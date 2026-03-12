import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/customer/bonus/claim
 * Body: { bonusId, branchId }
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let bonusId, branchId, publicToken;
    try {
        const body = await req.json()
        bonusId = body.bonusId
        branchId = body.branchId
        publicToken = body.publicToken
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (!bonusId) return NextResponse.json({ error: 'Bonus ID required' }, { status: 400 })
    if (!publicToken && !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const svc = createServiceClient()

    // 1. Get bonus reward details
    const { data: bonus, error: bonusErr } = await svc
        .from('bonus_rewards')
        .select('*')
        .eq('id', bonusId)
        .single()

    if (bonusErr || !bonus) return NextResponse.json({ error: 'Bonus reward not found' }, { status: 404 })

    // 2. Get the specific customer record for this org
    let query = svc
        .from('customers')
        .select('id, organization_id, total_stamps, available_stamps, total_points, available_points')
        .eq('organization_id', bonus.organization_id)
        
    if (publicToken) {
        query = query.eq('public_token', publicToken)
    } else {
        query = query.eq('auth_user_id', user!.id)
    }

    const { data: customer } = await query.single()

    if (!customer) return NextResponse.json({ error: 'Customer record not found for this organization' }, { status: 404 })

    // 3. Check for existing claim (one time per life per branch)
    const { data: existingClaim } = await svc
        .from('customer_bonus_claims')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('bonus_reward_id', bonusId)
        .eq('branch_id', branchId || null)
        .single()

    if (existingClaim) {
        return NextResponse.json({ error: 'You have already claimed this bonus reward at this branch' }, { status: 409 })
    }

    // 4. Update customer balance and log transaction (atomic transaction would be better but we'll do sequential for simplicity)
    const update: any = {}
    if (bonus.reward_type === 'stamps') {
        update.available_stamps = (customer.available_stamps || 0) + bonus.reward_value
        update.total_stamps = (customer.total_stamps || 0) + bonus.reward_value
    } else {
        update.available_points = (Number(customer.available_points) || 0) + bonus.reward_value
        update.total_points = (Number(customer.total_points) || 0) + bonus.reward_value
    }

    const { error: updateErr } = await svc
        .from('customers')
        .update(update)
        .eq('id', customer.id)

    if (updateErr) return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })

    // 5. Create transaction
    await svc.from('transactions').insert({
        organization_id: bonus.organization_id,
        branch_id: branchId || null,
        customer_id: customer.id,
        type: bonus.reward_type === 'stamps' ? 'earn_stamp' : 'earn_points',
        stamps_earned: bonus.reward_type === 'stamps' ? bonus.reward_value : 0,
        points_earned: bonus.reward_type === 'points' ? bonus.reward_value : 0,
        notes: `Bonus: ${bonus.type.replace(/_/g, ' ')}`,
        metadata: { bonus_reward_id: bonusId }
    })

    // 6. Record claim
    await svc.from('customer_bonus_claims').insert({
        customer_id: customer.id,
        branch_id: branchId || null,
        bonus_reward_id: bonusId
    })

    return NextResponse.json({
        success: true,
        rewardValue: bonus.reward_value,
        rewardType: bonus.reward_type
    })
}
