import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('organization_id, role').eq('id', user.id).single()
    if (!['owner', 'manager'].includes(profile?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { data } = await supabase.from('users').select('*, branches(name)').eq('organization_id', profile?.organization_id).neq('role', 'super_admin').is('deleted_at', null).order('created_at', { ascending: false })
    return NextResponse.json({ success: true, data })
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase.from('users').select('organization_id, role').eq('id', user.id).single()
    if (!['owner', 'manager'].includes(profile?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    const { email, full_name, role, branch_id, password } = body

    // Check employee quota
    if (profile?.organization_id) {
        const { SubscriptionService } = await import('@/lib/subscription')
        const subService = new SubscriptionService()
        const quota = await subService.canAddEmployee(profile.organization_id)
        if (!quota.allowed) {
            return NextResponse.json({
                error: quota.error || 'Employee limit reached for your plan.',
                current: quota.current,
                limit: quota.limit
            }, { status: 403 })
        }
    }

    const adminSupabase = await createAdminClient()
    // Create auth user
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { full_name, role },
    })
    if (authError || !authData.user) return NextResponse.json({ error: authError?.message ?? 'Failed to create user' }, { status: 500 })
    // Update user profile
    const { data, error } = await adminSupabase.from('users').upsert({
        id: authData.user.id,
        email, full_name, role,
        organization_id: profile?.organization_id,
        branch_id: branch_id || null,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data }, { status: 201 })
}
