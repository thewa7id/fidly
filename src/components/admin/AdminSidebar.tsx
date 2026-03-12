'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, Users, Star, Gift, Palette, Settings,
    BarChart2, Building2, CreditCard, ChevronLeft, LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/customers', label: 'Customers', icon: Users },
    { href: '/admin/program', label: 'Loyalty Program', icon: Star },
    { href: '/admin/rewards', label: 'Rewards', icon: Gift },
    { href: '/admin/branches', label: 'Branches', icon: Building2 },
    { href: '/admin/card-design', label: 'Card Design', icon: Palette },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    { href: '/admin/employees', label: 'Employees', icon: Users },
    { href: '/admin/subscription', label: 'Subscription', icon: CreditCard },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
]

interface AdminSidebarProps {
    profile: any
}

export default function AdminSidebar({ profile }: AdminSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const org = profile?.organizations

    async function handleLogout() {
        await supabase.auth.signOut({ scope: 'local' })
        router.push('/login')
        router.refresh()
    }

    return (
        <aside className="w-64 flex flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                    <div className="font-semibold text-white text-sm truncate">{org?.name ?? 'Goyalty'}</div>
                    <div className="text-xs text-muted-foreground capitalize">{profile?.role ?? 'admin'}</div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navItems.map(item => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'sidebar-item',
                                isActive && 'active'
                            )}
                        >
                            <item.icon className="w-4 h-4 shrink-0" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            {/* POS Link */}
            <div className="px-3 pb-4 border-t border-white/5 pt-4 space-y-1">
                <Link href="/pos" className="sidebar-item">
                    <ChevronLeft className="w-4 h-4" />
                    POS Terminal
                </Link>
                <button onClick={handleLogout} className="sidebar-item w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
