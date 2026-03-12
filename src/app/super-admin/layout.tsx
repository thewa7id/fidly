import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import SuperAdminSidebar from '@/components/super-admin/SuperAdminSidebar'
import SuperAdminHeader from '@/components/super-admin/SuperAdminHeader'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    if (!user) redirect('/login')
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') redirect('/admin')

    return (
        <TooltipProvider delayDuration={0}>
            <SidebarProvider>
                <div className="flex min-h-screen w-full bg-background">
                    <SuperAdminSidebar />
                    <SidebarInset className="flex-1 flex flex-col">
                        <SuperAdminHeader />
                        <main className="flex-1 overflow-y-auto p-6">
                            {children}
                        </main>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </TooltipProvider>
    )
}
