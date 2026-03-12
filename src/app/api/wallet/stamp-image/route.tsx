import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'edge'

const defaultStampConfig = {
    iconType: 'star',
    filledColor: '#e94560',
    emptyColor: '#ffffff30',
    size: 'medium',
}

// SVG path data for each icon type
const iconPaths: Record<string, string> = {
    star: 'M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    circle: '', // uses <circle> element
    crown: 'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z',
    diamond: 'M12 2 L22 9 L17 21 L7 21 L2 9 Z',
    coffee: 'M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z',
}

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
        return new Response('Missing token', { status: 400 })
    }

    const svc = createServiceClient()

    // Fetch customer
    const { data: customer } = await svc
        .from('customers')
        .select('id, organization_id, available_stamps')
        .eq('public_token', token)
        .single()

    if (!customer) {
        return new Response('Customer not found', { status: 404 })
    }

    // Fetch active program
    const { data: program } = await svc
        .from('loyalty_programs')
        .select('id, type, stamps_required')
        .eq('organization_id', customer.organization_id)
        .eq('is_active', true)
        .limit(1)
        .single()

    if (!program || program.type !== 'stamps') {
        return new Response('No stamps program', { status: 404 })
    }

    // Fetch stamp design
    const { data: stampDesign } = await svc
        .from('stamp_designs')
        .select('config')
        .eq('organization_id', customer.organization_id)
        .single()

    // Fetch card design
    const { data: cardDesignRow } = await svc
        .from('card_designs')
        .select('config')
        .eq('organization_id', customer.organization_id)
        .single()

    const config = { ...defaultStampConfig, ...(stampDesign?.config || {}) }
    const cardDesign = cardDesignRow?.config || {}

    const stampsRequired = program.stamps_required ?? 10
    const availableStamps = customer.available_stamps ?? 0
    const cols = stampsRequired <= 5 ? stampsRequired : stampsRequired <= 10 ? 5 : 6
    const iconSize = 40
    const gap = 16

    const emptyColorForImage = config.emptyColor || 'rgba(255, 255, 255, 0.3)'

    const imgWidth = 600
    const rows = Math.ceil(stampsRequired / cols)
    const imgHeight = rows * (iconSize + gap) + gap + 40

    const stamps = Array.from({ length: stampsRequired }, (_, i) => i < availableStamps)

    return new ImageResponse(
        (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    backgroundColor: cardDesign.backgroundColor || '#1a1a2e',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background Image handling for Satori */}
                {cardDesign.backgroundType === 'image' && cardDesign.backgroundImageUrl && (
                    <img 
                        src={cardDesign.backgroundImageUrl}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                )}
                
                {/* Gradient Background handling */}
                {cardDesign.backgroundType === 'gradient' && (
                    <div 
                        style={{ 
                            position: 'absolute', 
                            top: 0, left: 0, width: '100%', height: '100%', 
                            backgroundImage: `linear-gradient(${cardDesign.gradientAngle || 135}deg, ${cardDesign.gradientFrom || '#16213e'}, ${cardDesign.gradientTo || '#0f3460'})` 
                        }} 
                    />
                )}

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: `${gap}px`,
                        padding: `${gap}px`,
                    }}
                >
                    {stamps.map((filled, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: `${iconSize}px`,
                                height: `${iconSize}px`,
                            }}
                        >
                            {config.iconType === 'circle' ? (
                                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
                                    <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        fill={filled ? config.filledColor : 'none'}
                                        stroke={filled ? config.filledColor : emptyColorForImage}
                                        strokeWidth="1.5"
                                    />
                                </svg>
                            ) : (
                                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
                                    <path
                                        d={iconPaths[config.iconType] || iconPaths.star}
                                        fill={filled ? config.filledColor : 'none'}
                                        stroke={filled ? config.filledColor : emptyColorForImage}
                                        strokeWidth="1.5"
                                    />
                                </svg>
                            )}
                        </div>
                    ))}
                </div>
                <div
                    style={{
                        display: 'flex',
                        marginTop: '10px',
                        fontSize: '16px',
                        color: cardDesign.textColor || '#ffffff',
                        fontWeight: 700,
                    }}
                >
                    {availableStamps} / {stampsRequired} stamps
                </div>
            </div>
        ),
        {
            width: imgWidth,
            height: imgHeight,
        }
    )
}
