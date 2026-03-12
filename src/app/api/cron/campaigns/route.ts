import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWebPush } from '@/lib/push'
import { WalletService } from '@/lib/wallet/service'

export async function GET() {
    const svc = createServiceClient()

    // Find pending campaigns that are due
    const { data: campaigns, error: fetchError } = await svc
        .from('campaigns')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())

    if (fetchError) {
        console.error('Failed to fetch pending campaigns:', fetchError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!campaigns || campaigns.length === 0) {
        return NextResponse.json({ success: true, processed: 0 })
    }

    let processedCount = 0

    for (const campaign of campaigns) {
        // Mark as processing
        await svc.from('campaigns').update({ status: 'processing' }).eq('id', campaign.id)

        let successCount = 0
        let failureCount = 0

        try {
            // 1. Fetch push subscriptions
            let pushQuery = svc.from('push_subscriptions').select('*, customers!inner(*)')
                .eq('organization_id', campaign.organization_id)
            
            if (campaign.target_audience === 'active') {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                pushQuery = pushQuery.filter('customers.last_visit_at', 'gt', thirtyDaysAgo)
            } else if (campaign.target_audience === 'inactive') {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                pushQuery = pushQuery.filter('customers.last_visit_at', 'lt', thirtyDaysAgo)
            }
            const { data: subscriptions } = await pushQuery

            // 2. Fetch wallet objects
            let walletQuery = svc.from('wallet_google_objects').select('customer_id, customers!inner(*)')
                .eq('org_id', campaign.organization_id)
            if (campaign.target_audience === 'active') {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                walletQuery = walletQuery.filter('customers.last_visit_at', 'gt', thirtyDaysAgo)
            } else if (campaign.target_audience === 'inactive') {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                walletQuery = walletQuery.filter('customers.last_visit_at', 'lt', thirtyDaysAgo)
            }
            const { data: walletObjects } = await walletQuery

            // 3. Dispatch Web Push
            if (subscriptions && subscriptions.length > 0) {
                const pushPromises = subscriptions.map(async (sub) => {
                    const payload = {
                        title: campaign.name,
                        body: campaign.message,
                        url: `/c/${sub.customers?.public_token || ''}`
                    }
                    const pushSub = {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    }
                    const success = await sendWebPush(pushSub, payload)
                    if (success) successCount++
                    else failureCount++
                })
                await Promise.allSettled(pushPromises)
            }

            // 4. Dispatch Google Wallet messages
            if (walletObjects && walletObjects.length > 0) {
                const walletService = new WalletService()
                const walletPromises = walletObjects.map(async (obj) => {
                    const success = await walletService.addMessageToCustomerPass(obj.customer_id, {
                        header: campaign.name,
                        body: campaign.message
                    })
                    if (success) successCount++
                    else failureCount++
                })
                await Promise.allSettled(walletPromises)
            }

            // Mark as completed
            await svc.from('campaigns')
                .update({ 
                    status: 'completed', 
                    success_count: successCount, 
                    failure_count: failureCount,
                    sent_at: new Date().toISOString()
                })
                .eq('id', campaign.id)

            processedCount++
        } catch (err) {
            console.error(`Failed to process campaign ${campaign.id}:`, err)
            await svc.from('campaigns')
                .update({ status: 'failed', failure_count: failureCount })
                .eq('id', campaign.id)
        }
    }

    return NextResponse.json({ success: true, processed: processedCount })
}
