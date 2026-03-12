import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * POST /api/admin/onboard
 * Called during registration to create org, default branch, loyalty program, and card/stamp designs
 */
export async function POST(req: NextRequest) {
    try {
        const { userId, businessName, businessSlug, email, fullName } = await req.json()

        if (!userId || !businessName || !businessSlug) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = await createAdminClient()

        // Sanitize the slug server-side (defense in depth)
        function sanitizeSlug(value: string): string {
            return value
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
        }

        const baseSlug = sanitizeSlug(businessSlug) || sanitizeSlug(businessName) || 'business'

        // Find a unique slug — try baseSlug, then baseSlug-2, baseSlug-3, etc.
        let finalSlug = baseSlug
        let attempt = 1
        while (true) {
            const { data: existing } = await supabase
                .from('organizations')
                .select('id')
                .eq('slug', finalSlug)
                .maybeSingle()

            if (!existing) break // slug is available

            attempt++
            finalSlug = `${baseSlug}-${attempt}`

            if (attempt > 100) {
                // Safety valve — extremely unlikely
                finalSlug = `${baseSlug}-${Date.now()}`
                break
            }
        }

        // Get free plan subscription id
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('name', 'free')
            .single()

        // 1. Create organization
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name: businessName,
                slug: finalSlug,
                email,
                owner_id: userId,
                subscription_id: subscription?.id,
                subscription_status: 'trial',
                trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
            })
            .select()
            .single()

        if (orgError) throw orgError

        // 2. Update user profile with org and owner role
        await supabase
            .from('users')
            .upsert({
                id: userId,
                organization_id: org.id,
                email,
                full_name: fullName,
                role: 'owner',
            })

        // 3. Create default branch
        const { data: branch, error: branchError } = await supabase
            .from('branches')
            .insert({
                organization_id: org.id,
                name: `${businessName} – Main Branch`,
                qr_code: `${finalSlug}-${Date.now()}`,
            })
            .select()
            .single()

        if (branchError) throw branchError

        // 4. Create default loyalty program (stamps)
        await supabase
            .from('loyalty_programs')
            .insert({
                organization_id: org.id,
                name: `${businessName} Loyalty`,
                type: 'stamps',
                stamps_required: 10,
            })

        // 5. Create default card design
        await supabase
            .from('card_designs')
            .insert({
                organization_id: org.id,
                config: {
                    backgroundType: 'gradient',
                    backgroundColor: '#1a1a2e',
                    gradientFrom: '#16213e',
                    gradientTo: '#0f3460',
                    gradientAngle: 135,
                    accentColor: '#e94560',
                    textColor: '#ffffff',
                    brandName: businessName,
                    logoUrl: null,
                    fontFamily: 'Inter',
                    progressBarStyle: 'rounded',
                    progressBarColor: '#e94560',
                    cardBorderRadius: 16,
                    showBranchName: true,
                },
            })

        // 6. Create default stamp design
        await supabase
            .from('stamp_designs')
            .insert({
                organization_id: org.id,
                config: {
                    iconType: 'star',
                    iconUrl: null,
                    filledColor: '#e94560',
                    emptyColor: '#ffffff30',
                    filledAnimation: 'bounce',
                    emptyStyle: 'outline',
                    size: 'medium',
                    labelText: 'Stamps',
                },
            })

        // 7. Create a default reward
        const { data: loyaltyProgram } = await supabase
            .from('loyalty_programs')
            .select('id')
            .eq('organization_id', org.id)
            .single()

        if (loyaltyProgram) {
            await supabase.from('rewards').insert({
                organization_id: org.id,
                loyalty_program_id: loyaltyProgram.id,
                name: 'Free Item',
                description: 'Redeem your stamps for a free item!',
                type: 'free_item',
                stamps_required: 10,
            })
        }

        return NextResponse.json({
            success: true,
            data: { organization: org, branch },
        })
    } catch (error: any) {
        console.error('[Onboard] Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
