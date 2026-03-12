import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/customers/[id]/nfc-cards/block
 * Block an NFC card (sets status to 'blocked')
 *
 * Body: { cardId: string }
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
    const { cardId } = body
    if (!cardId) return NextResponse.json({ error: 'cardId is required' }, { status: 400 })

    const svc = createServiceClient()

    // Verify card belongs to this customer and org
    const { data: card } = await svc
        .from('nfc_cards')
        .select('id, status')
        .eq('id', cardId)
        .eq('customer_id', customerId)
        .eq('organization_id', profile.organization_id)
        .single()

    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 })

    if (card.status === 'blocked') {
        return NextResponse.json({ error: 'Card is already blocked' }, { status: 400 })
    }

    const now = new Date().toISOString()

    const { error } = await svc
        .from('nfc_cards')
        .update({
            status: 'blocked',
            deactivated_at: now,
        })
        .eq('id', cardId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
        success: true,
        data: { cardId, status: 'blocked', blocked_at: now },
    })
}
