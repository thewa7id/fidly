const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Updating subscription plans...');

    // 1. Update Free
    const { error: e1 } = await supabase.from('subscriptions').update({
        display_name: 'Free Plan',
        max_branches: 1,
        max_customers: 30,
        max_employees: 0,
        features: ['Stamp-based loyalty', 'Basic analytics']
    }).eq('name', 'free');
    if (e1) console.error('Error updating free plan:', e1);

    // 2. Update Gold -> Pro
    const { error: e2 } = await supabase.from('subscriptions').update({
        name: 'pro',
        display_name: 'Pro Plan',
        max_branches: 2,
        max_customers: 1000,
        max_employees: 4,
        features: ['Everything in Free', 'Points-based loyalty', 'Full customization', 'NFC Support', 'Apple & Google Wallet', 'Basic Marketing (5 pushes/mo)']
    }).eq('name', 'gold');
    if (e2) console.error('Error updating gold plan:', e2);

    // 3. Update Premium -> Platinium
    const { error: e3 } = await supabase.from('subscriptions').update({
        name: 'platinium',
        display_name: 'Platinium Plan',
        max_branches: 5,
        max_customers: 5000,
        max_employees: 10,
        features: ['Everything in Pro', 'Scheduled Marketing Campaigns', 'Advanced Analytics & Data Export', 'API Access', 'Priority Support']
    }).eq('name', 'premium');
    if (e3) console.error('Error updating premium plan:', e3);

    console.log('Migration finished.');
}

run();
