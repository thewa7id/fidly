import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RewardsClient from '@/components/admin/RewardsClient'

export const metadata = { title: 'Rewards' }

export default async function RewardsPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) redirect('/register')

    const orgId = profile.organization_id

    const [
        { data: rewards },
        { data: programs },
        { data: bonusRewards },
    ] = await Promise.all([
        supabase.from('rewards').select('*').eq('organization_id', orgId).eq('is_active', true).is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('loyalty_programs').select('*').eq('organization_id', orgId).eq('is_active', true).is('deleted_at', null),
        supabase.from('bonus_rewards').select('*').eq('organization_id', orgId).eq('is_active', true).order('created_at', { ascending: false }),
    ])

    return (
        <div className="max-w-4xl mx-auto">
            <RewardsClient
                initialRewards={rewards ?? []}
                initialBonusRewards={bonusRewards ?? []}
                programs={programs ?? []}
            />
        </div>
    )
}
