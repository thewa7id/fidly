'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    CreditCard, QrCode, Smartphone, Shield, ShieldOff,
    RefreshCw, Link2, Star, Calendar, Mail, Phone, Loader2,
    ExternalLink, X, Ban, History, ArrowDownLeft, Gift, AlertCircle
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import type { Customer, NfcCard, Transaction } from '@/lib/types'

// Lazy-load NFC reader (browser-only)
const NFCReader = dynamic(() => import('@/components/pos/NFCReader'), {
    ssr: false,
    loading: () => (
        <div className="h-40 flex items-center justify-center bg-muted/50 rounded-xl">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
    ),
})

// Check NFC support (client-side only)
function useNFCSupport() {
    const [supported, setSupported] = useState(false)
    useEffect(() => {
        setSupported(typeof window !== 'undefined' && 'NDEFReader' in window)
    }, [])
    return supported
}

interface Props {
    customer: Customer | null
    open: boolean
    onClose: () => void
}

export default function CustomerDetailDialog({ customer, open, onClose }: Props) {
    const nfcSupported = useNFCSupport()
    const [nfcCards, setNfcCards] = useState<NfcCard[]>([])
    const [loadingCards, setLoadingCards] = useState(false)

    // History state
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    // NFC Link state
    const [linkMode, setLinkMode] = useState(false)
    const [nfcScanning, setNfcScanning] = useState(false)
    const [linkProcessing, setLinkProcessing] = useState(false)

    // NFC Replace state
    const [replaceMode, setReplaceMode] = useState(false)
    const [replaceScanning, setReplaceScanning] = useState(false)

    // Block state
    const [blockingCardId, setBlockingCardId] = useState<string | null>(null)

    const activeCard = nfcCards.find(c => c.status === 'active')
    const hasBlockedCards = nfcCards.some(c => c.status === 'blocked')

    // Fetch NFC cards when customer changes
    const fetchNfcCards = useCallback(async () => {
        if (!customer) return
        setLoadingCards(true)
        try {
            const res = await fetch(`/api/admin/customers/${customer.id}/nfc-cards`)
            const data = await res.json()
            if (data.success) {
                setNfcCards(data.data ?? [])
            }
        } catch {
            // silent
        } finally {
            setLoadingCards(false)
        }
    }, [customer])

    // Fetch History when customer changes
    const fetchHistory = useCallback(async () => {
        if (!customer) return
        setLoadingHistory(true)
        try {
            const res = await fetch(`/api/admin/customers/${customer.id}/history`)
            const data = await res.json()
            if (data.success) {
                setTransactions(data.data ?? [])
            }
        } catch {
            // silent
        } finally {
            setLoadingHistory(false)
        }
    }, [customer])

    useEffect(() => {
        if (open && customer) {
            fetchNfcCards()
            fetchHistory()
        }
        if (!open) {
            // Reset states when closed
            setLinkMode(false)
            setReplaceMode(false)
            setNfcScanning(false)
            setReplaceScanning(false)
            setBlockingCardId(null)
            setTransactions([])
        }
    }, [open, customer, fetchNfcCards, fetchHistory])

    // ─── Link NFC Card ──────────────────────────────────────────
    const handleLinkRead = useCallback(async (uid: string) => {
        if (!customer) return
        setNfcScanning(false)
        setLinkProcessing(true)
        try {
            const res = await fetch(`/api/admin/customers/${customer.id}/nfc-cards/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nfcUid: uid }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('NFC card linked!', { description: `Card ${uid.slice(0, 5)}… linked to ${customer.full_name}` })
                setLinkMode(false)
                await fetchNfcCards()
            } else {
                toast.error(data.error || 'Failed to link card')
            }
        } catch {
            toast.error('Failed to link NFC card')
        } finally {
            setLinkProcessing(false)
        }
    }, [customer, fetchNfcCards])

    // ─── Replace NFC Card ───────────────────────────────────────
    const handleReplaceRead = useCallback(async (uid: string) => {
        if (!customer) return
        setReplaceScanning(false)
        try {
            const res = await fetch(`/api/admin/customers/${customer.id}/nfc-cards/replace`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newNfcUid: uid }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('NFC card replaced!', { description: `New card linked to ${customer.full_name}` })
                setReplaceMode(false)
                await fetchNfcCards()
            } else {
                toast.error(data.error || 'Failed to replace card')
            }
        } catch {
            toast.error('Failed to replace NFC card')
        }
    }, [customer, fetchNfcCards])

    // ─── Block NFC Card ─────────────────────────────────────────
    async function handleBlock(cardId: string) {
        if (!customer) return
        setBlockingCardId(cardId)
        try {
            const res = await fetch(`/api/admin/customers/${customer.id}/nfc-cards/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cardId }),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('NFC card blocked')
                await fetchNfcCards()
            } else {
                toast.error(data.error || 'Failed to block card')
            }
        } catch {
            toast.error('Failed to block card')
        } finally {
            setBlockingCardId(null)
        }
    }

    if (!customer) return null

    const firstVisitTransaction = transactions.length > 0 ? transactions[transactions.length - 1] : null;
    const firstVisitDate = firstVisitTransaction ? new Date(firstVisitTransaction.created_at) : null;

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
            <SheetContent side="right" className="w-full sm:max-w-md bg-background border-border overflow-y-auto p-0">
                <SheetHeader className="p-5 pb-0">
                    <SheetTitle className="text-foreground sr-only">Customer Profile</SheetTitle>
                </SheetHeader>

                <div className="px-5 pb-8 space-y-6">
                    {/* ─── Customer Header ────────────────────────────────────── */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-foreground font-bold text-xl shrink-0">
                            {(customer.full_name ?? customer.email ?? '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-foreground font-semibold text-lg truncate">
                                {customer.full_name ?? 'No name'}
                            </h2>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                                {customer.email && (
                                    <span className="flex items-center gap-1 truncate">
                                        <Mail className="w-3 h-3 shrink-0" />
                                        {customer.email}
                                    </span>
                                )}
                                {customer.phone && (
                                    <span className="flex items-center gap-1 truncate">
                                        <Phone className="w-3 h-3 shrink-0" />
                                        {customer.phone}
                                    </span>
                                )}
                            </div>
                        </div>
                        <a
                            href={`/c/${customer.public_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>

                    {/* ─── Loyalty Stats ──────────────────────────────────────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="text-center p-3 rounded-xl bg-muted/30 border border-border">
                            <div className="text-yellow-400 font-bold text-lg flex items-center justify-center gap-1">
                                {customer.available_stamps} <Star className="w-4 h-4" />
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">Stamps</div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-muted/30 border border-border">
                            <div className="text-foreground font-bold text-lg">{customer.total_visits}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">Visits</div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-muted/30 border border-border">
                            <div className="text-foreground font-bold text-lg flex items-center justify-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-sm">
                                    {firstVisitDate ? firstVisitDate.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) : 'Never'}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">First Visit</div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-muted/30 border border-border">
                            <div className="text-foreground font-bold text-lg flex items-center justify-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-sm">
                                    {customer.date_of_birth ? new Date(customer.date_of_birth).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Set DOB'}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">Birthday</div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-muted/30 border border-border sm:col-span-4">
                            <div className="text-foreground font-bold flex items-center justify-center gap-1">
                                <span className="text-sm">
                                    {new Date(customer.joined_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">Joined</div>
                        </div>
                    </div>

                    <Separator className="bg-border" />

                    {/* ─── Linked Cards Section ──────────────────────────────── */}
                    <div>
                        <h3 className="text-foreground font-semibold text-sm mb-3 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-primary" />
                            Linked Cards
                        </h3>

                        <div className="space-y-3">
                            {/* Digital Card (always present) */}
                            <Card className="bg-muted/20 border-border">
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <QrCode className="w-4 h-4 text-primary" />
                                            </div>
                                            <div>
                                                <div className="text-foreground text-sm font-medium">Digital Card</div>
                                                <div className="text-muted-foreground text-xs">
                                                    QR Code · Apple/Google Wallet
                                                </div>
                                            </div>
                                        </div>
                                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                                            Active
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* NFC Card */}
                            <Card className="bg-muted/20 border-border">
                                <CardContent className="p-3">
                                    {loadingCards ? (
                                        <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                                        </div>
                                    ) : activeCard ? (
                                        /* Active NFC card */
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-primary/10">
                                                        <Smartphone className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="text-foreground text-sm font-medium">NFC Card</div>
                                                        <div className="text-muted-foreground text-xs font-mono">
                                                            Card ID: {activeCard.nfc_uid.slice(0, 5)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                                                    Active
                                                </Badge>
                                            </div>

                                            {/* NFC Actions */}
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 border-border text-muted-foreground hover:text-foreground text-xs h-8"
                                                    onClick={() => { setReplaceMode(true); setLinkMode(false) }}
                                                >
                                                    <RefreshCw className="w-3 h-3 mr-1" /> Replace
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-8"
                                                    onClick={() => handleBlock(activeCard.id)}
                                                    disabled={blockingCardId === activeCard.id}
                                                >
                                                    {blockingCardId === activeCard.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                                    ) : (
                                                        <Ban className="w-3 h-3 mr-1" />
                                                    )}
                                                    Block
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        /* No active NFC card */
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-muted/50">
                                                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <div className="text-foreground text-sm font-medium">NFC Card</div>
                                                        <div className="text-muted-foreground text-xs">
                                                            {hasBlockedCards ? 'Card blocked' : 'Not linked'}
                                                        </div>
                                                    </div>
                                                </div>
                                                {hasBlockedCards ? (
                                                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">
                                                        Blocked
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                                                        None
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-border">
                                                {nfcSupported ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full border-primary/30 text-primary hover:bg-primary/10 text-xs h-8"
                                                        onClick={() => { setLinkMode(true); setReplaceMode(false) }}
                                                    >
                                                        <Link2 className="w-3 h-3 mr-1" /> Link NFC Card
                                                    </Button>
                                                ) : (
                                                    <div className="text-xs text-muted-foreground text-center py-1">
                                                        NFC not supported on this device. Use POS terminal to link cards.
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Blocked cards list (if any) */}
                            {nfcCards.filter(c => c.status === 'blocked').map(c => (
                                <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15 text-xs">
                                    <ShieldOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                    <span className="text-muted-foreground font-mono">{c.nfc_uid.slice(0, 5)}</span>
                                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px] ml-auto">
                                        Blocked
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ─── Activity History ──────────────────────────────────── */}
                    <div>
                        <h3 className="text-foreground font-semibold text-sm mb-3 flex items-center gap-2">
                            <History className="w-4 h-4 text-primary" />
                            Activity History
                        </h3>
                        <Card className="bg-muted/20 border-border">
                            <CardContent className="p-0 max-h-64 overflow-y-auto">
                                {loadingHistory ? (
                                    <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading history...
                                    </div>
                                ) : transactions.length === 0 ? (
                                    <div className="text-center p-6 text-muted-foreground text-sm">
                                        No activity history available.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border">
                                        {transactions.map(tx => {
                                            const isEarn = tx.type === 'earn_stamp' || tx.type === 'earn_points'
                                            const isRedeem = tx.type === 'redeem_reward'
                                            const isManual = tx.type === 'manual_adjust'
                                            const amount = tx.stamps_earned > 0 ? tx.stamps_earned : (tx.stamps_redeemed > 0 ? tx.stamps_redeemed : 0)
                                            
                                            return (
                                                <div key={tx.id} className="p-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                                                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                                        isEarn ? 'bg-green-500/10 text-green-500' :
                                                        isRedeem ? 'bg-orange-500/10 text-orange-500' :
                                                        'bg-blue-500/10 text-blue-500'
                                                    }`}>
                                                        {isEarn ? <ArrowDownLeft className="w-4 h-4" /> :
                                                         isRedeem ? <Gift className="w-4 h-4" /> :
                                                         <AlertCircle className="w-4 h-4" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-foreground text-sm font-medium">
                                                                {isEarn ? 'Earned Stamps' :
                                                                 isRedeem ? 'Redeemed Reward' :
                                                                 isManual ? 'Manual Adjustment' : 'Transaction'}
                                                            </span>
                                                            <span className={`text-sm font-bold ${isEarn ? 'text-green-500' : isRedeem ? 'text-orange-500' : 'text-blue-500'}`}>
                                                                {isEarn ? '+' : isRedeem ? '-' : ''}{amount}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                            <span>{new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(tx.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                                                            {tx.branch?.name && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="truncate">{tx.branch.name}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>


                    {/* ─── NFC Link Mode ──────────────────────────────────────── */}
                    {linkMode && (
                        <>
                            <Separator className="bg-border" />
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-foreground font-medium text-sm flex items-center gap-2">
                                        <Link2 className="w-4 h-4 text-primary" /> Link NFC Card
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-7 h-7 text-muted-foreground hover:text-foreground"
                                        onClick={() => { setLinkMode(false); setNfcScanning(false) }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Tap the NFC card on this device to link it to {customer.full_name}.
                                </p>
                                {linkProcessing ? (
                                    <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" /> Linking card…
                                    </div>
                                ) : (
                                    <NFCReader
                                        onRead={handleLinkRead}
                                        scanning={nfcScanning}
                                        onStartScan={() => setNfcScanning(true)}
                                        onStopScan={() => setNfcScanning(false)}
                                    />
                                )}
                            </div>
                        </>
                    )}

                    {/* ─── NFC Replace Mode ───────────────────────────────────── */}
                    {replaceMode && (
                        <>
                            <Separator className="bg-border" />
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-foreground font-medium text-sm flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4 text-primary" /> Replace NFC Card
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-7 h-7 text-muted-foreground hover:text-foreground"
                                        onClick={() => { setReplaceMode(false); setReplaceScanning(false) }}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                    The old card will be deactivated. Tap the new NFC card to link it.
                                </p>
                                <NFCReader
                                    onRead={handleReplaceRead}
                                    scanning={replaceScanning}
                                    onStartScan={() => setReplaceScanning(true)}
                                    onStopScan={() => setReplaceScanning(false)}
                                />
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
