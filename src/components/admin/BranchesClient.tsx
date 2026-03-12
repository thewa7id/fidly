'use client'

import { useState } from 'react'
import { Plus, Building2, Loader2, MapPin, Phone, Users, Copy, Check, MoreVertical, Edit2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
    initialBranches: any[]
    slug: string | null
    baseUrl: string
}

function JoinQRCard({ slug, baseUrl }: { slug: string | null; baseUrl: string }) {
    const [copied, setCopied] = useState(false)

    const joinUrl = slug ? `${baseUrl}/join/${slug}` : null

    async function copyLink() {
        if (!joinUrl) return
        await navigator.clipboard.writeText(joinUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success('Link copied!')
    }

    if (!slug) return null

    return (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Customer Join QR
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                    Display this QR in your store. Customers scan it to register their loyalty card.
                </p>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                    {joinUrl && (
                        <div className="shrink-0">
                            <div className="p-3 bg-white rounded-2xl shadow-lg">
                                <QRCodeSVG
                                    value={joinUrl}
                                    size={140}
                                    bgColor="#ffffff"
                                    fgColor="#0f0f1a"
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex-1 space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Join Link</p>
                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border">
                                <code className="text-xs text-foreground/80 flex-1 truncate">{joinUrl}</code>
                                <button onClick={copyLink} className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0">
                                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                                Customer scans this QR
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                                They register with name & email
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                                Loyalty card is created instantly
                            </div>
                        </div>

                        <button
                            onClick={() => window.print()}
                            className="text-xs text-primary hover:underline"
                        >
                            🖨️ Print this QR →
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function BranchesClient({ initialBranches, slug, baseUrl }: Props) {
    const [branches, setBranches] = useState(initialBranches)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' })
    
    // Edit state
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editSaving, setEditSaving] = useState(false)
    const [editingBranch, setEditingBranch] = useState<any>(null)
    const [editForm, setEditForm] = useState({ name: '', address: '', phone: '', email: '' })

    function openEdit(branch: any) {
        setEditingBranch(branch)
        setEditForm({ name: branch.name || '', address: branch.address || '', phone: branch.phone || '', email: branch.email || '' })
        setEditDialogOpen(true)
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()
        if (!editingBranch) return
        setEditSaving(true)
        try {
            const res = await fetch(`/api/admin/branches/${editingBranch.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Branch updated!')
                setBranches(prev => prev.map(b => b.id === editingBranch.id ? { ...b, ...data.data } : b))
                setEditDialogOpen(false)
                setEditingBranch(null)
            } else {
                toast.error(data.error || 'Failed to update branch')
            }
        } catch (err) {
            toast.error('Something went wrong')
        } finally {
            setEditSaving(false)
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/admin/branches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Branch created!')
                setBranches(prev => [data.data, ...prev])
                setDialogOpen(false)
                setForm({ name: '', address: '', phone: '', email: '' })
            } else {
                toast.error(data.error)
            }
        } catch (err) {
            toast.error('Failed to create branch')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Branches</h1>
                    <p className="text-muted-foreground">Manage your business locations</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-primary border-0 text-foreground"><Plus className="mr-2 w-4 h-4" /> Add Branch</Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                        <DialogHeader><DialogTitle className="text-foreground">New Branch</DialogTitle></DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2"><Label>Branch Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required className="bg-muted/50 border-border" /></div>
                            <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="bg-muted/50 border-border" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="bg-muted/50 border-border" /></div>
                                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="bg-muted/50 border-border" /></div>
                            </div>
                            <Button type="submit" disabled={saving} className="w-full gradient-primary border-0 text-foreground">
                                {saving ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Creating...</> : 'Create Branch'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <JoinQRCard slug={slug} baseUrl={baseUrl} />

            {branches.length === 0 ? (
                <Card className="bg-card border-border">
                    <CardContent className="pt-12 pb-12 text-center">
                        <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                        <p className="text-muted-foreground">No branches yet. Create your first location.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {branches.map((b: any) => (
                        <Card key={b.id} className="bg-card border-border">
                            <CardContent className="pt-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 rounded-xl gradient-primary">
                                        <Building2 className="w-4 h-4 text-foreground" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={b.is_active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}>
                                            {b.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card border-border">
                                                <DropdownMenuItem onClick={() => openEdit(b)} className="text-foreground hover:bg-muted cursor-pointer">
                                                    <Edit2 className="w-4 h-4 mr-2" />
                                                    Edit Branch
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <h3 className="text-foreground font-semibold text-lg">{b.name}</h3>
                                {b.address && <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {b.address}</p>}
                                {b.phone && <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1"><Phone className="w-3 h-3" /> {b.phone}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader><DialogTitle className="text-foreground">Edit Branch</DialogTitle></DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2"><Label>Branch Name</Label><Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required className="bg-muted/50 border-border" /></div>
                        <div className="space-y-2"><Label>Address</Label><Input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} className="bg-muted/50 border-border" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="bg-muted/50 border-border" /></div>
                            <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="bg-muted/50 border-border" /></div>
                        </div>
                        <Button type="submit" disabled={editSaving} className="w-full gradient-primary border-0 text-foreground">
                            {editSaving ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
