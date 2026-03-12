import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

/** GET /api/super-admin/organizations/[id] — Full org detail */
export async function GET(req: NextRequest, { params }: Params) {
    const { id } = await params
    const supabase = await createAdminClient()

    // Organization with relations
    const { data: org, error } = await supabase
        .from('organizations')
        .select('*, subscription:subscriptions!subscription_id(id, name, display_name, price_monthly, price_yearly)')
        .eq('id', id)
        .single()

    if (error || !org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Owner info
    const { data: owner } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at')
        .eq('id', org.owner_id)
        .single()

    // Branches
    const { data: branches } = await supabase
        .from('branches')
        .select('*')
        .eq('organization_id', id)
        .is('deleted_at', null)
        .order('created_at')

    // Employees
    const { data: employees } = await supabase
        .from('users')
        .select('id, email, full_name, role, is_active, created_at')
        .eq('organization_id', id)
        .is('deleted_at', null)
        .order('created_at')

    // Customers count & recent
    const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id)
        .is('deleted_at', null)

    const { data: recentCustomers } = await supabase
        .from('customers')
        .select('id, full_name, email, phone, available_stamps, total_visits, total_redeemed, joined_at')
        .eq('organization_id', id)
        .is('deleted_at', null)
        .order('joined_at', { ascending: false })
        .limit(10)

    // Transaction stats
    const { count: transactionCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id)

    const { data: recentTx } = await supabase
        .from('transactions')
        .select('id, type, stamps_earned, stamps_redeemed, purchase_amount, created_at, customers(full_name)')
        .eq('organization_id', id)
        .order('created_at', { ascending: false })
        .limit(10)

    // Loyalty programs
    const { data: programs } = await supabase
        .from('loyalty_programs')
        .select('*')
        .eq('organization_id', id)
        .is('deleted_at', null)

    // All subscription plans (for the dropdown)
    const { data: allPlans } = await supabase
        .from('subscriptions')
        .select('id, name, display_name, price_monthly, price_yearly')
        .eq('is_active', true)
        .order('price_monthly')

    return NextResponse.json({
        success: true,
        data: {
            org,
            owner,
            branches: branches ?? [],
            employees: employees ?? [],
            customerCount: customerCount ?? 0,
            recentCustomers: recentCustomers ?? [],
            transactionCount: transactionCount ?? 0,
            recentTransactions: recentTx ?? [],
            programs: programs ?? [],
            allPlans: allPlans ?? [],
        }
    })
}
