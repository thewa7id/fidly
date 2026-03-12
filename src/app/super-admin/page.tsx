'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Star, TrendingUp, ArrowUpRight, Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar,
} from 'recharts'

export default function SuperAdminDashboard() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/super-admin/stats')
            .then(r => r.json())
            .then(d => { if (d.success) setData(d.data); setLoading(false) })
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <Skeleton className="h-80 rounded-xl" />
            </div>
        )
    }

    const metrics = [
        { label: 'Total Organizations', value: data.totalOrgs, sub: `${data.activeOrgs} active`, icon: Building2, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Total Users', value: data.totalUsers, sub: 'Staff accounts', icon: Users, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
        { label: 'Total Customers', value: data.totalCustomers, sub: 'Across all orgs', icon: Star, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Total Transactions', value: data.totalTransactions, sub: 'All time', icon: Activity, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
    ]

    const subData = [
        { name: 'Active', value: data.subscriptionBreakdown.active, color: 'bg-green-500' },
        { name: 'Trial', value: data.subscriptionBreakdown.trial, color: 'bg-yellow-500' },
        { name: 'Inactive', value: data.subscriptionBreakdown.inactive, color: 'bg-gray-500' },
        { name: 'Cancelled', value: data.subscriptionBreakdown.cancelled, color: 'bg-red-500' },
        { name: 'Past Due', value: data.subscriptionBreakdown.past_due, color: 'bg-orange-500' },
    ]
    const totalSubs = subData.reduce((s, d) => s + d.value, 0) || 1

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
                <p className="text-muted-foreground text-sm">Global metrics across all organizations</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map(m => (
                    <Card key={m.label} className="bg-card border-border">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-2.5 rounded-xl ${m.bg}`}>
                                    <m.icon className={`w-5 h-5 ${m.color}`} />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="text-3xl font-bold text-foreground">{m.value.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground mt-1">{m.sub}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Growth chart */}
                <Card className="lg:col-span-2 bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground text-base flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-primary" /> 30-Day Growth
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={data.growthData}>
                                <defs>
                                    <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F18701" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#F18701" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="date" tickFormatter={v => v.slice(5)} className="text-muted-foreground" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '12px',
                                        color: 'hsl(var(--popover-foreground))',
                                        fontSize: 12,
                                    }}
                                    labelFormatter={v => new Date(v).toLocaleDateString()}
                                />
                                <Area type="monotone" dataKey="customers" stroke="#F18701" fill="url(#colorCustomers)" strokeWidth={2} name="New Customers" />
                                <Area type="monotone" dataKey="transactions" stroke="#8b5cf6" fill="url(#colorTx)" strokeWidth={2} name="Transactions" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Subscription breakdown */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground text-base">Subscription Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {subData.map(s => (
                            <div key={s.name}>
                                <div className="flex items-center justify-between text-sm mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                                        <span className="text-foreground font-medium">{s.name}</span>
                                    </div>
                                    <span className="text-muted-foreground font-mono text-xs">{s.value}</span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${s.color} rounded-full transition-all`}
                                        style={{ width: `${(s.value / totalSubs) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
