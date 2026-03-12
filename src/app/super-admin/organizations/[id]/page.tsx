'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import {
    ArrowLeft, Building2, Users, GitBranch, Activity, Shield, ShieldOff,
    Calendar, Mail, Globe, Phone, MapPin, CreditCard, Save, Loader2,
    Star, Eye, Pencil, Check, X
} from 'lucide-react'
import { toast } from 'sonner'

export default function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [subDialogOpen, setSubDialogOpen] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState('')
    const [subStatus, setSubStatus] = useState('')
    const [subExpiry, setSubExpiry] = useState('')
    const [editingBranch, setEditingBranch] = useState<any>(null)
    const [branchName, setBranchName] = useState('')
    const [branchActive, setBranchActive] = useState(true)

    async function load() {
        const res = await fetch(`/api/super-admin/organizations/${id}`)
        const json = await res.json()
        if (json.success) {
            setData(json.data)
            setSelectedPlan(json.data.org.subscription_id ?? '')
            setSubStatus(json.data.org.subscription_status ?? 'trial')
            setSubExpiry(json.data.org.subscription_expires_at ? json.data.org.subscription_expires_at.split('T')[0] : '')
        }
        setLoading(false)
    }

    useEffect(() => { load() }, [id])

    async function toggleActive() {
        setSaving(true)
        await fetch('/api/super-admin/organizations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, is_active: !data.org.is_active }),
        })
        toast.success(data.org.is_active ? 'Organization blocked' : 'Organization activated')
        setData((d: any) => ({ ...d, org: { ...d.org, is_active: !d.org.is_active } }))
        setSaving(false)
    }

    async function saveSubscription() {
        setSaving(true)
        await fetch('/api/super-admin/organizations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id,
                subscription_id: selectedPlan || null,
                subscription_status: subStatus,
                subscription_expires_at: subExpiry ? new Date(subExpiry).toISOString() : null,
            }),
        })
        toast.success('Subscription updated')
        setSubDialogOpen(false)
        load()
    }

    async function saveBranch() {
        if (!editingBranch) return
        setSaving(true)
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase.from('branches').update({
            name: branchName,
            is_active: branchActive,
            updated_at: new Date().toISOString(),
        }).eq('id', editingBranch.id)
        toast.success('Branch updated')
        setEditingBranch(null)
        setSaving(false)
        load()
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
                <Skeleton className="h-64 rounded-xl" />
            </div>
        )
    }

    if (!data) return <div className="text-muted-foreground">Organization not found</div>

    const { org, owner, branches, employees, customerCount, recentCustomers, transactionCount, recentTransactions, programs, allPlans } = data
    const currentPlan = allPlans.find((p: any) => p.id === org.subscription_id)

    const kpis = [
        { label: 'Customers', value: customerCount, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
        { label: 'Branches', value: branches.length, icon: GitBranch, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
        { label: 'Employees', value: employees.length, icon: Users, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-500/10' },
        { label: 'Transactions', value: transactionCount, icon: Activity, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push('/super-admin/organizations')}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold">
                        {org.name[0]}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-foreground">{org.name}</h1>
                            {!org.is_active && <Badge variant="destructive" className="text-[9px]">BLOCKED</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground">{org.slug} · Created {new Date(org.created_at).toLocaleDateString()}</div>
                    </div>
                </div>
                <Button
                    variant={org.is_active ? 'destructive' : 'default'}
                    size="sm"
                    onClick={toggleActive}
                    disabled={saving}
                >
                    {org.is_active ? <><ShieldOff className="w-4 h-4 mr-1" /> Block</> : <><Shield className="w-4 h-4 mr-1" /> Activate</>}
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(k => (
                    <Card key={k.label} className="bg-card border-border">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${k.bg}`}>
                                <k.icon className={`w-4 h-4 ${k.color}`} />
                            </div>
                            <div>
                                <div className="text-xl font-bold text-foreground">{k.value}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{k.label}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="info" className="w-full">
                <TabsList className="bg-muted border border-border">
                    <TabsTrigger value="info">Overview</TabsTrigger>
                    <TabsTrigger value="branches">Branches</TabsTrigger>
                    <TabsTrigger value="subscription">Subscription</TabsTrigger>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="info" className="mt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-primary" /> Business Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {[
                                    { icon: Building2, label: 'Name', value: org.name },
                                    { icon: Mail, label: 'Email', value: org.email ?? '—' },
                                    { icon: Phone, label: 'Phone', value: org.phone ?? '—' },
                                    { icon: Globe, label: 'Website', value: org.website ?? '—' },
                                    { icon: MapPin, label: 'Address', value: org.address ?? '—' },
                                    { icon: Calendar, label: 'Created', value: new Date(org.created_at).toLocaleDateString() },
                                    { icon: Calendar, label: 'Trial Ends', value: org.trial_ends_at ? new Date(org.trial_ends_at).toLocaleDateString() : '—' },
                                ].map(field => (
                                    <div key={field.label} className="flex items-center gap-3 py-1">
                                        <field.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <span className="text-muted-foreground w-20">{field.label}</span>
                                        <span className="text-foreground font-medium">{field.value}</span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" /> Owner & Team
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {owner && (
                                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                                        <div className="text-xs text-primary font-bold uppercase tracking-wider mb-1">Owner</div>
                                        <div className="text-foreground font-medium">{owner.full_name ?? 'N/A'}</div>
                                        <div className="text-xs text-muted-foreground">{owner.email}</div>
                                    </div>
                                )}
                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Team Members</div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {employees.map((emp: any) => (
                                        <div key={emp.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                                            <div>
                                                <div className="text-sm text-foreground font-medium">{emp.full_name ?? emp.email}</div>
                                                <div className="text-xs text-muted-foreground">{emp.role}</div>
                                            </div>
                                            <Badge variant="outline" className={`text-[9px] ${emp.is_active ? 'border-green-500/20 text-green-600 dark:text-green-400' : 'border-red-500/20 text-red-500'}`}>
                                                {emp.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Branches Tab */}
                <TabsContent value="branches" className="mt-4">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground text-sm">All Branches ({branches.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border">
                                        <TableHead className="text-muted-foreground">Branch Name</TableHead>
                                        <TableHead className="text-muted-foreground">QR Code</TableHead>
                                        <TableHead className="text-muted-foreground">Status</TableHead>
                                        <TableHead className="text-muted-foreground">Created</TableHead>
                                        <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {branches.map((b: any) => (
                                        <TableRow key={b.id} className="border-border">
                                            <TableCell className="font-medium text-foreground">{b.name}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground font-mono">{b.qr_code?.slice(0, 16)}…</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-[10px] ${b.is_active ? 'border-green-500/20 text-green-600 dark:text-green-400' : 'border-red-500/20 text-red-500'}`}>
                                                    {b.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(b.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                                                    setEditingBranch(b)
                                                    setBranchName(b.name)
                                                    setBranchActive(b.is_active)
                                                }}>
                                                    <Pencil className="w-3 h-3 mr-1" /> Edit
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Subscription Tab */}
                <TabsContent value="subscription" className="mt-4">
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-primary" /> Subscription
                                </CardTitle>
                                <CardDescription>Manage this organization's subscription plan</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => setSubDialogOpen(true)}>
                                <Pencil className="w-3 h-3 mr-1" /> Change Plan
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Plan</div>
                                    <div className="text-lg font-bold text-foreground">{currentPlan?.display_name ?? 'Free'}</div>
                                    {currentPlan && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            ${currentPlan.price_monthly}/mo · ${currentPlan.price_yearly}/yr
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</div>
                                    <div className="text-lg font-bold text-foreground capitalize">{org.subscription_status}</div>
                                </div>
                                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expires</div>
                                    <div className="text-lg font-bold text-foreground">
                                        {org.subscription_expires_at
                                            ? new Date(org.subscription_expires_at).toLocaleDateString()
                                            : 'Never'}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Customers Tab */}
                <TabsContent value="customers" className="mt-4">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground text-sm">Recent Customers ({customerCount})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border">
                                        <TableHead className="text-muted-foreground">Customer</TableHead>
                                        <TableHead className="text-muted-foreground">Contact</TableHead>
                                        <TableHead className="text-muted-foreground text-center">Stamps</TableHead>
                                        <TableHead className="text-muted-foreground text-center">Visits</TableHead>
                                        <TableHead className="text-muted-foreground text-center">Redeemed</TableHead>
                                        <TableHead className="text-muted-foreground">Joined</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentCustomers.map((c: any) => (
                                        <TableRow key={c.id} className="border-border">
                                            <TableCell className="font-medium text-foreground">{c.full_name ?? '—'}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{c.email ?? c.phone ?? '—'}</TableCell>
                                            <TableCell className="text-center text-primary font-bold">{c.available_stamps}</TableCell>
                                            <TableCell className="text-center text-foreground">{c.total_visits}</TableCell>
                                            <TableCell className="text-center text-foreground">{c.total_redeemed}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(c.joined_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Transactions Tab */}
                <TabsContent value="transactions" className="mt-4">
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground text-sm">Recent Transactions ({transactionCount})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border">
                                        <TableHead className="text-muted-foreground">Customer</TableHead>
                                        <TableHead className="text-muted-foreground">Type</TableHead>
                                        <TableHead className="text-muted-foreground text-center">Stamps +/-</TableHead>
                                        <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                                        <TableHead className="text-muted-foreground">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentTransactions.map((tx: any) => (
                                        <TableRow key={tx.id} className="border-border">
                                            <TableCell className="text-foreground text-sm">{tx.customers?.full_name ?? '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[9px] capitalize border-border">{tx.type.replace('_', ' ')}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {tx.stamps_earned > 0 && <span className="text-green-600 dark:text-green-400 font-medium">+{tx.stamps_earned}</span>}
                                                {tx.stamps_redeemed > 0 && <span className="text-red-500 font-medium">-{tx.stamps_redeemed}</span>}
                                            </TableCell>
                                            <TableCell className="text-right text-foreground font-mono text-xs">
                                                {tx.purchase_amount ? `$${Number(tx.purchase_amount).toFixed(2)}` : '—'}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Subscription Dialog */}
            <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Change Subscription</DialogTitle>
                        <DialogDescription>Update the plan, status, and expiry for {org.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Plan</Label>
                            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                <SelectTrigger className="bg-muted/50 border-border">
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allPlans.map((p: any) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.display_name} — ${p.price_monthly}/mo
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={subStatus} onValueChange={setSubStatus}>
                                <SelectTrigger className="bg-muted/50 border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="trial">Trial</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="past_due">Past Due</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Expiry Date</Label>
                            <Input
                                type="date"
                                value={subExpiry}
                                onChange={e => setSubExpiry(e.target.value)}
                                className="bg-muted/50 border-border"
                            />
                            <p className="text-[10px] text-muted-foreground">Leave empty for no expiration</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSubDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveSubscription} disabled={saving} className="gradient-primary border-0 text-primary-foreground">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Branch Dialog */}
            <Dialog open={!!editingBranch} onOpenChange={open => !open && setEditingBranch(null)}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Edit Branch</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Branch Name</Label>
                            <Input value={branchName} onChange={e => setBranchName(e.target.value)} className="bg-muted/50 border-border" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label>Active Status</Label>
                            <Switch checked={branchActive} onCheckedChange={setBranchActive} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingBranch(null)}>Cancel</Button>
                        <Button onClick={saveBranch} disabled={saving} className="gradient-primary border-0 text-primary-foreground">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
