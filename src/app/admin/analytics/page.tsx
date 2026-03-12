import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from '@/components/admin/AnalyticsClient'

export const metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) redirect('/register')

    const orgId = profile.organization_id
    const daysCount = 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysCount)
    startDate.setHours(0, 0, 0, 0)
    const since = startDate.toISOString()
    const until = new Date().toISOString()

    // 1. Total customers (all time)
    const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .is('deleted_at', null)

    // 2. Statistics for the period
    const [
        { count: activeCustomers },
        { data: stampsData },
        { count: totalRedemptions },
        { count: totalTransactions },
        { data: branchData },
        { data: growthRaw },
        { data: newCustomersByDay }
    ] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('last_visit_at', since).lte('last_visit_at', until),
        supabase.from('transactions').select('stamps_earned').eq('organization_id', orgId).eq('type', 'earn_stamp').gte('created_at', since).lte('created_at', until),
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('type', 'redeem_reward').gte('created_at', since).lte('created_at', until),
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('created_at', since).lte('created_at', until),
        supabase.from('transactions').select('branch_id, branches(name)').eq('organization_id', orgId).gte('created_at', since).lte('created_at', until),
        supabase.from('transactions').select('created_at, type, customer_id').eq('organization_id', orgId).gte('created_at', since).lte('created_at', until).order('created_at', { ascending: true }),
        supabase.from('customers').select('joined_at').eq('organization_id', orgId).gte('joined_at', since).lte('joined_at', until)
    ])

    const totalStampsEarned = stampsData?.reduce((sum, t) => sum + (t.stamps_earned || 0), 0) ?? 0

    const branchCounts: Record<string, { name: string; count: number }> = {}
    branchData?.forEach((t: any) => {
        const bid = t.branch_id
        if (!branchCounts[bid]) branchCounts[bid] = { name: t.branches?.name ?? bid, count: 0 }
        branchCounts[bid].count++
    })
    const topBranch = Object.values(branchCounts).sort((a, b) => b.count - a.count)[0]?.name ?? null

    const growthMap: Record<string, { date: string; newCustomers: number; transactions: number }> = {}
    const startD = new Date(since)
    const endD = new Date(until)
    for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        growthMap[dateStr] = { date: dateStr, newCustomers: 0, transactions: 0 }
    }

    growthRaw?.forEach(t => {
        const date = t.created_at.split('T')[0]
        if (growthMap[date]) growthMap[date].transactions++
    })

    newCustomersByDay?.forEach(c => {
        const date = c.joined_at.split('T')[0]
        if (growthMap[date]) growthMap[date].newCustomers++
    })

    const analyticsData = {
        totalCustomers: totalCustomers ?? 0,
        activeCustomers: activeCustomers ?? 0,
        totalStampsEarned,
        totalRedemptions: totalRedemptions ?? 0,
        totalTransactions: totalTransactions ?? 0,
        redemptionRate: totalTransactions ? Math.round(((totalRedemptions ?? 0) / (totalTransactions ?? 1)) * 100) : 0,
        topBranch,
        growthData: Object.values(growthMap).sort((a, b) => a.date.localeCompare(b.date))
    }

    return (
        <div className="max-w-6xl mx-auto">
            <AnalyticsClient initialData={analyticsData} initialPeriod="30" />
        </div>
    )
}
