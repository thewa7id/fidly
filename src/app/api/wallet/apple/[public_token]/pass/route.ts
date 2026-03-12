import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { WalletService } from '@/lib/wallet/service'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ public_token: string }> }
) {
    const { public_token } = await params
    const svc = createServiceClient()

    // 1. Validate customer exists
    const { data: customer } = await svc
        .from('customers')
        .select('*')
        .eq('public_token', public_token)
        .single()

    if (!customer) {
        return new NextResponse('Customer not found', { status: 404 })
    }

    // 2. Determine program (get the first active one)
    const { data: program } = await svc
        .from('loyalty_programs')
        .select('id')
        .eq('organization_id', customer.organization_id)
        .eq('is_active', true)
        .limit(1)
        .single()

    const walletService = new WalletService()

    try {
        const passBuffer = await walletService.getAppleWalletPassBuffer(customer.id, program?.id || null)

        return new NextResponse(passBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename="pass-${public_token}.pkpass"`,
                'Cache-Control': 'no-cache'
            }
        })
    } catch (err: any) {
        console.error('[Apple Wallet] Failed to generate pass:', err)
        return new NextResponse(err.message || 'Failed to generate pass', { status: 500 })
    }
}
