import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/client/push-token
 * Registers a Firebase push token for a customer
 * Body: { token, customerToken, organizationId }
 */
export async function POST(req: NextRequest) {
    const body = await req.json()
    const { token, customerToken, organizationId } = body

    if (!token || !customerToken || !organizationId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Find customer
    const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('public_token', customerToken)
        .eq('organization_id', organizationId)
        .single()

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    // Upsert push token
    const { error } = await supabase
        .from('push_tokens')
        .upsert({
            customer_id: customer.id,
            organization_id: organizationId,
            token,
            platform: 'web',
            is_active: true,
            last_used_at: new Date().toISOString(),
        }, {
            onConflict: 'customer_id,organization_id,token',
        })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
