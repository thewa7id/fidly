'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Eye, EyeOff, Wallet, Mail, Phone, Hash, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'

type LoginMethod = 'email' | 'phone'
type LoginMode = 'password' | 'otp'

export default function WalletLoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <WalletLoginContent />
        </Suspense>
    )
}

function WalletLoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [method, setMethod] = useState<LoginMethod>('email')
    const [mode, setMode] = useState<LoginMode>('password')
    const [id, setId] = useState('') // email or phone
    const [password, setPassword] = useState('')
    const [otp, setOtp] = useState('')
    const [showPw, setShowPw] = useState(false)
    const [loading, setLoading] = useState(false)
    const [otpSent, setOtpSent] = useState(false)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        if (mode === 'password') {
            const loginData = method === 'email' ? { email: id, password } : { phone: id, password }
            const { error } = await supabase.auth.signInWithPassword(loginData as any)

            if (error) {
                toast.error(error.message === 'Invalid login credentials'
                    ? `Wrong ${method} or password`
                    : error.message)
                setLoading(false)
                return
            }
        } else if (otpSent) {
            // Verify OTP
            const verifyData = method === 'email'
                ? { email: id, token: otp, type: 'email' as const }
                : { phone: id, token: otp, type: 'sms' as const }

            const { error } = await supabase.auth.verifyOtp(verifyData)

            if (error) {
                toast.error('Invalid or expired passcode')
                setLoading(false)
                return
            }
        } else {
            // Request OTP
            const otpData = method === 'email'
                ? {
                    email: id,
                    options: {
                        shouldCreateUser: false,
                        emailRedirectTo: `${window.location.origin}/auth/callback?next=/wallet`
                    }
                }
                : { phone: id, options: { shouldCreateUser: false } }

            const { error } = await supabase.auth.signInWithOtp(otpData as any)

            if (error) {
                toast.error(error.message)
                setLoading(false)
                return
            }

            setOtpSent(true)
            toast.success(`Passcode sent to your ${method}!`)
            setLoading(false)
            return
        }

        const next = searchParams.get('next') ?? '/wallet'
        router.push(next)
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Theme toggle */}
            <div className="absolute top-4 right-4 z-20">
                <ThemeToggle />
            </div>

            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px]" />
            </div>

            {/* Logo / Brand */}
            <div className="mb-10 text-center relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-5 shadow-2xl backdrop-blur-xl">
                    <Wallet className="w-8 h-8 text-primary shadow-glow" />
                </div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Goyalty Wallet</h1>
                <p className="text-muted-foreground text-sm mt-2 max-w-[240px] mx-auto">Access your rewards and digital stamp cards in one place</p>
            </div>

            {/* Form Container */}
            <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-xl relative z-10">
                {/* Mode Selector */}
                <div className="flex bg-muted rounded-2xl p-1 mb-8">
                    <button
                        onClick={() => { setMode('password'); setOtpSent(false); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'password' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Password
                    </button>
                    <button
                        onClick={() => setMode('otp')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === 'otp' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Passcode
                    </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Method Selector (Email vs Phone) */}
                    <div className="flex items-center gap-3 mb-2">
                        <button
                            type="button"
                            onClick={() => { setMethod('email'); setId(''); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${method === 'email' ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground opacity-60'}`}
                        >
                            <Mail className="w-3 h-3" /> Email
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMethod('phone'); setId(''); }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all border ${method === 'phone' ? 'border-primary/50 bg-primary/10 text-primary' : 'border-border bg-muted text-muted-foreground opacity-60'}`}
                        >
                            <Phone className="w-3 h-3" /> Phone
                        </button>
                    </div>

                    <div>
                        <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block ml-1">
                            {method === 'email' ? 'Email Address' : 'Phone Number'}
                        </label>
                        <div className="relative group">
                            {method === 'email' ? (
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                            ) : (
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                            )}
                            <input
                                type={method === 'email' ? 'email' : 'tel'}
                                value={id}
                                onChange={e => setId(e.target.value)}
                                placeholder={method === 'email' ? 'you@email.com' : '+1234567890'}
                                required
                                disabled={otpSent}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-all focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
                            />
                        </div>
                    </div>

                    {mode === 'password' ? (
                        <div className="relative group">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block ml-1">Password</label>
                            <input
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Your password"
                                required
                                className="w-full px-4 py-4 pr-12 rounded-2xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-all focus:ring-4 focus:ring-primary/10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(v => !v)}
                                className="absolute right-4 top-[38px] text-muted-foreground/50 hover:text-primary transition-colors"
                            >
                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    ) : (
                        otpSent && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1.5 block ml-1">Enter Passcode</label>
                                <div className="relative group">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        placeholder="6-digit code"
                                        required
                                        maxLength={8}
                                        autoFocus
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 transition-all focus:ring-4 focus:ring-primary/10"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setOtpSent(false)}
                                    className="text-[10px] text-primary mt-2 flex items-center gap-1 ml-1 hover:underline"
                                >
                                    <ArrowLeft className="w-3 h-3" /> Change {method}
                                </button>
                            </div>
                        )
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-2xl font-bold text-primary-foreground gradient-primary border-0 disabled:opacity-60 transition-all active:scale-[0.98] shadow-xl flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                {mode === 'otp' && !otpSent ? 'Send Passcode' : 'Open My Wallet'}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {mode === 'password' && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setMode('otp')}
                            className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            Forgot password? Log in with passcode
                        </button>
                    </div>
                )}
            </div>

            <div className="mt-10 text-center relative z-10">
                <p className="text-xs text-muted-foreground">
                    Don't have an account?{' '}
                    <span className="text-primary font-medium">Scan a merchant's QR code to join</span>
                </p>
            </div>
        </div>
    )
}
