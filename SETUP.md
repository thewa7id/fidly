# Goyalty Setup Guide

## 1. Apply the Database Schema

Go to your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) and run the contents of `supabase/schema.sql`.

## 2. Required Supabase Auth Settings

Go to **Authentication → Settings** in your Supabase dashboard and configure the following:

### Disable Email Confirmation (for development)
- **Confirm email** → Toggle **OFF**  
  *(This lets users sign up instantly without clicking a confirmation link)*

### Increase Email Rate Limit (optional for testing)
- Email rate limiting is capped at 3 emails/hour on the free Supabase plan
- For testing, you can use the **Supabase CLI** with local auth, or use real email addresses

### Allow All Email Domains (if getting `email_address_invalid`)
- Go to **Authentication → Settings → Email**
- If you see "Email provider" settings, make sure no domain restrictions are set
- The `@example.com` and `@goyaltydemo.com` errors happen because Supabase validates email formats

## 3. Create Your First Account

Once email confirmation is disabled, go to http://localhost:3000/register and sign up with:
- Any real-looking email (even `test@yourdomain.com` works)
- A strong password (8+ chars)
- Your business name

The app will redirect you to `/admin` on success.

## 4. Add Firebase (optional — for push notifications)

When you're ready to enable push notifications:
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Cloud Messaging
3. Get your config values and add to `.env.local`

Firebase is completely optional — all other features work without it.

## 5. Environment Variables Reference

\`\`\`env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Optional (push notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
\`\`\`
