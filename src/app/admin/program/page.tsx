'use client'

import { useState, useEffect } from 'react'
import { Star, Save, Loader2, Zap, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import type { LoyaltyProgram } from '@/lib/types'

export default function ProgramPage() {
    const [program, setProgram] = useState<LoyaltyProgram | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch('/api/admin/program')
            .then(r => r.json())
            .then(d => {
                setProgram(d.data?.[0] ?? null)
                setLoading(false)
            })
    }, [])

    function handleChange(key: keyof LoyaltyProgram, value: any) {
        if (!program) return
        setProgram(prev => prev ? { ...prev, [key]: value } : prev)
    }

    async function handleSave() {
        if (!program) return
        setSaving(true)
        const res = await fetch('/api/admin/program', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(program),
        })
        const data = await res.json()
        if (data.success) toast.success('Program saved!')
        else toast.error(data.error)
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Loyalty Program</h1>
                <p className="text-muted-foreground">Configure your loyalty rules and earning mechanics.</p>
            </div>

            {program ? (
                <Tabs defaultValue={program.type} onValueChange={v => handleChange('type', v as 'stamps' | 'points')}>
                    <TabsList className="bg-muted/50 border border-border">
                        <TabsTrigger value="stamps" className="flex items-center gap-2">
                            <Star className="w-4 h-4" /> Stamps
                        </TabsTrigger>
                        <TabsTrigger value="points" className="flex items-center gap-2">
                            <Zap className="w-4 h-4" /> Points
                        </TabsTrigger>
                    </TabsList>

                    <Card className="bg-card border-border mt-4">
                        <CardHeader>
                            <CardTitle className="text-foreground">Program Settings</CardTitle>
                            <CardDescription>Changes apply to all future transactions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Program Name</Label>
                                <Input
                                    value={program.name}
                                    onChange={e => handleChange('name', e.target.value)}
                                    className="bg-muted/50 border-border"
                                />
                            </div>

                            <TabsContent value="stamps" className="mt-0 space-y-4">
                                <div className="space-y-2">
                                    <Label>Stamps Required for Reward</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={program.stamps_required ?? 10}
                                        onChange={e => handleChange('stamps_required', parseInt(e.target.value))}
                                        className="bg-muted/50 border-border"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Customer earns 1 stamp per visit. Reward unlocks at {program.stamps_required} stamps.
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Stamps Expiry Days</Label>
                                        <Input
                                            type="number"
                                            placeholder="Never (leave empty)"
                                            value={program.stamps_expiry_days ?? ''}
                                            onChange={e => handleChange('stamps_expiry_days', e.target.value ? parseInt(e.target.value) : null)}
                                            className="bg-muted/50 border-border"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="points" className="mt-0 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Points per Currency Unit</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min={0.01}
                                            value={program.points_per_currency_unit ?? 1}
                                            onChange={e => handleChange('points_per_currency_unit', parseFloat(e.target.value))}
                                            className="bg-muted/50 border-border"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Currency Unit</Label>
                                        <Select
                                            value={program.currency_unit ?? 'USD'}
                                            onValueChange={v => handleChange('currency_unit', v)}
                                        >
                                            <SelectTrigger className="bg-muted/50 border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {['USD', 'EUR', 'GBP', 'AED', 'SAR', 'EGP', 'CAD', 'AUD'].map(c => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Points Expiry Days</Label>
                                    <Input
                                        type="number"
                                        placeholder="Never (leave empty)"
                                        value={program.points_expiry_days ?? ''}
                                        onChange={e => handleChange('points_expiry_days', e.target.value ? parseInt(e.target.value) : null)}
                                        className="bg-muted/50 border-border"
                                    />
                                </div>
                            </TabsContent>

                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={program.is_active}
                                        onCheckedChange={v => handleChange('is_active', v)}
                                    />
                                    <Label>Program Active</Label>
                                </div>
                                <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-foreground">
                                    {saving ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Saving...</> : <><Save className="mr-2 w-4 h-4" /> Save Changes</>}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </Tabs>
            ) : (
                <Card className="bg-card border-border">
                    <CardContent className="pt-6 text-center text-muted-foreground">
                        No loyalty program found. Please contact support.
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
