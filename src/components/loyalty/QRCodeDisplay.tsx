'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Check } from 'lucide-react'

import PDF417Barcode from './PDF417Barcode'

interface QRCodeDisplayProps {
    token: string
    size?: number
    type?: 'qr' | 'barcode'
}

export default function QRCodeDisplay({ token, size = 180, type = 'qr' }: QRCodeDisplayProps) {
    const [copied, setCopied] = useState(false)

    const url = typeof window !== 'undefined'
        ? `${window.location.origin}/c/${token}`
        : `/c/${token}`

    // Short code = first 8 chars of the hex token, formatted as "XXXX XXXX" for readability
    const shortCode = token.slice(0, 8).toUpperCase()
    const shortCodeDisplay = shortCode.slice(0, 4) + ' ' + shortCode.slice(4)

    async function copyShortCode() {
        await navigator.clipboard.writeText(shortCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex flex-col items-center gap-3">
            {/* Code */}
            <div className="p-4 bg-white rounded-2xl shadow-lg ring-1 ring-white/10 flex items-center justify-center min-w-[210px] min-h-[140px]">
                {type === 'barcode' ? (
                    <PDF417Barcode value={token} aspectRatio={2} />
                ) : (
                    <QRCodeSVG
                        value={url}
                        size={size}
                        bgColor="#ffffff"
                        fgColor="#0f0f1a"
                        level="H"
                        includeMargin={false}
                    />
                )}
            </div>

            {/* Short code */}
            <button
                onClick={copyShortCode}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
                title="Tap to copy code"
            >
                <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">Short Code</p>
                    <p className="text-white font-mono font-bold text-lg tracking-[0.2em] leading-none">{shortCodeDisplay}</p>
                </div>
                <div className="ml-2 p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                    {copied
                        ? <Check className="w-3.5 h-3.5 text-green-400" />
                        : <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    }
                </div>
            </button>

            <p className="text-xs text-muted-foreground text-center">
                Show the {type === 'barcode' ? 'barcode' : 'QR code'} or give the short code to the cashier
            </p>
        </div>
    )
}
