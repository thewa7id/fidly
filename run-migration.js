require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const sql = `
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

    ALTER TABLE public.bonus_rewards ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.customer_bonus_claims ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Bonus rewards are viewable by everyone." ON public.bonus_rewards FOR SELECT USING (true);
    CREATE POLICY "Bonus claims are viewable by everyone." ON public.customer_bonus_claims FOR SELECT USING (true);
    CREATE POLICY "Organizations can manage their bonus rewards" ON public.bonus_rewards USING (true);
    CREATE POLICY "Organizations can manage their claims" ON public.customer_bonus_claims USING (true);
  `;
  
  // NOTE: supabase-js v2 doesn't have a direct raw SQL execution method via the client interface.
  // We need to use postgres-meta API or just create an edge function / api route and hit it.
  console.log("We need to use postgres or API route.");
}
run();
