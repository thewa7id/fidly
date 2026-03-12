'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QRScannerProps {
    onScan: (token: string) => void
    onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const scannerRef = useRef<any>(null)

    useEffect(() => {
        let isMounted = true

        async function initScanner() {
            try {
                // Import supported formats enum
                const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode')

                if (!containerRef.current || !isMounted) return

                const scannerId = 'qr-scanner-container'
                const scannerEl = document.getElementById(scannerId)
                if (!scannerEl) return

                const scanner = new Html5Qrcode(scannerId, {
                    verbose: false,
                    formatsToSupport: [
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.AZTEC,
                        Html5QrcodeSupportedFormats.CODABAR,
                        Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.CODE_93,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.DATA_MATRIX,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.ITF,
                        Html5QrcodeSupportedFormats.PDF_417,
                        Html5QrcodeSupportedFormats.UPC_A,
                        Html5QrcodeSupportedFormats.UPC_E,
                    ]
                })
                scannerRef.current = scanner

                await scanner.start(
                    { facingMode: 'environment' },
                    { 
                        fps: 10, 
                        qrbox: { width: 250, height: 250 }
                    },
                    (decodedText: string) => {
                        // Extract token from URL — handles both:
                        //   Full URL:  "https://domain.com/c/TOKEN"
                        //   Path only: "/c/TOKEN"  (common when scanning on mobile)
                        let token = decodedText.trim()
                        try {
                            // Try parsing as full URL first
                            const url = new URL(token)
                            const pathParts = url.pathname.split('/').filter(Boolean)
                            const cIdx = pathParts.indexOf('c')
                            token = cIdx >= 0 ? (pathParts[cIdx + 1] ?? token) : (pathParts[pathParts.length - 1] ?? token)
                        } catch {
                            // Not a full URL — try stripping /c/ prefix from path
                            if (token.includes('/c/')) {
                                token = token.split('/c/').pop()?.split('?')[0]?.trim() ?? token
                            }
                        }
                        onScan(token)
                    },
                    undefined
                )
            } catch (err) {
                console.error('[QRScanner] Error:', err)
            }
        }

        initScanner()

        return () => {
            isMounted = false
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { })
            }
        }
    }, [onScan])

    return (
        <div className="relative rounded-2xl overflow-hidden bg-black">
            <div id="qr-scanner-container" className="w-full min-h-64" ref={containerRef} />
            <Button
                onClick={onClose}
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 bg-black/50 text-white hover:bg-black/70 z-10"
            >
                <X className="w-5 h-5" />
            </Button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-black/50 px-3 py-1 rounded-full">
                Point at customer QR code
            </div>
        </div>
    )
}
