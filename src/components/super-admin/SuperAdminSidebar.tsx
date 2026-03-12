'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard, Building2, Users, Settings, LogOut,
    ChevronsUpDown, Shield, ChevronLeft
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
    Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
    SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
    SidebarMenuItem, useSidebar,
} from '@/components/ui/sidebar'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
    { href: '/super-admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/super-admin/organizations', label: 'Organizations', icon: Building2 },
    { href: '/super-admin/customers', label: 'Customers', icon: Users },
    { href: '/super-admin/settings', label: 'Settings', icon: Settings },
]

export default function SuperAdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { toggleSidebar, state } = useSidebar()

    const isActive = (href: string) =>
        href === '/super-admin'
            ? pathname === '/super-admin'
            : pathname.startsWith(href)

    async function handleLogout() {
        await supabase.auth.signOut({ scope: 'local' })
        router.push('/login')
        router.refresh()
    }

    return (
        <Sidebar collapsible="icon" className="border-r border-border">
            <SidebarHeader className="border-b border-border px-3 py-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/super-admin" className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                                    <Shield className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex flex-col leading-none">
                                    <span className="font-bold text-sm text-foreground">Goyalty</span>
                                    <span className="text-[10px] font-semibold text-red-500 uppercase tracking-wider">Super Admin</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 py-3">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-muted-foreground text-[10px] uppercase tracking-widest px-2 mb-1">
                        Platform
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {navItems.map(item => (
                            <SidebarMenuItem key={item.href}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive(item.href)}
                                            className={isActive(item.href)
                                                ? 'bg-primary/10 text-primary font-semibold'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}
                                        >
                                            <Link href={item.href}>
                                                <item.icon className="w-4 h-4" />
                                                <span>{item.label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </TooltipTrigger>
                                    {state === 'collapsed' && (
                                        <TooltipContent side="right">{item.label}</TooltipContent>
                                    )}
                                </Tooltip>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-border p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg" className="hover:bg-muted/50">
                                    <Avatar className="w-7 h-7 shrink-0">
                                        <AvatarFallback className="bg-red-500/10 text-red-500 text-xs font-bold">SA</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col leading-none text-left">
                                        <span className="text-xs font-semibold text-foreground">Super Admin</span>
                                        <span className="text-[10px] text-muted-foreground">Platform Manager</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto w-4 h-4 text-muted-foreground" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="top" className="w-56">
                                <DropdownMenuItem asChild>
                                    <Link href="/super-admin/settings">
                                        <Settings className="w-4 h-4 mr-2" /> Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
