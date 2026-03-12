import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { WalletService } from '@/lib/wallet/service'

export async function POST(req: NextRequest, { params }: { params: Promise<{ public_token: string }> }) {
    const { public_token } = await params
    const svc = createServiceClient()

    // 1. Validate customer exists
    const { data: customer } = await svc
        .from('customers')
        .select('*')
        .eq('public_token', public_token)
        .single()

    if (!customer) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

    // 2. Determine program
    const { data: program } = await svc
        .from('loyalty_programs')
        .select('id')
        .eq('organization_id', customer.organization_id)
        .eq('is_active', true)
        .limit(1)
        .single()

    const walletService = new WalletService()

    try {
        // First sync the object to ensure it has latest balance
        await walletService.syncCustomerWallet(customer.id, program?.id || null)

        // Generate link
        const link = await walletService.getGoogleWalletLink(customer.id, program?.id || null)

        return NextResponse.json({ success: true, url: link })
    } catch (err: any) {
        console.error('[Google Wallet] Failed to generate link:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
