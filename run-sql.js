import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function runSQL() {
    const rawSql = `
    CREATE TABLE IF NOT EXISTS public.bonus_rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        reward_type TEXT NOT NULL,
        reward_value INTEGER NOT NULL,
        config JSONB DEFAULT '{}'::jsonb,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS public.customer_bonus_claims (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
        bonus_reward_id UUID NOT NULL REFERENCES public.bonus_rewards(id) ON DELETE CASCADE,
        branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
        claimed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        UNIQUE(customer_id, bonus_reward_id, branch_id)
    );

    -- Enable RLS
    ALTER TABLE public.bonus_rewards ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.customer_bonus_claims ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist (to avoid errors on re-run)
    DROP POLICY IF EXISTS "Bonus rewards viewable by everyone" ON public.bonus_rewards;
    DROP POLICY IF EXISTS "Bonus claims viewable by everyone" ON public.customer_bonus_claims;
    DROP POLICY IF EXISTS "Bonus claims insertable by service auth" ON public.customer_bonus_claims;

    -- Create policies
    CREATE POLICY "Bonus rewards viewable by everyone" ON public.bonus_rewards FOR SELECT USING (true);
    CREATE POLICY "Bonus claims viewable by everyone" ON public.customer_bonus_claims FOR SELECT USING (true);
    CREATE POLICY "Bonus claims insertable by service auth" ON public.customer_bonus_claims FOR ALL USING (true);
    `
    console.log("We need to run this SQL in Supabase SQL editor.")
}
runSQL()
