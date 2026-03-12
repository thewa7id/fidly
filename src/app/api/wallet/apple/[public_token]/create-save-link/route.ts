import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ public_token: string }> }
) {
    const { public_token } = await params
    const svc = createServiceClient()

    // 1. Verify the customer exists
    const { data: customer } = await svc
        .from('customers')
        .select('organization_id')
        .eq('public_token', public_token)
        .single()

    if (!customer) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // 2. Return the direct URL to the .pkpass file
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const passUrl = `${baseUrl.replace(/\/$/, '')}/api/wallet/apple/${public_token}/pass`

    return NextResponse.json({ 
        success: true,
        url: passUrl
    })
}
