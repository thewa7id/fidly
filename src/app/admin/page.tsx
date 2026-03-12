export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Star, TrendingUp, Gift, BarChart2, ArrowUpRight, Smartphone, Megaphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AdminAnalyticsChart from '@/components/admin/AdminAnalyticsChart'

export const metadata = { title: 'Dashboard' }

export default async function AdminDashboardPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    if (!user) redirect('/login')

    // Use cached profile fetch
    const { getCachedProfile } = await import('@/lib/cache')
    const profile = await getCachedProfile(user.id)
    const orgId = profile?.organization_id
    if (!orgId) redirect('/login')

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Parallel queries — all scoped to this org (RLS also enforces this)
    const [
        { count: totalCustomers },
        { count: activeCustomers },
        { count: totalTransactions },
        { count: totalStampsEarned },
        { count: totalRedemptions },
        { data: recentTransactions },
        { count: pushSubscribers },
        { data: campaignsSent }
    ] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('last_visit_at', since30),
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('created_at', since30),
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('type', 'earn').gte('created_at', since30),
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('type', 'redeem').gte('created_at', since30),
        supabase.from('transactions').select('created_at, type, amount').eq('organization_id', orgId).gte('created_at', since30).order('created_at', { ascending: true }),
        supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('campaigns').select('success_count').eq('organization_id', orgId).gte('created_at', since30),
    ])

    // Build daily growth chart data from transactions
    const days: Record<string, { date: string; newCustomers: number; transactions: number }> = {}
    for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        const key = d.toISOString().slice(0, 10)
        days[key] = { date: key, newCustomers: 0, transactions: 0 }
    }
    for (const tx of recentTransactions ?? []) {
        const key = tx.created_at?.slice(0, 10)
        if (key && days[key]) {
            days[key].transactions += 1
            if (tx.type === 'earn') days[key].newCustomers += tx.amount ?? 1
        }
    }
    const growthData = Object.values(days)

    const redemptionRate = totalTransactions
        ? Math.round(((totalRedemptions ?? 0) / (totalTransactions ?? 1)) * 100)
        : 0

    const totalPushesSent = campaignsSent?.reduce((sum, c) => sum + (c.success_count || 0), 0) ?? 0

    const stats = [
        { label: 'Total Customers', value: totalCustomers ?? 0, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Active (30 days)', value: activeCustomers ?? 0, icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
        { label: 'Stamps Issued', value: totalStampsEarned ?? 0, icon: Star, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
        { label: 'Redemptions', value: totalRedemptions ?? 0, icon: Gift, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
        { label: 'Total Transactions', value: totalTransactions ?? 0, icon: BarChart2, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10' },
        { label: 'Redemption Rate', value: `${redemptionRate}%`, icon: ArrowUpRight, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
        { label: 'Push Subscribers', value: pushSubscribers ?? 0, icon: Smartphone, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'Pushes Sent (30d)', value: totalPushesSent, icon: Megaphone, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
    ]

    const orgName = (profile?.organizations as any)?.name ?? 'your business'

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back! Here&apos;s what&apos;s happening with{' '}
                    <span className="text-primary font-medium">{orgName}</span>
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(stat => (
                    <div key={stat.label} className="stat-card group">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">
                            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                        </div>
                        <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Analytics Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Activity — Last 30 Days</CardTitle>
                </CardHeader>
                <CardContent>
                    <AdminAnalyticsChart data={growthData} />
                </CardContent>
            </Card>
        </div>
    )
}
