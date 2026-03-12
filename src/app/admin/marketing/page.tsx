import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MarketingClient from './MarketingClient'

export const metadata = { title: 'Marketing' }

export default async function MarketingPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('organization_id, organizations(*, subscriptions(*))').eq('id', user.id).single()
    if (!profile?.organization_id) redirect('/register')

    const organization = profile.organizations as any
    const planName = organization?.subscriptions?.name || 'free'

    // Get stats for audiences
    const [{ count: activeCount }, { count: totalCount }, { data: pushSubs }, { count: walletCount }] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id).is('deleted_at', null).gt('last_visit_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('organization_id', profile.organization_id).is('deleted_at', null),
        supabase.from('push_subscriptions').select('id').eq('organization_id', profile.organization_id),
        supabase.from('wallet_google_objects').select('*', { count: 'exact', head: true }).eq('org_id', profile.organization_id)
    ])

    // Get recent campaigns
    const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })
        .limit(10)

    return (
        <div className="max-w-4xl mx-auto">
            <MarketingClient
                initialCampaigns={campaigns ?? []}
                stats={{
                    totalCustomers: totalCount ?? 0,
                    activeCustomers: activeCount ?? 0,
                    subscribers: pushSubs?.length ?? 0,
                    walletPasses: walletCount ?? 0,
                    planName
                }}
            />
        </div>
    )
}
