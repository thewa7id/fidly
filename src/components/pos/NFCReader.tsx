'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Smartphone, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NFCReaderProps {
    onRead: (serialNumber: string) => void
    onError?: (error: string) => void
    scanning: boolean
    onStartScan: () => void
    onStopScan: () => void
}

export function useNFCSupport() {
    const [supported, setSupported] = useState(false)

    useEffect(() => {
        setSupported(typeof window !== 'undefined' && 'NDEFReader' in window)
    }, [])

    return supported
}

export default function NFCReader({ onRead, onError, scanning, onStartScan, onStopScan }: NFCReaderProps) {
    const [status, setStatus] = useState<'idle' | 'waiting' | 'reading' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const readerRef = useRef<any>(null)
    const abortRef = useRef<AbortController | null>(null)

    const startReading = useCallback(async () => {
        if (!('NDEFReader' in window)) {
            setStatus('error')
            setErrorMsg('NFC not supported on this device')
            onError?.('NFC not supported')
            return
        }

        try {
            setStatus('waiting')
            setErrorMsg('')

            const NDEFReader = (window as any).NDEFReader
            const reader = new NDEFReader()
            readerRef.current = reader

            const controller = new AbortController()
            abortRef.current = controller

            await reader.scan({ signal: controller.signal })

            reader.addEventListener('reading', ({ serialNumber }: any) => {
                if (serialNumber) {
                    const uid = serialNumber.replace(/:/g, '').toUpperCase()
                    setStatus('success')
                    onRead(uid)

                    // Reset to waiting after brief success feedback
                    setTimeout(() => {
                        setStatus('waiting')
                    }, 1500)
                }
            }, { signal: controller.signal })

            reader.addEventListener('readingerror', () => {
                setStatus('error')
                setErrorMsg('Could not read NFC card. Try again.')
                onError?.('Read error')
                setTimeout(() => setStatus('waiting'), 2000)
            }, { signal: controller.signal })

        } catch (err: any) {
            setStatus('error')
            if (err.name === 'NotAllowedError') {
                setErrorMsg('NFC permission denied. Please allow NFC access.')
            } else if (err.name === 'NotSupportedError') {
                setErrorMsg('NFC not supported on this device.')
            } else {
                setErrorMsg(err.message || 'NFC error')
            }
            onError?.(errorMsg)
        }
    }, [onRead, onError])

    const stopReading = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort()
            abortRef.current = null
        }
        readerRef.current = null
        setStatus('idle')
    }, [])

    useEffect(() => {
        if (scanning) {
            startReading()
        } else {
            stopReading()
        }

        return () => stopReading()
    }, [scanning])

    if (!scanning) {
        return (
            <button
                onClick={onStartScan}
                className="w-full h-56 rounded-2xl border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground"
            >
                <Smartphone className="w-16 h-16" />
                <span className="font-medium">Tap to Enable NFC</span>
            </button>
        )
    }

    return (
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
            <div className="flex flex-col items-center justify-center py-12 px-6">
                {status === 'waiting' && (
                    <>
                        {/* Animated NFC pulse */}
                        <div className="relative mb-6">
                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                                <Smartphone className="w-10 h-10 text-primary" />
                            </div>
                            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                            <div className="absolute -inset-3 rounded-full border-2 border-primary/20 animate-pulse" />
                        </div>
                        <p className="text-foreground font-semibold text-lg">Ready for NFC</p>
                        <p className="text-muted-foreground text-sm mt-1">Hold the card near the device</p>
                    </>
                )}

                {status === 'reading' && (
                    <>
                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                        <p className="text-foreground font-medium">Reading card…</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                            <Smartphone className="w-10 h-10 text-green-400" />
                        </div>
                        <p className="text-green-400 font-semibold text-lg">Card Read!</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                            <WifiOff className="w-10 h-10 text-red-400" />
                        </div>
                        <p className="text-red-400 font-semibold">{errorMsg}</p>
                    </>
                )}
            </div>

            <div className="px-6 pb-6">
                <Button
                    onClick={() => { onStopScan(); stopReading() }}
                    variant="outline"
                    className="w-full border-white/20 text-muted-foreground hover:text-foreground"
                >
                    Stop NFC Scanning
                </Button>
            </div>
        </div>
    )
}
