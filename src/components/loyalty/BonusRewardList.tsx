'use client'

import { useState } from 'react'
import { Gift, Bell, Star, Share2, Heart, CheckCircle, Loader2, ArrowRight, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface BonusReward {
    id: string
    type: 'google_review' | 'enable_notifications' | 'social_follow' | 'other'
    reward_type: 'stamps' | 'points'
    reward_value: number
    config: { link?: string }
    claimed: boolean
}

interface Props {
    bonuses: BonusReward[]
    publicToken: string
    onClaimed: (bonusId: string, value: number, type: string) => void
}

const icons: any = {
    google_review: <span className="font-bold">G</span>,
    enable_notifications: <Bell className="w-4 h-4" />,
    social_follow: <Share2 className="w-4 h-4" />,
    other: <Heart className="w-4 h-4" />,
}

const labels: any = {
    google_review: 'Write a Review',
    enable_notifications: 'Enable Notifications',
    social_follow: 'Follow Socials',
    other: 'Special Bonus',
}

export default function BonusRewardList({ bonuses, publicToken, onClaimed }: Props) {
    const [claiming, setClaiming] = useState<string | null>(null)

    async function handleClaim(bonus: BonusReward) {
        if (bonus.claimed) return

        // If it has a link, open it first
        if (bonus.config.link) {
            window.open(bonus.config.link, '_blank')
        }

        setClaiming(bonus.id)
        try {
            const res = await fetch('/api/customer/bonus/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bonusId: bonus.id, publicToken }),
            })
            const data = await res.json()

            if (data.success) {
                toast.success(`You earned ${data.rewardValue} ${data.rewardType}! 🎉`)
                onClaimed(bonus.id, data.rewardValue, data.rewardType)
            } else {
                toast.error(data.error || 'Failed to claim reward')
            }
        } catch (error) {
            toast.error('Connection error')
        } finally {
            setClaiming(null)
        }
    }

    if (bonuses.length === 0) return null

    return (
        <div className="space-y-2 mt-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest ml-1 font-bold">Bonus Offerings</p>
            <div className="flex flex-col gap-2">
                {bonuses.map((bonus) => (
                    <div
                        key={bonus.id}
                        onClick={() => !bonus.claimed && handleClaim(bonus)}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${bonus.claimed
                                ? 'bg-black/20 border-white/5 opacity-50 grayscale cursor-default'
                                : 'bg-white/5 border-white/10 hover:border-primary/30 cursor-pointer active:scale-[0.98]'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${bonus.claimed ? 'bg-white/5 text-muted-foreground' : 'bg-primary/20 text-primary'
                                }`}>
                                {icons[bonus.type]}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-white leading-tight">
                                    {labels[bonus.type]}
                                </h4>
                                <p className="text-[10px] text-muted-foreground">
                                    Earn +{bonus.reward_value} {bonus.reward_type}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {bonus.claimed ? (
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold">
                                    <CheckCircle className="w-3 h-3" /> CLAIMED
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                                    {claiming === bonus.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <>GET REWARD <ArrowRight className="w-3 h-3" /></>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
