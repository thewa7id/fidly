import { createServiceClient } from './supabase/server'
import { Organization } from './types'

export interface QuotaCheck {
    allowed: boolean
    current?: number
    limit?: number | null
    error?: string
}

export class SubscriptionService {
    private supabase = createServiceClient()

    /**
     * Get the effective subscription for an organization, handling trial expiration
     */
    private async getEffectiveOrg(orgId: string) {
        const { data: org, error: orgErr } = await this.supabase
            .from('organizations')
            .select('*, subscriptions(*)')
            .eq('id', orgId)
            .single()

        if (orgErr || !org) return null

        // If in trial and trial has expired, they effectively have the 'free' plan
        if (org.subscription_status === 'trial') {
            const trialEndsAt = org.trial_ends_at || (org.created_at ? new Date(new Date(org.created_at).getTime() + 14 * 86400000).toISOString() : null)
            
            if (trialEndsAt) {
                const isExpired = new Date(trialEndsAt).getTime() < Date.now()
                if (isExpired) {
                    // Fetch the free plan to use its limits
                    const { data: freePlan } = await this.supabase
                        .from('subscriptions')
                        .select('*')
                        .eq('name', 'free')
                        .single()
                    
                    if (freePlan) {
                        return { 
                            ...org, 
                            subscriptions: freePlan, 
                            subscription_status: 'inactive' // Signal that trial is over
                        }
                    }
                }
            }
        }

        return org
    }

    /**
     * Check if an organization can add more customers
     */
    async canAddCustomer(orgId: string): Promise<QuotaCheck> {
        const org = await this.getEffectiveOrg(orgId)
        if (!org) return { allowed: false, error: 'Organization not found' }

        const limit = org.subscriptions?.max_customers
        if (limit === null) return { allowed: true, limit: null }

        const { count, error: countErr } = await this.supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)

        if (countErr) return { allowed: false, error: 'Failed to check customer count' }

        return {
            allowed: (count ?? 0) < limit,
            current: count ?? 0,
            limit
        }
    }

    /**
     * Check if an organization can add more branches
     */
    async canAddBranch(orgId: string): Promise<QuotaCheck> {
        const org = await this.getEffectiveOrg(orgId)
        if (!org) return { allowed: false, error: 'Organization not found' }

        const limit = org.subscriptions?.max_branches
        if (limit === null) return { allowed: true, limit: null }

        const { count, error: countErr } = await this.supabase
            .from('branches')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)

        if (countErr) return { allowed: false, error: 'Failed to check branch count' }

        return {
            allowed: (count ?? 0) < limit,
            current: count ?? 0,
            limit
        }
    }

    /**
     * Check if an organization is allowed to use NFC features
     */
    async canUseNFC(orgId: string): Promise<boolean> {
        const org = await this.getEffectiveOrg(orgId)
        const planName = org?.subscriptions?.name
        return planName === 'pro' || planName === 'platinium'
    }

    /**
     * Check if an organization is allowed to use Apple Wallet / Google Wallet
     */
    async canUseDigitalWallets(orgId: string): Promise<boolean> {
        const org = await this.getEffectiveOrg(orgId)
        const planName = org?.subscriptions?.name
        return planName === 'pro' || planName === 'platinium'
    }

    /**
     * Check if an organization is allowed to use Apple Wallet (Legacy helper)
     */
    async canUseAppleWallet(orgId: string): Promise<boolean> {
        return this.canUseDigitalWallets(orgId)
    }

    /**
     * Check if an organization is allowed to schedule campaigns
     */
    async canScheduleCampaigns(orgId: string): Promise<boolean> {
        const org = await this.getEffectiveOrg(orgId)
        const planName = org?.subscriptions?.name
        return planName === 'platinium'
    }

    /**
     * Check if an organization can add more employees
     */
    async canAddEmployee(orgId: string): Promise<QuotaCheck> {
        const org = await this.getEffectiveOrg(orgId)
        if (!org) return { allowed: false, error: 'Organization not found' }

        const limit = org.subscriptions?.max_employees
        if (limit === null) return { allowed: true, limit: null }
        if (limit === 0) return { allowed: false, current: 0, limit: 0, error: 'Employee accounts are not available on this plan. The account owner is the only user permitted on the POS.' }

        const { count, error: countErr } = await this.supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .neq('role', 'super_admin')
            .is('deleted_at', null)

        if (countErr) return { allowed: false, error: 'Failed to check employee count' }

        return {
            allowed: (count ?? 0) < limit,
            current: count ?? 0,
            limit
        }
    }
}
