'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Users, Star, Gift, Activity, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    async function loadCustomers() {
        setLoading(true)
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        const res = await fetch(`/api/super-admin/customers?${params}`)
        const json = await res.json()
        if (json.success) setCustomers(json.data)
        setLoading(false)
    }

    useEffect(() => { loadCustomers() }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">All Customers</h1>
                    <p className="text-muted-foreground text-sm">View customer details across all organizations</p>
                </div>
                <Badge variant="outline" className="text-xs border-border">
                    {customers.length} total
                </Badge>
            </div>

            {/* Search */}
            <Card className="bg-card border-border">
                <CardContent className="p-4">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or phone…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && loadCustomers()}
                                className="pl-9 bg-muted/50 border-border"
                            />
                        </div>
                        <Button onClick={loadCustomers} variant="outline" className="border-border">
                            <Search className="w-4 h-4 mr-2" /> Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="bg-card border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground">Customer</TableHead>
                                <TableHead className="text-muted-foreground">Contact</TableHead>
                                <TableHead className="text-muted-foreground">Organization</TableHead>
                                <TableHead className="text-muted-foreground text-center">
                                    <Star className="w-3.5 h-3.5 inline mr-1" />Stamps
                                </TableHead>
                                <TableHead className="text-muted-foreground text-center">
                                    <Activity className="w-3.5 h-3.5 inline mr-1" />Visits
                                </TableHead>
                                <TableHead className="text-muted-foreground text-center">
                                    <Gift className="w-3.5 h-3.5 inline mr-1" />Redeemed
                                </TableHead>
                                <TableHead className="text-muted-foreground">Last Visit</TableHead>
                                <TableHead className="text-muted-foreground">Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(8)].map((_, i) => (
                                    <TableRow key={i} className="border-border">
                                        {[...Array(8)].map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : customers.length === 0 ? (
                                <TableRow className="border-border">
                                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                        No customers found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                customers.map(c => (
                                    <TableRow key={c.id} className="border-border hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                                    {(c.full_name ?? '?')[0].toUpperCase()}
                                                </div>
                                                <span className="font-medium text-foreground">{c.full_name ?? '—'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-muted-foreground space-y-0.5">
                                                {c.email && <div>{c.email}</div>}
                                                {c.phone && <div>{c.phone}</div>}
                                                {!c.email && !c.phone && <span>—</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded gradient-primary flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                                                    {c.organizations?.name?.[0] ?? '?'}
                                                </div>
                                                <span className="text-sm text-foreground">{c.organizations?.name ?? '—'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="text-primary font-bold">{c.available_stamps ?? 0}</span>
                                            <span className="text-muted-foreground text-xs">/{c.total_stamps ?? 0}</span>
                                        </TableCell>
                                        <TableCell className="text-center text-foreground font-medium">{c.total_visits ?? 0}</TableCell>
                                        <TableCell className="text-center text-foreground font-medium">{c.total_redeemed ?? 0}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString() : 'Never'}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(c.joined_at).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    )
}
