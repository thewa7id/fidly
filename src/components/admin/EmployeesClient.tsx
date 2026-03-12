'use client'

import { useState } from 'react'
import { Plus, Users, Loader2, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

const roleColors: Record<string, string> = {
    owner: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    employee: 'bg-green-500/10 text-green-400 border-green-500/20',
}

interface Props {
    initialEmployees: any[]
    branches: any[]
}

export default function EmployeesClient({ initialEmployees, branches }: Props) {
    const [employees, setEmployees] = useState(initialEmployees)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ email: '', full_name: '', role: 'employee', branch_id: '', password: '' })

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/admin/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Employee added!')
                setEmployees(prev => [data.data, ...prev])
                setDialogOpen(false)
                setForm({ email: '', full_name: '', role: 'employee', branch_id: '', password: '' })
            } else {
                toast.error(data.error)
            }
        } catch (err) {
            toast.error('Failed to add employee')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Employees</h1>
                    <p className="text-muted-foreground">Manage your team and their access</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-primary border-0 text-foreground"><Plus className="mr-2 w-4 h-4" /> Add Employee</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                        <DialogHeader><DialogTitle className="text-foreground">Add Employee</DialogTitle></DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div className="space-y-2"><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className="bg-muted/50 border-border" required /></div>
                            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="bg-muted/50 border-border" required /></div>
                            <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="bg-muted/50 border-border" required minLength={8} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                                        <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="employee">Cashier / Employee</SelectItem>
                                            <SelectItem value="manager">Manager</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Branch</Label>
                                    <Select value={form.branch_id} onValueChange={v => setForm(p => ({ ...p, branch_id: v }))}>
                                        <SelectTrigger className="bg-muted/50 border-border"><SelectValue placeholder="Any branch" /></SelectTrigger>
                                        <SelectContent>
                                            {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button type="submit" disabled={saving} className="w-full gradient-primary border-0 text-foreground">
                                {saving ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Adding...</> : 'Add Employee'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {employees.length === 0 ? (
                <Card className="bg-card border-border">
                    <CardContent className="pt-12 pb-12 text-center">
                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                        <p className="text-muted-foreground">No employees yet. Add your first team member.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {employees.map((emp: any) => (
                        <Card key={emp.id} className="bg-card/30 border-border">
                            <CardContent className="py-3 px-4 flex items-center gap-4">
                                <Avatar className="w-10 h-10">
                                    <AvatarFallback className="gradient-primary text-foreground text-sm font-semibold">
                                        {(emp.full_name ?? emp.email ?? '?')[0].toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="text-foreground font-medium">{emp.full_name ?? 'No name'}</div>
                                    <div className="text-muted-foreground text-sm">{emp.email}</div>
                                </div>
                                {emp.branches?.name && (
                                    <div className="hidden sm:flex items-center gap-1 text-muted-foreground text-sm">
                                        <Building2 className="w-3 h-3" /> {emp.branches.name}
                                    </div>
                                )}
                                <Badge className={`${roleColors[emp.role] ?? ''} border capitalize`}>
                                    {emp.role === 'employee' ? 'cashier' : emp.role}
                                </Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
