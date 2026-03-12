import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/** GET /api/super-admin/organizations — List all orgs */
export async function GET(req: NextRequest) {
    const supabase = await createAdminClient()
    const search = req.nextUrl.searchParams.get('search') ?? ''
    const status = req.nextUrl.searchParams.get('status') ?? ''

    let query = supabase
        .from('organizations')
        .select('*, subscription:subscriptions!subscription_id(id, name, display_name)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (status && status !== 'all') {
        query = query.eq('subscription_status', status)
    }

    const { data, error } = await query.limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Attach counts for each org
    const enriched = await Promise.all(
        (data ?? []).map(async (org: any) => {
            const [{ count: customerCount }, { count: branchCount }, { count: transactionCount }] = await Promise.all([
                supabase.from('customers').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).is('deleted_at', null),
                supabase.from('branches').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).is('deleted_at', null),
                supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('organization_id', org.id),
            ])
            return { ...org, customerCount: customerCount ?? 0, branchCount: branchCount ?? 0, transactionCount: transactionCount ?? 0 }
        })
    )

    return NextResponse.json({ success: true, data: enriched })
}

/** PATCH /api/super-admin/organizations — Update org (activate/block/subscription) */
export async function PATCH(req: NextRequest) {
    const supabase = await createAdminClient()
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Missing org id' }, { status: 400 })

    const { error } = await supabase
        .from('organizations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
}
