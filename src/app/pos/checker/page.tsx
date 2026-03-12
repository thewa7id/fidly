import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CheckerClient from '@/components/pos/CheckerClient'

export const metadata = { title: 'POS Balance Checker' }

export default async function POSCheckerPage() {
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

    return <CheckerClient initialProfile={profile} />
}
