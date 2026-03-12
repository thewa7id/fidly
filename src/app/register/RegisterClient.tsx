'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, Eye, EyeOff, Loader2, Building2 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function RegisterClient() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [slugTaken, setSlugTaken] = useState(false)
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        businessName: '',
        businessSlug: '',
    })

    function sanitizeSlug(value: string): string {
        return value
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')          // spaces → dashes
            .replace(/[^a-z0-9-]/g, '')    // strip non-alphanumeric except dashes
            .replace(/-+/g, '-')           // collapse consecutive dashes
            .replace(/^-|-$/g, '')         // trim leading/trailing dashes
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = e.target
        setForm(prev => {
            const updated = { ...prev, [name]: value }
            if (name === 'businessName') {
                updated.businessSlug = sanitizeSlug(value)
            }
            if (name === 'businessSlug') {
                updated.businessSlug = sanitizeSlug(value)
            }
            return updated
        })
        if (name === 'businessName' || name === 'businessSlug') {
            setSlugTaken(false)
        }
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                data: { full_name: form.fullName, role: 'owner' },
            },
        })

        if (authError || !authData.user) {
            toast.error(authError?.message ?? 'Registration failed')
            setLoading(false)
            return
        }

        const res = await fetch('/api/admin/onboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: authData.user.id,
                businessName: form.businessName,
                businessSlug: form.businessSlug,
                email: form.email,
                fullName: form.fullName,
            }),
        })

        const result = await res.json()
        if (!result.success) {
            toast.error(result.error ?? 'Setup failed')
            setLoading(false)
            return
        }

        toast.success('Welcome to Goyalty! 🎉')
        router.push('/admin')
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
                    <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
                    <p className="text-muted-foreground text-sm mb-8">14-day free trial · No credit card required</p>

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Your name</Label>
                            <Input id="fullName" name="fullName" placeholder="John Smith" value={form.fullName} onChange={handleChange} required className="bg-muted/50 border-border focus:border-primary" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reg-email">Email address</Label>
                            <Input id="reg-email" name="email" type="email" placeholder="john@mybusiness.com" value={form.email} onChange={handleChange} required className="bg-muted/50 border-border focus:border-primary" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reg-password">Password</Label>
                            <div className="relative">
                                <Input id="reg-password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={handleChange} required minLength={8} className="bg-muted/50 border-border focus:border-primary pr-10" />
                                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="border-t border-border pt-4 space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Building2 className="w-4 h-4 text-primary" />
                                Business Details
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="businessName">Business name</Label>
                                <Input id="businessName" name="businessName" placeholder="My Coffee Shop" value={form.businessName} onChange={handleChange} required className="bg-muted/50 border-border focus:border-primary" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="businessSlug">URL slug</Label>
                                <div className="flex items-center">
                                    <span className="px-3 py-2 bg-muted/50 border border-r-0 border-border rounded-l-lg text-xs text-muted-foreground whitespace-nowrap">goyalty.app/</span>
                                    <Input id="businessSlug" name="businessSlug" placeholder="my-coffee-shop" value={form.businessSlug} onChange={handleChange} required className="bg-muted/50 border-border focus:border-primary rounded-l-none" />
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground font-semibold" disabled={loading}>
                            {loading ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Creating account...</> : 'Start Free Trial'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
                    </div>
                </div>

                <div className="mt-4 text-center text-xs text-muted-foreground">
                    <Link href="/" className="hover:text-foreground transition-colors">← Back to homepage</Link>
                </div>
            </div>
        </div>
    )
}
