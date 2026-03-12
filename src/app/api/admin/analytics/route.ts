import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/analytics
 * Returns summary analytics for the organization with date range support
 */
export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 404 })

    const orgId = profile.organization_id
    const { searchParams } = new URL(req.url)
    const days = searchParams.get('days')
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    let since: string
    let until: string = new Date().toISOString()

    if (start) {
        since = new Date(start).toISOString()
        if (end) {
            const endDate = new Date(end)
            endDate.setHours(23, 59, 59, 999)
            until = endDate.toISOString()
        }
    } else {
        const daysCount = parseInt(days ?? '30')
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - daysCount)
        startDate.setHours(0, 0, 0, 0)
        since = startDate.toISOString()
    }

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
        { data: newCustomersByDay },
        { count: pushSubscribers },
        { data: campaignsData }
    ] = await Promise.all([
        // Active customers (visited in period)
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('last_visit_at', since).lte('last_visit_at', until),
        // Stamps earned
        supabase.from('transactions').select('stamps_earned').eq('organization_id', orgId).eq('type', 'earn_stamp').gte('created_at', since).lte('created_at', until),
        // Redemptions
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('type', 'redeem_reward').gte('created_at', since).lte('created_at', until),
        // Total transactions
        supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).gte('created_at', since).lte('created_at', until),
        // Branch data
        supabase.from('transactions').select('branch_id, branches(name)').eq('organization_id', orgId).gte('created_at', since).lte('created_at', until),
        // Growth raw
        supabase.from('transactions').select('created_at, type, customer_id').eq('organization_id', orgId).gte('created_at', since).lte('created_at', until).order('created_at', { ascending: true }),
        // New customers
        supabase.from('customers').select('joined_at').eq('organization_id', orgId).gte('joined_at', since).lte('joined_at', until),
        // Push Subscribers (all time)
        supabase.from('push_subscriptions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        // Campaigns sent in period
        supabase.from('campaigns').select('success_count').eq('organization_id', orgId).gte('created_at', since).lte('created_at', until)
    ])

    const totalStampsEarned = stampsData?.reduce((sum, t) => sum + (t.stamps_earned || 0), 0) ?? 0

    // Top branch calculation
    const branchCounts: Record<string, { name: string; count: number }> = {}
    branchData?.forEach((t: any) => {
        const bid = t.branch_id
        if (!branchCounts[bid]) branchCounts[bid] = { name: t.branches?.name ?? bid, count: 0 }
        branchCounts[bid].count++
    })
    const topBranch = Object.values(branchCounts).sort((a, b) => b.count - a.count)[0]?.name ?? null

    // Growth data mapping
    const growthMap: Record<string, { date: string; newCustomers: number; transactions: number }> = {}

    // Initialize days in range
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

    const growthData = Object.values(growthMap).sort((a, b) => a.date.localeCompare(b.date))
    const redemptionRate = totalTransactions ? Math.round(((totalRedemptions ?? 0) / (totalTransactions ?? 1)) * 100) : 0
    const totalPushesSent = campaignsData?.reduce((sum, c) => sum + (c.success_count || 0), 0) ?? 0

    return NextResponse.json({
        success: true,
        data: {
            totalCustomers: totalCustomers ?? 0,
            activeCustomers: activeCustomers ?? 0,
            totalStampsEarned,
            totalRedemptions: totalRedemptions ?? 0,
            totalTransactions: totalTransactions ?? 0,
            redemptionRate,
            pushSubscribers: pushSubscribers ?? 0,
            totalPushesSent,
            topBranch,
            growthData,
            period: { since, until }
        },
    })
}
