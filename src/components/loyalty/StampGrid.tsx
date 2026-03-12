'use client'

import type { StampDesignConfig } from '@/lib/types'

interface StampGridProps {
    stampsRequired: number
    availableStamps: number
    config: StampDesignConfig
    animated?: boolean
}

const stampIcons: Record<string, (props: { size: number; color: string; filled: boolean }) => React.ReactNode> = {
    star: ({ size, color, filled }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    ),
    heart: ({ size, color, filled }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    ),
    circle: ({ size, color, filled }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
        </svg>
    ),
    crown: ({ size, color, filled }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5">
            <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
            <path d="M4 20h16" />
        </svg>
    ),
    diamond: ({ size, color, filled }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5">
            <polygon points="12 2 22 9 17 21 7 21 2 9 12 2" />
        </svg>
    ),
    coffee: ({ size, color, filled }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="1.5">
            <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
            <line x1="6" y1="2" x2="6" y2="4" />
            <line x1="10" y1="2" x2="10" y2="4" />
            <line x1="14" y1="2" x2="14" y2="4" />
        </svg>
    ),
}

const stampSizes: Record<string, number> = { small: 18, medium: 24, large: 30 }

export default function StampGrid({ stampsRequired, availableStamps, config, animated }: StampGridProps) {
    const iconSize = stampSizes[config.size] ?? 24
    const IconComponent = stampIcons[config.iconType] ?? stampIcons.star
    const useCustomImage = config.iconType === 'custom' && !!config.iconUrl

    const cols = stampsRequired <= 5 ? stampsRequired : stampsRequired <= 10 ? 5 : 6

    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: config.size === 'large' ? 8 : 6 }}>
            {Array.from({ length: stampsRequired }).map((_, i) => {
                const filled = i < availableStamps
                const animClass = filled && animated
                    ? config.filledAnimation === 'bounce' ? 'stamp-bounce'
                        : config.filledAnimation === 'pulse' ? 'stamp-pulse'
                            : config.filledAnimation === 'scale' ? 'stamp-scale' : ''
                    : ''

                return (
                    <div
                        key={i}
                        className={animClass}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: filled ? 1 : 0.3,
                            transition: 'opacity 0.3s ease',
                            filter: filled && !useCustomImage ? `drop-shadow(0 0 4px ${config.filledColor}66)` : 'none',
                        }}
                    >
                        {useCustomImage ? (
                            // Custom logo inside a circle stamp
                            <div
                                style={{
                                    width: iconSize + 8,
                                    height: iconSize + 8,
                                    borderRadius: '50%',
                                    border: `1.5px solid ${filled ? config.filledColor : config.emptyColor}`,
                                    background: filled ? config.filledColor + '22' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    transition: 'background 0.3s ease, border-color 0.3s ease',
                                }}
                            >
                                <img
                                    src={config.iconUrl!}
                                    alt="stamp"
                                    style={{
                                        width: iconSize - 4,
                                        height: iconSize - 4,
                                        objectFit: 'contain',
                                        filter: filled ? 'none' : 'grayscale(1) brightness(0.35)',
                                        transition: 'filter 0.3s ease',
                                        borderRadius: 2,
                                    }}
                                />
                            </div>
                        ) : (
                            <IconComponent
                                size={iconSize}
                                color={filled ? config.filledColor : config.emptyColor}
                                filled={filled}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
