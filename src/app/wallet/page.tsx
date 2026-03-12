'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, LogOut, QrCode, Gift, Star, ChevronRight, Plus, Stamp, Sparkles } from 'lucide-react'
import LoyaltyCard from '@/components/loyalty/LoyaltyCard'
import BonusRewardList from '@/components/loyalty/BonusRewardList'
import type { CardDesignConfig, StampDesignConfig } from '@/lib/types'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/theme-toggle'

const defaultCard: CardDesignConfig = {
    backgroundType: 'gradient', backgroundColor: '#1a1a2e',
    gradientFrom: '#16213e', gradientTo: '#0f3460', gradientAngle: 135,
    backgroundImageUrl: null, accentColor: '#e94560', textColor: '#ffffff',
    brandName: 'Loyalty', logoUrl: null, fontFamily: 'Inter',
    progressBarStyle: 'rounded', progressBarColor: '#e94560',
    cardBorderRadius: 20, layoutType: 'classic', heroImageUrl: null, codeType: 'qr', showBranchName: false, socialLinks: null,
}

const defaultStamp: StampDesignConfig = {
    iconType: 'star', iconUrl: null, filledColor: '#e94560',
    emptyColor: '#ffffff30', filledAnimation: 'bounce',
    emptyStyle: 'outline', size: 'medium', labelText: 'Stamps',
}

interface WalletCard {
    customer: {
        id: string; organization_id: string; full_name: string | null
        available_stamps: number; total_visits: number; total_redeemed: number; public_token: string; joined_at: string
    }
    organization: { id: string; name: string; logo_url: string | null } | null
    cardDesign: CardDesignConfig | null
    stampDesign: StampDesignConfig | null
    stampsRequired: number
    bonusRewards: any[]
}

export default function WalletPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [cards, setCards] = useState<WalletCard[]>([])
    const [userName, setUserName] = useState('')
    const [signingOut, setSigningOut] = useState(false)

    async function load() {
        const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null
        if (!user) { router.push('/wallet/login'); return }
        setUserName(user.user_metadata?.full_name ?? user.email ?? 'My Wallet')

        const res = await fetch('/api/customer/wallet')
        const json = await res.json()
        if (json.success) setCards(json.data)
        setLoading(false)
    }

    useEffect(() => {
        load()
    }, [])

    async function signOut() {
        setSigningOut(true)
        await supabase.auth.signOut({ scope: 'local' })
        router.push('/wallet/login')
    }

    const handleBonusClaimed = (customerId: string, bonusId: string, value: number, type: string) => {
        setCards(prev => prev.map(card => {
            if (card.customer.id === customerId) {
                return {
                    ...card,
                    customer: {
                        ...card.customer,
                        available_stamps: type === 'stamps' ? card.customer.available_stamps + value : card.customer.available_stamps
                    },
                    bonusRewards: card.bonusRewards.map(b => b.id === bonusId ? { ...b, claimed: true } : b)
                }
            }
            return card
        }))
    }

    const totalStamps = cards.reduce((s, c) => s + (c.customer.available_stamps ?? 0), 0)
    const totalRedeemed = cards.reduce((s, c) => s + (c.customer.total_redeemed ?? 0), 0)

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-muted-foreground text-sm">Loading your wallet…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="relative overflow-hidden px-4 pt-12 pb-10">
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(34 99% 47% / 0.4), transparent 70%)' }} />

                <div className="relative z-10 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                            {userName[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">Loyalty Pass</p>
                            <h1 className="text-2xl font-black text-foreground truncate max-w-[200px]">
                                {userName.split(' ')[0]}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            onClick={signOut}
                            disabled={signingOut}
                            className="p-2.5 rounded-xl bg-muted border border-border text-muted-foreground hover:text-destructive transition-all active:scale-90"
                        >
                            {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Summary stats */}
                {cards.length > 0 && (
                    <div className="relative z-10 flex gap-3 mt-8">
                        {[
                            { label: 'Active Cards', value: cards.length, color: 'text-foreground' },
                            { label: 'My Stamps', value: totalStamps, color: 'text-primary' },
                            { label: 'Redeemed', value: totalRedeemed, color: 'text-green-600 dark:text-green-400' },
                        ].map(s => (
                            <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex-1 shadow-sm">
                                <div className={`text-2xl font-black ${s.color} leading-none mb-1`}>{s.value}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-tighter font-bold">{s.label}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Cards list */}
            <div className="px-4 space-y-10">
                {cards.length === 0 ? (
                    <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
                        <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4 border border-border">
                            <QrCode className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h2 className="text-foreground font-bold text-lg">No cards yet</h2>
                        <p className="text-muted-foreground text-xs max-w-[200px] mx-auto mt-1">
                            Scan a merchant's QR code at their shop to start earning stamps!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {cards.map(({ customer, organization, cardDesign, stampDesign, stampsRequired, bonusRewards }) => {
                            if (!organization) return null
                            const cardConfig = {
                                ...defaultCard,
                                ...(cardDesign ?? {}),
                                brandName: organization.name,
                                logoUrl: cardDesign?.logoUrl ?? organization.logo_url ?? null,
                            }
                            const stampConfig = { ...defaultStamp, ...(stampDesign ?? {}) }
                            const canRedeem = customer.available_stamps >= stampsRequired
                            const nextReward = bonusRewards?.find(r => !r.claimed) || { name: 'Free Item' }
                            const nextRewardName = nextReward?.name

                            return (
                                <div key={customer.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            {organization.logo_url && (
                                                <img src={organization.logo_url} className="w-5 h-5 rounded-md object-cover" />
                                            )}
                                            <h3 className="text-sm font-black text-foreground tracking-tight italic uppercase">
                                                {organization.name}
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => router.push(`/c/${customer.public_token}`)}
                                            className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-widest hover:translate-x-1 transition-transform"
                                        >
                                            View Details <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Card */}
                                    <div
                                        className="relative group cursor-pointer active:scale-[0.99] transition-all"
                                        onClick={() => router.push(`/c/${customer.public_token}`)}
                                    >
                                        <LoyaltyCard
                                            config={cardConfig}
                                            customerName={customer.full_name ?? 'Loyal Guest'}
                                            availableStamps={customer.available_stamps}
                                            stampsRequired={stampsRequired}
                                            stampConfig={stampConfig}
                                            publicToken={customer.public_token}
                                            nextRewardName={nextRewardName}
                                        />

                                        {/* Status floating badge */}
                                        <div className="absolute top-4 right-4 z-20">
                                            {canRedeem ? (
                                                <div className="bg-green-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-2xl animate-bounce flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" /> REWARD READY
                                                </div>
                                            ) : (
                                                <div className="bg-card/80 backdrop-blur-md text-muted-foreground text-[9px] font-black px-2.5 py-1 rounded-full border border-border italic">
                                                    {stampsRequired - customer.available_stamps} MORE TO GO
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bonus Opportunities */}
                                    {bonusRewards && bonusRewards.length > 0 && (
                                        <BonusRewardList
                                            bonuses={bonusRewards}
                                            publicToken={customer.public_token}
                                            onClaimed={(bid, val, typ) => handleBonusClaimed(customer.id, bid, val, typ)}
                                        />
                                    )}

                                    {/* Mini footer stats */}
                                    <div className="mt-4 flex items-center gap-4 px-2">
                                        <div className="flex items-center gap-1.5 opacity-50">
                                            <Stamp className="w-3 h-3 text-foreground" />
                                            <span className="text-[10px] font-bold text-foreground uppercase tracking-tighter">
                                                {customer.available_stamps} Stamps
                                            </span>
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-border" />
                                        <div className="flex items-center gap-1.5 opacity-50">
                                            <Gift className="w-3 h-3 text-foreground" />
                                            <span className="text-[10px] font-bold text-foreground uppercase tracking-tighter">
                                                {customer.total_redeemed} Redeemed
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Add Card Hint */}
                        <div className="p-8 rounded-[32px] bg-card border border-border flex flex-col items-center text-center shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                <Plus className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-foreground font-bold mb-1">Add Another Card?</h3>
                            <p className="text-xs text-muted-foreground mb-4">Scan the QR code at any participating shop to add them to your wallet.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
