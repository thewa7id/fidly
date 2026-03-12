import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/client/balance?token=PUBLIC_TOKEN
 * Public endpoint – returns customer balance and loyalty card data
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    // Sanitize: strip /c/ path prefix if present (scanner artefact)
    let cleanToken = token.trim()
    if (cleanToken.includes('/c/')) cleanToken = cleanToken.split('/c/').pop()?.split('?')[0]?.trim() ?? cleanToken
    if (cleanToken.startsWith('c/')) cleanToken = cleanToken.slice(2)

    const supabase = await createAdminClient()

    // Resolve short code (8-char prefix) OR full 32-char token
    const isShortCode = cleanToken.length <= 8
    const { data: customer } = isShortCode
        ? await supabase
            .from('customers')
            .select('id, full_name, available_stamps, total_stamps, available_points, total_points, total_visits, total_redeemed, last_visit_at, joined_at, organization_id, public_token')
            .ilike('public_token', `${cleanToken}%`)
            .limit(1)
            .single()
        : await supabase
            .from('customers')
            .select('id, full_name, available_stamps, total_stamps, available_points, total_points, total_visits, total_redeemed, last_visit_at, joined_at, organization_id, public_token')
            .eq('public_token', cleanToken)
            .single()

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })


    // Get organization + card/stamp design
    const { data: org } = await supabase
        .from('organizations')
        .select('id, name, logo_url, subscription_status')
        .eq('id', customer.organization_id)
        .single()

    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    if (org.subscription_status === 'inactive') return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })

    const { data: cardDesign } = await supabase
        .from('card_designs')
        .select('config')
        .eq('organization_id', customer.organization_id)
        .single()

    const { data: stampDesign } = await supabase
        .from('stamp_designs')
        .select('config')
        .eq('organization_id', customer.organization_id)
        .single()

    // Get loyalty program
    const { data: program } = await supabase
        .from('loyalty_programs')
        .select('name, type, stamps_required, points_per_currency_unit, currency_unit')
        .eq('organization_id', customer.organization_id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .limit(1)
        .single()

    // Get active rewards
    const { data: rewards } = await supabase
        .from('rewards')
        .select('id, name, description, type, value, stamps_required, points_required')
        .eq('organization_id', customer.organization_id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('stamps_required', { ascending: true })

    // Get recent transactions (last 10)
    const { data: transactions } = await supabase
        .from('transactions')
        .select('id, type, stamps_earned, stamps_redeemed, points_earned, points_redeemed, created_at, branches(name), rewards(name)')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(10)

    return NextResponse.json({
        success: true,
        data: {
            customer,
            organization: { name: org.name, logoUrl: org.logo_url },
            cardDesign: cardDesign?.config ?? null,
            stampDesign: stampDesign?.config ?? null,
            program: program ?? null,
            rewards: rewards ?? [],
            transactions: transactions ?? [],
        },
    }, {
        headers: {
            'Cache-Control': 'private, max-age=30',
        },
    })
}
