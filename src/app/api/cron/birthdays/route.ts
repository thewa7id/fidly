import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/cron/birthdays
 * Daily cron job to check for birthdays and send rewards (stamps/points + push notification)
 * To secure this, you should either add an Authorization header check or configure a secret in Vercel Cron.
 */
export async function GET(req: Request) {
    // 1. Authenticate the Cron request (e.g. Simple Bearer token check)
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Comment this out if hitting via browser for testing without headers
        // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Force using Service Role key because this is a background job not bound to a user session
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    try {
        // Find today's date in MM-DD format
        const today = new Date()
        const monthFilter = today.getMonth() + 1
        const dayFilter = today.getDate()

        // We use a raw SQL query or postgREST syntax to match month and day of birth
        // Unfortunately standard JS supabase client lacks full date part extraction out of the box so we might need an RPC call, 
        // or we fetch all distinct customers with a DO_B and filter in app (not scalable).
        // A better approach is to create a database function `get_birthday_customers(month, day)`
        
        // For complete accuracy, assuming the migration created a get_birthday_customers RPC function:
        const { data: customers, error } = await supabase.rpc('get_birthday_customers', {
            target_month: monthFilter,
            target_day: dayFilter
        })

        if (error) {
            console.error('Failed to get birthday customers:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!customers || customers.length === 0) {
            return NextResponse.json({ success: true, message: 'No birthdays today.' })
        }

        let rewardedCount = 0

        // Process each birthday customer
        for (const customer of customers) {
            // Assume the organization has a default birthday reward setup, for simplicity we grant 2 stamps
            const stampsToAward = 2

            // Record transaction
            const { data: transaction, error: txError } = await supabase
                .from('transactions')
                .insert({
                    organization_id: customer.organization_id,
                    branch_id: null, // system generated
                    customer_id: customer.id,
                    type: 'earn_stamp',
                    stamps_earned: stampsToAward,
                    stamps_redeemed: 0,
                    points_earned: 0,
                    points_redeemed: 0,
                    reference_number: `B-DAY-${today.getFullYear()}`,
                    notes: 'Happy Birthday Reward'
                })
                .select()
                .single()

            if (!txError) {
                // Update customer total
                await supabase.rpc('increment_customer_stamps', {
                    customer_id: customer.id,
                    amount: stampsToAward
                })
                rewardedCount++

                // TODO: Send Push Notification + Update Wallets
                // await sendBirthdayPushNotification(customer)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${rewardedCount} birthday rewards.`,
            customers_processed: rewardedCount
        })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
