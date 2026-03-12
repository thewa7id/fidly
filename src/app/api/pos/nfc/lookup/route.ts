import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/pos/nfc/lookup
 * Looks up a customer by NFC card UID
 *
 * Body: { nfcUid: string }
 * Returns: { found: true, customer: {...} } or { found: false }
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
    const { nfcUid } = body

    if (!nfcUid || typeof nfcUid !== 'string') {
        return NextResponse.json({ error: 'nfcUid is required' }, { status: 400 })
    }

    const svc = createServiceClient()

    // Check if card is blocked first
    const { data: blockedCard } = await svc
        .from('nfc_cards')
        .select('id, nfc_uid, status')
        .eq('nfc_uid', nfcUid.toUpperCase().trim())
        .eq('organization_id', employee.organization_id)
        .eq('status', 'blocked')
        .single()

    if (blockedCard) {
        return NextResponse.json({
            success: true,
            data: {
                found: false,
                blocked: true,
                nfcUid: nfcUid.toUpperCase().trim(),
                message: 'This card has been blocked. Please use a digital card instead.',
            },
        })
    }

    // Look up NFC card by UID within the organization
    const { data: nfcCard } = await svc
        .from('nfc_cards')
        .select('id, customer_id, nfc_uid, status, linked_at')
        .eq('nfc_uid', nfcUid.toUpperCase().trim())
        .eq('organization_id', employee.organization_id)
        .eq('status', 'active')
        .single()

    if (!nfcCard || !nfcCard.customer_id) {
        return NextResponse.json({
            success: true,
            data: {
                found: false,
                nfcUid: nfcUid.toUpperCase().trim(),
                cardExists: !!nfcCard,
            },
        })
    }

    // Fetch the linked customer
    const { data: customer } = await svc
        .from('customers')
        .select('id, full_name, email, phone, available_stamps, total_stamps, available_points, total_points, total_visits, public_token')
        .eq('id', nfcCard.customer_id)
        .eq('organization_id', employee.organization_id)
        .single()

    if (!customer) {
        return NextResponse.json({
            success: true,
            data: { found: false, nfcUid: nfcUid.toUpperCase().trim() },
        })
    }

    return NextResponse.json({
        success: true,
        data: {
            found: true,
            customer,
            nfcCard: {
                id: nfcCard.id,
                nfc_uid: nfcCard.nfc_uid,
                linked_at: nfcCard.linked_at,
            },
        },
    })
}
