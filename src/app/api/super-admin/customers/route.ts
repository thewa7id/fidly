import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/** GET /api/super-admin/customers — List all customers across all orgs */
export async function GET(req: NextRequest) {
    const supabase = await createAdminClient()
    const search = req.nextUrl.searchParams.get('search') ?? ''
    const orgId = req.nextUrl.searchParams.get('org') ?? ''

    let query = supabase
        .from('customers')
        .select('*, organizations(id, name, slug, logo_url)')
        .is('deleted_at', null)
        .order('joined_at', { ascending: false })

    if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    if (orgId) {
        query = query.eq('organization_id', orgId)
    }

    const { data, error } = await query.limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, data: data ?? [] })
}
