import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/customers/[id]/nfc-cards
 * Fetch all NFC cards linked to a customer
 */
export async function GET(
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

    const svc = createServiceClient()

    // Verify customer belongs to org
    const { data: customer } = await svc
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .eq('organization_id', profile.organization_id)
        .single()

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    // Fetch NFC cards for this customer
    const { data: cards, error } = await svc
        .from('nfc_cards')
        .select('id, nfc_uid, status, linked_at, deactivated_at, created_at')
        .eq('customer_id', customerId)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data: cards ?? [] })
}
