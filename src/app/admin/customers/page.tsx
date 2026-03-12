import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CustomerListClient from '@/components/admin/CustomerListClient'

export const metadata = { title: 'Customers' }

interface Props {
    searchParams: Promise<{ search?: string; page?: string; card?: string; sort?: string; order?: string }>
}

export default async function CustomersPage({ searchParams }: Props) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) redirect('/register')

    const sp = await searchParams
    const search = sp.search ?? ''
    const cardFilter = sp.card ?? 'all'
    const sortField = sp.sort ?? 'joined_at'
    const sortOrder = sp.order ?? 'desc'
    const page = parseInt(sp.page ?? '1')
    const pageSize = 20
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Always fetch NFC-linked customer IDs (needed for Linked Cards column + filter)
    const { data: nfcRows } = await supabase
        .from('nfc_cards')
        .select('customer_id')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')
        .not('customer_id', 'is', null)
    const nfcCustomerIds = [...new Set((nfcRows ?? []).map(r => r.customer_id).filter(Boolean))] as string[]

    // Get total customer count (unfiltered) for the "All" badge
    const { count: totalAll } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .is('deleted_at', null)

    // Map valid sort fields to DB columns
    const sortMap: Record<string, string> = {
        joined_at: 'joined_at',
        stamps: 'available_stamps',
        visits: 'total_visits',
        last_activity: 'last_visit_at',
    }
    const dbSort = sortMap[sortField] ?? 'joined_at'

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
    if (cardFilter === 'nfc') {
        if (nfcCustomerIds.length > 0) {
            query = query.in('id', nfcCustomerIds)
        } else {
            query = query.eq('id', '00000000-0000-0000-0000-000000000000')
        }
    } else if (cardFilter === 'digital') {
        if (nfcCustomerIds.length > 0) {
            query = query.not('id', 'in', `(${nfcCustomerIds.join(',')})`)
        }
    }

    const { data, count } = await query

    return (
        <div className="max-w-7xl mx-auto">
            <CustomerListClient
                initialCustomers={data ?? []}
                initialTotal={count ?? 0}
                initialHasMore={(count ?? 0) > to + 1}
                nfcCustomerIds={nfcCustomerIds}
                totalAll={totalAll ?? 0}
                nfcCount={nfcCustomerIds.length}
            />
        </div>
    )
}
