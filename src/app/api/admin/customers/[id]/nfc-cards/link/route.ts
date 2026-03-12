import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/customers/[id]/nfc-cards/link
 * Link a new NFC card to this customer (from admin dashboard)
 *
 * Body: { nfcUid: string }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: customerId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 404 })
    if (!['owner', 'manager'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { nfcUid } = body
    if (!nfcUid) return NextResponse.json({ error: 'nfcUid is required' }, { status: 400 })

    const uid = nfcUid.toUpperCase().trim()
    const svc = createServiceClient()

    // Verify customer belongs to org
    const { data: customer } = await svc
        .from('customers')
        .select('id, full_name')
        .eq('id', customerId)
        .eq('organization_id', profile.organization_id)
        .single()

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    // Check if this NFC UID is already linked to a different active customer
    const { data: existingCard } = await svc
        .from('nfc_cards')
        .select('id, customer_id, status')
        .eq('nfc_uid', uid)
        .eq('organization_id', profile.organization_id)
        .single()

    if (existingCard && existingCard.status === 'active' && existingCard.customer_id && existingCard.customer_id !== customerId) {
        return NextResponse.json({
            error: 'This NFC card is already linked to another customer.',
        }, { status: 409 })
    }

    // Check if this customer already has an active NFC card
    const { data: customerExistingCard } = await svc
        .from('nfc_cards')
        .select('id, nfc_uid')
        .eq('customer_id', customerId)
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
        .single()

    if (customerExistingCard && customerExistingCard.nfc_uid !== uid) {
        return NextResponse.json({
            error: 'This customer already has an active NFC card. Use "Replace Card" instead.',
        }, { status: 409 })
    }

    const now = new Date().toISOString()

    if (existingCard) {
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
        const { error } = await svc
            .from('nfc_cards')
            .insert({
                organization_id: profile.organization_id,
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
