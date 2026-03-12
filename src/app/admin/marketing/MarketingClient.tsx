'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Megaphone, Users, UserCheck, Smartphone, Loader2, History, Send, CalendarClock, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface MarketingClientProps {
    initialCampaigns: any[]
    stats: {
        totalCustomers: number
        activeCustomers: number
        subscribers: number
        walletPasses: number
        planName?: string
    }
}

export default function MarketingClient({ initialCampaigns, stats }: MarketingClientProps) {
    const [campaigns, setCampaigns] = useState(initialCampaigns)
    const [title, setTitle] = useState('')
    const [message, setMessage] = useState('')
    const [audience, setAudience] = useState('all')
    const [scheduledFor, setScheduledFor] = useState('')
    const [sending, setSending] = useState(false)

    async function handleSend(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim() || !message.trim()) {
            toast.error('Please enter a title and message')
            return
        }

        setSending(true)
        try {
            const res = await fetch('/api/admin/marketing/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, message, audience, scheduledFor: scheduledFor || null }),
            })
            const data = await res.json()

            if (data.success) {
                toast.success('Campaign sent!', {
                    description: `Successfully sent to ${data.sentCount} devices.`,
                })
                // Add the new campaign to the list safely
                if (data.campaign) {
                    setCampaigns(prev => [data.campaign, ...prev])
                }
                setTitle('')
                setMessage('')
                setScheduledFor('')
            } else {
                toast.error(data.error || 'Failed to send campaign')
            }
        } catch (err) {
            toast.error('Failed to send campaign')
        } finally {
            setSending(false)
        }
    }

    const totalSubscribers = stats.subscribers + stats.walletPasses

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Marketing & Notifications</h1>
                <p className="text-muted-foreground">Reach your customers with targeted push campaigns</p>
            </div>

            {/* Audience Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-muted/10 border-border">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-primary/10 text-primary">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-foreground">{stats.totalCustomers}</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Audience</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-muted/10 border-border">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-foreground">{stats.activeCustomers}</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active (30d)</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-muted/10 border-border">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-foreground">{totalSubscribers}</div>
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Device Subscribers</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Compose Form */}
                <Card className="lg:col-span-2 border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-primary" /> New Campaign
                        </CardTitle>
                        <CardDescription>Send a push notification to your customers' devices</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSend} className="space-y-5">
                            <div className="space-y-2">
                                <Label>Select Audience</Label>
                                <Select value={audience} onValueChange={setAudience}>
                                    <SelectTrigger className="bg-muted/30">
                                        <SelectValue placeholder="Select audience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Available Devices ({totalSubscribers})</SelectItem>
                                        <SelectItem value="active">Active Customers Only</SelectItem>
                                        <SelectItem value="inactive">Inactive Customers ({'>'}30 days)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Notification Title</Label>
                                <Input
                                    placeholder="e.g. 🌟 Flash Sale Today!"
                                    className="bg-muted/30"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                    maxLength={50}
                                />
                                <div className="text-xs text-right text-muted-foreground">{title.length}/50</div>
                            </div>

                            <div className="space-y-2">
                                <Label>Message Body</Label>
                                <Textarea
                                    placeholder="Double stamps on all coffee orders today..."
                                    className="bg-muted/30 resize-none h-24"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required
                                    maxLength={150}
                                />
                                <div className="text-xs text-right text-muted-foreground">{message.length}/150</div>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <CalendarClock className="w-4 h-4 text-muted-foreground" />
                                    Schedule (Optional)
                                    {stats.planName !== 'platinium' && (
                                        <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20 py-0 h-4">
                                            Platinium
                                        </Badge>
                                    )}
                                </Label>
                                <Input
                                    type="datetime-local"
                                    className="bg-muted/30"
                                    value={scheduledFor}
                                    onChange={e => setScheduledFor(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    disabled={stats.planName !== 'platinium'}
                                />
                                <div className="text-xs text-muted-foreground">
                                    {stats.planName === 'platinium'
                                        ? 'Leave empty to send immediately'
                                        : 'Scheduling is only available on the Platinium plan.'}
                                </div>
                            </div>

                            <Button type="submit" disabled={sending || !title || !message || (totalSubscribers === 0 && !scheduledFor)} className="w-full gradient-primary">
                                {sending ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                                ) : (
                                    <><Send className="w-4 h-4 mr-2" /> {scheduledFor ? 'Schedule Campaign' : 'Send via Push & Digital Wallets'}</>
                                )}
                            </Button>
                        </form>

                        {totalSubscribers === 0 && (
                            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3 rounded-xl mt-4 flex items-start gap-3 text-sm">
                                <Megaphone className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium mb-1">No devices available for push</p>
                                    <p className="opacity-90 leading-relaxed text-xs">
                                        Customers must actively grant permission on their physical device (by installing your digital wallet card or accepting browser prompts) before you can send campaigns to them.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Campaign History */}
                <Card className="border-border bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <History className="w-5 h-5 text-muted-foreground" /> Campaign History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        {campaigns.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-sm">
                                No campaigns sent yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-border px-6 overflow-y-auto max-h-[400px]">
                                {campaigns.map(c => (
                                    <div key={c.id} className="py-4 space-y-2">
                                        <div className="font-medium text-foreground text-sm">{c.name}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-2">{c.message}</div>
                                        <div className="flex items-center justify-between mt-2">
                                            <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground border-border">
                                                To: {c.target_audience}
                                            </Badge>
                                            {c.status === 'pending' ? (
                                                <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">
                                                    <Clock className="w-3 h-3 mr-1 inline" />
                                                    Pending
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-green-500 font-medium">
                                                    {c.success_count} sent
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground text-right mt-1">
                                            {c.status === 'pending' && c.scheduled_for
                                                ? `Scheduled: ${new Date(c.scheduled_for).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`
                                                : new Date(c.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
