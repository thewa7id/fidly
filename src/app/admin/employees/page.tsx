import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EmployeesClient from '@/components/admin/EmployeesClient'

export const metadata = { title: 'Employees' }

export default async function EmployeesPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) redirect('/register')

    const [
        { data: employees },
        { data: branches },
    ] = await Promise.all([
        supabase.from('users').select('*, branches(name)').eq('organization_id', profile.organization_id).order('created_at', { ascending: false }),
        supabase.from('branches').select('*').eq('organization_id', profile.organization_id),
    ])

    return (
        <div className="max-w-4xl mx-auto">
            <EmployeesClient
                initialEmployees={employees ?? []}
                branches={branches ?? []}
            />
        </div>
    )
}
