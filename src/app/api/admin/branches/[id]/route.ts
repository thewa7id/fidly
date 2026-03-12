import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { data: profile } = await supabase.from('users').select('organization_id, role').eq('id', user.id).single()
    if (!['owner', 'manager'].includes(profile?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    
    const body = await req.json()
    const { name, address, phone, email } = body
    
    const { data, error } = await supabase
        .from('branches')
        .update({ name, address, phone, email })
        .eq('id', id)
        .eq('organization_id', profile?.organization_id)
        .select()
        .single()
        
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data }, { status: 200 })
}
