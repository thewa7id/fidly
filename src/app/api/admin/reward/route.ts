import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET  /api/admin/reward  - List all rewards
 * POST /api/admin/reward  - Create or update reward
 */

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()

    const { data, error } = await supabase
        .from('rewards')
        .select('*, loyalty_programs(name, type)')
        .eq('organization_id', profile?.organization_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

    if (!['owner', 'manager'].includes(profile?.role ?? '')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { id, loyalty_program_id, name, description, type, value, stamps_required, points_required, image_url, terms } = body

    if (id) {
        const { data, error } = await supabase
            .from('rewards')
            .update({ name, description, type, value, stamps_required, points_required, image_url, terms })
            .eq('id', id)
            .eq('organization_id', profile?.organization_id)
            .select()
            .single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, data })
    }

    const { data, error } = await supabase
        .from('rewards')
        .insert({ organization_id: profile?.organization_id, loyalty_program_id, name, description, type, value, stamps_required, points_required, image_url, terms })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { data: profile } = await supabase.from('users').select('organization_id, role').eq('id', user.id).single()
    if (!['owner', 'manager'].includes(profile?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabase
        .from('rewards')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organization_id', profile?.organization_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
