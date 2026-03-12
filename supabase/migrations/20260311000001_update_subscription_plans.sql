-- Update Subscription plans to Free, Gold, and Premium

-- 1. Update Free Plan
UPDATE subscriptions SET 
  display_name = 'Free',
  max_customers = 100,
  max_branches = 1,
  max_employees = 1,
  price_monthly = 0,
  price_yearly = 0,
  features = '["1 branch", "Up to 100 customers", "Google Wallet", "Stamp-based program", "Basic analytics"]'
WHERE name = 'free';

-- 2. Update Pro to Gold
UPDATE subscriptions SET 
  name = 'gold',
  display_name = 'Gold',
  max_customers = 2000,
  max_branches = 5,
  max_employees = 10,
  price_monthly = 49,
  price_yearly = 490,
  features = '["5 branches", "2,000 customers", "NFC Support", "Points-based programs", "Custom card design", "Basic Marketing (10/mo)"]'
WHERE name = 'pro';

-- 3. Update Enterprise to Premium
UPDATE subscriptions SET 
  name = 'premium',
  display_name = 'Premium',
  max_customers = NULL,
  max_branches = NULL,
  max_employees = NULL,
  price_monthly = 199,
  price_yearly = 1990,
  features = '["Unlimited branches", "Unlimited customers", "Apple Wallet Integration", "Scheduled Marketing Campaigns", "Advanced Analytics", "API Access"]'
WHERE name = 'enterprise';
