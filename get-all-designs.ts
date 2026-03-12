import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching card designs...");
    const { data: d, error } = await supabase.from('card_designs').select('*');
    if(error) console.error(error);
    if(d) console.log(JSON.stringify(d, null, 2));
}
run();
