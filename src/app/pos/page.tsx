import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import POSClient from '@/components/pos/POSClient'

export const metadata = { title: 'POS Terminal' }

export default async function POSPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('*, organizations(name, metadata)')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) redirect('/register')

    const [
        { data: branches },
        { data: rewards },
        { data: transactions },
    ] = await Promise.all([
        supabase.from('branches').select('id, name').eq('organization_id', profile.organization_id).eq('is_active', true).order('created_at', { ascending: true }),
        supabase.from('rewards').select('id, name, description, stamps_required, points_required').eq('organization_id', profile.organization_id).eq('is_active', true).is('deleted_at', null),
        supabase.from('transactions').select('*, customers(full_name), rewards(name)').eq('organization_id', profile.organization_id).order('created_at', { ascending: false }).limit(20)
    ])

    return (
        <POSClient
            initialProfile={profile}
            initialBranches={branches ?? []}
            initialRewards={rewards ?? []}
            initialTransactions={transactions ?? []}
        />
    )
}
