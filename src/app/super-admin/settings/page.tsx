'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
    CreditCard, Save, Loader2, Settings2, Plus, Pencil,
} from 'lucide-react'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function SuperAdminSettings() {
    const supabase = createClient()
    const [plans, setPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingPlan, setEditingPlan] = useState<any>(null)
    const [form, setForm] = useState({
        name: '',
        display_name: '',
        max_customers: '',
        max_branches: '1',
        max_employees: '5',
        price_monthly: '0',
        price_yearly: '0',
        is_active: true,
    })

    async function loadPlans() {
        const { data } = await supabase.from('subscriptions').select('*').order('price_monthly')
        setPlans(data ?? [])
        setLoading(false)
    }

    useEffect(() => { loadPlans() }, [])

    function openEditor(plan?: any) {
        if (plan) {
            setEditingPlan(plan)
            setForm({
                name: plan.name,
                display_name: plan.display_name,
                max_customers: plan.max_customers?.toString() ?? '',
                max_branches: plan.max_branches?.toString() ?? '1',
                max_employees: plan.max_employees?.toString() ?? '5',
                price_monthly: plan.price_monthly?.toString() ?? '0',
                price_yearly: plan.price_yearly?.toString() ?? '0',
                is_active: plan.is_active,
            })
        } else {
            setEditingPlan('new')
            setForm({
                name: '',
                display_name: '',
                max_customers: '',
                max_branches: '1',
                max_employees: '5',
                price_monthly: '0',
                price_yearly: '0',
                is_active: true,
            })
        }
    }

    async function savePlan() {
        setSaving(true)
        const payload = {
            name: form.name.toLowerCase().replace(/\s+/g, '_'),
            display_name: form.display_name,
            max_customers: form.max_customers ? parseInt(form.max_customers) : null,
            max_branches: parseInt(form.max_branches) || 1,
            max_employees: parseInt(form.max_employees) || 5,
            price_monthly: parseFloat(form.price_monthly) || 0,
            price_yearly: parseFloat(form.price_yearly) || 0,
            is_active: form.is_active,
        }

        let error: any = null
        if (editingPlan === 'new') {
            const res = await supabase.from('subscriptions').insert(payload)
            error = res.error
        } else {
            const res = await supabase.from('subscriptions').update(payload).eq('id', editingPlan.id)
            error = res.error
        }

        if (error) {
            toast.error(error.message)
        } else {
            toast.success(editingPlan === 'new' ? 'Plan created' : 'Plan updated')
            setEditingPlan(null)
            loadPlans()
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="space-y-6 max-w-3xl mx-auto">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-64 rounded-xl" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
                <p className="text-muted-foreground text-sm">Manage subscription plans and platform configuration</p>
            </div>

            {/* Subscription Plans */}
            <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-foreground text-base flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-primary" /> Subscription Plans
                        </CardTitle>
                        <CardDescription>Manage the available plans for organizations</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => openEditor()}>
                        <Plus className="w-3 h-3 mr-1" /> Add Plan
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground">Plan</TableHead>
                                <TableHead className="text-muted-foreground">Limits</TableHead>
                                <TableHead className="text-muted-foreground text-right">Monthly</TableHead>
                                <TableHead className="text-muted-foreground text-right">Yearly</TableHead>
                                <TableHead className="text-muted-foreground text-center">Status</TableHead>
                                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.map(p => (
                                <TableRow key={p.id} className="border-border">
                                    <TableCell>
                                        <div className="font-medium text-foreground">{p.display_name}</div>
                                        <div className="text-[10px] text-muted-foreground font-mono">{p.name}</div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {p.max_customers ?? '∞'} customers · {p.max_branches ?? '∞'} branches · {p.max_employees ?? '∞'} staff
                                    </TableCell>
                                    <TableCell className="text-right text-foreground font-mono text-sm">${p.price_monthly}</TableCell>
                                    <TableCell className="text-right text-foreground font-mono text-sm">${p.price_yearly}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={`text-[9px] ${p.is_active ? 'border-green-500/20 text-green-600 dark:text-green-400' : 'border-red-500/20 text-red-500'}`}>
                                            {p.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEditor(p)}>
                                            <Pencil className="w-3 h-3 mr-1" /> Edit
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit/Create Plan Dialog */}
            <Dialog open={!!editingPlan} onOpenChange={open => !open && setEditingPlan(null)}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">
                            {editingPlan === 'new' ? 'Create Plan' : 'Edit Plan'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Internal Name</Label>
                                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="pro" className="bg-muted/50 border-border" />
                            </div>
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <Input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Pro Plan" className="bg-muted/50 border-border" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Max Customers</Label>
                                <Input type="number" value={form.max_customers} onChange={e => setForm(f => ({ ...f, max_customers: e.target.value }))} placeholder="∞" className="bg-muted/50 border-border" />
                                <p className="text-[10px] text-muted-foreground">Empty = unlimited</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Max Branches</Label>
                                <Input type="number" value={form.max_branches} onChange={e => setForm(f => ({ ...f, max_branches: e.target.value }))} className="bg-muted/50 border-border" />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Employees</Label>
                                <Input type="number" value={form.max_employees} onChange={e => setForm(f => ({ ...f, max_employees: e.target.value }))} className="bg-muted/50 border-border" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Monthly Price ($)</Label>
                                <Input type="number" step="0.01" value={form.price_monthly} onChange={e => setForm(f => ({ ...f, price_monthly: e.target.value }))} className="bg-muted/50 border-border" />
                            </div>
                            <div className="space-y-2">
                                <Label>Yearly Price ($)</Label>
                                <Input type="number" step="0.01" value={form.price_yearly} onChange={e => setForm(f => ({ ...f, price_yearly: e.target.value }))} className="bg-muted/50 border-border" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <Label>Active</Label>
                            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancel</Button>
                        <Button onClick={savePlan} disabled={saving || !form.name || !form.display_name} className="gradient-primary border-0 text-primary-foreground">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                            {editingPlan === 'new' ? 'Create' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
