'use client'

import { Bell, Search } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export default function AdminHeader({ profile }: { profile: any }) {
    const org = profile?.organizations
    const subStatus = org?.subscription_status ?? 'trial'
    const plan = org?.subscriptions

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
        active: 'bg-green-500/10 text-green-400 border-green-500/20',
        trial: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
        past_due: 'bg-red-500/10 text-red-400 border-red-500/20',
        inactive: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    }

    const initials = (profile?.full_name ?? profile?.email ?? 'U')
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-sidebar/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-64"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <Badge className={`${statusColors[subStatus]} border text-xs capitalize`}>
                    {getBadgeLabel()}
                </Badge>

                <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors text-muted-foreground hover:text-white">
                    <Bell className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="gradient-primary text-white text-xs font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                        <div className="text-white font-medium leading-tight">{profile?.full_name ?? 'Admin'}</div>
                        <div className="text-muted-foreground text-xs capitalize">{profile?.role}</div>
                    </div>
                </div>
            </div>
        </header>
    )
}
