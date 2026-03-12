'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard, Users, Star, Gift, Palette, Settings,
    BarChart2, Building2, CreditCard, ChevronLeft, LogOut,
    ChevronsUpDown, Sparkles, Wallet, Megaphone
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
} from '@/components/ui/sidebar'

// Nav structure organized into logical groups
const mainNav = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
]

const programNav = [
    { href: '/admin/program', label: 'Loyalty Program', icon: Star },
    { href: '/admin/rewards', label: 'Rewards', icon: Gift },
    { href: '/admin/card-design', label: 'Card Design', icon: Palette },
    { href: '/admin/settings/wallet', label: 'Digital Wallet', icon: Wallet },
]

const managementNav = [
    { href: '/admin/branches', label: 'Branches', icon: Building2 },
    { href: '/admin/employees', label: 'Employees', icon: Users },
    { href: '/admin/subscription', label: 'Subscription', icon: CreditCard },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
]

interface AppSidebarProps {
    profile: any
}

export default function AppSidebar({ profile }: AppSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const org = profile?.organizations

    const initials = (profile?.full_name ?? profile?.email ?? 'U')
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    async function handleLogout() {
        await supabase.auth.signOut({ scope: 'local' })
        router.push('/login')
        router.refresh()
    }

    function isActive(href: string) {
        return pathname === href || (href !== '/admin' && pathname.startsWith(href))
    }

    function renderNavGroup(label: string, items: typeof mainNav) {
        return (
            <SidebarGroup>
                <SidebarGroupLabel>{label}</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        {items.map(item => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive(item.href)}
                                    tooltip={item.label}
                                >
                                    <Link href={item.href}>
                                        <item.icon />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        )
    }

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            {/* Brand Header */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild tooltip={org?.name ?? 'Goyalty'}>
                            <Link href="/admin">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg gradient-primary text-white shrink-0">
                                    <Sparkles className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left">
                                    <span className="truncate text-sm font-semibold text-sidebar-foreground">
                                        {org?.name ?? 'Goyalty'}
                                    </span>
                                    <span className="truncate text-xs text-sidebar-foreground/50 capitalize">
                                        {profile?.role ?? 'admin'} · dashboard
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarSeparator />

            {/* Navigation Groups */}
            <SidebarContent>
                {renderNavGroup('Overview', mainNav)}
                {renderNavGroup('Program', programNav)}
                {renderNavGroup('Management', managementNav)}

                {/* POS link */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="POS Terminal">
                                    <Link href="/pos">
                                        <ChevronLeft />
                                        <span>POS Terminal</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* User Footer */}
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                >
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarFallback className="rounded-lg gradient-primary text-white text-xs font-semibold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">{profile?.full_name ?? 'Admin'}</span>
                                        <span className="truncate text-xs text-muted-foreground">{profile?.email}</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                                side="bottom"
                                align="end"
                                sideOffset={4}
                            >
                                <DropdownMenuLabel className="p-0 font-normal">
                                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarFallback className="rounded-lg gradient-primary text-white text-xs font-semibold">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{profile?.full_name ?? 'Admin'}</span>
                                            <span className="truncate text-xs text-muted-foreground">{profile?.email}</span>
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/settings" className="cursor-pointer">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/admin/subscription" className="cursor-pointer">
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Subscription
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}
