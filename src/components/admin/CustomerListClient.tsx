'use client'

import { useState, useTransition, useEffect, useMemo } from 'react'
import { Search, Plus, Star, Loader2, Users, ChevronRight, Smartphone, QrCode, Clock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { Customer } from '@/lib/types'
import { useDebounce } from 'use-debounce'
import CustomerDetailDialog from '@/components/admin/CustomerDetailDialog'

interface Props {
    initialCustomers: Customer[]
    initialTotal: number
    initialHasMore: boolean
    nfcCustomerIds: string[]
    totalAll: number
    nfcCount: number
}

const STAMPS_REQUIRED = 10

function formatRelativeTime(dateStr: string | null): string {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function getRewardStatus(customer: Customer): { label: string; variant: 'ready' | 'progress' | 'redeemed' } {
    if (customer.available_stamps >= STAMPS_REQUIRED) {
        return { label: 'Reward Ready', variant: 'ready' }
    }
    if (customer.total_redeemed > 0 && customer.available_stamps < STAMPS_REQUIRED) {
        return { label: 'Redeemed', variant: 'redeemed' }
    }
    return { label: 'In Progress', variant: 'progress' }
}

export default function CustomerListClient({
    initialCustomers, initialTotal, initialHasMore,
    nfcCustomerIds, totalAll, nfcCount,
}: Props) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') ?? '')
    const [debouncedSearch] = useDebounce(searchTerm, 300)
    const [cardFilter, setCardFilterState] = useState(searchParams.get('card') ?? 'all')
    const [sortField, setSortField] = useState(searchParams.get('sort') ?? 'joined_at')
    const [sortOrder, setSortOrder] = useState(searchParams.get('order') ?? 'desc')

    const [isPending, startTransition] = useTransition()
    const [loadingMore, setLoadingMore] = useState(false)
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [total, setTotal] = useState(initialTotal)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const [newCustomer, setNewCustomer] = useState({ full_name: '', email: '', phone: '', date_of_birth: '' })
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

    // NFC customer lookup set for per-row display
    const nfcSet = useMemo(() => new Set(nfcCustomerIds), [nfcCustomerIds])

    // Filter button counts
    const digitalOnlyCount = totalAll - nfcCount

    // Sync state when initial props change
    useEffect(() => {
        setCustomers(initialCustomers)
        setTotal(initialTotal)
        setHasMore(initialHasMore)
        setPage(1)
    }, [initialCustomers, initialTotal, initialHasMore])

    // Update URL when debounced search term changes
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (debouncedSearch) {
            params.set('search', debouncedSearch)
        } else {
            params.delete('search')
        }
        params.delete('page')

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch])

    function pushUrlParams(overrides: Record<string, string | null>) {
        const params = new URLSearchParams(window.location.search)
        for (const [key, value] of Object.entries(overrides)) {
            if (value && value !== 'all' && !(key === 'order' && value === 'desc') && !(key === 'sort' && value === 'joined_at')) {
                params.set(key, value)
            } else {
                params.delete(key)
            }
        }
        params.delete('page')
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`)
        })
    }

    function setCardFilter(value: string) {
        setCardFilterState(value)
        pushUrlParams({ card: value })
    }

    function toggleSort(field: string) {
        let newOrder = 'desc'
        if (sortField === field) {
            newOrder = sortOrder === 'desc' ? 'asc' : 'desc'
        }
        setSortField(field)
        setSortOrder(newOrder)
        pushUrlParams({ sort: field, order: newOrder })
    }

    async function loadMore() {
        setLoadingMore(true)
        const nextPage = page + 1
        const s = searchParams.get('search') ?? ''
        const c = searchParams.get('card') ?? 'all'
        const sort = searchParams.get('sort') ?? 'joined_at'
        const order = searchParams.get('order') ?? 'desc'
        const res = await fetch(`/api/admin/customers?page=${nextPage}&pageSize=20&search=${encodeURIComponent(s)}&card=${c}&sort=${sort}&order=${order}`)
        const data = await res.json()

        if (data.success) {
            setCustomers(prev => [...prev, ...(data.data ?? [])])
            setHasMore(data.hasMore ?? false)
            setPage(nextPage)
        }
        setLoadingMore(false)
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        try {
            const res = await fetch('/api/admin/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomer),
            })
            const data = await res.json()

            if (data.success) {
                toast.success('Customer added!')
                setCustomers(prev => [data.data, ...prev])
                setTotal(t => t + 1)
                setDialogOpen(false)
                setNewCustomer({ full_name: '', email: '', phone: '', date_of_birth: '' })
            } else {
                toast.error(data.error)
            }
        } catch (err) {
            toast.error('Failed to create customer')
        } finally {
            setSaving(false)
        }
    }

    // Sort column header helper
    function SortableHeader({ field, label, className }: { field: string; label: string; className?: string }) {
        const isActive = sortField === field
        return (
            <TableHead
                className={`text-muted-foreground font-medium cursor-pointer select-none hover:text-foreground transition-colors ${className ?? ''}`}
                onClick={() => toggleSort(field)}
            >
                <span className="flex items-center gap-1">
                    {label}
                    {isActive ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                    )}
                </span>
            </TableHead>
        )
    }

    // Empty state messages based on active filter
    const isFiltered = cardFilter !== 'all'
    const emptyTitle = searchTerm
        ? 'No customers match your search'
        : isFiltered
            ? `No customers with ${cardFilter === 'nfc' ? 'NFC cards' : 'digital-only cards'}`
            : 'No customers yet'
    const emptyDescription = searchTerm
        ? 'Try adjusting your search terms.'
        : isFiltered
            ? cardFilter === 'nfc'
                ? 'Link NFC cards to customers via the POS terminal or customer profile.'
                : 'All your customers currently have NFC cards linked.'
            : 'Add your first customer to start collecting loyalty data.'
    const showAddButton = !searchTerm && !isFiltered

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Customers</h1>
                    <p className="text-muted-foreground">{total.toLocaleString()} total customers</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="gradient-primary border-0 text-foreground">
                            <Plus className="mr-2 w-4 h-4" /> Add Customer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">Add New Customer</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={newCustomer.full_name} onChange={e => setNewCustomer(p => ({ ...p, full_name: e.target.value }))} className="bg-muted/50 border-border" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={newCustomer.email} onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))} className="bg-muted/50 border-border" />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input type="tel" value={newCustomer.phone} onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))} className="bg-muted/50 border-border" />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input type="date" value={newCustomer.date_of_birth} onChange={e => setNewCustomer(p => ({ ...p, date_of_birth: e.target.value }))} className="bg-muted/50 border-border" />
                            </div>
                            <Button type="submit" disabled={saving} className="w-full gradient-primary border-0 text-foreground">
                                {saving ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Adding...</> : 'Add Customer'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                        <Search className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>
                <Input
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 bg-muted/30 border-border focus:border-primary/50"
                />
            </div>

            {/* Card Type Filter */}
            <div className="flex items-center gap-2">
                {[
                    { value: 'all', label: 'All', icon: null, count: totalAll },
                    { value: 'digital', label: 'Digital Only', icon: <QrCode className="w-3.5 h-3.5" />, count: digitalOnlyCount },
                    { value: 'nfc', label: 'NFC', icon: <Smartphone className="w-3.5 h-3.5" />, count: nfcCount },
                ].map(f => (
                    <Button
                        key={f.value}
                        variant={cardFilter === f.value ? 'default' : 'outline'}
                        size="sm"
                        className={cardFilter === f.value
                            ? 'gradient-primary border-0 text-foreground text-xs h-8'
                            : 'border-border text-muted-foreground hover:text-foreground text-xs h-8'
                        }
                        onClick={() => setCardFilter(f.value)}
                    >
                        {f.icon && <span className="mr-1.5">{f.icon}</span>}
                        {f.label}
                        <span className={`ml-1.5 text-[10px] ${cardFilter === f.value ? 'opacity-80' : 'opacity-50'}`}>
                            {f.count}
                        </span>
                    </Button>
                ))}
            </div>

            {/* Table / Empty State */}
            {customers.length === 0 ? (
                <div className="text-center py-16">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium text-foreground mb-1">{emptyTitle}</p>
                    <p className="text-muted-foreground text-sm mb-6">{emptyDescription}</p>
                    {showAddButton && (
                        <Button
                            className="gradient-primary border-0 text-foreground"
                            onClick={() => setDialogOpen(true)}
                        >
                            <Plus className="mr-2 w-4 h-4" /> Add Customer
                        </Button>
                    )}
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                                <TableHead className="text-muted-foreground font-medium">Customer</TableHead>
                                <SortableHeader field="stamps" label="Stamps" className="hidden md:table-cell" />
                                <SortableHeader field="visits" label="Visits" className="hidden md:table-cell" />
                                <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">Reward Status</TableHead>
                                <TableHead className="text-muted-foreground font-medium hidden lg:table-cell">Linked Cards</TableHead>
                                <SortableHeader field="last_activity" label="Last Activity" className="hidden sm:table-cell" />
                                <TableHead className="text-muted-foreground font-medium w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map(c => {
                                const reward = getRewardStatus(c)
                                const hasNfc = nfcSet.has(c.id)
                                return (
                                    <TableRow
                                        key={c.id}
                                        className="border-border cursor-pointer hover:bg-muted/30 transition-colors"
                                        onClick={() => setSelectedCustomer(c)}
                                    >
                                        {/* Customer */}
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center shrink-0 text-foreground font-semibold text-sm">
                                                    {(c.full_name ?? c.email ?? '?')[0].toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-foreground font-medium truncate text-sm">
                                                        {c.full_name ?? 'No name'}
                                                    </div>
                                                    <div className="text-muted-foreground text-xs truncate">
                                                        {c.email ?? c.phone ?? c.public_token.slice(0, 12) + '...'}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>

                                        {/* Stamps */}
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-1">
                                                <div className="flex items-center gap-0.5 text-yellow-400">
                                                    {Array.from({ length: Math.min(c.available_stamps, 5) }).map((_, i) => (
                                                        <Star key={i} className="w-3 h-3 fill-yellow-400" />
                                                    ))}
                                                    {c.available_stamps > 5 && (
                                                        <span className="text-xs font-medium ml-0.5">+{c.available_stamps - 5}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                {c.available_stamps} / {STAMPS_REQUIRED}
                                            </div>
                                        </TableCell>

                                        {/* Visits */}
                                        <TableCell className="hidden md:table-cell">
                                            <span className="text-foreground text-sm font-medium">{c.total_visits}</span>
                                            <span className="text-muted-foreground text-xs ml-1">visits</span>
                                        </TableCell>

                                        {/* Reward Status */}
                                        <TableCell className="hidden lg:table-cell">
                                            {reward.variant === 'ready' ? (
                                                <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                                                    Reward Ready
                                                </Badge>
                                            ) : reward.variant === 'redeemed' ? (
                                                <Badge variant="outline" className="border-border text-muted-foreground text-xs">
                                                    Redeemed
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-primary/20 text-primary/70 text-xs">
                                                    In Progress
                                                </Badge>
                                            )}
                                        </TableCell>

                                        {/* Linked Cards */}
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center gap-2">
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <QrCode className="w-3.5 h-3.5 text-primary/60" />
                                                    Digital
                                                </span>
                                                {hasNfc && (
                                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Smartphone className="w-3.5 h-3.5 text-primary/60" />
                                                        NFC
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Last Activity */}
                                        <TableCell className="hidden sm:table-cell">
                                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                                <Clock className="w-3 h-3" />
                                                {formatRelativeTime(c.last_visit_at)}
                                            </div>
                                        </TableCell>

                                        {/* Actions */}
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-7 h-7 text-muted-foreground hover:text-foreground"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedCustomer(c)
                                                }}
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>

                    {/* Load More */}
                    {hasMore && (
                        <div className="p-3 border-t border-border">
                            <Button
                                variant="ghost"
                                className="w-full text-muted-foreground hover:text-foreground"
                                onClick={loadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Load More
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Customer Detail Sheet */}
            <CustomerDetailDialog
                customer={selectedCustomer}
                open={!!selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
            />
        </div>
    )
}
