import { unstable_cache } from 'next/cache'
import { createServiceClient } from './supabase/server'

/**
 * Cache organization profile lookup
 * Validates for 60 seconds
 */
export const getCachedProfile = unstable_cache(
    async (userId: string) => {
        const supabase = createServiceClient()
        const { data, error } = await supabase
            .from('users')
            .select('*, organizations(*, subscriptions(*))')
            .eq('id', userId)
            .single()

        if (error) throw error
        return data
    },
    ['user-profile'],
    { revalidate: 60, tags: ['profile'] }
)

/**
 * Cache organization settings
 */
export const getCachedOrgSettings = unstable_cache(
    async (orgId: string) => {
        const supabase = createServiceClient()
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single()

        if (error) throw error
        return data
    },
    ['org-settings'],
    { revalidate: 300, tags: ['settings'] }
)
