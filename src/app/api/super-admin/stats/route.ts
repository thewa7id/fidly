import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/** GET /api/super-admin/stats — Platform-wide metrics */
export async function GET() {
    const supabase = await createAdminClient()

    const [
        { count: totalOrgs },
        { count: activeOrgs },
        { count: totalUsers },
        { count: totalCustomers },
        { count: totalTransactions },
    ] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('organizations').select('*', { count: 'exact', head: true }).is('deleted_at', null).eq('is_active', true),
        supabase.from('users').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('customers').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('transactions').select('*', { count: 'exact', head: true }),
    ])

    // Growth data — last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentOrgs } = await supabase
        .from('organizations')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .is('deleted_at', null)

    const { data: recentCustomers } = await supabase
        .from('customers')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .is('deleted_at', null)

    const { data: recentTx } = await supabase
        .from('transactions')
        .select('created_at, purchase_amount')
        .gte('created_at', thirtyDaysAgo.toISOString())

    // Aggregate by day
    const growthMap: Record<string, { orgs: number; customers: number; transactions: number; revenue: number }> = {}
    for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toISOString().split('T')[0]
        growthMap[key] = { orgs: 0, customers: 0, transactions: 0, revenue: 0 }
    }

    recentOrgs?.forEach((o: any) => {
        const key = o.created_at.split('T')[0]
        if (growthMap[key]) growthMap[key].orgs++
    })
    recentCustomers?.forEach((c: any) => {
        const key = c.created_at.split('T')[0]
        if (growthMap[key]) growthMap[key].customers++
    })
    recentTx?.forEach((t: any) => {
        const key = t.created_at.split('T')[0]
        if (growthMap[key]) {
            growthMap[key].transactions++
            growthMap[key].revenue += Number(t.purchase_amount ?? 0)
        }
    })

    const growthData = Object.entries(growthMap).map(([date, data]) => ({ date, ...data }))

    // Subscription breakdown
    const { data: subBreakdown } = await supabase
        .from('organizations')
        .select('subscription_status')
        .is('deleted_at', null)

    const subsCount = { active: 0, trial: 0, inactive: 0, cancelled: 0, past_due: 0 }
    subBreakdown?.forEach((o: any) => {
        const status = o.subscription_status as keyof typeof subsCount
        if (subsCount[status] !== undefined) subsCount[status]++
    })

    return NextResponse.json({
        success: true,
        data: {
            totalOrgs: totalOrgs ?? 0,
            activeOrgs: activeOrgs ?? 0,
            totalUsers: totalUsers ?? 0,
            totalCustomers: totalCustomers ?? 0,
            totalTransactions: totalTransactions ?? 0,
            growthData,
            subscriptionBreakdown: subsCount,
        }
    })
}
