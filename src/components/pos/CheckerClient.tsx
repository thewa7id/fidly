'use client'

import { useState, useCallback } from 'react'
import {
    QrCode, Smartphone, Search, LogOut, Loader2, LayoutDashboard, ChevronRight, X, User, Star, CalendarDays, KeyRound, ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useNFCSupport } from '@/components/pos/NFCReader'
import { format } from 'date-fns'

const QRScanner = dynamic(() => import('@/components/pos/QRScanner'), {
    ssr: false,
    loading: () => (
        <div className="h-64 flex items-center justify-center bg-muted/50 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    ),
})

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
}

export default function CheckerClient({ initialProfile }: Props) {
    const supabase = createClient()
    const router = useRouter()
    const nfcSupported = useNFCSupport()

    const [scanning, setScanning] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [lastResult, setLastResult] = useState<any>(null)
    const [manualToken, setManualToken] = useState('')

    // Input mode: 'qr' or 'nfc'
    const [inputMode, setInputMode] = useState<'qr' | 'nfc'>('qr')
    const [nfcScanning, setNfcScanning] = useState(false)

    async function handleLogout() {
        await supabase.auth.signOut({ scope: 'local' })
        router.push('/login')
    }

    const handleNFCRead = useCallback(async (uid: string) => {
        if (!uid || processing) return
        setNfcScanning(false)
        await checkBalance({ nfcUid: uid })
    }, [processing])

    const handleQRScanned = useCallback(async (rawToken: string) => {
        if (!rawToken || processing) return
        setScanning(false)

        let token = rawToken.trim()
        if (token.includes('/c/')) token = token.split('/c/').pop()?.split('?')[0]?.trim() ?? token
        if (token.startsWith('c/')) token = token.slice(2)

        setManualToken(token)
        await checkBalance({ customerToken: token })
    }, [processing])

    async function checkBalance(payload: { nfcUid?: string, customerToken?: string }) {
        setProcessing(true)
        setLastResult(null)
        
        try {
            const res = await fetch('/api/pos/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            
            const data = await res.json()
            setProcessing(false)

            if (!data.success) {
                toast.error(data.error ?? 'Customer not found')
                return
            }

            setLastResult(data.data)
            toast.success('Customer loaded successfully')
            setManualToken('')
        } catch (err) {
            setProcessing(false)
            toast.error('Failed to look up customer')
        }
    }

    const InputModeToggle = nfcSupported ? (
        <div className="flex items-center bg-muted/50 rounded-lg p-0.5 mb-4 max-w-sm mx-auto w-full">
            <button
                onClick={() => { setInputMode('qr'); setNfcScanning(false); setLastResult(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${inputMode === 'qr'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
            >
                <QrCode className="w-3.5 h-3.5" />
                QR Code
            </button>
            <button
                onClick={() => { setInputMode('nfc'); setScanning(false); setLastResult(null); }}
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
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 glass border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                        <Star className="w-4 h-4 text-foreground" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-foreground">Balance Checker</div>
                        <div className="text-xs text-muted-foreground">{initialProfile?.organizations?.name ?? 'Goyalty'}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/pos">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1.5 h-8">
                            <ArrowLeft className="w-4 h-4" />
                            <span className="hidden sm:inline">Register</span>
                        </Button>
                    </Link>
                    {initialProfile?.role !== 'employee' && (
                        <Link href="/admin">
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                                <LayoutDashboard className="w-4 h-4" />
                            </Button>
                        </Link>
                    )}
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-red-400 h-8 w-8">
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col pt-8">
                
                <div className="text-center mb-8">
                    <h2 className="text-foreground font-semibold text-2xl mb-2">
                        {inputMode === 'nfc' ? 'Read NFC Card' : 'Scan Customer QR'}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {inputMode === 'nfc'
                            ? 'Hold the customer\'s NFC card near the device to view balance'
                            : 'Point the camera at the customer\'s loyalty card to view balance'}
                    </p>
                </div>

                {InputModeToggle}

                {!lastResult ? (
                    <div className="w-full">
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
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground my-4">
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
                                        disabled={processing}
                                    />
                                    <Button
                                        onClick={() => manualToken && handleQRScanned(manualToken)}
                                        disabled={!manualToken || processing}
                                        className="gradient-primary border-0 text-foreground shrink-0"
                                    >
                                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
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
                    </div>
                ) : (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-primary/30 bg-primary/5 shadow-xl shadow-primary/5">
                            <CardContent className="pt-6 pb-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-foreground font-bold text-lg">
                                            {lastResult.customer.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-foreground font-semibold text-xl">{lastResult.customer.full_name}</h3>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                <KeyRound className="w-3 h-3" />
                                                <span>{lastResult.customer.public_token}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setLastResult(null)} className="text-muted-foreground hover:text-foreground -mt-2 -mr-2">
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-background/60 backdrop-blur border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                        <Star className="w-6 h-6 text-primary mb-2" />
                                        <div className="text-2xl font-bold text-foreground">{lastResult.customer.available_stamps}</div>
                                        <div className="text-xs font-medium text-muted-foreground">Available Stamps</div>
                                        {lastResult.program?.type === 'stamps' && (
                                            <div className="text-[10px] text-muted-foreground/70 mt-1">
                                                out of {lastResult.program.stamps_required}
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-background/60 backdrop-blur border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                        <Star className="w-6 h-6 text-primary mb-2 opacity-50" />
                                        <div className="text-2xl font-bold text-foreground">{lastResult.customer.available_points}</div>
                                        <div className="text-xs font-medium text-muted-foreground">Available Points</div>
                                    </div>
                                    <div className="bg-background/60 backdrop-blur border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center col-span-2">
                                        <div className="text-lg font-semibold text-foreground">{lastResult.customer.total_stamps}</div>
                                        <div className="text-xs font-medium text-muted-foreground">Lifetime Stamps Earned</div>
                                    </div>
                                </div>

                                <div className="border-t border-border/50 pt-4 flex justify-between items-center text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-4 h-4" />
                                        <span>Total Visits: <span className="text-foreground font-medium">{lastResult.customer.total_visits}</span></span>
                                    </div>
                                    {lastResult.customer.last_visit_at && (
                                        <div className="flex items-center gap-1.5">
                                            <CalendarDays className="w-4 h-4" />
                                            <span>Last: {format(new Date(lastResult.customer.last_visit_at), 'MMM d, yyyy')}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Button 
                            className="w-full mt-4 h-12 rounded-xl" 
                            variant="secondary"
                            onClick={() => setLastResult(null)}
                        >
                            Scan Another Customer
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
