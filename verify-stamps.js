require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data: customer } = await supabase.from('customers').select('*').limit(1).single();
  const token = customer.public_token;
  
  const res = await fetch(`https://goyalty-oonq.vercel.app/api/wallet/stamp-image?token=${token}`);
  console.log('Vercel Fetch Status:', res.status, res.headers.get('content-type'));
})();
