import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SubscriptionService } from '@/lib/subscription'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
    const { data, error } = await supabase.from('branches').select('*').eq('organization_id', profile?.organization_id).is('deleted_at', null).order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('organization_id, role').eq('id', user.id).single()
    if (!['owner', 'manager'].includes(profile?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Check Quota for Branch
    const subSvc = new SubscriptionService()
    const quota = await subSvc.canAddBranch(profile!.organization_id!)
    if (!quota.allowed) {
        return NextResponse.json({
            error: `Your plan is limited to ${quota.limit} branches. Please upgrade to Gold or Premium to add more.`,
            upgradeRequired: true
        }, { status: 403 })
    }

    const body = await req.json()
    const { name, address, phone, email } = body
    const qrCode = `${profile?.organization_id}-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    const { data, error } = await supabase.from('branches').insert({ organization_id: profile?.organization_id, name, address, phone, email, qr_code: qrCode }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data }, { status: 201 })
}
