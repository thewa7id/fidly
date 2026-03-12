'use client'

import { useState, useCallback, useEffect } from 'react'
import {
    QrCode, CheckCircle2, Gift, History, Star, User, LogOut,
    Loader2, LayoutDashboard, X, ChevronRight,
    Banknote, StickyNote, Stamp, Smartphone, Search, Plus, CreditCard, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useNFCSupport } from '@/components/pos/NFCReader'
import { Dialog, DialogContent } from '@/components/ui/dialog'

// Lazy-load QR scanner to avoid SSR issues
const QRScanner = dynamic(() => import('@/components/pos/QRScanner'), {
    ssr: false,
    loading: () => (
        <div className="h-64 flex items-center justify-center bg-muted/50 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    ),
})

// Lazy-load NFC reader
const NFCReader = dynamic(() => import('@/components/pos/NFCReader'), {
    ssr: false,
    loading: () => (
        <div className="h-56 flex items-center justify-center bg-muted/50 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    ),
})

interface Props {
    initialProfile: any
    initialBranches: any[]
    initialRewards: any[]
    initialTransactions: any[]
}

export default function POSClient({ initialProfile, initialBranches, initialRewards, initialTransactions }: Props) {
    const supabase = createClient()
    const router = useRouter()
    const nfcSupported = useNFCSupport()
    const [branches] = useState(initialBranches)
    const [rewards] = useState(initialRewards)
    const [selectedBranch, setSelectedBranch] = useState(initialBranches[0]?.id || '')
    const [tab, setTab] = useState<'scan' | 'redeem' | 'history'>('scan')
    const [scanning, setScanning] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [lastResult, setLastResult] = useState<any>(null)
    const [transactions, setTransactions] = useState(initialTransactions)
    const [manualToken, setManualToken] = useState('')

    // Input mode: 'qr' or 'nfc'
    const [inputMode, setInputMode] = useState<'qr' | 'nfc'>('qr')
    const [nfcScanning, setNfcScanning] = useState(false)

    // Confirmation sheet state
    const [pendingScan, setPendingScan] = useState<any>(null)
    const [purchaseAmount, setPurchaseAmount] = useState('')
    const [scanNotes, setScanNotes] = useState('')

    // Redeem tab customer state
    const [redeemCustomer, setRedeemCustomer] = useState<any>(null)
    const [loadingCustomer, setLoadingCustomer] = useState(false)

    // NFC Link Card modal state
    const [linkModal, setLinkModal] = useState<{ nfcUid: string } | null>(null)
    const [linkSearch, setLinkSearch] = useState('')
    const [linkSearchResults, setLinkSearchResults] = useState<any[]>([])
    const [linkSearching, setLinkSearching] = useState(false)
    const [linkCreating, setLinkCreating] = useState(false)
    const [linkNewName, setLinkNewName] = useState('')
    const [linkNewPhone, setLinkNewPhone] = useState('')
    const [linkNewEmail, setLinkNewEmail] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [linkProcessing, setLinkProcessing] = useState(false)

    // NFC Replace Card modal
    const [replaceModal, setReplaceModal] = useState<{ customerId: string; customerName: string } | null>(null)
    const [replaceNfcScanning, setReplaceNfcScanning] = useState(false)

    // Confirmation Popup
    const [showSuccess, setShowSuccess] = useState(false)
    const [successType, setSuccessType] = useState<'stamp' | 'reward' | 'redeem'>('stamp')
    const [successData, setSuccessData] = useState<any>(null)

    const playSuccessSound = useCallback(() => {
        const audio = new Audio('/sounds/scan-success.mp3')
        audio.volume = 0.5
        audio.play().catch(e => console.log('Audio play failed', e))
    }, [])

    useEffect(() => {
        if (showSuccess) {
            playSuccessSound()
            const timer = setTimeout(() => setShowSuccess(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [showSuccess, playSuccessSound])

    const org = initialProfile?.organizations ?? {}
    const requireConfirmation: boolean = org?.metadata?.pos_require_confirmation ?? true

    async function loadTransactions() {
        const { data: tx } = await supabase
            .from('transactions')
            .select('*, customers(full_name), rewards(name)')
            .eq('organization_id', initialProfile.organization_id)
            .order('created_at', { ascending: false })
            .limit(20)
        setTransactions(tx ?? [])
    }

    const fetchRedeemCustomer = useCallback(async (token: string) => {
        if (!token) { setRedeemCustomer(null); return }
        setLoadingCustomer(true)
        try {
            const res = await fetch(`/api/client/balance?token=${encodeURIComponent(token)}`)
            const json = await res.json()
            if (json.success) {
                setRedeemCustomer(json.data?.customer ?? null)
            } else {
                setRedeemCustomer(null)
            }
        } catch {
            setRedeemCustomer(null)
        } finally {
            setLoadingCustomer(false)
        }
    }, [])

    // ─── NFC lookup ──────────────────────────────────────────────
    const handleNFCRead = useCallback(async (uid: string) => {
        if (!uid || !selectedBranch || processing) return
        setNfcScanning(false)

        try {
            const res = await fetch('/api/pos/nfc/lookup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nfcUid: uid }),
            })
            const data = await res.json()

            if (data.success && data.data.found) {
                const customer = data.data.customer

                if (tab === 'redeem') {
                    setRedeemCustomer(customer)
                    setManualToken(customer.public_token)
                    return
                }

                // Scan tab flow — stamp
                if (!requireConfirmation) {
                    // Instant stamp via NFC
                    await instantStampNfc(uid)
                    return
                }

                // Show confirmation sheet
                setPendingScan({
                    token: customer.public_token,
                    nfcUid: uid,
                    loading: false,
                    customer: {
                        id: customer.id,
                        full_name: customer.full_name,
                        available_stamps: customer.available_stamps,
                        available_points: customer.available_points,
                        public_token: customer.public_token,
                    },
                })
                setPurchaseAmount('')
                setScanNotes('')
            } else if (data.success && data.data.blocked) {
                // Blocked card
                toast.error('Card Blocked', {
                    description: 'This NFC card has been blocked. Please use a digital card instead.',
                    duration: 5000,
                })
            } else {
                // Card not linked — open link modal
                setLinkModal({ nfcUid: uid })
                toast.info('New NFC card detected', { description: 'Link it to a customer to get started.' })
            }
        } catch (err) {
            toast.error('Failed to read NFC card')
        }
    }, [selectedBranch, tab, requireConfirmation, processing])

    async function instantStampNfc(nfcUid: string) {
        if (!nfcUid || !selectedBranch || processing) return
        setProcessing(true)

        const res = await fetch('/api/pos/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nfcUid, branchId: selectedBranch }),
        })

        const data = await res.json()
        setProcessing(false)

        if (!data.success) {
            toast.error(data.error ?? 'Scan failed')
            return
        }

        setLastResult(data.data)
        if (data.data.rewardUnlocked) {
            setSuccessType('reward')
            setSuccessData(data.data)
            setShowSuccess(true)
        } else {
            setSuccessType('stamp')
            setSuccessData(data.data)
            setShowSuccess(true)
        }

        await loadTransactions()
    }

    // ─── NFC Link helpers ────────────────────────────────────────
    async function searchCustomersForLink(query: string) {
        if (!query || query.length < 2) { setLinkSearchResults([]); return }
        setLinkSearching(true)
        try {
            const { data } = await supabase
                .from('customers')
                .select('id, full_name, email, phone, public_token, available_stamps')
                .eq('organization_id', initialProfile.organization_id)
                .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
                .limit(5)
            setLinkSearchResults(data ?? [])
        } catch {
            setLinkSearchResults([])
        } finally {
            setLinkSearching(false)
        }
    }

    async function linkNfcToCustomer(customerId: string) {
        if (!linkModal) return
        setLinkProcessing(true)
        try {
            const res = await fetch('/api/pos/nfc/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nfcUid: linkModal.nfcUid, customerId }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('NFC card linked!', { description: `Card linked to ${data.data.customer.full_name}` })
                setLinkModal(null)
                resetLinkForm()
            } else {
                toast.error(data.error || 'Failed to link card')
            }
        } catch {
            toast.error('Failed to link NFC card')
        } finally {
            setLinkProcessing(false)
        }
    }

    async function createAndLinkCustomer() {
        if (!linkModal || !linkNewName.trim()) return
        setLinkCreating(true)
        try {
            // Create customer
            const { data: newCust, error } = await supabase
                .from('customers')
                .insert({
                    organization_id: initialProfile.organization_id,
                    full_name: linkNewName.trim(),
                    phone: linkNewPhone.trim() || null,
                    email: linkNewEmail.trim() || null,
                })
                .select('id, full_name')
                .single()

            if (error || !newCust) {
                toast.error(error?.message || 'Failed to create customer')
                return
            }

            // Link the NFC card
            await linkNfcToCustomer(newCust.id)
        } catch {
            toast.error('Failed to create customer')
        } finally {
            setLinkCreating(false)
        }
    }

    function resetLinkForm() {
        setLinkSearch('')
        setLinkSearchResults([])
        setShowCreateForm(false)
        setLinkNewName('')
        setLinkNewPhone('')
        setLinkNewEmail('')
    }

    // ─── NFC Replace handlers ────────────────────────────────────
    async function handleReplaceNFCRead(uid: string) {
        if (!replaceModal) return
        setReplaceNfcScanning(false)

        try {
            const res = await fetch('/api/pos/nfc/replace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: replaceModal.customerId, newNfcUid: uid }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Card replaced!', { description: `New card linked to ${replaceModal.customerName}` })
                setReplaceModal(null)
            } else {
                toast.error(data.error || 'Failed to replace card')
            }
        } catch {
            toast.error('Failed to replace NFC card')
        }
    }

    // ─── Existing QR scan handlers (unchanged) ───────────────────
    async function instantStamp(token: string) {
        if (!token || !selectedBranch || processing) return
        setProcessing(true)

        const res = await fetch('/api/pos/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerToken: token, branchId: selectedBranch }),
        })

        const data = await res.json()
        setProcessing(false)
        setManualToken('')

        if (!data.success) {
            toast.error(data.error ?? 'Scan failed')
            return
        }

        setLastResult(data.data)
        if (data.data.rewardUnlocked) {
            setSuccessType('reward')
            setSuccessData(data.data)
            setShowSuccess(true)
        } else {
            setSuccessType('stamp')
            setSuccessData(data.data)
            setShowSuccess(true)
        }

        await loadTransactions()
    }

    const handleQRScanned = useCallback(async (rawToken: string) => {
        if (!rawToken || !selectedBranch) return
        setScanning(false)

        let token = rawToken.trim()
        if (token.includes('/c/')) token = token.split('/c/').pop()?.split('?')[0]?.trim() ?? token
        if (token.startsWith('c/')) token = token.slice(2)

        setManualToken(token)

        if (tab === 'redeem') {
            await fetchRedeemCustomer(token)
            return
        }

        if (!requireConfirmation) {
            await instantStamp(token)
            return
        }

        setPendingScan({ token, customer: null, loading: true })
        setPurchaseAmount('')
        setScanNotes('')

        try {
            const res = await fetch(`/api/client/balance?token=${encodeURIComponent(token)}`)
            if (res.ok) {
                const json = await res.json()
                const c = json.data?.customer
                setPendingScan({
                    token,
                    loading: false,
                    customer: c ? {
                        id: c.id,
                        full_name: c.full_name,
                        available_stamps: c.available_stamps,
                        available_points: c.available_points,
                        public_token: c.public_token,
                    } : null,
                })
            } else {
                setPendingScan({ token, customer: null, loading: false })
            }
        } catch {
            setPendingScan({ token, customer: null, loading: false })
        }
    }, [selectedBranch, tab, requireConfirmation, fetchRedeemCustomer])

    async function confirmScan() {
        if (!pendingScan || processing) return
        setProcessing(true)

        const body: any = {
            branchId: selectedBranch,
            purchaseAmount: purchaseAmount || undefined,
            notes: scanNotes || undefined,
        }

        // Use NFC UID if available, otherwise use token
        if (pendingScan.nfcUid) {
            body.nfcUid = pendingScan.nfcUid
        } else {
            body.customerToken = pendingScan.token
        }

        const res = await fetch('/api/pos/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        const data = await res.json()
        setProcessing(false)

        if (!data.success) {
            toast.error(data.error ?? 'Scan failed')
            setPendingScan(null)
            return
        }

        setPendingScan(null)
        setManualToken('')
        setPurchaseAmount('')
        setScanNotes('')
        setLastResult(data.data)

        if (data.data.rewardUnlocked) {
            setSuccessType('reward')
            setSuccessData(data.data)
            setShowSuccess(true)
        } else {
            setSuccessType('stamp')
            setSuccessData(data.data)
            setShowSuccess(true)
        }

        await loadTransactions()
    }

    async function redeemReward(customerToken: string, rewardId: string) {
        if (!selectedBranch || processing || !customerToken) return
        setProcessing(true)

        const res = await fetch('/api/pos/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerToken, rewardId, branchId: selectedBranch }),
        })

        const data = await res.json()
        setProcessing(false)

        if (!data.success) {
            toast.error(data.error)
        } else {
            setSuccessType('redeem')
            setSuccessData(data.data)
            setShowSuccess(true)

            if (redeemCustomer && redeemCustomer.public_token === customerToken) {
                setRedeemCustomer({
                    ...redeemCustomer,
                    available_stamps: data.data.customer.available_stamps,
                    available_points: data.data.customer.available_points,
                })
            }

            setLastResult((prev: any) => prev ? {
                ...prev,
                customer: {
                    ...prev.customer,
                    available_stamps: data.data.customer.available_stamps,
                    available_points: data.data.customer.available_points,
                },
            } : prev)
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut({ scope: 'local' })
        router.push('/login')
    }

    const tabs = [
        { id: 'scan' as const, label: 'Scan', icon: QrCode },
        { id: 'redeem' as const, label: 'Redeem', icon: Gift },
        { id: 'history' as const, label: 'History', icon: History },
    ]

    // ─── Input mode toggle (QR vs NFC) ──────────────────────────
    const InputModeToggle = nfcSupported ? (
        <div className="flex items-center bg-muted/50 rounded-lg p-0.5 mb-4">
            <button
                onClick={() => { setInputMode('qr'); setNfcScanning(false) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${inputMode === 'qr'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
            >
                <QrCode className="w-3.5 h-3.5" />
                QR Code
            </button>
            <button
                onClick={() => { setInputMode('nfc'); setScanning(false) }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${inputMode === 'nfc'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
            >
                <Smartphone className="w-3.5 h-3.5" />
                NFC Card
            </button>
        </div>
    ) : null

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* POS Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 glass border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                        <Star className="w-4 h-4 text-foreground" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-foreground">{initialProfile?.organizations?.name ?? 'Goyalty POS'}</div>
                        <div className="text-xs text-muted-foreground">{initialProfile?.full_name}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={selectedBranch}
                        onChange={e => setSelectedBranch(e.target.value)}
                        className="bg-muted/50 border border-border rounded-lg text-sm text-foreground px-3 py-1.5 focus:outline-none focus:border-primary/50"
                    >
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                    <Link href="/pos/checker">
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Search className="w-4 h-4" />
                        </Button>
                    </Link>
                    {initialProfile?.role !== 'employee' && (
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                <LayoutDashboard className="w-4 h-4" />
                            </Button>
                        </Link>
                    )}
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-red-400">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-border">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${tab === t.id
                            ? 'text-primary border-b-2 border-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 max-w-lg mx-auto w-full">

                {/* SCAN TAB */}
                {tab === 'scan' && (
                    <div className="space-y-4 mt-4">
                        <div className="text-center">
                            <h2 className="text-foreground font-semibold text-lg">
                                {inputMode === 'nfc' ? 'Tap NFC Card' : 'Scan Customer QR'}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {inputMode === 'nfc'
                                    ? 'Hold the customer\'s NFC card near the device'
                                    : 'Point the camera at the customer\'s loyalty card'}
                            </p>
                        </div>

                        {InputModeToggle}

                        {inputMode === 'qr' ? (
                            <>
                                {scanning ? (
                                    <QRScanner onScan={handleQRScanned} onClose={() => setScanning(false)} />
                                ) : (
                                    <button
                                        onClick={() => setScanning(true)}
                                        className="w-full h-56 rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground"
                                    >
                                        <QrCode className="w-16 h-16" />
                                        <span className="font-medium">Tap to Open Scanner</span>
                                    </button>
                                )}

                                {/* Manual input */}
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground my-2">
                                    <div className="flex-1 h-px bg-muted" />
                                    <span>or enter manually</span>
                                    <div className="flex-1 h-px bg-muted" />
                                </div>

                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Customer token..."
                                        value={manualToken}
                                        onChange={e => setManualToken(e.target.value)}
                                        className="bg-muted/50 border-border"
                                        onKeyDown={e => e.key === 'Enter' && manualToken && handleQRScanned(manualToken)}
                                    />
                                    <Button
                                        onClick={() => manualToken && handleQRScanned(manualToken)}
                                        disabled={!manualToken}
                                        className="gradient-primary border-0 text-foreground shrink-0"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            /* NFC mode */
                            <NFCReader
                                onRead={handleNFCRead}
                                scanning={nfcScanning}
                                onStartScan={() => setNfcScanning(true)}
                                onStopScan={() => setNfcScanning(false)}
                            />
                        )}

                        {/* Last Result */}
                        {lastResult && !pendingScan && (
                            <Card className={`border ${lastResult.rewardUnlocked ? 'border-green-500/30 bg-green-500/5' : 'border-primary/30 bg-primary/5'}`}>
                                <CardContent className="pt-4 pb-4">
                                    <div className="flex items-start gap-3">
                                        {lastResult.rewardUnlocked ? (
                                            <Gift className="w-8 h-8 text-green-400 shrink-0" />
                                        ) : (
                                            <CheckCircle2 className="w-8 h-8 text-primary shrink-0" />
                                        )}
                                        <div className="flex-1">
                                            <div className="text-foreground font-semibold">{lastResult.customer.full_name}</div>
                                            {lastResult.rewardUnlocked ? (
                                                <div className="text-green-400 text-sm">🎉 Reward Unlocked! Tell the customer.</div>
                                            ) : (
                                                <div className="text-muted-foreground text-sm">
                                                    {lastResult.customer.available_stamps} / {lastResult.stampsRequired} stamps
                                                </div>
                                            )}
                                        </div>
                                        <Badge className={lastResult.rewardUnlocked
                                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                            : 'bg-primary/20 text-primary border-primary/30'}>
                                            +1 Stamp
                                        </Badge>
                                    </div>

                                    {lastResult.rewardUnlocked && rewards.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <div className="text-xs text-muted-foreground font-medium">Redeem now:</div>
                                            {rewards.map(r => (
                                                <Button
                                                    key={r.id}
                                                    onClick={() => redeemReward(lastResult.customer.public_token, r.id)}
                                                    disabled={processing}
                                                    size="sm"
                                                    className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                                                >
                                                    <Gift className="mr-2 w-3 h-3" /> Redeem: {r.name}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* REDEEM TAB */}
                {tab === 'redeem' && (
                    <div className="space-y-4 mt-4">
                        <div className="text-center">
                            <h2 className="text-foreground font-semibold text-lg">Redeem Reward</h2>
                            <p className="text-muted-foreground text-sm">
                                {inputMode === 'nfc'
                                    ? 'Tap customer NFC card to identify'
                                    : 'Scan customer to see eligible rewards'}
                            </p>
                        </div>

                        {InputModeToggle}

                        {inputMode === 'qr' ? (
                            <>
                                {scanning ? (
                                    <QRScanner onScan={handleQRScanned} onClose={() => setScanning(false)} />
                                ) : (
                                    <button
                                        onClick={() => setScanning(true)}
                                        className="w-full py-6 rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <QrCode className="w-10 h-10" />
                                        <span className="font-medium text-sm">Scan Customer QR</span>
                                    </button>
                                )}

                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Manual customer token..."
                                        value={manualToken}
                                        onChange={e => setManualToken(e.target.value)}
                                        className="bg-muted/50 border-border"
                                        onKeyDown={e => e.key === 'Enter' && manualToken && fetchRedeemCustomer(manualToken)}
                                    />
                                    <Button
                                        onClick={() => manualToken && fetchRedeemCustomer(manualToken)}
                                        disabled={!manualToken || loadingCustomer}
                                        className="gradient-primary border-0 text-foreground shrink-0"
                                    >
                                        {loadingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            /* NFC mode for redeem */
                            <NFCReader
                                onRead={handleNFCRead}
                                scanning={nfcScanning}
                                onStartScan={() => setNfcScanning(true)}
                                onStopScan={() => setNfcScanning(false)}
                            />
                        )}

                        {/* Identified Customer */}
                        {redeemCustomer && (
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/10 border border-primary/20">
                                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-foreground font-bold shrink-0">
                                    {redeemCustomer.full_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-foreground font-semibold truncate text-sm">{redeemCustomer.full_name}</div>
                                    <div className="text-primary text-xs font-medium flex items-center gap-1.5 mt-0.5">
                                        <Star className="w-3.5 h-3.5 fill-primary" />
                                        <span>{redeemCustomer.available_stamps} Stamps available</span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setRedeemCustomer(null); setManualToken('') }}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {rewards.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Gift className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                <p>No active rewards configured.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rewards.map(r => {
                                    const cRedeem = redeemCustomer && redeemCustomer.available_stamps >= (r.stamps_required ?? 0)
                                    const tokenToUse = redeemCustomer?.public_token || manualToken

                                    return (
                                        <Card key={r.id} className={`bg-card border-border transition-opacity ${redeemCustomer && !cRedeem ? 'opacity-50' : ''}`}>
                                            <CardContent className="pt-4 pb-4 flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${cRedeem ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}`}>
                                                    <Gift className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-foreground font-medium text-sm">{r.name}</div>
                                                    <div className="text-muted-foreground text-[10px] leading-tight mt-0.5">{r.description}</div>
                                                    {r.stamps_required && (
                                                        <div className={`text-[10px] font-bold uppercase mt-1 ${cRedeem ? 'text-green-500' : 'text-primary'}`}>
                                                            {r.stamps_required} stamps required
                                                        </div>
                                                    )}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => redeemReward(tokenToUse, r.id)}
                                                    disabled={!tokenToUse || processing || (redeemCustomer && !cRedeem)}
                                                    className={`${cRedeem ? 'bg-green-600 hover:bg-green-700' : 'gradient-primary'} border-0 text-foreground font-bold text-xs px-4`}
                                                >
                                                    {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'REDEEM'}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* HISTORY TAB */}
                {tab === 'history' && (
                    <div className="mt-4 space-y-2">
                        <h2 className="text-foreground font-semibold mb-4">Recent Transactions</h2>
                        {transactions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
                                <p>No transactions yet.</p>
                            </div>
                        ) : (
                            transactions.map(tx => (
                                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                                    <div className={`p-2 rounded-lg ${tx.type === 'earn_stamp' ? 'bg-primary/10 text-primary' : tx.type === 'redeem_reward' ? 'bg-green-500/10 text-green-400' : 'bg-muted/50 text-muted-foreground'}`}>
                                        {tx.type === 'earn_stamp' ? <Star className="w-4 h-4" /> : tx.type === 'redeem_reward' ? <Gift className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-foreground text-sm font-medium truncate">{tx.customers?.full_name ?? 'Customer'}</div>
                                        <div className="text-muted-foreground text-xs capitalize">
                                            {tx.type === 'earn_stamp' ? `+${tx.stamps_earned} stamp` : tx.type === 'redeem_reward' ? `Redeemed: ${tx.rewards?.name ?? 'reward'}` : tx.type.replace(/_/g, ' ')}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* ─── CONFIRMATION BOTTOM SHEET ─────────────────────────────────── */}
            {pendingScan && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={() => { setPendingScan(null); setManualToken('') }}
                    />

                    {/* Sheet */}
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#13131f] border-t border-border rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-w-lg mx-auto">
                        {/* Handle bar */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-white/20 rounded-full" />
                        </div>

                        <div className="px-6 pb-8 pt-2">
                            {/* Header row */}
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-foreground font-semibold text-lg">Confirm Stamp</h3>
                                <button
                                    onClick={() => { setPendingScan(null); setManualToken('') }}
                                    className="p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* NFC badge if applicable */}
                            {pendingScan.nfcUid && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Via NFC Card</span>
                                </div>
                            )}

                            {/* Customer info */}
                            {pendingScan.loading ? (
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/50 mb-5">
                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    <span className="text-muted-foreground text-sm">Looking up customer…</span>
                                </div>
                            ) : pendingScan.customer ? (
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 mb-5">
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shrink-0 text-foreground font-bold text-lg">
                                        {pendingScan.customer.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-foreground font-semibold truncate">{pendingScan.customer.full_name}</div>
                                        <div className="text-muted-foreground text-sm flex items-center gap-1.5 mt-0.5">
                                            <Star className="w-3.5 h-3.5 text-yellow-400" />
                                            <span>{pendingScan.customer.available_stamps} stamps currently</span>
                                        </div>
                                    </div>
                                    <Badge className="bg-primary/20 text-primary border-primary/30 shrink-0">
                                        +1 Stamp
                                    </Badge>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 mb-5">
                                    <X className="w-5 h-5 text-red-400 shrink-0" />
                                    <div>
                                        <div className="text-red-400 font-medium text-sm">Customer not found</div>
                                        <div className="text-muted-foreground text-xs mt-0.5">Check the QR code and try again</div>
                                    </div>
                                </div>
                            )}

                            {/* Fields — only when customer found */}
                            {pendingScan.customer && (
                                <div className="space-y-3 mb-6">
                                    {/* Purchase Amount */}
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium mb-1.5 flex items-center gap-1.5">
                                            <Banknote className="w-3.5 h-3.5" /> Product / Purchase Value
                                            <span className="text-foreground/30 font-normal">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">$</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={purchaseAmount}
                                                onChange={e => setPurchaseAmount(e.target.value)}
                                                className="bg-muted/50 border-border pl-7 text-foreground placeholder:text-foreground/20"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="text-xs text-muted-foreground font-medium mb-1.5 flex items-center gap-1.5">
                                            <StickyNote className="w-3.5 h-3.5" /> Notes
                                            <span className="text-foreground/30 font-normal">(optional)</span>
                                        </label>
                                        <Input
                                            placeholder="e.g. Large latte, table 5…"
                                            value={scanNotes}
                                            onChange={e => setScanNotes(e.target.value)}
                                            className="bg-muted/50 border-border text-foreground placeholder:text-foreground/20"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-border text-muted-foreground hover:text-foreground hover:border-white/20"
                                    onClick={() => { setPendingScan(null); setManualToken('') }}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 gradient-primary border-0 text-foreground font-semibold"
                                    onClick={confirmScan}
                                    disabled={!pendingScan.customer || processing}
                                >
                                    {processing ? (
                                        <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Processing…</>
                                    ) : (
                                        <><Stamp className="mr-2 w-4 h-4" /> Confirm Stamp</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ─── NFC LINK CARD MODAL ──────────────────────────────────────── */}
            {linkModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={() => { setLinkModal(null); resetLinkForm() }}
                    />
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#13131f] border-t border-border rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-w-lg mx-auto max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-white/20 rounded-full" />
                        </div>

                        <div className="px-6 pb-8 pt-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-foreground font-semibold text-lg">Link NFC Card</h3>
                                <button
                                    onClick={() => { setLinkModal(null); resetLinkForm() }}
                                    className="p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 mb-5">
                                <CreditCard className="w-5 h-5 text-primary shrink-0" />
                                <div>
                                    <div className="text-foreground text-sm font-medium">NFC Card Detected</div>
                                    <div className="text-muted-foreground text-xs font-mono">UID: {linkModal.nfcUid}</div>
                                </div>
                            </div>

                            {!showCreateForm ? (
                                <>
                                    {/* Search existing customer */}
                                    <div className="relative mb-3">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search customer by name, email, or phone..."
                                            value={linkSearch}
                                            onChange={e => {
                                                setLinkSearch(e.target.value)
                                                searchCustomersForLink(e.target.value)
                                            }}
                                            className="bg-muted/50 border-border pl-10 text-foreground placeholder:text-foreground/30"
                                            autoFocus
                                        />
                                    </div>

                                    {linkSearching && (
                                        <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground text-sm">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Searching…
                                        </div>
                                    )}

                                    {linkSearchResults.length > 0 && (
                                        <div className="space-y-2 mb-4">
                                            {linkSearchResults.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => linkNfcToCustomer(c.id)}
                                                    disabled={linkProcessing}
                                                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border hover:border-primary/40 transition-colors text-left"
                                                >
                                                    <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-foreground font-bold text-sm shrink-0">
                                                        {c.full_name?.charAt(0).toUpperCase() ?? '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-foreground text-sm font-medium truncate">{c.full_name}</div>
                                                        <div className="text-muted-foreground text-xs truncate">{c.email || c.phone || ''}</div>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{c.available_stamps} stamps</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {linkSearch.length >= 2 && !linkSearching && linkSearchResults.length === 0 && (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                            No customers found
                                        </div>
                                    )}

                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground my-4">
                                        <div className="flex-1 h-px bg-muted" />
                                        <span>or</span>
                                        <div className="flex-1 h-px bg-muted" />
                                    </div>

                                    <Button
                                        onClick={() => setShowCreateForm(true)}
                                        variant="outline"
                                        className="w-full border-border text-foreground hover:border-primary/40"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Create New Customer
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {/* Quick create customer form */}
                                    <div className="space-y-3 mb-5">
                                        <div>
                                            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Full Name *</label>
                                            <Input
                                                placeholder="Customer name"
                                                value={linkNewName}
                                                onChange={e => setLinkNewName(e.target.value)}
                                                className="bg-muted/50 border-border text-foreground"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Phone</label>
                                            <Input
                                                placeholder="Phone number"
                                                value={linkNewPhone}
                                                onChange={e => setLinkNewPhone(e.target.value)}
                                                className="bg-muted/50 border-border text-foreground"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Email</label>
                                            <Input
                                                placeholder="Email address"
                                                value={linkNewEmail}
                                                onChange={e => setLinkNewEmail(e.target.value)}
                                                className="bg-muted/50 border-border text-foreground"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-border text-muted-foreground"
                                            onClick={() => setShowCreateForm(false)}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            className="flex-1 gradient-primary border-0 text-foreground font-semibold"
                                            onClick={createAndLinkCustomer}
                                            disabled={!linkNewName.trim() || linkCreating}
                                        >
                                            {linkCreating ? (
                                                <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Creating…</>
                                            ) : (
                                                <><Plus className="mr-2 w-4 h-4" /> Create & Link</>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ─── NFC REPLACE CARD MODAL ───────────────────────────────────── */}
            {replaceModal && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={() => { setReplaceModal(null); setReplaceNfcScanning(false) }}
                    />
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#13131f] border-t border-border rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-w-lg mx-auto">
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-white/20 rounded-full" />
                        </div>

                        <div className="px-6 pb-8 pt-2">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-foreground font-semibold text-lg">Replace NFC Card</h3>
                                <button
                                    onClick={() => { setReplaceModal(null); setReplaceNfcScanning(false) }}
                                    className="p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border mb-5">
                                <RefreshCw className="w-5 h-5 text-primary shrink-0" />
                                <div>
                                    <div className="text-foreground text-sm font-medium">{replaceModal.customerName}</div>
                                    <div className="text-muted-foreground text-xs">Tap the new NFC card to replace the old one</div>
                                </div>
                            </div>

                            <NFCReader
                                onRead={handleReplaceNFCRead}
                                scanning={replaceNfcScanning}
                                onStartScan={() => setReplaceNfcScanning(true)}
                                onStopScan={() => setReplaceNfcScanning(false)}
                            />
                        </div>
                    </div>
                </>
            )}
            {/* Replace NFC card modal content... unchanged ... */}

            {/* Success Confirmation Animation Dialog */}
            <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
                <DialogContent className="max-w-xs p-8 rounded-3xl border-0 overflow-hidden" showCloseButton={false}>
                    <div className="relative flex flex-col items-center text-center space-y-4">
                        {/* Green Glow/Animation background */}
                        <div className="absolute -top-12 -left-12 w-48 h-48 bg-green-500/10 blur-3xl rounded-full animate-pulse" />

                        {/* Checkmark animation */}
                        <div className="relative z-10 w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center animate-in zoom-in duration-500 spring-bounce-50">
                            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/50 scale-110">
                                <CheckCircle2 className="w-10 h-10 text-white animate-in slide-in-from-bottom-2 duration-300" />
                            </div>
                        </div>

                        <div className="space-y-1 z-10">
                            <h3 className="text-2xl font-bold text-foreground">
                                {successType === 'stamp' && 'STAMP ADDED'}
                                {successType === 'reward' && 'REWARD UNLOCKED!'}
                                {successType === 'redeem' && 'REDEEMED SUCCESS'}
                            </h3>
                            <p className="text-muted-foreground text-sm font-medium">
                                {successData?.customer?.full_name || 'Customer'}
                            </p>
                        </div>

                        {successType === 'stamp' && successData && (
                            <div className="bg-muted px-4 py-2 rounded-2xl flex items-center gap-2 border border-border">
                                <Stamp className="w-4 h-4 text-primary" />
                                <span className="text-lg font-black text-primary">
                                    {successData.customer.available_stamps} / {successData.stampsRequired}
                                </span>
                            </div>
                        )}

                        {successType === 'reward' && (
                            <div className="animate-bounce">
                                <Badge className="bg-yellow-500 hover:bg-yellow-500 text-black font-black px-4 py-1.5 text-sm rounded-full shadow-lg shadow-yellow-500/20 border-0">
                                    <Gift className="w-4 h-4 mr-2" /> GIFT WAITING!
                                </Badge>
                            </div>
                        )}

                        {successType === 'redeem' && successData && (
                            <div className="text-sm font-bold text-green-500 bg-green-500/10 px-4 py-1 rounded-lg">
                                {successData.reward?.name}
                            </div>
                        )}

                        <div className="pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground text-xs font-mono uppercase tracking-widest opacity-50"
                                onClick={() => setShowSuccess(false)}
                            >
                                Tap to close
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
