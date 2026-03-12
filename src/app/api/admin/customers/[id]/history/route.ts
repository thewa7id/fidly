import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const params = await context.params
    const customerId = params.id
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
    if (!profile?.organization_id) return NextResponse.json({ error: 'No organization' }, { status: 404 })

    // Verify customer belongs to the organization
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('id', customerId)
        .eq('organization_id', profile.organization_id)
        .single()

    if (customerError || !customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Fetch transactions
    const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
            *,
            branch:branches(name),
            processor:users(full_name)
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        data: transactions ?? []
    })
}
