import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/pos/check
 * Safely looks up a customer's balance without creating a transaction or granting points.
 * 
 * Body: { customerToken?, nfcUid? }
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: employee } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

    if (!employee?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 404 })
    if (!['owner', 'manager', 'employee'].includes(employee.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    let { customerToken, nfcUid } = body

    // Defensively extract token if a full URL was passed (e.g. "https://app.com/c/TOKEN")
    if (customerToken?.includes('/c/')) {
        customerToken = customerToken.split('/c/').pop()?.split('?')[0]?.trim() ?? customerToken
    }
    customerToken = customerToken?.trim()

    if (!customerToken && !nfcUid) {
        return NextResponse.json({ error: 'customerToken or nfcUid is required' }, { status: 400 })
    }

    // Use service client for reads since POS accesses customers table
    const svc = createServiceClient()

    let customer: any = null
    let custLookupError: any = null

    if (nfcUid) {
        const uid = nfcUid.toUpperCase().trim()

        const { data: blockedCard } = await svc
            .from('nfc_cards')
            .select('id')
            .eq('nfc_uid', uid)
            .eq('organization_id', employee.organization_id)
            .eq('status', 'blocked')
            .single()

        if (blockedCard) {
            return NextResponse.json({ error: 'This NFC card is blocked.' }, { status: 403 })
        }

        const { data: nfcCard } = await svc
            .from('nfc_cards')
            .select('customer_id')
            .eq('nfc_uid', uid)
            .eq('organization_id', employee.organization_id)
            .eq('status', 'active')
            .single()

        if (!nfcCard?.customer_id) {
            return NextResponse.json({ error: 'NFC card not linked to any customer in this organization' }, { status: 404 })
        }

        const result = await svc
            .from('customers')
            .select('id, full_name, public_token, available_stamps, total_stamps, available_points, total_points, total_visits, last_visit_at')
            .eq('id', nfcCard.customer_id)
            .eq('organization_id', employee.organization_id)
            .single()

        customer = result.data
        custLookupError = result.error
    } else {
        const isShortCode = customerToken.length <= 8
        const result = isShortCode
            ? await svc
                .from('customers')
                .select('id, full_name, public_token, available_stamps, total_stamps, available_points, total_points, total_visits, last_visit_at')
                .ilike('public_token', `${customerToken}%`)
                .eq('organization_id', employee.organization_id)
                .limit(1)
                .single()
            : await svc
                .from('customers')
                .select('id, full_name, public_token, available_stamps, total_stamps, available_points, total_points, total_visits, last_visit_at')
                .eq('public_token', customerToken)
                .eq('organization_id', employee.organization_id)
                .single()

        customer = result.data
        custLookupError = result.error
    }

    if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Get active loyalty program to know what max stamps is if applicable
    const { data: program } = await svc
        .from('loyalty_programs')
        .select('type, stamps_required, points_per_currency_unit')
        .eq('organization_id', employee.organization_id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .limit(1)
        .single()

    return NextResponse.json({
        success: true,
        data: {
            customer,
            program: program || null
        },
    })
}
