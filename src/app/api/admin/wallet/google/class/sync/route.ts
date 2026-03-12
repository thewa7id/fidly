import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WalletService } from '@/lib/wallet/service'

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if user is owner/manager
    const { data: profile } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

    if (!profile || !['owner', 'manager'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { programId } = await req.json()
    const walletService = new WalletService()

    try {
        const loyaltyClass = await walletService.ensureClass(profile.organization_id!, programId || null)
        return NextResponse.json({ success: true, data: loyaltyClass })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
