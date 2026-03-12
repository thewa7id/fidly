'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AdminAnalyticsChart from '@/components/admin/AdminAnalyticsChart'
import {
    BarChart2, Users, Star, Gift, TrendingUp, Percent,
    Calendar, RefreshCcw, Loader2, Smartphone, Megaphone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'

interface Props {
    initialData: any
    initialPeriod: string
}

export default function AnalyticsClient({ initialData, initialPeriod }: Props) {
    const [loading, setLoading] = useState(false)
    const [period, setPeriod] = useState(initialPeriod)
    const [data, setData] = useState(initialData)
    const [customRange, setCustomRange] = useState({ start: '', end: '' })
    const [isCustom, setIsCustom] = useState(false)

    const fetchAnalytics = async (p: string, start?: string, end?: string) => {
        setLoading(true)
        try {
            let url = `/api/admin/analytics?days=${p}`
            if (start && end) {
                url = `/api/admin/analytics?start=${start}&end=${end}`
            }
            const res = await fetch(url)
            const json = await res.json()
            if (json.success) {
                setData(json.data)
            } else {
                toast.error(json.error || 'Failed to fetch analytics')
            }
        } catch (error) {
            toast.error('Failed to load analytics')
        } finally {
            setLoading(false)
        }
    }

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!customRange.start || !customRange.end) {
            toast.error('Please select both start and end dates')
            return
        }
        setIsCustom(true)
        fetchAnalytics('', customRange.start, customRange.end)
    }

    const handlePeriodChange = (val: string) => {
        if (val === 'custom') {
            setIsCustom(true)
        } else {
            setIsCustom(false)
            setPeriod(val)
            fetchAnalytics(val)
        }
    }

    const kpis = [
        { label: 'Total Customers', value: data?.totalCustomers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Active Customers', value: data?.activeCustomers, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
        { label: 'Stamps Issued', value: data?.totalStampsEarned, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        { label: 'Rewards Redeemed', value: data?.totalRedemptions, icon: Gift, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { label: 'Total Transactions', value: data?.totalTransactions, icon: BarChart2, color: 'text-pink-400', bg: 'bg-pink-500/10' },
        { label: 'Redemption Rate', value: `${data?.redemptionRate}%`, icon: Percent, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { label: 'Push Subscribers', value: data?.pushSubscribers, icon: Smartphone, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { label: 'Pushes Sent', value: data?.totalPushesSent, icon: Megaphone, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    ]

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                    <p className="text-muted-foreground">Business performance metrics</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Select value={isCustom ? 'custom' : period} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="w-[180px] bg-muted/50 border-border text-foreground">
                            <Calendar className="w-4 h-4 mr-2 opacity-50" />
                            <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Today</SelectItem>
                            <SelectItem value="7">Last 7 Days</SelectItem>
                            <SelectItem value="30">Last 30 Days</SelectItem>
                            <SelectItem value="90">Last 90 Days</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>

                    {isCustom && (
                        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                            <input
                                type="date"
                                value={customRange.start}
                                onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                                className="bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                            />
                            <span className="text-muted-foreground text-xs">to</span>
                            <input
                                type="date"
                                value={customRange.end}
                                onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                                className="bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                            />
                            <Button size="sm" type="submit" className="gradient-primary border-0 h-[34px]">
                                Apply
                            </Button>
                        </form>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => isCustom ? fetchAnalytics('', customRange.start, customRange.end) : fetchAnalytics(period)}
                        disabled={loading}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {loading && !data ? (
                <div className="h-[400px] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-muted-foreground animate-pulse">Gathering insights...</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {kpis.map(kpi => (
                            <div key={kpi.label} className="stat-card group hover:border-primary/30 transition-all duration-300">
                                <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                <div className="text-3xl font-bold text-foreground mb-1">
                                    {loading ? '...' : (typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value)}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center justify-between">
                                    <span>{kpi.label}</span>
                                    {!loading && (
                                        <span className="text-[10px] uppercase tracking-wider opacity-50">
                                            {isCustom ? 'Matching Period' : `${period} Days`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <Card className="bg-card border-border overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                            <div>
                                <CardTitle className="text-foreground text-lg">Performance Over Time</CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Tracking new customers and transaction volume
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <AdminAnalyticsChart data={data?.growthData ?? []} />
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-border flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-foreground font-semibold">Growth Overview</h4>
                                <p className="text-sm text-muted-foreground">
                                    Your redemption rate is <span className="text-foreground font-bold">{data?.redemptionRate}%</span>.
                                    {data?.redemptionRate > 20 ? " This is above industry average!" : " Consider offering more stamps to boost engagement."}
                                </p>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-border flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-foreground font-semibold">Top Location</h4>
                                <p className="text-sm text-muted-foreground">
                                    <span className="text-foreground font-bold">{data?.topBranch || 'N/A'}</span> is currently your most active branch in this period.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
