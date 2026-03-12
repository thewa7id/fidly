'use client'

import { useState } from 'react'
import { Plus, Trash2, Gift, Loader2, Star, Percent, DollarSign, Bell, Share2, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { Reward } from '@/lib/types'

const rewardTypeIcons: Record<string, React.ReactNode> = {
    free_item: <Gift className="w-4 h-4" />,
    percentage_discount: <Percent className="w-4 h-4" />,
    fixed_discount: <DollarSign className="w-4 h-4" />,
    custom: <Star className="w-4 h-4" />,
}

const bonusTypeIcons: Record<string, React.ReactNode> = {
    google_review: <span className="font-bold text-[10px]">G</span>,
    enable_notifications: <Bell className="w-4 h-4" />,
    social_follow: <Share2 className="w-4 h-4" />,
    other: <Heart className="w-4 h-4" />,
}

const rewardTypeColors: Record<string, string> = {
    free_item: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    percentage_discount: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    fixed_discount: 'bg-green-500/10 text-green-400 border-green-500/20',
    custom: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
}

const defaultForm = {
    name: '',
    description: '',
    type: 'free_item' as Reward['type'],
    value: '',
    stamps_required: '10',
    points_required: '',
    terms: '',
}

const defaultBonusForm = {
    type: 'google_review',
    reward_type: 'stamps',
    reward_value: '1',
    config: { link: '' },
}

interface Props {
    initialRewards: Reward[]
    initialBonusRewards: any[]
    programs: any[]
}

export default function RewardsClient({ initialRewards, initialBonusRewards, programs }: Props) {
    const [rewards, setRewards] = useState<Reward[]>(initialRewards)
    const [bonusRewards, setBonusRewards] = useState<any[]>(initialBonusRewards)
    const [selectedProgram] = useState(programs[0]?.id ?? '')
    const [saving, setSaving] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [bonusDialogOpen, setBonusDialogOpen] = useState(false)
    const [form, setForm] = useState(defaultForm)
    const [bonusForm, setBonusForm] = useState(defaultBonusForm)

    function handleChange(key: string, value: string) {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        const res = await fetch('/api/admin/reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...form,
                loyalty_program_id: selectedProgram,
                value: form.value ? parseFloat(form.value) : null,
                stamps_required: form.stamps_required ? parseInt(form.stamps_required) : null,
                points_required: form.points_required ? parseInt(form.points_required) : null,
            }),
        })
        const data = await res.json()
        if (data.success) {
            toast.success('Reward created!')
            setRewards(prev => [data.data, ...prev])
            setDialogOpen(false)
            setForm(defaultForm)
        } else {
            toast.error(data.error)
        }
        setSaving(false)
    }

    async function handleCreateBonus(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        const res = await fetch('/api/admin/bonus-reward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...bonusForm,
                reward_value: parseInt(bonusForm.reward_value),
            }),
        })
        const data = await res.json()
        if (data.success) {
            toast.success('Bonus reward configured!')
            setBonusRewards(prev => {
                const filtered = prev.filter(b => b.id !== data.data.id && b.type !== data.data.type)
                return [data.data, ...filtered]
            })
            setBonusDialogOpen(false)
            setBonusForm(defaultBonusForm)
        } else {
            toast.error(data.error)
        }
        setSaving(false)
    }

    async function handleDelete(id: string) {
        const res = await fetch(`/api/admin/reward?id=${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) {
            toast.success('Reward deleted')
            setRewards(prev => prev.filter(r => r.id !== id))
        }
    }

    async function handleDeleteBonus(id: string) {
        const res = await fetch(`/api/admin/bonus-reward?id=${id}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) {
            toast.success('Bonus reward removed')
            setBonusRewards(prev => prev.filter(b => b.id !== id))
        }
    }

    return (
        <div className="space-y-12">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Redemption Rewards</h1>
                        <p className="text-muted-foreground text-sm">Define what customers can redeem their stamps for.</p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gradient-primary border-0 text-foreground">
                                <Plus className="mr-2 w-4 h-4" /> Add Reward
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">New Redemption Reward</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Reward Name</Label>
                                    <Input value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Free coffee" required className="bg-muted/50 border-border" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="One free coffee of any size" className="bg-muted/50 border-border resize-none" rows={2} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Reward Type</Label>
                                        <Select value={form.type} onValueChange={v => handleChange('type', v)}>
                                            <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="free_item">Free Item</SelectItem>
                                                <SelectItem value="percentage_discount">% Discount</SelectItem>
                                                <SelectItem value="fixed_discount">Fixed Discount</SelectItem>
                                                <SelectItem value="custom">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {form.type !== 'free_item' && form.type !== 'custom' && (
                                        <div className="space-y-2">
                                            <Label>Value ({form.type === 'percentage_discount' ? '%' : '$'})</Label>
                                            <Input type="number" value={form.value} onChange={e => handleChange('value', e.target.value)} className="bg-muted/50 border-border" />
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Stamps Required</Label>
                                        <Input type="number" value={form.stamps_required} onChange={e => handleChange('stamps_required', e.target.value)} min={1} className="bg-muted/50 border-border" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Points Required</Label>
                                        <Input type="number" value={form.points_required} onChange={e => handleChange('points_required', e.target.value)} placeholder="Optional" className="bg-muted/50 border-border" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Terms & Conditions</Label>
                                    <Textarea value={form.terms} onChange={e => handleChange('terms', e.target.value)} placeholder="One per visit. Cannot be combined with other offers." className="bg-muted/50 border-border resize-none" rows={2} />
                                </div>
                                <Button type="submit" className="w-full gradient-primary border-0 text-foreground" disabled={saving}>
                                    {saving ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Creating...</> : 'Create Reward'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {rewards.length === 0 ? (
                    <Card className="bg-card border-border">
                        <CardContent className="pt-12 pb-12 text-center">
                            <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No rewards yet. Create your first reward.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rewards.map(reward => (
                            <Card key={reward.id} className="bg-card border-border hover:border-border transition-colors group">
                                <CardContent className="pt-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge className={`${rewardTypeColors[reward.type]} border text-xs capitalize flex items-center gap-1`}>
                                                    {rewardTypeIcons[reward.type]}
                                                    {reward.type.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <h3 className="text-foreground font-semibold">{reward.name}</h3>
                                            {reward.description && <p className="text-muted-foreground text-sm mt-1">{reward.description}</p>}
                                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                                {reward.stamps_required && (
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-3 h-3 text-yellow-400" /> {reward.stamps_required} stamps
                                                    </span>
                                                )}
                                                {reward.points_required && (
                                                    <span className="flex items-center gap-1">
                                                        <Zap className="w-3 h-3 text-blue-400" /> {reward.points_required} pts
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(reward.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Bonus Rewards Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between border-t border-border pt-10">
                    <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            Bonus Rewards (One-Time)
                        </h2>
                        <p className="text-muted-foreground text-sm">Reward customers for actions like Google reviews or enabling notifications.</p>
                    </div>
                    <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="bg-muted/50 border-border text-foreground hover:bg-muted">
                                <Plus className="mr-2 w-4 h-4" /> Configure Bonus
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border max-w-md">
                            <DialogHeader>
                                <DialogTitle className="text-foreground">Configure Bonus Reward</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateBonus} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Action Required</Label>
                                    <Select value={bonusForm.type} onValueChange={v => setBonusForm(p => ({ ...p, type: v }))}>
                                        <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="google_review">Write Google Review</SelectItem>
                                            <SelectItem value="enable_notifications">Enable App Notifications</SelectItem>
                                            <SelectItem value="social_follow">Follow on Social Media</SelectItem>
                                            <SelectItem value="other">Other Action</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Reward Type</Label>
                                        <Select value={bonusForm.reward_type} onValueChange={v => setBonusForm(p => ({ ...p, reward_type: v }))}>
                                            <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="stamps">Stamps</SelectItem>
                                                <SelectItem value="points">Points</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Value</Label>
                                        <Input type="number" value={bonusForm.reward_value} onChange={e => setBonusForm(p => ({ ...p, reward_value: e.target.value }))} className="bg-muted/50 border-border" />
                                    </div>
                                </div>
                                {bonusForm.type !== 'enable_notifications' && (
                                    <div className="space-y-2">
                                        <Label>External Link (Optional)</Label>
                                        <Input
                                            value={bonusForm.config.link}
                                            onChange={e => setBonusForm(p => ({ ...p, config: { ...p.config, link: e.target.value } }))}
                                            placeholder="https://g.page/your-business/review"
                                            className="bg-muted/50 border-border"
                                        />
                                    </div>
                                )}
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <p className="text-[11px] text-primary leading-tight">
                                        <strong>Note:</strong> Customers can only claim this reward <u>once in their lifetime</u> per branch.
                                    </p>
                                </div>
                                <Button type="submit" className="w-full gradient-primary border-0 text-foreground" disabled={saving}>
                                    {saving ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Processing...</> : 'Configure Bonus'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bonusRewards.map(bonus => (
                        <Card key={bonus.id} className="bg-card/30 border-border relative group cursor-default">
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-muted/50 text-primary">
                                        {bonusTypeIcons[bonus.type]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-foreground truncate capitalize">
                                            {bonus.type.replace(/_/g, ' ')}
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground">Once per life</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] font-bold">
                                        +{bonus.reward_value} {bonus.reward_type}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="w-7 h-7 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteBonus(bonus.id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}

function Zap({ className }: { className?: string }) {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
}
