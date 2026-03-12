import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/firebase/admin'

/**
 * POST /api/pos/redeem
 * Redeems a reward for a customer
 *
 * Body: { customerToken, rewardId, branchId }
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

    const body = await req.json()
    let { customerToken, rewardId, branchId, nfcUid } = body

    // Defensively extract token if a full URL was passed (e.g. "https://app.com/c/TOKEN")
    if (customerToken?.includes('/c/')) {
        customerToken = customerToken.split('/c/').pop()?.split('?')[0]?.trim() ?? customerToken
    }
    customerToken = customerToken?.trim()

    if ((!customerToken && !nfcUid) || !rewardId || !branchId) {
        return NextResponse.json({ error: 'customerToken (or nfcUid), rewardId, and branchId are required' }, { status: 400 })
    }

    // Use service client — bypasses RLS on customers/branches tables
    const svc = createServiceClient()

    // Validate branch
    const { data: branch } = await svc
        .from('branches')
        .select('id, name')
        .eq('id', branchId)
        .eq('organization_id', employee.organization_id)
        .single()

    if (!branch) return NextResponse.json({ error: 'Invalid branch' }, { status: 404 })

    let customer: any = null

    if (nfcUid) {
        // NFC UID lookup path
        const uid = nfcUid.toUpperCase().trim()
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

        const { data } = await svc
            .from('customers')
            .select('*')
            .eq('id', nfcCard.customer_id)
            .eq('organization_id', employee.organization_id)
            .single()

        customer = data
    } else {
        // Original public_token lookup
        const { data, error: custErr } = await svc
            .from('customers')
            .select('*')
            .eq('public_token', customerToken)
            .eq('organization_id', employee.organization_id)
            .single()

        customer = data
        if (!customer) {
            console.error('[POS redeem] Customer not found. token:', customerToken, 'error:', custErr?.message)
        }
    }

    if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Find reward
    const { data: reward } = await svc
        .from('rewards')
        .select('*')
        .eq('id', rewardId)
        .eq('organization_id', employee.organization_id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

    if (!reward) return NextResponse.json({ error: 'Reward not found or inactive' }, { status: 404 })

    // Validate customer has enough stamps/points
    if (reward.stamps_required && customer.available_stamps < reward.stamps_required) {
        return NextResponse.json({
            error: `Not enough stamps. Need ${reward.stamps_required}, have ${customer.available_stamps}`,
        }, { status: 400 })
    }

    if (reward.points_required && customer.available_points < reward.points_required) {
        return NextResponse.json({
            error: `Not enough points. Need ${reward.points_required}, have ${customer.available_points}`,
        }, { status: 400 })
    }

    const newStampsBalance = customer.available_stamps - (reward.stamps_required ?? 0)
    const newPointsBalance = customer.available_points - (reward.points_required ?? 0)

    // Update customer
    await svc
        .from('customers')
        .update({
            available_stamps: newStampsBalance,
            available_points: newPointsBalance,
            total_redeemed: customer.total_redeemed + 1,
        })
        .eq('id', customer.id)

    // Create transaction
    const { data: transaction, error: txError } = await svc
        .from('transactions')
        .insert({
            organization_id: employee.organization_id,
            branch_id: branchId,
            customer_id: customer.id,
            processed_by: user.id,
            type: 'redeem_reward',
            stamps_redeemed: reward.stamps_required ?? 0,
            stamps_balance_after: newStampsBalance,
            points_redeemed: reward.points_required ?? 0,
            points_balance_after: newPointsBalance,
            reward_id: reward.id,
            reward_snapshot: reward,
        })
        .select()
        .single()

    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

    // Send push notification (no-op if Firebase not configured)
    const { data: pushTokens } = await svc
        .from('push_tokens')
        .select('token')
        .eq('customer_id', customer.id)
        .eq('is_active', true)

    if (pushTokens?.length) {
        await Promise.all(
            pushTokens.map(pt =>
                sendPushNotification({
                    token: pt.token,
                    title: '🎁 Reward Redeemed!',
                    body: `You redeemed: ${reward.name}. Enjoy!`,
                })
            )
        )
    }

    // Insert Admin Notification
    await svc.from('notifications').insert({
        organization_id: employee.organization_id,
        type: 'reward_redeemed',
        title: 'Reward Redeemed 🎁',
        message: `${customer.full_name} redeemed ${reward.name} at ${branch.name}`,
        customer_id: customer.id
    })
    try {
        const { WalletService } = await import('@/lib/wallet/service')
        const walletService = new WalletService()
        walletService.syncCustomerWallet(customer.id, reward.loyalty_program_id).catch(err => {
            console.error('[Google Wallet Sync Error]:', err)
        })
    } catch (err) {
        console.error('[Google Wallet Service Error]:', err)
    }

    return NextResponse.json({
        success: true,
        data: {
            customer: {
                full_name: customer.full_name,
                available_stamps: newStampsBalance,
                available_points: newPointsBalance,
            },
            reward: { name: reward.name, description: reward.description },
            transaction,
        },
    })
}
