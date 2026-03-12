import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in the params, use it as the redirect URL
    const next = searchParams.get('next') ?? '/admin'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )
        const { error, data } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Check user role for proper redirection
            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single()

            let redirectPath = next
            if (profile?.role === 'super_admin') redirectPath = '/super-admin'
            else if (profile?.role === 'employee') redirectPath = '/pos'
            else if (pathnameContainsWallet(next)) redirectPath = '/wallet'

            return NextResponse.redirect(`${origin}${redirectPath}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

function pathnameContainsWallet(path: string) {
    return path.includes('/wallet')
}
