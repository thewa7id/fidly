'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, Loader2, MailCheck } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ForgotPasswordClient() {
    const router = useRouter()
    const supabase = createClient()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    async function handleReset(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        // Generate redirect URL based on environment
        let baseUrl = process.env.NEXT_PUBLIC_APP_URL 
            ? process.env.NEXT_PUBLIC_APP_URL 
            : window.location.origin
            
        if (baseUrl.includes('fidly.ma') && !baseUrl.includes('www.fidly.ma')) {
            baseUrl = baseUrl.replace('https://fidly.ma', 'https://www.fidly.ma')
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${baseUrl}/admin/settings`,
        })

        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        setSubmitted(true)
        setLoading(false)
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

                <div className="glass rounded-2xl p-8 border border-border text-center">
                    {submitted ? (
                        <div className="space-y-4">
                            <div className="mx-auto w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                                <MailCheck className="w-6 h-6" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Check your email</h2>
                            <p className="text-sm text-muted-foreground">
                                We've sent a password reset link to {email}.
                            </p>
                            <Button asChild variant="outline" className="mt-4 w-full">
                                <Link href="/login">Back to Login</Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold text-foreground mb-1 text-left">Forgot Password</h1>
                            <p className="text-muted-foreground text-sm mb-8 text-left">Enter your email to receive a password reset link.</p>

                            <form onSubmit={handleReset} className="space-y-4 text-left">
                                <div className="space-y-2">
                                    <Label htmlFor="reset-email">Email address</Label>
                                    <Input
                                        id="reset-email"
                                        type="email"
                                        placeholder="name@business.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        className="bg-muted/50 border-border focus:border-primary"
                                    />
                                </div>

                                <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground font-semibold" disabled={loading || !email}>
                                    {loading ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Sending...</> : 'Send Reset Link'}
                                </Button>
                            </form>
                            
                            <div className="mt-6 text-center text-sm text-muted-foreground">
                                Remember your password?{' '}
                                <Link href="/login" className="text-primary hover:underline font-medium">
                                    Sign In
                                </Link>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-4 text-center text-xs text-muted-foreground">
                    <Link href="/" className="hover:text-foreground transition-colors">← Back to homepage</Link>
                </div>
            </div>
        </div>
    )
}
