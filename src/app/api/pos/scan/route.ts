import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/firebase/admin'
import { SubscriptionService } from '@/lib/subscription'

/**
 * POST /api/pos/scan
 * Processes a QR scan — earns a stamp or points for the customer
 * 
 * Body: { customerToken, branchId, purchaseAmount?, notes? }
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: employee } = await supabase
        .from('users')
        .select('organization_id, branch_id, role')
        .eq('id', user.id)
        .single()

    if (!employee?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 404 })
    if (!['owner', 'manager', 'employee'].includes(employee.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    let { customerToken, branchId, purchaseAmount, notes, nfcUid } = body

    // Defensively extract token if a full URL was passed (e.g. "https://app.com/c/TOKEN")
    if (customerToken?.includes('/c/')) {
        customerToken = customerToken.split('/c/').pop()?.split('?')[0]?.trim() ?? customerToken
    }
    customerToken = customerToken?.trim()

    if ((!customerToken && !nfcUid) || !branchId) {
        return NextResponse.json({ error: 'customerToken (or nfcUid) and branchId are required' }, { status: 400 })
    }

    // Use service client for all reads — bypasses RLS restrictions on customers table
    const svc = createServiceClient()

    // Validate branch belongs to org
    const { data: branch } = await svc
        .from('branches')
        .select('id, name, organization_id')
        .eq('id', branchId)
        .eq('organization_id', employee.organization_id)
        .single()

    if (!branch) return NextResponse.json({ error: 'Invalid branch' }, { status: 404 })

    let customer: any = null
    let custLookupError: any = null

    if (nfcUid) {
        // Check Quota for NFC
        const subSvc = new SubscriptionService()
        const canUseNFC = await subSvc.canUseNFC(employee.organization_id)
        if (!canUseNFC) {
            return NextResponse.json({
                error: 'NFC features are not included in your current plan. Please upgrade to Gold or Premium.',
                upgradeRequired: true
            }, { status: 403 })
        }

        // NFC UID lookup path
        const uid = nfcUid.toUpperCase().trim()

        // Check if card is blocked
        const { data: blockedCard } = await svc
            .from('nfc_cards')
            .select('id')
            .eq('nfc_uid', uid)
            .eq('organization_id', employee.organization_id)
            .eq('status', 'blocked')
            .single()

        if (blockedCard) {
            return NextResponse.json({ error: 'This NFC card has been blocked. Please use a digital card instead.' }, { status: 403 })
        }

        const { data: nfcCard } = await svc
            .from('nfc_cards')
            .select('customer_id')
            .eq('nfc_uid', uid)
            .eq('organization_id', employee.organization_id)
            .eq('status', 'active')
            .single()

        if (!nfcCard?.customer_id) {
            return NextResponse.json({ error: 'NFC card not linked to any customer' }, { status: 404 })
        }

        const result = await svc
            .from('customers')
            .select('*')
            .eq('id', nfcCard.customer_id)
            .eq('organization_id', employee.organization_id)
            .single()

        customer = result.data
        custLookupError = result.error
    } else {
        // Original public_token lookup path
        const isShortCode = customerToken.length <= 8
        const result = isShortCode
            ? await svc
                .from('customers')
                .select('*')
                .ilike('public_token', `${customerToken}%`)
                .eq('organization_id', employee.organization_id)
                .limit(1)
                .single()
            : await svc
                .from('customers')
                .select('*')
                .eq('public_token', customerToken)
                .eq('organization_id', employee.organization_id)
                .single()

        customer = result.data
        custLookupError = result.error
    }

    if (!customer) {
        console.error('[POS scan] Customer not found. token:', customerToken, 'nfcUid:', nfcUid, 'orgId:', employee.organization_id, 'error:', custLookupError?.message)
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }


    // Get active loyalty program
    const { data: program } = await svc
        .from('loyalty_programs')
        .select('*')
        .eq('organization_id', employee.organization_id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .limit(1)
        .single()

    if (!program) return NextResponse.json({ error: 'No active loyalty program' }, { status: 404 })

    // Check subscription limits
    const { data: org } = await svc
        .from('organizations')
        .select('subscription_status, subscription_expires_at')
        .eq('id', employee.organization_id)
        .single()

    if (org?.subscription_status === 'inactive' || org?.subscription_status === 'cancelled') {
        return NextResponse.json({ error: 'Subscription inactive. Please renew your plan.' }, { status: 402 })
    }

    // Calculate earn amount
    let stampsEarned = 0
    let pointsEarned = 0
    let transactionType: 'earn_stamp' | 'earn_points' = 'earn_stamp'

    if (program.type === 'stamps') {
        stampsEarned = 1
        transactionType = 'earn_stamp'
    } else {
        const amount = parseFloat(purchaseAmount ?? '0')
        pointsEarned = amount * (program.points_per_currency_unit ?? 1)
        transactionType = 'earn_points'
    }

    const newStampsBalance = customer.available_stamps + stampsEarned
    const newPointsBalance = customer.available_points + pointsEarned

    // Begin: update customer and create transaction
    const adminSupabase = svc

    // Update customer balance
    const { error: custError } = await adminSupabase
        .from('customers')
        .update({
            available_stamps: newStampsBalance,
            total_stamps: customer.total_stamps + stampsEarned,
            available_points: newPointsBalance,
            total_points: customer.total_points + pointsEarned,
            total_visits: customer.total_visits + 1,
            last_visit_at: new Date().toISOString(),
        })
        .eq('id', customer.id)

    if (custError) return NextResponse.json({ error: custError.message }, { status: 500 })

    // Create transaction
    const { data: transaction, error: txError } = await adminSupabase
        .from('transactions')
        .insert({
            organization_id: employee.organization_id,
            branch_id: branchId,
            customer_id: customer.id,
            loyalty_program_id: program.id,
            processed_by: user.id,
            type: transactionType,
            stamps_earned: stampsEarned,
            stamps_balance_after: newStampsBalance,
            points_earned: pointsEarned,
            points_balance_after: newPointsBalance,
            purchase_amount: purchaseAmount,
            notes,
        })
        .select()
        .single()

    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

    // Check if reward unlocked
    let rewardUnlocked = false
    if (program.type === 'stamps' && newStampsBalance >= (program.stamps_required ?? 10)) {
        rewardUnlocked = true
    }

    // Send push notification
    const { data: pushTokens } = await adminSupabase
        .from('push_tokens')
        .select('token')
        .eq('customer_id', customer.id)
        .eq('organization_id', employee.organization_id)
        .eq('is_active', true)

    if (pushTokens && pushTokens.length > 0) {
        const notifTitle = rewardUnlocked ? '🎉 Reward Unlocked!' : '⭐ Stamp Earned!'
        const notifBody = rewardUnlocked
            ? `You've collected ${newStampsBalance} stamps! Redeem your reward now.`
            : `You earned 1 stamp! ${program.stamps_required! - newStampsBalance} more to unlock your reward.`

        await Promise.all(
            pushTokens.map(pt =>
                sendPushNotification({
                    token: pt.token,
                    title: notifTitle,
                    body: notifBody,
                    data: { type: 'stamp', link: `/c/${customer.public_token}` },
                })
            )
        )

        await adminSupabase.from('transactions').update({ push_sent: true }).eq('id', transaction.id)
    }

    // Insert Admin Notification
    await svc.from('notifications').insert({
        organization_id: employee.organization_id,
        type: 'stamp_earned',
        title: 'New Stamp Earnt',
        message: `${customer.full_name} just received a stamp at ${branch.name}`,
        customer_id: customer.id
    })

    // Google Wallet Sync (Non-blocking)
    try {
        const { WalletService } = await import('@/lib/wallet/service')
        const walletService = new WalletService()
        // Syncing without await to not block the main transaction response, 
        // though in some cases you might want to ensure it succeeds or use a queue.
        walletService.syncCustomerWallet(customer.id, program.id).catch(err => {
            console.error('[Google Wallet Sync Error]:', err)
        })
    } catch (err) {
        console.error('[Google Wallet Service Error]:', err)
    }

    return NextResponse.json({
        success: true,
        data: {
            customer: {
                id: customer.id,
                full_name: customer.full_name,
                available_stamps: newStampsBalance,
                available_points: newPointsBalance,
                public_token: customer.public_token,
            },
            transaction,
            stampsEarned,
            pointsEarned,
            rewardUnlocked,
            stampsRequired: program.stamps_required,
        },
    })
}
