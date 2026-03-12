import { NextRequest, NextResponse } from 'next/server'
import { WalletService } from '@/lib/wallet/service'

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('x-wallet-sync-key')
    if (authHeader !== process.env.INTERNAL_SYNC_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { customerId, programId } = await req.json()
    if (!customerId) return NextResponse.json({ error: 'customerId required' }, { status: 400 })

    const walletService = new WalletService()

    try {
        await walletService.syncCustomerWallet(customerId, programId || null)
        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('[Internal Sync] Failed:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
