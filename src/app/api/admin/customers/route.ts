import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET  /api/admin/customers  - List customers with pagination
 * POST /api/admin/customers  - Create new customer
 */

export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 404 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20')
    const search = searchParams.get('search') ?? ''
    const cardFilter = searchParams.get('card') ?? 'all'
    const sortField = searchParams.get('sort') ?? 'joined_at'
    const sortOrder = searchParams.get('order') ?? 'desc'
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const sortMap: Record<string, string> = {
        joined_at: 'joined_at',
        stamps: 'available_stamps',
        visits: 'total_visits',
        last_activity: 'last_visit_at',
    }
    const dbSort = sortMap[sortField] ?? 'joined_at'

    // If filtering by card type, fetch NFC-linked customer IDs first
    let nfcCustomerIds: string[] | null = null
    if (cardFilter === 'nfc' || cardFilter === 'digital') {
        const { data: nfcRows } = await supabase
            .from('nfc_cards')
            .select('customer_id')
            .eq('organization_id', profile.organization_id)
            .eq('status', 'active')
            .not('customer_id', 'is', null)
        nfcCustomerIds = [...new Set((nfcRows ?? []).map((r: any) => r.customer_id).filter(Boolean))]
    }

    let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .is('deleted_at', null)
        .order(dbSort, { ascending: sortOrder === 'asc' })
        .range(from, to)

    if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    // Apply card type filter
    if (cardFilter === 'nfc' && nfcCustomerIds) {
        if (nfcCustomerIds.length > 0) {
            query = query.in('id', nfcCustomerIds)
        } else {
            query = query.eq('id', '00000000-0000-0000-0000-000000000000')
        }
    } else if (cardFilter === 'digital' && nfcCustomerIds) {
        if (nfcCustomerIds.length > 0) {
            query = query.not('id', 'in', `(${nfcCustomerIds.join(',')})`)
        }
    }

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
        success: true,
        data,
        total: count ?? 0,
        page,
        pageSize,
        hasMore: (count ?? 0) > to + 1,
    })
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 404 })

    const body = await req.json()
    const { full_name, email, phone } = body

    const { data, error } = await supabase
        .from('customers')
        .insert({
            organization_id: profile.organization_id,
            full_name,
            email,
            phone,
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data }, { status: 201 })
}
