import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Check if Supabase is properly configured
function isConfigured() {
  return (
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_ANON_KEY.length > 10 &&
    !SUPABASE_URL.includes('your_')
  )
}

export function createClient() {
  if (!isConfigured()) {
    if (typeof window !== 'undefined') {
      console.warn(
        '[Goyalty] Supabase is not configured. Please add your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
      )
    }
    // Return a safe no-op stub so the UI renders without crashing
    return createNoOpClient()
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

function createNoOpClient(): any {
  const noOpQuery = () => {
    const q: any = {
      select: () => q,
      eq: () => q,
      neq: () => q,
      is: () => q,
      ilike: () => q,
      or: () => q,
      order: () => q,
      range: () => q,
      limit: () => q,
      single: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      then: async (resolve: any) => resolve({ data: [], error: null, count: 0 }),
    }
    return q
  }

  return {
    auth: {
      signInWithPassword: async () => ({ data: null, error: { message: 'Please configure Supabase in .env.local' } }),
      signUp: async () => ({ data: null, error: { message: 'Please configure Supabase in .env.local' } }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: (_event: any, _cb: any) => ({
        data: { subscription: { unsubscribe: () => { } } },
      }),
    },
    from: (_table: string) => noOpQuery(),
    channel: () => ({ on: () => ({ subscribe: () => { } }) }),
    removeChannel: () => { },
  }
}
