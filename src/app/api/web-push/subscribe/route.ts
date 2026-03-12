import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // For simplicity, we allow public subscriptions if a public_token is provided (e.g. from POS /c/[token])
    // or standard authenticated user if an admin logs in.
    // In our payload we expect: { subscription: PushSubscription, publicToken?: string }
    const body = await req.json()
    const { subscription, publicToken } = body

    if (!subscription || !subscription.endpoint) {
        return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    let customerId = null
    let organizationId = null

    if (publicToken) {
        // Find customer and org by public token
        const { data: customer } = await supabase
            .from('customers')
            .select('id, organization_id')
            .eq('public_token', publicToken)
            .single()
        
        if (customer) {
            customerId = customer.id
            organizationId = customer.organization_id
        } else {
             return NextResponse.json({ error: 'Invalid customer token' }, { status: 404 })
        }
    } else if (user) {
        const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
        if (profile?.organization_id) {
            organizationId = profile.organization_id
        } else {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
    } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { keys, endpoint } = subscription

    const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
            organization_id: organizationId,
            customer_id: customerId, // null for admins
            endpoint: endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
            user_agent: req.headers.get('user-agent') || 'Unknown',
            last_used_at: new Date().toISOString()
        }, {
            onConflict: 'endpoint'
        })

    if (error) {
        console.error('Push subscription save error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Subscription saved' })
}
