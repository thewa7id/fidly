import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: d } = await supabase.from('card_designs').select('*').limit(1).single();
    if(d) console.log(JSON.stringify(d.config, null, 2));
}
run();
