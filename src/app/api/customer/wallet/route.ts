import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/customer/wallet
 * Returns all loyalty cards for the currently logged-in customer, 
 * including available bonus rewards and claim status.
 */
export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const svc = createServiceClient()

    // Get all customer records for this auth user
    const { data: customers } = await svc
        .from('customers')
        .select('id, organization_id, full_name, available_stamps, total_stamps, total_visits, total_redeemed, public_token, joined_at')
        .eq('auth_user_id', user.id)
        .is('deleted_at', null)
        .order('joined_at', { ascending: false })

    if (!customers || customers.length === 0) {
        return NextResponse.json({ success: true, data: [] })
    }

    const orgIds = customers.map(c => c.organization_id)
    const customerIds = customers.map(c => c.id)

    // Fetch org details, designs, programs, bonuses, and claims
    const [
        { data: orgs },
        { data: cardDesigns },
        { data: stampDesigns },
        { data: programs },
        { data: bonuses },
        { data: claims }
    ] = await Promise.all([
        svc.from('organizations').select('id, name, logo_url').in('id', orgIds),
        svc.from('card_designs').select('organization_id, config').in('organization_id', orgIds),
        svc.from('stamp_designs').select('organization_id, config').in('organization_id', orgIds),
        svc.from('loyalty_programs').select('organization_id, stamps_required').in('organization_id', orgIds).eq('is_active', true).is('deleted_at', null),
        svc.from('bonus_rewards').select('*').in('organization_id', orgIds).eq('is_active', true),
        svc.from('customer_bonus_claims').select('customer_id, bonus_reward_id, branch_id').in('customer_id', customerIds)
    ])

    const orgMap = Object.fromEntries((orgs ?? []).map(o => [o.id, o]))
    const cardMap = Object.fromEntries((cardDesigns ?? []).map(d => [d.organization_id, d.config]))
    const stampMap = Object.fromEntries((stampDesigns ?? []).map(d => [d.organization_id, d.config]))
    const programMap = Object.fromEntries((programs ?? []).map(p => [p.organization_id, p]))

    // Group bonuses by organization
    const bonusMap: Record<string, any[]> = {}
    bonuses?.forEach(b => {
        if (!bonusMap[b.organization_id]) bonusMap[b.organization_id] = []
        bonusMap[b.organization_id].push(b)
    })

    const wallet = customers.map(c => {
        const orgBonuses = bonusMap[c.organization_id] ?? []
        const userClaims = claims?.filter(cl => cl.customer_id === c.id) ?? []

        return {
            customer: c,
            organization: orgMap[c.organization_id] ?? null,
            cardDesign: cardMap[c.organization_id] ?? null,
            stampDesign: stampMap[c.organization_id] ?? null,
            stampsRequired: programMap[c.organization_id]?.stamps_required ?? 10,
            bonusRewards: orgBonuses.map(b => ({
                ...b,
                claimed: userClaims.some(cl => cl.bonus_reward_id === b.id)
            }))
        }
    })

    return NextResponse.json({ success: true, data: wallet })
}

/**
 * POST /api/customer/wallet/join
 */
export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orgSlug } = await req.json()
    if (!orgSlug) return NextResponse.json({ error: 'orgSlug required' }, { status: 400 })

    const svc = createServiceClient()

    const { data: org } = await svc
        .from('organizations')
        .select('id, name, subscription_status')
        .eq('slug', orgSlug)
        .single()

    if (!org) return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    if (org.subscription_status === 'inactive') return NextResponse.json({ error: 'This loyalty program is not active' }, { status: 403 })

    const { data: existing } = await svc
        .from('customers')
        .select('id, public_token')
        .eq('auth_user_id', user.id)
        .eq('organization_id', org.id)
        .single()

    if (existing) {
        return NextResponse.json({ success: true, token: existing.public_token, alreadyMember: true })
    }

    const { data: customer, error } = await svc
        .from('customers')
        .insert({
            organization_id: org.id,
            auth_user_id: user.id,
            email: user.email,
            phone: user.phone || user.user_metadata?.phone || null,
            full_name: user.user_metadata?.full_name ?? null,
            available_stamps: 0,
            total_stamps: 0,
            total_visits: 0,
            total_redeemed: 0,
        })
        .select('id, public_token')
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, token: customer.public_token })
}
