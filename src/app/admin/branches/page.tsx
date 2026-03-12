import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BranchesClient from '@/components/admin/BranchesClient'
import { headers } from 'next/headers'

export const metadata = { title: 'Branches' }

export default async function BranchesPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('organization_id, organizations(slug)')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) redirect('/register')

    const { data: branches } = await supabase
        .from('branches')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

    const host = (await headers()).get('host')
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`

    return (
        <div className="max-w-4xl mx-auto">
            <BranchesClient
                initialBranches={branches ?? []}
                slug={(profile.organizations as any)?.slug || null}
                baseUrl={baseUrl}
            />
        </div>
    )
}
