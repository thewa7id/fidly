'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, Eye, EyeOff, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginClient() {
    const router = useRouter()
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const { data, error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .single()

        const role = profile?.role
        if (role === 'super_admin') router.push('/super-admin')
        else if (role === 'employee') router.push('/pos')
        else router.push('/admin')

        router.refresh()
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
            <div className="absolute top-4 right-4 z-20"><ThemeToggle /></div>
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

            <div className="w-full max-w-md">
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                        <Star className="w-5 h-5 text-foreground" />
                    </div>
                    <span className="text-2xl font-bold text-foreground">Goyalty</span>
                </div>

                <div className="glass rounded-2xl p-8 border border-border">
                    <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
                    <p className="text-muted-foreground text-sm mb-8">Sign in to your dashboard</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-email">Email address</Label>
                            <Input
                                id="login-email"
                                type="email"
                                placeholder="name@business.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                className="bg-muted/50 border-border focus:border-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="login-password">Password</Label>
                                <Link href="/forgot-password" className="text-xs text-primary hover:underline font-medium">Forgot Password?</Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    className="bg-muted/50 border-border focus:border-primary pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground font-semibold" disabled={loading}>
                            {loading ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-primary hover:underline font-medium">
                            Create one free
                        </Link>
                    </div>
                </div>

                <div className="mt-4 text-center text-xs text-muted-foreground">
                    <Link href="/" className="hover:text-foreground transition-colors">← Back to homepage</Link>
                </div>
            </div>
        </div>
    )
}
