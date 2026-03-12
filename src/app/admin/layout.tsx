import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppSidebar from '@/components/admin/AppSidebar'
import AppHeader from '@/components/admin/AppHeader'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    if (!user) redirect('/login')

    // Use cached profile fetch
    const { getCachedProfile } = await import('@/lib/cache')
    const profile = await getCachedProfile(user.id)

    if (!profile?.organization_id) redirect('/register')
    if (profile.role === 'employee') redirect('/pos')

    // Read sidebar state from cookie
    const cookieStore = await cookies()
    const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false'

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar profile={profile} />
            <SidebarInset>
                <AppHeader profile={profile} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
