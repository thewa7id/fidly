import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendWebPush } from '@/lib/push'
import { WalletService } from '@/lib/wallet/service'
import { SubscriptionService } from '@/lib/subscription'

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) {
        return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const { title, message, audience, scheduledFor } = await req.json()

    if (!title || !message) {
        return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
    }

    const scheduledDate = scheduledFor ? new Date(scheduledFor) : null
    const isScheduled = scheduledDate && scheduledDate > new Date()

    if (isScheduled) {
        const subSvc = new SubscriptionService()
        const canSchedule = await subSvc.canScheduleCampaigns(profile.organization_id)
        if (!canSchedule) {
            return NextResponse.json({
                error: 'Scheduled campaigns are only available on the Platinium plan.',
                upgradeRequired: true
            }, { status: 403 })
        }
    }

    // Determine target users based on audience string
    const svc = createServiceClient()
    let query = svc.from('push_subscriptions').select('*, customers!inner(*)')
        .eq('organization_id', profile.organization_id)

    if (audience === 'active') {
        // active in last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        query = query.filter('customers.last_visit_at', 'gt', thirtyDaysAgo)
    } else if (audience === 'inactive') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        query = query.filter('customers.last_visit_at', 'lt', thirtyDaysAgo)
    }

    const { data: subscriptions, error } = await query

    if (error) {
        console.error('Failed to fetch subscriptions:', error)
        return NextResponse.json({ error: 'Failed to fetch push subscribers' }, { status: 500 })
    }

    if (error) {
        console.error('Failed to fetch subscriptions:', error)
        return NextResponse.json({ error: 'Failed to fetch push subscribers' }, { status: 500 })
    }

    // Determine target users for wallet objects
    let walletQuery = svc.from('wallet_google_objects').select('customer_id, customers!inner(*)')
        .eq('org_id', profile.organization_id)

    if (audience === 'active') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        walletQuery = walletQuery.filter('customers.last_visit_at', 'gt', thirtyDaysAgo)
    } else if (audience === 'inactive') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        walletQuery = walletQuery.filter('customers.last_visit_at', 'lt', thirtyDaysAgo)
    }

    const { data: walletObjects, error: walletError } = await walletQuery

    if (walletError) {
        console.error('Failed to fetch wallet objects:', walletError)
    }

    // Prepare campaign record
    const { data: campaign, error: campaignError } = await supabase.from('campaigns').insert({
        organization_id: profile.organization_id,
        name: title,
        message: message,
        target_audience: audience,
        sent_by: user.id,
        scheduled_for: isScheduled ? scheduledDate.toISOString() : null,
        status: isScheduled ? 'pending' : 'processing',
        success_count: 0,
        failure_count: 0
    }).select().single()

    if (campaignError) {
        console.error('Failed to create campaign record:', campaignError)
        return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
    }

    if (isScheduled) {
        return NextResponse.json({
            success: true,
            sentCount: 0,
            campaign
        })
    }

    let successCount = 0
    let failureCount = 0

    // Dispatch web push notifications
    if (subscriptions && subscriptions.length > 0) {
        const pushPromises = subscriptions.map(async (sub) => {
            const payload = {
                title,
                body: message,
                url: `/c/${sub.customers?.public_token || ''}`
            }

            const pushSub = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }

            const success = await sendWebPush(pushSub, payload)
            if (success) {
                successCount++
            } else {
                failureCount++
                // Optionally, delete invalid subscriptions here
                // await supabase.from('push_subscriptions').delete().eq('id', sub.id)
            }
        })

        await Promise.allSettled(pushPromises)
    }

    // Dispatch Google Wallet messages
    if (walletObjects && walletObjects.length > 0) {
        const walletService = new WalletService()
        const walletPromises = walletObjects.map(async (obj) => {
            const success = await walletService.addMessageToCustomerPass(obj.customer_id, {
                header: title,
                body: message
            })
            if (success) {
                // If the user didn't exist in web push success counts, we could optionally increment here
                // but let's just count total successful outgoing pings.
                successCount++
            } else {
                failureCount++
            }
        })
        await Promise.allSettled(walletPromises)
    }

    // Update campaign record
    const { data: finalCampaign } = await svc.from('campaigns')
        .update({ success_count: successCount, failure_count: failureCount, status: 'completed' })
        .eq('id', campaign.id)
        .select()
        .single()

    return NextResponse.json({
        success: true,
        sentCount: successCount,
        campaign: finalCampaign
    })
}
