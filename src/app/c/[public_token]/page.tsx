export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CustomerCard from '@/components/loyalty/CustomerCard'
import { createServiceClient } from '@/lib/supabase/server'

interface Props {
    params: Promise<{ public_token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    return {
        title: 'My Loyalty Card',
        description: 'View your digital loyalty card and stamps',
    }
}

async function getCardData(token: string) {
    const svc = createServiceClient()

    // Accept both the full 32-char hex token AND the 8-char short code
    // Short code = first 8 chars of public_token
    const isShortCode = token.length <= 8
    const { data: customer } = isShortCode
        ? await svc
            .from('customers')
            .select('id, full_name, available_stamps, total_stamps, available_points, total_points, total_visits, total_redeemed, last_visit_at, joined_at, organization_id, public_token')
            .ilike('public_token', `${token}%`)
            .limit(1)
            .single()
        : await svc
            .from('customers')
            .select('id, full_name, available_stamps, total_stamps, available_points, total_points, total_visits, total_redeemed, last_visit_at, joined_at, organization_id, public_token')
            .eq('public_token', token)
            .single()

    if (!customer) return null

    const orgId = customer.organization_id

    const [
        { data: org },
        { data: cardDesign },
        { data: stampDesign },
        { data: program },
        { data: rewards },
        { data: transactions },
        bonusesRes,
        claimsRes,
        { data: googleWalletConfig },
        { data: appleWalletConfig },
    ] = await Promise.all([
        svc.from('organizations').select('id, name, logo_url, subscription_status').eq('id', orgId).single(),
        svc.from('card_designs').select('config').eq('organization_id', orgId).single(),
        svc.from('stamp_designs').select('config').eq('organization_id', orgId).single(),
        svc.from('loyalty_programs')
            .select('name, type, stamps_required, points_per_currency_unit, currency_unit')
            .eq('organization_id', orgId)
            .eq('is_active', true)
            .is('deleted_at', null)
            .limit(1)
            .single(),
        svc.from('rewards')
            .select('id, name, description, type, value, stamps_required, points_required')
            .eq('organization_id', orgId)
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('stamps_required', { ascending: true }),
        svc.from('transactions')
            .select('id, type, stamps_earned, stamps_redeemed, stamps_balance_after, points_earned, points_redeemed, purchase_amount, notes, created_at, branches(name), rewards(name), reward_snapshot')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false })
            .limit(50),
        svc.from('bonus_rewards').select('*').eq('organization_id', orgId).eq('is_active', true).order('created_at', { ascending: false }),
        svc.from('customer_bonus_claims').select('bonus_reward_id').eq('customer_id', customer.id),
        svc.from('wallet_providers_config').select('id').eq('org_id', orgId).eq('provider', 'google').single(),
        svc.from('wallet_providers_config').select('id').eq('org_id', orgId).eq('provider', 'apple').single()
    ])

    // Fetch NFC card separately (not in Promise.all due to destructuring)
    const nfcCardResult = await svc.from('nfc_cards').select('nfc_uid, linked_at').eq('customer_id', customer.id).eq('organization_id', orgId).eq('status', 'active').limit(1).single()

    const bonusesData = bonusesRes.data ?? []
    const claimsData = claimsRes.data ?? []

    const claimMap = new Set(claimsData.map((c: any) => c.bonus_reward_id))
    const bonusRewards = bonusesData.map((b: any) => ({
        ...b,
        claimed: claimMap.has(b.id)
    }))

    if (!org || org.subscription_status === 'inactive') return null

    return {
        customer,
        organization: { name: org.name, logoUrl: org.logo_url },
        cardDesign: cardDesign?.config ?? null,
        stampDesign: stampDesign?.config ?? null,
        program: program ?? null,
        rewards: rewards ?? [],
        transactions: transactions ?? [],
        bonusRewards,
        googleWalletEnabled: !!googleWalletConfig,
        appleWalletEnabled: !!appleWalletConfig,
        nfcCard: nfcCardResult.data ?? null
    }
}

export default async function CustomerCardPage({ params }: Props) {
    const { public_token } = await params
    const data = await getCardData(public_token)

    if (!data) notFound()

    return (
        <div className="min-h-screen bg-background">
            <CustomerCard data={data} publicToken={data.customer.public_token} />
        </div>
    )
}
