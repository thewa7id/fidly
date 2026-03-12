'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, ChevronDown, ChevronUp, Star, Gift, Clock, CheckCircle, Stamp, TrendingUp, RotateCcw, CreditCard, QrCode, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import LoyaltyCard from './LoyaltyCard'
import QRCodeDisplay from '@/components/loyalty/QRCodeDisplay'
import BonusRewardList from './BonusRewardList'
import GoogleWalletButton from './GoogleWalletButton'
import AppleWalletButton from './AppleWalletButton'
import { requestNotificationPermission } from '@/lib/firebase/client'
import { toast } from 'sonner'
import type { CardDesignConfig, StampDesignConfig } from '@/lib/types'

interface CustomerCardProps {
    data: {
        customer: any
        organization: { name: string; logoUrl: string | null }
        cardDesign: CardDesignConfig | null
        stampDesign: StampDesignConfig | null
        program: any
        rewards: any[]
        transactions: any[]
        bonusRewards?: any[]
        googleWalletEnabled?: boolean
        appleWalletEnabled?: boolean
        nfcCard?: { nfc_uid: string; linked_at: string | null } | null
    }
    publicToken: string
}

const defaultCard: CardDesignConfig = {
    backgroundType: 'gradient',
    backgroundColor: '#1a1a2e',
    gradientFrom: '#16213e',
    gradientTo: '#0f3460',
    gradientAngle: 135,
    backgroundImageUrl: null,
    accentColor: '#e94560',
    textColor: '#ffffff',
    brandName: 'Loyalty',
    logoUrl: null,
    fontFamily: 'Inter',
    progressBarStyle: 'rounded',
    progressBarColor: '#e94560',
    cardBorderRadius: 20,
    layoutType: 'classic',
    heroImageUrl: null,
    codeType: 'qr',
    showBranchName: false,
    socialLinks: null,
}

const defaultStamp: StampDesignConfig = {
    iconType: 'star',
    iconUrl: null,
    filledColor: '#e94560',
    emptyColor: '#ffffff30',
    filledAnimation: 'bounce',
    emptyStyle: 'outline',
    size: 'medium',
    labelText: 'Stamps',
}

// Format date/time in a friendly way
function formatDateTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: diffDays > 365 ? 'numeric' : undefined })
}

function formatExactDateTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) +
        ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

// Transaction type config
const txConfig: Record<string, { label: string; icon: typeof Star; color: string; bg: string }> = {
    earn_stamp: {
        label: 'Stamp Earned',
        icon: Stamp,
        color: 'text-primary',
        bg: 'bg-primary/10',
    },
    earn_points: {
        label: 'Points Earned',
        icon: TrendingUp,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10',
    },
    redeem_reward: {
        label: 'Reward Redeemed',
        icon: Gift,
        color: 'text-green-400',
        bg: 'bg-green-500/10',
    },
    manual_adjust: {
        label: 'Manual Adjustment',
        icon: RotateCcw,
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
    },
}

export default function CustomerCard({ data, publicToken }: CustomerCardProps) {
    const { customer, organization, cardDesign, stampDesign, program, rewards, transactions, bonusRewards: initialBonuses, googleWalletEnabled, appleWalletEnabled, nfcCard } = data
    const [showHistory, setShowHistory] = useState(false)
    const [notifEnabled, setNotifEnabled] = useState(false)
    const [registering, setRegistering] = useState(false)
    const [availableStamps, setAvailableStamps] = useState(customer.available_stamps ?? 0)
    const [bonusRewards, setBonusRewards] = useState(initialBonuses ?? [])

    const cardConfig = cardDesign ? { ...defaultCard, ...cardDesign } : defaultCard
    const stampConfig = stampDesign ? { ...defaultStamp, ...stampDesign } : defaultStamp

    const stampsRequired = program?.stamps_required ?? 10
    const rewardProgress = Math.min((availableStamps / stampsRequired) * 100, 100)
    const canRedeem = availableStamps >= stampsRequired
    const nextReward = rewards.find((r: any) => (r.stamps_required ?? 0) > availableStamps) || rewards[0]
    const nextRewardName = nextReward?.name

    useEffect(() => {
        const enabled = localStorage.getItem(`notif_${customer.id}`)
        setNotifEnabled(enabled === '1')
    }, [customer.id])

    async function handleNotifications() {
        setRegistering(true)
        try {
            const token = await requestNotificationPermission()
            if (!token) {
                toast.error('Permission denied or browser not supported')
                setRegistering(false)
                return
            }
            const res = await fetch('/api/client/push-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, customerToken: publicToken, organizationId: customer.organization_id }),
            })
            if (res.ok) {
                setNotifEnabled(true)
                localStorage.setItem(`notif_${customer.id}`, '1')
                toast.success('Notifications enabled! 🔔')
            }
        } catch {
            toast.error('Failed to enable notifications')
        }
        setRegistering(false)
    }

    async function handleBonusClaimed(bonusId: string, value: number, type: string) {
        if (type === 'stamps') setAvailableStamps((prev: number) => prev + value)
        setBonusRewards((prev: any[]) => prev.map(b => b.id === bonusId ? { ...b, claimed: true } : b))
    }

    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Header */}
            <div className="px-4 pt-8 pb-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">{organization.name}</div>
                <h1 className="text-xl font-bold text-white">{customer.full_name ?? 'Your Loyalty Card'}</h1>
            </div>

            {/* Loyalty Card */}
            <div className="px-4 flex justify-center mb-6">
                <LoyaltyCard
                    config={cardConfig}
                    customerName={customer.full_name ?? 'Valued Customer'}
                    availableStamps={availableStamps}
                    stampsRequired={stampsRequired}
                    stampConfig={stampConfig}
                    publicToken={publicToken}
                    nextRewardName={nextRewardName}
                />
            </div>

            {/* Digital Wallet Buttons */}
            {(googleWalletEnabled || appleWalletEnabled) && (
                <div className="px-4 mb-6 space-y-3">
                    {googleWalletEnabled && <GoogleWalletButton publicToken={publicToken} />}
                    {appleWalletEnabled && <AppleWalletButton publicToken={publicToken} />}
                </div>
            )}

            {/* QR Code (Only if classic layout, as modern has it integrated) */}
            {cardConfig.layoutType !== 'modern' && (
                <div className="px-4 flex justify-center mb-6">
                    <QRCodeDisplay token={publicToken} type={cardConfig.codeType} />
                </div>
            )}

            {/* Stats */}
            <div className="px-4 grid grid-cols-3 gap-3 mb-6">
                {[
                    { label: 'Stamps', value: customer.available_stamps ?? 0, color: 'text-yellow-400' },
                    { label: 'Visits', value: customer.total_visits ?? 0, color: 'text-blue-400' },
                    { label: 'Redeemed', value: customer.total_redeemed ?? 0, color: 'text-green-400' },
                ].map(s => (
                    <div key={s.label} className="stat-card text-center !p-3">
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Reward status */}
            {canRedeem && (
                <div className="mx-4 mb-4 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
                    <div>
                        <div className="text-green-400 font-semibold">Reward Ready! 🎉</div>
                        <div className="text-sm text-muted-foreground">Show this to the cashier to redeem</div>
                    </div>
                </div>
            )}

            {/* Available Rewards */}
            {rewards.length > 0 && (
                <div className="px-4 mb-6">
                    <h2 className="text-white font-semibold mb-3">Available Rewards</h2>
                    <div className="space-y-2">
                        {rewards.map((r: any) => {
                            const canGet = availableStamps >= (r.stamps_required ?? 0)
                            return (
                                <Card key={r.id} className={`border ${canGet ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-card/30'}`}>
                                    <CardContent className="pt-3 pb-3 flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${canGet ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                                            <Gift className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1">
                                            <div className={`font-medium text-sm ${canGet ? 'text-white' : 'text-muted-foreground'}`}>{r.name}</div>
                                            {r.description && <div className="text-xs text-muted-foreground">{r.description}</div>}
                                        </div>
                                        {r.stamps_required && (
                                            <Badge className={canGet ? 'bg-primary/20 text-primary border-primary/30' : 'bg-white/5 text-muted-foreground border-white/10'}>
                                                {r.stamps_required} <Star className="w-2.5 h-2.5 ml-0.5" />
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Bonus Offers */}
            {bonusRewards.length > 0 && (
                <div className="px-4 mb-6">
                    <BonusRewardList
                        bonuses={bonusRewards}
                        publicToken={publicToken}
                        onClaimed={handleBonusClaimed}
                    />
                </div>
            )}

            {/* Linked Cards */}
            <div className="px-4 mb-6">
                <h2 className="text-white font-semibold mb-3">Linked Cards</h2>
                <div className="space-y-2">
                    {/* Digital Card */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-card/30 border border-white/5">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <QrCode className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <div className="text-white text-sm font-medium">Digital Card</div>
                            <div className="text-xs text-muted-foreground">QR Code / Wallet</div>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
                    </div>

                    {/* NFC Card */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-card/30 border border-white/5">
                        <div className={`p-2 rounded-lg ${nfcCard ? 'bg-primary/10 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                            <CreditCard className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <div className={`text-sm font-medium ${nfcCard ? 'text-white' : 'text-muted-foreground'}`}>NFC Card</div>
                            {nfcCard ? (
                                <div className="text-xs text-muted-foreground font-mono">···{nfcCard.nfc_uid.slice(-6)}</div>
                            ) : (
                                <div className="text-xs text-muted-foreground">Ask staff to link a card</div>
                            )}
                        </div>
                        <Badge className={nfcCard
                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : 'bg-white/5 text-muted-foreground border-white/10'
                        }>
                            {nfcCard ? 'Linked' : 'Not linked'}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="px-4 mb-6">
                <Button
                    onClick={handleNotifications}
                    disabled={notifEnabled || registering}
                    variant="outline"
                    className={`w-full ${notifEnabled ? 'border-green-500/30 text-green-400 bg-green-500/5' : 'border-white/10 text-muted-foreground'}`}
                >
                    {notifEnabled ? (
                        <><Bell className="mr-2 w-4 h-4" /> Notifications Enabled</>
                    ) : (
                        <><BellOff className="mr-2 w-4 h-4" /> {registering ? 'Enabling...' : 'Enable Notifications'}</>
                    )}
                </Button>
            </div>

            {/* ── TRANSACTION HISTORY ── */}
            <div className="px-4">
                <button
                    onClick={() => setShowHistory(v => !v)}
                    className="w-full flex items-center justify-between py-3 text-white font-semibold"
                >
                    <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        Transaction History
                        {transactions.length > 0 && (
                            <span className="text-xs text-muted-foreground font-normal">({transactions.length})</span>
                        )}
                    </span>
                    {showHistory ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>

                {showHistory && (
                    <div className="space-y-0 mt-1 pb-4">
                        {transactions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                No transactions yet
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Vertical timeline line */}
                                <div className="absolute left-4 top-4 bottom-4 w-px bg-white/8" />

                                <div className="space-y-1">
                                    {transactions.map((tx: any, idx: number) => {
                                        const cfg = txConfig[tx.type] ?? txConfig.earn_stamp
                                        const Icon = cfg.icon
                                        const isRedeem = tx.type === 'redeem_reward'
                                        const rewardName = tx.rewards?.name ?? tx.reward_snapshot?.name

                                        return (
                                            <div
                                                key={tx.id}
                                                className="flex items-start gap-3 pl-1 py-3 relative"
                                            >
                                                {/* Timeline dot / icon */}
                                                <div className={`relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${cfg.bg} ${cfg.color} ring-2 ring-background`}>
                                                    <Icon className="w-3.5 h-3.5" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className={`text-sm font-medium ${cfg.color}`}>
                                                                {cfg.label}
                                                            </div>

                                                            {/* Stamp earned: show count */}
                                                            {tx.type === 'earn_stamp' && (
                                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                                    +{tx.stamps_earned ?? 1} stamp
                                                                    {tx.stamps_balance_after != null && (
                                                                        <span className="text-white/40 ml-1">→ {tx.stamps_balance_after} total</span>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Reward redeemed: show name */}
                                                            {isRedeem && rewardName && (
                                                                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                                    <Gift className="w-3 h-3" />
                                                                    {rewardName}
                                                                </div>
                                                            )}

                                                            {/* Points earned */}
                                                            {tx.type === 'earn_points' && tx.points_earned > 0 && (
                                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                                    +{tx.points_earned} pts
                                                                </div>
                                                            )}

                                                            {/* Branch name */}
                                                            {tx.branches?.name && (
                                                                <div className="text-xs text-white/30 mt-0.5">
                                                                    📍 {tx.branches.name}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Date/time */}
                                                        <div className="text-right shrink-0">
                                                            <div className="text-xs text-white/50">{formatDateTime(tx.created_at)}</div>
                                                            <div className="text-[10px] text-white/25 mt-0.5 hidden sm:block">
                                                                {formatExactDateTime(tx.created_at)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Purchase amount if set */}
                                                    {tx.purchase_amount && (
                                                        <div className="mt-1 text-xs text-white/30">
                                                            Purchase: ${parseFloat(tx.purchase_amount).toFixed(2)}
                                                        </div>
                                                    )}
                                                    {tx.notes && (
                                                        <div className="mt-1 text-xs italic text-white/25">"{tx.notes}"</div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
