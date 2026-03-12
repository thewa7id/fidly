import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/pos/nfc/link
 * Links an NFC card to a customer
 *
 * Body: { nfcUid: string, customerId: string }
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
    if (!['owner', 'manager', 'employee'].includes(employee.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { nfcUid, customerId } = body

    if (!nfcUid || !customerId) {
        return NextResponse.json({ error: 'nfcUid and customerId are required' }, { status: 400 })
    }

    const uid = nfcUid.toUpperCase().trim()
    const svc = createServiceClient()

    // Verify customer belongs to the same organization
    const { data: customer } = await svc
        .from('customers')
        .select('id, full_name, public_token')
        .eq('id', customerId)
        .eq('organization_id', employee.organization_id)
        .single()

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    // Check if this NFC UID is already linked to a DIFFERENT active customer
    const { data: existingCard } = await svc
        .from('nfc_cards')
        .select('id, customer_id, status')
        .eq('nfc_uid', uid)
        .eq('organization_id', employee.organization_id)
        .single()

    if (existingCard && existingCard.status === 'active' && existingCard.customer_id && existingCard.customer_id !== customerId) {
        return NextResponse.json({
            error: 'This NFC card is already linked to another customer. Please deactivate it first.',
        }, { status: 409 })
    }

    // Check if this customer already has an active NFC card (different UID)
    const { data: customerExistingCard } = await svc
        .from('nfc_cards')
        .select('id, nfc_uid')
        .eq('customer_id', customerId)
        .eq('organization_id', employee.organization_id)
        .eq('status', 'active')
        .single()

    if (customerExistingCard && customerExistingCard.nfc_uid !== uid) {
        return NextResponse.json({
            error: 'This customer already has an active NFC card. Use "Replace Card" to swap it.',
        }, { status: 409 })
    }

    const now = new Date().toISOString()

    if (existingCard) {
        // Re-activate / re-link existing card row
        const { error } = await svc
            .from('nfc_cards')
            .update({
                customer_id: customerId,
                status: 'active',
                linked_at: now,
                deactivated_at: null,
            })
            .eq('id', existingCard.id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
        // Create new card row
        const { error } = await svc
            .from('nfc_cards')
            .insert({
                organization_id: employee.organization_id,
                customer_id: customerId,
                nfc_uid: uid,
                status: 'active',
                linked_at: now,
            })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        data: {
            customer: { id: customer.id, full_name: customer.full_name },
            nfc_uid: uid,
            linked_at: now,
        },
    })
}
