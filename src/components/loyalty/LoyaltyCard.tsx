'use client'

import type { CardDesignConfig, StampDesignConfig } from '@/lib/types'
import StampGrid from '@/components/loyalty/StampGrid'
import { QRCodeSVG } from 'qrcode.react'
import PDF417Barcode from '@/components/loyalty/PDF417Barcode'
import { useEffect, useRef } from 'react'

interface LoyaltyCardProps {
    config: CardDesignConfig
    customerName: string
    availableStamps?: number
    availablePoints?: number
    stampsRequired?: number
    pointsRequired?: number
    stampConfig: StampDesignConfig
    branchName?: string
    publicToken?: string
    isPoints?: boolean
    nextRewardName?: string
}

const fontFamilies: Record<string, string> = {
    'Inter': "'Inter', sans-serif",
    'Poppins': "'Poppins', sans-serif",
    'Roboto': "'Roboto', sans-serif",
    'Montserrat': "'Montserrat', sans-serif",
    'Playfair Display': "'Playfair Display', serif",
    'Space Grotesk': "'Space Grotesk', monospace",
}

function SocialIcon({ type }: { type: string }) {
    const size = 13
    if (type === 'instagram') return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
    )
    if (type === 'twitter') return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    )
    if (type === 'facebook') return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    )
    if (type === 'tiktok') return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.26 8.26 0 0 0 4.83 1.56V6.79a4.85 4.85 0 0 1-1.06-.1z" />
        </svg>
    )
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )
}

export default function LoyaltyCard({
    config, customerName, availableStamps = 0, stampsRequired = 10, stampConfig, branchName, publicToken, isPoints = false, availablePoints = 0, pointsRequired = 100, nextRewardName,
}: LoyaltyCardProps) {
    const layout = config.layoutType ?? 'classic'
    const codeType = config.codeType ?? 'qr'

    let background: string
    if (config.backgroundType === 'gradient') {
        background = `linear-gradient(${config.gradientAngle}deg, ${config.gradientFrom}, ${config.gradientTo})`
    } else if (config.backgroundType === 'image' && config.backgroundImageUrl) {
        background = config.backgroundColor || '#1a1a2e'
    } else {
        background = config.backgroundColor
    }

    const progress = stampsRequired > 0 ? Math.min((availableStamps / stampsRequired) * 100, 100) : 0
    const borderRadius = { rounded: '8px', square: '2px', pill: '100px' }[config.progressBarStyle]

    const socials = config.socialLinks
        ? Object.entries(config.socialLinks).filter(([, v]) => v && v.trim())
        : []

    if (layout === 'modern') {
        return (
            <div
                className="loyalty-card w-full max-w-[340px] shadow-2xl transition-all hover:scale-[1.01]"
                style={{
                    background,
                    borderRadius: config.cardBorderRadius,
                    fontFamily: fontFamilies[config.fontFamily] ?? 'sans-serif',
                    color: config.textColor,
                    minHeight: '480px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header: Logo + Points */}
                <div className="p-5 flex items-center justify-between">
                    {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="h-9 object-contain" />
                    ) : (
                        <div className="text-xl font-black uppercase tracking-tighter">{config.brandName}</div>
                    )}
                    <div className="text-right">
                        <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest leading-none">{isPoints ? 'Points' : stampConfig.labelText}</div>
                        <div className="text-2xl font-black leading-none">{isPoints ? availablePoints : availableStamps}</div>
                    </div>
                </div>

                {/* Hero Image */}
                <div className="px-5">
                    <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-inner relative group bg-black/20">
                        {config.heroImageUrl ? (
                            <img src={config.heroImageUrl} className="w-full h-full object-cover" alt="Card Preview" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs opacity-20 italic">Hero Image</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                    </div>
                </div>

                {/* Level Info */}
                <div className="p-5 space-y-4 flex-1">
                    <div className="flex items-center justify-between border-b border-current/10 pb-4">
                        <div className="space-y-1">
                            <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest leading-none text-current">Next Reward</div>
                            <div className="text-xs font-bold leading-none truncate max-w-[180px]">{nextRewardName ?? 'Collect more to unlock!'}</div>
                        </div>
                        <div className="text-right space-y-1">
                            <div className="text-[10px] opacity-60 font-bold uppercase tracking-widest leading-none">Remaining</div>
                            <div className="text-xs font-bold leading-none">{isPoints ? Math.max(0, pointsRequired - availablePoints) : Math.max(0, stampsRequired - availableStamps)}</div>
                        </div>
                    </div>

                    {/* Barcode/QR Section */}
                    <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-3 shadow-lg my-2">
                        {codeType === 'barcode' ? (
                            <div className="w-full flex justify-center py-2">
                                <PDF417Barcode
                                    value={publicToken ?? 'INACTIVE'}
                                    aspectRatio={3}
                                />
                            </div>
                        ) : (
                            <QRCodeSVG
                                value={publicToken ? `https://goyalty.com/c/${publicToken}` : 'INACTIVE'}
                                size={100}
                                level="H"
                                marginSize={1}
                            />
                        )}
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {!publicToken ? '' : 'Scan for rewards'}
                        </div>
                    </div>
                </div>

                {/* Footer / Socials */}
                <div className="px-5 pb-5 pt-2 flex items-center justify-between">
                    <div className="text-[10px] opacity-50 font-medium">Valid at: {branchName ?? 'All locations'}</div>
                    <div className="flex gap-3 mt-1">
                        {socials.map(([type, url]) => (
                            <a key={type} href={url as string} target="_blank" rel="noopener noreferrer" className="opacity-60 hover:opacity-100">
                                <SocialIcon type={type} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className="loyalty-card w-full max-w-sm"
            style={{
                background,
                borderRadius: config.cardBorderRadius,
                fontFamily: fontFamilies[config.fontFamily] ?? 'sans-serif',
                color: config.textColor,
                padding: '22px',
                minHeight: '200px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background image overlay */}
            {config.backgroundType === 'image' && config.backgroundImageUrl && (
                <>
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: `url(${config.backgroundImageUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: 0,
                    }} />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.7) 100%)',
                        zIndex: 1,
                    }} />
                </>
            )}

            <div style={{ position: 'relative', zIndex: 2 }}>
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>
                            {config.brandName}
                        </div>
                        {config.showBranchName && branchName && (
                            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{branchName}</div>
                        )}
                    </div>
                    {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: config.accentColor + '30',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, fontWeight: 800,
                        }}>
                            {config.brandName?.[0] ?? 'L'}
                        </div>
                    )}
                </div>

                <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2, letterSpacing: '0.08em' }}>LOYALTY CARD</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 14 }}>{customerName}</div>

                <StampGrid
                    stampsRequired={stampsRequired}
                    availableStamps={availableStamps}
                    config={stampConfig}
                />

                <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.6, marginBottom: 5 }}>
                        <span>{availableStamps} of {stampsRequired} {stampConfig.labelText.toLowerCase()}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.15)', borderRadius, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', width: `${progress}%`,
                            background: config.progressBarColor, borderRadius,
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                </div>

                {socials.length > 0 && (
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, opacity: 0.75 }}>
                        {socials.map(([type, url]) => (
                            <a key={type} href={url as string} target="_blank" rel="noopener noreferrer" style={{ color: config.textColor, display: 'flex', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                <SocialIcon type={type} />
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
