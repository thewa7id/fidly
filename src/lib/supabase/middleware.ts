import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
        return NextResponse.next({ request })
    }

    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                supabaseResponse = NextResponse.next({ request })
                cookiesToSet.forEach(({ name, value, options }) =>
                    supabaseResponse.cookies.set(name, value, options)
                )
            },
        },
    })

    // Use getSession() instead of getUser() — avoids triggering anonymous sign-in
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

    const { pathname } = request.nextUrl

    // Public paths — no auth required
    const isPublic =
        pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/join') ||
        pathname.startsWith('/wallet/login') ||
        pathname.startsWith('/c/') ||
        pathname.startsWith('/api/client/') ||
        pathname.startsWith('/api/customer/') ||
        pathname.startsWith('/api/wallet/') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.startsWith('/manifest') ||
        pathname.startsWith('/firebase') ||
        pathname.startsWith('/icon') ||
        pathname.startsWith('/badge') ||
        pathname.startsWith('/apple')

    // /wallet needs a customer session — redirect to customer login, not admin login
    if (pathname.startsWith('/wallet') && !pathname.startsWith('/wallet/login') && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/wallet/login'
        return NextResponse.redirect(url)
    }

    if (!isPublic && !pathname.startsWith('/wallet') && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Prevent non-super-admins from accessing super-admin section
    if (user && pathname.startsWith('/super-admin')) {
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'super_admin') {
            const url = request.nextUrl.clone()
            url.pathname = '/admin'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
