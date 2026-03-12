import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const svc = createServiceClient()
    const { data: profile } = await svc
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) return NextResponse.json({ error: 'No org' }, { status: 404 })

    const { data: org } = await svc
        .from('organizations')
        .select('id, name, slug, logo_url, website, phone, email, address, metadata')
        .eq('id', profile.organization_id)
        .single()

    return NextResponse.json({ success: true, data: org })
}
