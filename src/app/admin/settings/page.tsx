'use client'

import { useState, useEffect } from 'react'
import {
    Save, Loader2, Building2, Globe, Phone, Mail,
    ScanLine, CheckCircle2, Zap, Info, Shield, Users,
    KeyRound, ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'

function sanitizeSlug(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

export default function SettingsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<any>(null)
    const [org, setOrg] = useState<any>(null)

    // POS setting derived from org.metadata
    const posRequireConfirmation: boolean = org?.metadata?.pos_require_confirmation ?? true

    const [oldPassword, setOldPassword] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [updatingPassword, setUpdatingPassword] = useState(false)

    useEffect(() => {
        async function load() {
            const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
            if (!user) return
            const { data: p } = await supabase.from('users').select('*, organizations(*)').eq('id', user.id).single()
            setProfile(p)
            setOrg(p?.organizations ?? {})
            setLoading(false)
        }
        load()
    }, [])

    async function saveProfile(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
        if (!user) { setSaving(false); return }

        await supabase.from('users').update({ full_name: profile.full_name }).eq('id', user.id)
        const slugToSave = sanitizeSlug(org.slug ?? org.name ?? '')
        const { error } = await supabase.from('organizations').update({
            name: org.name,
            slug: slugToSave,
            phone: org.phone,
            email: org.email,
            website: org.website,
            address: org.address,
            metadata: org.metadata ?? {},
        }).eq('id', org.id)

        if (error) {
            toast.error('Failed to save settings')
        } else {
            toast.success('Settings saved!')
        }
        setSaving(false)
    }

    async function handleUpdatePassword(e: React.FormEvent) {
        e.preventDefault()
        if (password !== confirmPassword) {
            toast.error("Passwords do not match")
            return
        }
        if (password.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        if (!oldPassword) {
            toast.error("Please enter your current password")
            return
        }

        setUpdatingPassword(true)

        // Verify old password
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: profile.email,
            password: oldPassword
        })

        if (signInError) {
            toast.error("Current password is incorrect")
            setUpdatingPassword(false)
            return
        }

        const { error } = await supabase.auth.updateUser({ password })
        
        if (error) {
            toast.error(error.message || "Failed to update password")
        } else {
            toast.success("Password updated successfully")
            setOldPassword('')
            setPassword('')
            setConfirmPassword('')
        }
        setUpdatingPassword(false)
    }

    function togglePosConfirmation() {
        setOrg((o: any) => ({
            ...o,
            metadata: {
                ...(o?.metadata ?? {}),
                pos_require_confirmation: !(o?.metadata?.pos_require_confirmation ?? true),
            },
        }))
    }

    if (loading) {
        return <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your account and business settings</p>
            </div>

            <form onSubmit={saveProfile} className="space-y-6">
                {/* Profile */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground text-base flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" /> Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input
                                value={profile?.full_name ?? ''}
                                onChange={e => setProfile((p: any) => ({ ...p, full_name: e.target.value }))}
                                className="bg-muted/50 border-border"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email (read-only)</Label>
                            <Input value={profile?.email ?? ''} disabled className="bg-muted/30 border-border opacity-50" />
                        </div>
                    </CardContent>
                </Card>

                {/* Business */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground text-base flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" /> Business Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Business Name</Label>
                            <Input
                                value={org?.name ?? ''}
                                onChange={e => setOrg((o: any) => ({ ...o, name: e.target.value }))}
                                className="bg-muted/50 border-border"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL Slug</Label>
                            <div className="flex items-center">
                                <span className="px-3 py-2 bg-muted/50 border border-r-0 border-border rounded-l-lg text-xs text-muted-foreground whitespace-nowrap">/join/</span>
                                <Input
                                    value={org?.slug ?? ''}
                                    onChange={e => setOrg((o: any) => ({ ...o, slug: sanitizeSlug(e.target.value) }))}
                                    placeholder="my-business"
                                    className="bg-muted/50 border-border rounded-l-none"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">Used in your customer join URL. Only lowercase letters, numbers, and dashes.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</Label>
                                <Input
                                    value={org?.phone ?? ''}
                                    onChange={e => setOrg((o: any) => ({ ...o, phone: e.target.value }))}
                                    className="bg-muted/50 border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
                                <Input
                                    type="email"
                                    value={org?.email ?? ''}
                                    onChange={e => setOrg((o: any) => ({ ...o, email: e.target.value }))}
                                    className="bg-muted/50 border-border"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1"><Globe className="w-3 h-3" /> Website</Label>
                            <Input
                                type="url"
                                value={org?.website ?? ''}
                                onChange={e => setOrg((o: any) => ({ ...o, website: e.target.value }))}
                                placeholder="https://"
                                className="bg-muted/50 border-border"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input
                                value={org?.address ?? ''}
                                onChange={e => setOrg((o: any) => ({ ...o, address: e.target.value }))}
                                className="bg-muted/50 border-border"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ── POS / Cashier Settings ── */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground text-base flex items-center gap-2">
                            <ScanLine className="w-4 h-4 text-primary" /> POS / Cashier Settings
                        </CardTitle>
                        <CardDescription>Control how the cashier terminal behaves when scanning customer QR codes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Confirmation toggle */}
                        <button
                            type="button"
                            onClick={togglePosConfirmation}
                            className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all text-left cursor-pointer ${posRequireConfirmation
                                ? 'border-primary/40 bg-primary/5'
                                : 'border-border bg-muted/30 hover:border-white/20'
                                }`}
                        >
                            {/* Toggle pill */}
                            <div className="pt-0.5 shrink-0">
                                <div className={`w-11 h-6 rounded-full transition-colors relative ${posRequireConfirmation ? 'bg-primary' : 'bg-white/20'}`}>
                                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${posRequireConfirmation ? 'left-[22px]' : 'left-0.5'}`} />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-foreground font-medium text-sm">Require Scan Confirmation</span>
                                    {posRequireConfirmation && (
                                        <span className="text-xs bg-primary/20 text-primary border border-primary/30 rounded-full px-2 py-0.5">ON</span>
                                    )}
                                </div>
                                <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                                    {posRequireConfirmation
                                        ? 'A confirmation sheet appears after every scan showing the customer\'s name, current stamps, and optional purchase value & notes fields. The cashier must confirm before stamping.'
                                        : 'Stamps are added instantly when a QR code is scanned — no confirmation required. Fastest checkout experience.'}
                                </p>

                                {/* Comparison pills */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${posRequireConfirmation ? 'text-primary border-primary/30 bg-primary/10' : 'text-muted-foreground border-border'}`}>
                                        <CheckCircle2 className="w-3 h-3" /> Customer preview
                                    </span>
                                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${posRequireConfirmation ? 'text-primary border-primary/30 bg-primary/10' : 'text-muted-foreground border-border'}`}>
                                        <CheckCircle2 className="w-3 h-3" /> Purchase amount
                                    </span>
                                    <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${!posRequireConfirmation ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-muted-foreground border-border'}`}>
                                        <Zap className="w-3 h-3" /> Instant stamp
                                    </span>
                                </div>
                            </div>
                        </button>

                        {!posRequireConfirmation && (
                            <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2.5">
                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span>In instant mode the stamp is applied immediately — accidental scans cannot be undone by the cashier.</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Button type="submit" disabled={saving} className="gradient-primary border-0 text-foreground w-full sm:w-auto">
                    {saving ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Saving…</> : <><Save className="mr-2 w-4 h-4" /> Save General Settings</>}
                </Button>
            </form>

            {/* ── Security ── */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground text-base flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> Security
                    </CardTitle>
                    <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Current Password</Label>
                            <Input
                                type="password"
                                value={oldPassword}
                                onChange={e => setOldPassword(e.target.value)}
                                placeholder="••••••••"
                                className="bg-muted/50 border-border"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>New Password</Label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="bg-muted/50 border-border"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Confirm Password</Label>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="bg-muted/50 border-border"
                                />
                            </div>
                        </div>
                        <Button 
                            type="submit" 
                            disabled={updatingPassword || !oldPassword || !password || !confirmPassword} 
                            variant="secondary"
                            className="bg-primary/10 text-primary hover:bg-primary/20 border-0"
                        >
                            {updatingPassword ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Updating...</> : <><KeyRound className="mr-2 w-4 h-4" /> Update Password</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* ── Staff & Cashiers ── */}
            <Card className="bg-card border-border overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-primary/5 to-transparent flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0 mt-1 sm:mt-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-foreground">Cashiers & Staff Management</h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-md">
                                Invite new cashiers and manage their access to the POS terminal. Employees only have access to the checkout screen.
                            </p>
                        </div>
                    </div>
                    <Button asChild variant="outline" className="w-full sm:w-auto shrink-0 border-primary/20 hover:bg-primary/5 hover:text-primary">
                        <Link href="/admin/employees">
                            Manage Staff <ChevronRight className="ml-2 w-4 h-4" />
                        </Link>
                    </Button>
                </div>
            </Card>
        </div>
    )
}
