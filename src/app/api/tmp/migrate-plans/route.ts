import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createAdminClient()

        console.log('Updating subscription plans via API...');

        // 1. Update Free
        await supabase.from('subscriptions').update({
            display_name: 'Free Plan',
            max_branches: 1,
            max_customers: 30,
            max_employees: 0,
            features: ['Stamp-based loyalty', 'Basic analytics']
        }).eq('name', 'free')

        // 2. Update Gold -> Pro
        await supabase.from('subscriptions').update({
            name: 'pro',
            display_name: 'Pro Plan',
            max_branches: 2,
            max_customers: 1000,
            max_employees: 4,
            features: ['Everything in Free', 'Points-based loyalty', 'Full customization', 'NFC Support', 'Apple & Google Wallet', 'Basic Marketing (5 pushes/mo)']
        }).eq('name', 'gold')

        // 3. Update Premium -> Platinium
        await supabase.from('subscriptions').update({
            name: 'platinium',
            display_name: 'Platinium Plan',
            max_branches: 5,
            max_customers: 5000,
            max_employees: 10,
            features: ['Everything in Pro', 'Scheduled Marketing Campaigns', 'Advanced Analytics & Data Export', 'API Access', 'Priority Support']
        }).eq('name', 'premium')

        return NextResponse.json({ success: true, message: 'Migration completed' })
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message })
    }
}
