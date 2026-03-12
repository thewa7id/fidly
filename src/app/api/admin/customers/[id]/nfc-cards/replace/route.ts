import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/customers/[id]/nfc-cards/replace
 * Deactivate old NFC card(s) and link a new one (from admin dashboard)
 *
 * Body: { newNfcUid: string }
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
    const { newNfcUid } = body
    if (!newNfcUid) return NextResponse.json({ error: 'newNfcUid is required' }, { status: 400 })

    const uid = newNfcUid.toUpperCase().trim()
    const svc = createServiceClient()

    // Verify customer belongs to org
    const { data: customer } = await svc
        .from('customers')
        .select('id, full_name')
        .eq('id', customerId)
        .eq('organization_id', profile.organization_id)
        .single()

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    // Check new UID isn't active for a different customer
    const { data: existingNewCard } = await svc
        .from('nfc_cards')
        .select('id, customer_id, status')
        .eq('nfc_uid', uid)
        .eq('organization_id', profile.organization_id)
        .single()

    if (existingNewCard && existingNewCard.status === 'active' && existingNewCard.customer_id && existingNewCard.customer_id !== customerId) {
        return NextResponse.json({
            error: 'This new NFC card is already linked to another customer.',
        }, { status: 409 })
    }

    const now = new Date().toISOString()

    // Deactivate ALL existing active cards for this customer
    await svc
        .from('nfc_cards')
        .update({ status: 'inactive', deactivated_at: now })
        .eq('customer_id', customerId)
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')

    // Link the new card
    if (existingNewCard) {
        await svc
            .from('nfc_cards')
            .update({
                customer_id: customerId,
                status: 'active',
                linked_at: now,
                deactivated_at: null,
            })
            .eq('id', existingNewCard.id)
    } else {
        await svc
            .from('nfc_cards')
            .insert({
                organization_id: profile.organization_id,
                customer_id: customerId,
                nfc_uid: uid,
                status: 'active',
                linked_at: now,
            })
    }

    return NextResponse.json({
        success: true,
        data: {
            customer: { id: customer.id, full_name: customer.full_name },
            new_nfc_uid: uid,
            replaced_at: now,
        },
    })
}
