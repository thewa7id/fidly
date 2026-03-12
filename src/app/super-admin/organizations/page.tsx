'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
    Building2, Search, Users, GitBranch, Activity,
    ChevronRight, Loader2, Shield, ShieldOff
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function OrganizationsPage() {
    const router = useRouter()
    const [orgs, setOrgs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [toggling, setToggling] = useState<string | null>(null)

    async function loadOrgs() {
        setLoading(true)
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (statusFilter !== 'all') params.set('status', statusFilter)
        const res = await fetch(`/api/super-admin/organizations?${params}`)
        const json = await res.json()
        if (json.success) setOrgs(json.data)
        setLoading(false)
    }

    useEffect(() => { loadOrgs() }, [statusFilter])

    async function toggleActive(org: any) {
        setToggling(org.id)
        const res = await fetch('/api/super-admin/organizations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: org.id, is_active: !org.is_active }),
        })
        const json = await res.json()
        if (json.success) {
            toast.success(org.is_active ? 'Organization blocked' : 'Organization activated')
            setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, is_active: !o.is_active } : o))
        }
        setToggling(null)
    }

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            active: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
            trial: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
            inactive: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
            cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
            past_due: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
        }
        return <Badge variant="outline" className={`text-[10px] font-bold uppercase ${map[status] ?? map.inactive}`}>{status}</Badge>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Organizations</h1>
                    <p className="text-muted-foreground text-sm">Manage all registered businesses</p>
                </div>
                <Badge variant="outline" className="text-xs border-border">
                    {orgs.length} total
                </Badge>
            </div>

            {/* Filters */}
            <Card className="bg-card border-border">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, slug, or email…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && loadOrgs()}
                                className="pl-9 bg-muted/50 border-border"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px] bg-muted/50 border-border">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="trial">Trial</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={loadOrgs} variant="outline" className="border-border">
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
                                <TableHead className="text-muted-foreground">Organization</TableHead>
                                <TableHead className="text-muted-foreground">Plan</TableHead>
                                <TableHead className="text-muted-foreground">Status</TableHead>
                                <TableHead className="text-muted-foreground text-center">
                                    <Users className="w-3.5 h-3.5 inline mr-1" />Customers
                                </TableHead>
                                <TableHead className="text-muted-foreground text-center">
                                    <GitBranch className="w-3.5 h-3.5 inline mr-1" />Branches
                                </TableHead>
                                <TableHead className="text-muted-foreground text-center">
                                    <Activity className="w-3.5 h-3.5 inline mr-1" />Txns
                                </TableHead>
                                <TableHead className="text-muted-foreground">Created</TableHead>
                                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i} className="border-border">
                                        {[...Array(8)].map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : orgs.length === 0 ? (
                                <TableRow className="border-border">
                                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                        No organizations found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orgs.map(org => (
                                    <TableRow
                                        key={org.id}
                                        className="border-border cursor-pointer hover:bg-muted/30"
                                        onClick={() => router.push(`/super-admin/organizations/${org.id}`)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                    {org.name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-foreground flex items-center gap-2">
                                                        {org.name}
                                                        {!org.is_active && (
                                                            <Badge variant="outline" className="text-[9px] bg-red-500/10 text-red-500 border-red-500/20">BLOCKED</Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{org.slug}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] capitalize border-border">
                                                {org.subscription?.display_name ?? 'Free'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{statusBadge(org.subscription_status)}</TableCell>
                                        <TableCell className="text-center text-foreground font-medium">{org.customerCount}</TableCell>
                                        <TableCell className="text-center text-foreground font-medium">{org.branchCount}</TableCell>
                                        <TableCell className="text-center text-foreground font-medium">{org.transactionCount}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {new Date(org.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant={org.is_active ? 'destructive' : 'default'}
                                                    className="h-7 text-xs"
                                                    disabled={toggling === org.id}
                                                    onClick={() => toggleActive(org)}
                                                >
                                                    {toggling === org.id ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : org.is_active ? (
                                                        <><ShieldOff className="w-3 h-3 mr-1" /> Block</>
                                                    ) : (
                                                        <><Shield className="w-3 h-3 mr-1" /> Activate</>
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm" variant="ghost"
                                                    className="h-7 text-xs text-muted-foreground"
                                                    onClick={() => router.push(`/super-admin/organizations/${org.id}`)}
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
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
