'use client'

import { usePathname } from 'next/navigation'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import AdminNotifications from '@/components/admin/AdminNotifications'

const pageTitles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/customers': 'Customers',
    '/admin/program': 'Loyalty Program',
    '/admin/rewards': 'Rewards',
    '/admin/branches': 'Branches',
    '/admin/card-design': 'Card Design',
    '/admin/analytics': 'Analytics',
    '/admin/marketing': 'Marketing',
    '/admin/employees': 'Employees',
    '/admin/subscription': 'Subscription',
    '/admin/settings': 'Settings',
}

export default function AppHeader({ profile }: { profile: any }) {
    const pathname = usePathname()
    const org = profile?.organizations
    const subStatus = org?.subscription_status ?? 'trial'
    const plan = org?.subscriptions

    // Build dynamic badge label
    const getBadgeLabel = () => {
        const planName = plan?.display_name ?? plan?.name ?? null

        if (subStatus === 'trial') {
            const expiresAt = org?.subscription_expires_at ?? org?.trial_ends_at
                ?? (org?.created_at ? new Date(new Date(org.created_at).getTime() + 14 * 86400000).toISOString() : null)
            const daysLeft = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)) : null
            const daysStr = daysLeft !== null ? `${daysLeft} days left` : 'Trial'
            return planName ? `${planName} · ${daysStr}` : daysStr
        }

        if (subStatus === 'active' && planName) return planName
        return planName ? `${planName} · ${subStatus}` : subStatus
    }

    const statusColors: Record<string, string> = {
        active: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400',
        trial: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400',
        past_due: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
        inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:text-gray-400',
        cancelled: 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400',
    }

    const currentPage = pageTitles[pathname] ?? pathname.split('/').pop()?.replace(/-/g, ' ') ?? 'Dashboard'

    return (
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 flex-1">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/admin">
                                {org?.name ?? 'Goyalty'}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {pathname !== '/admin' && (
                            <>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="capitalize">{currentPage}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </>
                        )}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
                <Badge className={`${statusColors[subStatus]} border text-[10px] font-bold uppercase tracking-wider capitalize`}>
                    {getBadgeLabel()}
                </Badge>

                <ThemeToggle />

                <AdminNotifications organizationId={org?.id} />
            </div>
        </header>
    )
}
