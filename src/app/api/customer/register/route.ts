import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { SubscriptionService } from '@/lib/subscription'

/**
 * POST /api/customer/register
 * Body: { email, password, fullName, orgSlug }
 * Creates a Supabase auth user + customer record for the given org
 */
export async function POST(req: NextRequest) {
    const { email, password, fullName, orgSlug, phone } = await req.json()

    if (!email || !password || !fullName || !orgSlug || !phone) {
        return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    const svc = createServiceClient()

    // 1. Find the organization by slug
    const { data: org } = await svc
        .from('organizations')
        .select('id, name, subscription_status')
        .eq('slug', orgSlug)
        .single()

    if (!org) return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    if (org.subscription_status === 'inactive') return NextResponse.json({ error: 'This loyalty program is not active' }, { status: 403 })

    // 2. Create the Supabase auth user
    const { data: authData, error: authError } = await svc.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, phone: phone },
    })

    if (authError) {
        // Handle duplicate email gracefully
        if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
            return NextResponse.json({ error: 'An account with this email already exists. Please log in.' }, { status: 409 })
        }
        return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const authUserId = authData.user.id

    // 3. Check: does a customer record already exist for this user + org?
    const { data: existing } = await svc
        .from('customers')
        .select('id, public_token')
        .eq('auth_user_id', authUserId)
        .eq('organization_id', org.id)
        .single()

    if (existing) {
        // Already joined this org — just return success
        return NextResponse.json({ success: true, token: existing.public_token, alreadyMember: true })
    }

    // Check Quota
    const subSvc = new SubscriptionService()
    const quota = await subSvc.canAddCustomer(org.id)
    if (!quota.allowed) {
        return NextResponse.json({
            error: 'This business has reached its customer limit for the current plan.',
            quotaReached: true
        }, { status: 403 })
    }

    // 4. Create the customer loyalty card record
    const { data: customer, error: custErr } = await svc
        .from('customers')
        .insert({
            organization_id: org.id,
            auth_user_id: authUserId,
            email,
            phone,
            full_name: fullName,
            available_stamps: 0,
            total_stamps: 0,
            total_visits: 0,
            total_redeemed: 0,
        })
        .select('id, public_token')
        .single()

    if (custErr || !customer) {
        console.error('[customer/register] customer insert error:', custErr?.message)
        return NextResponse.json({ error: 'Failed to create loyalty card' }, { status: 500 })
    }

    // Insert Admin Notification
    await svc.from('notifications').insert({
        organization_id: org.id,
        type: 'new_customer',
        title: 'New Member Joined!',
        message: `${fullName} just joined your loyalty program`,
        customer_id: customer.id
    })

    return NextResponse.json({ success: true, token: customer.public_token })
}
