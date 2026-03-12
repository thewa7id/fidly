import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
    const { data } = await supabase.from('stamp_designs').select('config').eq('organization_id', profile?.organization_id).single()
    return NextResponse.json({ success: true, data })
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('organization_id, role').eq('id', user.id).single()
    if (!['owner', 'manager'].includes(profile?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { config } = await req.json()
    const { data, error } = await supabase.from('stamp_designs').upsert({ organization_id: profile?.organization_id, config }, { onConflict: 'organization_id' }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
}
