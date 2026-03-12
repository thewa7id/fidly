'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, RefreshCw, Wallet, ShieldCheck, ChevronRight } from 'lucide-react'

export default function WalletSettingsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [appleSaving, setAppleSaving] = useState(false)
    const [syncing, setSyncing] = useState(false)

    const [org, setOrg] = useState<any>(null)
    const [config, setConfig] = useState<any>(null)
    const [appleConfig, setAppleConfig] = useState<any>(null)

    const [enabled, setEnabled] = useState(false)
    const [appleEnabled, setAppleEnabled] = useState(false)

    useEffect(() => {
        async function load() {
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user ?? null
            if (!user) return

            const [orgRes, configsRes] = await Promise.all([
                supabase.from('organizations').select('*, subscriptions(*)').single(),
                supabase.from('wallet_providers_config').select('*').in('provider', ['google', 'apple'])
            ])

            setOrg(orgRes.data)

            const googleConf = configsRes.data?.find((c: any) => c.provider === 'google')
            const appleConf = configsRes.data?.find((c: any) => c.provider === 'apple')

            setConfig(googleConf)
            setAppleConfig(appleConf)

            setEnabled(!!googleConf)
            setAppleEnabled(!!appleConf)

            setLoading(false)
        }
        load()
    }, [])

    async function handleToggle(newState: boolean, provider: 'google' | 'apple' = 'google') {
        const setLocalSaving = provider === 'google' ? setSaving : setAppleSaving
        const setLocalEnabled = provider === 'google' ? setEnabled : setAppleEnabled

        setLocalSaving(true)
        try {
            if (newState) {
                if (provider === 'apple') {
                    const planName = org?.subscriptions?.name
                    if (planName !== 'platinium') {
                        toast.error('Apple Wallet is only available on the Platinium plan.', {
                            description: 'Please upgrade to Platinium to enable this feature.',
                        })
                        setLocalSaving(false)
                        return
                    }
                }
                await supabase
                    .from('wallet_providers_config')
                    .insert({ org_id: org.id, provider, config: { enabled: true } })
                setLocalEnabled(true)
                toast.success(`${provider === 'google' ? 'Google' : 'Apple'} Wallet enabled`)
            } else {
                await supabase
                    .from('wallet_providers_config')
                    .delete()
                    .eq('org_id', org.id)
                    .eq('provider', provider)
                setLocalEnabled(false)
                toast.success(`${provider === 'google' ? 'Google' : 'Apple'} Wallet disabled`)
            }
        } catch (err) {
            toast.error('Failed to update status')
        } finally {
            setLocalSaving(false)
        }
    }

    async function handleSyncClass() {
        setSyncing(true)
        try {
            const res = await fetch('/api/admin/wallet/google/class/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ programId: null })
            })
            const data = await res.json()
            if (data.success) {
                setConfig((prev: any) => ({ ...prev, updated_at: new Date().toISOString() }))
                toast.success('Branding synchronized with Google Wallet')
            } else {
                toast.error(data.error || 'Sync failed')
            }
        } catch (err) {
            toast.error('Something went wrong during sync')
        } finally {
            setSyncing(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Digital Wallet</h1>
                <p className="text-muted-foreground">Offer digital loyalty cards in Google and Apple Wallet</p>
            </div>

            {/* Google Wallet */}
            <Card className="bg-card border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-primary/5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-primary">
                            <Wallet className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Google Wallet</h3>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {enabled ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={() => handleToggle(!enabled, 'google')}
                        disabled={saving}
                        variant={enabled ? "outline" : "default"}
                        className={!enabled ? "gradient-primary text-foreground" : ""}
                    >
                        {saving && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                        {enabled ? 'Disable Integration' : 'Enable Now'}
                    </Button>
                </div>

                <CardContent className="p-6 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                Instant Setup
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                No technical configuration required. Google Wallet is managed centrally by the platform.
                                Your branding will be automatically synchronized.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-primary" />
                                Branding Sync
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Whenever you change your logo or brand colors in the "Card Design" section,
                                click the sync button to update your Google Wallet cards.
                            </p>
                        </div>
                    </div>

                    {enabled && (
                        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-muted-foreground italic">
                                Last synced: {config?.updated_at ? new Date(config.updated_at).toLocaleDateString() : 'Never'}
                            </div>
                            <Button
                                onClick={handleSyncClass}
                                disabled={syncing}
                                variant="outline"
                                className="w-full sm:w-auto border-border hover:bg-muted/50"
                            >
                                {syncing && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                                <RefreshCw className={`mr-2 w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                Sync Branding to Google
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Apple Wallet */}
            <Card className="bg-card border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-black/5 dark:bg-white/5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-black dark:bg-white rounded-xl shadow-sm text-white dark:text-black">
                            {/* Apple Logo placeholder. Using simple path for minimalist apple shape or text for now, using a wallet generic to match Google for UI */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" className="w-8 h-8 fill-current"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Apple Wallet</h3>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${appleEnabled ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    {appleEnabled ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button
                        onClick={() => handleToggle(!appleEnabled, 'apple')}
                        disabled={appleSaving}
                        variant={appleEnabled ? "outline" : "default"}
                        className={!appleEnabled ? "bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black" : ""}
                    >
                        {appleSaving && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                        {appleEnabled ? 'Disable Integration' : 'Enable Now'}
                    </Button>
                </div>

                <CardContent className="p-6 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-primary" />
                                Instant Setup
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                No technical configuration required. Apple Wallet integration uses the platform's central credential manager.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-primary" />
                                Branding Sync
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Unlike Google Wallet, Apple Wallet dynamically generates standard `.pkpass` files on the fly. Syncing is automated during file generation.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Info className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-primary font-semibold mb-1">How it works</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        When enabled, native buttons will appear on your customer's digital loyalty page.
                        They can add your card to their phone with one click. Their stamps and reward balance will stay synced automatically
                        whenever they earn points or redeem rewards in your store.
                    </p>
                </div>
            </div>
        </div>
    )
}

function Info({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
    )
}
