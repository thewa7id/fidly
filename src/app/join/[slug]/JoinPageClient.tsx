'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Star, Gift, CheckCircle, Eye, EyeOff } from 'lucide-react'
import LoyaltyCard from '@/components/loyalty/LoyaltyCard'
import type { CardDesignConfig, StampDesignConfig } from '@/lib/types'

const defaultCard: CardDesignConfig = {
    backgroundType: 'gradient',
    backgroundColor: '#1a1a2e',
    gradientFrom: '#16213e',
    gradientTo: '#0f3460',
    gradientAngle: 135,
    backgroundImageUrl: null,
    accentColor: '#e94560',
    textColor: '#ffffff',
    brandName: 'Loyalty',
    logoUrl: null,
    fontFamily: 'Inter',
    progressBarStyle: 'rounded',
    progressBarColor: '#e94560',
    cardBorderRadius: 20,
    layoutType: 'classic',
    heroImageUrl: null,
    codeType: 'qr',
    showBranchName: false,
    socialLinks: null,
}

const defaultStamp: StampDesignConfig = {
    iconType: 'star',
    iconUrl: null,
    filledColor: '#e94560',
    emptyColor: '#ffffff30',
    filledAnimation: 'bounce',
    emptyStyle: 'outline',
    size: 'medium',
    labelText: 'Stamps',
}

interface Props {
    data: {
        org: { id: string; name: string; slug: string; logo_url: string | null }
        cardDesign: CardDesignConfig | null
        stampDesign: StampDesignConfig | null
        program: { name: string; stamps_required: number } | null
        rewards: { name: string; stamps_required: number | null }[]
    }
    orgSlug: string
}

export default function JoinPageClient({ data, orgSlug }: Props) {
    const { org, cardDesign, stampDesign, program, rewards } = data
    const router = useRouter()
    const supabase = createClient()

    const [mode, setMode] = useState<'register' | 'login'>('register')
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)

    const cardConfig = { ...defaultCard, ...(cardDesign ?? {}), brandName: org.name, logoUrl: cardDesign?.logoUrl ?? org.logo_url ?? null }
    const stampConfig = { ...defaultStamp, ...(stampDesign ?? {}) }
    const stampsRequired = program?.stamps_required ?? 10

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault()
        if (!fullName.trim()) { toast.error('Please enter your name'); return }
        if (!phone.trim()) { toast.error('Please enter your phone number'); return }
        setLoading(true)

        const res = await fetch('/api/customer/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName: fullName.trim(), phone: phone.trim(), orgSlug }),
        })
        const data = await res.json()

        if (!res.ok) {
            if (res.status === 409) {
                toast.error('Account already exists — switching to login')
                setMode('login')
            } else {
                toast.error(data.error ?? 'Registration failed')
            }
            setLoading(false)
            return
        }

        // Sign in immediately after registration
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
        if (signInErr) {
            toast.error('Account created! Please log in.')
            setMode('login')
            setLoading(false)
            return
        }

        toast.success(`Welcome to ${org.name}! 🎉 Your loyalty card is ready.`)
        router.push('/wallet')
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            toast.error(error.message)
            setLoading(false)
            return
        }

        // If logged-in customer doesn't have a card for this org yet, add one
        await fetch('/api/customer/wallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orgSlug }),
        })

        toast.success(`Welcome back! Added ${org.name} to your wallet.`)
        router.push('/wallet')
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Hero / Branding */}
            <div className="relative overflow-hidden px-4 pt-10 pb-6 text-center">
                {/* Background gradient orb */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse at 50% 0%, ${cardConfig.accentColor}60 0%, transparent 70%)`,
                    }}
                />

                <div className="relative z-10">
                    {org.logo_url ? (
                        <img src={org.logo_url} alt={org.name} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 ring-2 ring-white/10" />
                    ) : (
                        <div
                            className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl font-black ring-2 ring-white/10"
                            style={{ background: cardConfig.accentColor + '30', color: cardConfig.accentColor }}
                        >
                            {org.name[0]}
                        </div>
                    )}
                    <h1 className="text-2xl font-bold text-foreground mb-1">{org.name}</h1>
                    <p className="text-muted-foreground text-sm">Join our loyalty program & start earning rewards</p>
                </div>
            </div>

            {/* Card Preview */}
            <div className="flex justify-center px-4 mb-6">
                <div className="w-full max-w-sm">
                    <LoyaltyCard
                        config={cardConfig}
                        customerName={fullName.trim() || 'Your Name'}
                        availableStamps={3}
                        stampsRequired={stampsRequired}
                        stampConfig={stampConfig}
                    />
                </div>
            </div>

            {/* Rewards teaser */}
            {rewards.length > 0 && (
                <div className="px-4 mb-6 max-w-sm mx-auto w-full">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2 text-center">Earn rewards like</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {rewards.map((r, i) => (
                            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border text-xs text-foreground">
                                <Gift className="w-3 h-3 text-primary" />
                                {r.name}
                                {r.stamps_required && <span className="text-muted-foreground ml-1">({r.stamps_required}★)</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Auth Form */}
            <div className="flex-1 px-4 pb-10">
                <div className="max-w-sm mx-auto">
                    {/* Toggle */}
                    <div className="flex rounded-xl bg-muted/50 border border-border p-1 mb-5">
                        {(['register', 'login'] as const).map(m => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMode(m)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === m ? 'bg-primary text-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {m === 'register' ? 'Create Account' : 'Log In'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-3">
                        {mode === 'register' && (
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Your full name"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
                                />
                            </div>
                        )}

                        {mode === 'register' && (
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="+1 234 567 890"
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Email address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
                            />
                        </div>

                        <div className="relative">
                            <label className="text-xs text-muted-foreground mb-1 block">Password</label>
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                                required
                                minLength={mode === 'register' ? 8 : undefined}
                                className="w-full px-4 py-3 pr-12 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/60 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(v => !v)}
                                className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl font-semibold text-foreground transition-all disabled:opacity-60 mt-2"
                            style={{ background: `linear-gradient(135deg, ${cardConfig.accentColor}, ${cardConfig.accentColor}cc)` }}
                        >
                            {loading
                                ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</span>
                                : mode === 'register' ? `Join ${org.name}` : 'Log In & Open Wallet'
                            }
                        </button>
                    </form>

                    {mode === 'register' && (
                        <p className="text-xs text-muted-foreground text-center mt-4">
                            Already have an account?{' '}
                            <button onClick={() => setMode('login')} className="text-primary underline">Log in instead</button>
                        </p>
                    )}

                    <p className="text-xs text-foreground/20 text-center mt-6">
                        By joining you agree to receive loyalty updates from {org.name}
                    </p>
                </div>
            </div>
        </div>
    )
}
