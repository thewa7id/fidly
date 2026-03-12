import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function POSLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('users')
        .select('role, organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) redirect('/register')

    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    )
}
