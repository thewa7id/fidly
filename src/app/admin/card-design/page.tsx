'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, Loader2, Upload, X, Link2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import LoyaltyCard from '@/components/loyalty/LoyaltyCard'
import StampGrid from '@/components/loyalty/StampGrid'
import type { CardDesignConfig, StampDesignConfig } from '@/lib/types'

const defaultCard: CardDesignConfig = {
    backgroundType: 'gradient',
    backgroundColor: '#1a1a2e',
    gradientFrom: '#16213e',
    gradientTo: '#0f3460',
    gradientAngle: 135,
    backgroundImageUrl: null,
    accentColor: '#e94560',
    textColor: '#ffffff',
    brandName: 'My Loyalty',
    logoUrl: null,
    fontFamily: 'Inter',
    progressBarStyle: 'rounded',
    progressBarColor: '#e94560',
    cardBorderRadius: 16,
    layoutType: 'classic',
    heroImageUrl: null,
    codeType: 'qr',
    showBranchName: true,
    socialLinks: null,
}

const defaultStamp: StampDesignConfig = {
    iconType: 'star',
    iconUrl: null,
    filledColor: '#e94560',
    emptyColor: '#ffffff30',
    filledAnimation: 'bounce',
    emptyStyle: 'outline',
    size: 'medium',
    labelText: 'Stamps',
}

function UploadButton({
    label, value, onUpload, onClear,
}: {
    label: string
    value: string | null
    onUpload: (url: string) => void
    onClear: () => void
}) {
    const ref = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)

        try {
            const form = new FormData()
            form.append('file', file)

            const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
            const data = await res.json()

            if (!res.ok || !data.url) {
                toast.error(data.error ?? 'Upload failed')
            } else {
                onUpload(data.url)
                toast.success('Image uploaded!')
            }
        } catch {
            toast.error('Upload failed – check your connection')
        }

        setUploading(false)
        if (ref.current) ref.current.value = ''
    }

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            {value ? (
                <div className="relative w-full rounded-xl overflow-hidden border border-border bg-muted/50">
                    <img src={value} alt={label} className="w-full h-28 object-cover" />
                    <button
                        type="button"
                        onClick={onClear}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-foreground hover:bg-red-500/80 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => ref.current?.click()}
                    disabled={uploading}
                    className="w-full h-24 rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    <span className="text-xs">{uploading ? 'Uploading…' : 'Click to upload (max 5 MB)'}</span>
                </button>
            )}
            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
    )
}

export default function CardDesignPage() {
    const [cardConfig, setCardConfig] = useState<CardDesignConfig>(defaultCard)
    const [stampConfig, setStampConfig] = useState<StampDesignConfig>(defaultStamp)
    const [stampCount, setStampCount] = useState(7)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/card-design').then(r => r.json()),
            fetch('/api/admin/stamp-design').then(r => r.json()),
        ]).then(([cardData, stampData]) => {
            if (cardData.data?.config) setCardConfig({ ...defaultCard, ...cardData.data.config })
            if (stampData.data?.config) setStampConfig({ ...defaultStamp, ...stampData.data.config })
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    function updateCard(key: keyof CardDesignConfig, value: any) {
        setCardConfig(prev => ({ ...prev, [key]: value }))
    }

    function updateSocial(key: string, value: string) {
        setCardConfig(prev => ({
            ...prev,
            socialLinks: { ...(prev.socialLinks ?? {}), [key]: value },
        }))
    }

    function updateStamp(key: keyof StampDesignConfig, value: any) {
        setStampConfig(prev => ({ ...prev, [key]: value }))
    }

    async function handleSave() {
        setSaving(true)
        const [cardRes, stampRes] = await Promise.all([
            fetch('/api/admin/card-design', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: cardConfig }),
            }),
            fetch('/api/admin/stamp-design', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: stampConfig }),
            }),
        ])
        const [cardData, stampData] = await Promise.all([cardRes.json(), stampRes.json()])
        if (cardData.success && stampData.success) toast.success('Designs saved!')
        else toast.error('Failed to save designs')
        setSaving(false)
    }

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Card Design</h1>
                    <p className="text-muted-foreground">Customize how your loyalty card looks to customers.</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 text-foreground">
                    {saving ? <><Loader2 className="mr-2 w-4 h-4 animate-spin" /> Saving...</> : <><Save className="mr-2 w-4 h-4" /> Save Design</>}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="space-y-4">
                    <Card className="bg-card border-border sticky top-6">
                        <CardHeader>
                            <CardTitle className="text-foreground text-base">Live Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-6 pb-8">
                            <LoyaltyCard
                                config={cardConfig}
                                customerName="Jane Smith"
                                availableStamps={stampCount}
                                stampsRequired={10}
                                stampConfig={stampConfig}
                            />
                            <div className="flex items-center gap-3">
                                <Label className="text-muted-foreground text-sm">Preview stamps:</Label>
                                <input
                                    type="range" min={0} max={10} value={stampCount}
                                    onChange={e => setStampCount(parseInt(e.target.value))}
                                    className="w-32 h-2 accent-primary"
                                />
                                <span className="text-foreground text-sm font-mono w-8">{stampCount}/10</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Controls */}
                <div>
                    <Tabs defaultValue="card">
                        <TabsList className="bg-muted/50 border border-border mb-4">
                            <TabsTrigger value="card">Card Design</TabsTrigger>
                            <TabsTrigger value="stamps">Stamp Design</TabsTrigger>
                            <TabsTrigger value="social">Social & Links</TabsTrigger>
                        </TabsList>

                        {/* ── CARD DESIGN TAB ── */}
                        <TabsContent value="card" className="space-y-4">
                            <Card className="bg-card border-border">
                                <CardContent className="pt-5 space-y-5">
                                    <div className="space-y-4 pb-4 border-b border-border">
                                        <div className="space-y-2">
                                            <Label>Layout Style</Label>
                                            <Select value={cardConfig.layoutType} onValueChange={v => updateCard('layoutType', v)}>
                                                <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="classic">Classic (Digital Card)</SelectItem>
                                                    <SelectItem value="modern">Modern (Premium Image Style)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {cardConfig.layoutType === 'modern' && (
                                            <UploadButton
                                                label="Hero / Cover Image (Modern Layout only)"
                                                value={cardConfig.heroImageUrl}
                                                onUpload={url => updateCard('heroImageUrl', url)}
                                                onClear={() => updateCard('heroImageUrl', null)}
                                            />
                                        )}

                                        <div className="space-y-2">
                                            <Label>Customer Identification Code</Label>
                                            <Select value={cardConfig.codeType} onValueChange={v => updateCard('codeType', v)}>
                                                <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="qr">QR Code</SelectItem>
                                                    <SelectItem value="barcode">PDF417 2D Barcode</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-[10px] text-muted-foreground italic">PDF417 barcodes are perfect for handheld scanners. QR codes are better for mobile-to-mobile scanning.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2">
                                        <Label>Brand Name</Label>
                                        <Input value={cardConfig.brandName} onChange={e => updateCard('brandName', e.target.value)} className="bg-muted/50 border-border" />
                                    </div>

                                    {/* Background type */}
                                    <div className="space-y-2">
                                        <Label>Background Type</Label>
                                        <Select value={cardConfig.backgroundType} onValueChange={v => updateCard('backgroundType', v)}>
                                            <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="solid">Solid Color</SelectItem>
                                                <SelectItem value="gradient">Gradient</SelectItem>
                                                <SelectItem value="image">Background Image</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {cardConfig.backgroundType === 'gradient' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>From</Label>
                                                <div className="flex gap-2">
                                                    <input type="color" value={cardConfig.gradientFrom} onChange={e => updateCard('gradientFrom', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                                                    <Input value={cardConfig.gradientFrom} onChange={e => updateCard('gradientFrom', e.target.value)} className="bg-muted/50 border-border font-mono" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>To</Label>
                                                <div className="flex gap-2">
                                                    <input type="color" value={cardConfig.gradientTo} onChange={e => updateCard('gradientTo', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                                                    <Input value={cardConfig.gradientTo} onChange={e => updateCard('gradientTo', e.target.value)} className="bg-muted/50 border-border font-mono" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {cardConfig.backgroundType === 'solid' && (
                                        <div className="space-y-2">
                                            <Label>Background Color</Label>
                                            <div className="flex gap-2">
                                                <input type="color" value={cardConfig.backgroundColor} onChange={e => updateCard('backgroundColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                                                <Input value={cardConfig.backgroundColor} onChange={e => updateCard('backgroundColor', e.target.value)} className="bg-muted/50 border-border font-mono" />
                                            </div>
                                        </div>
                                    )}

                                    {cardConfig.backgroundType === 'image' && (
                                        <UploadButton
                                            label="Background Image"
                                            value={cardConfig.backgroundImageUrl}
                                            onUpload={url => updateCard('backgroundImageUrl', url)}
                                            onClear={() => updateCard('backgroundImageUrl', null)}
                                        />
                                    )}

                                    <div className="space-y-2">
                                        <Label>Accent Color</Label>
                                        <div className="flex gap-2">
                                            <input type="color" value={cardConfig.accentColor} onChange={e => updateCard('accentColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                                            <Input value={cardConfig.accentColor} onChange={e => updateCard('accentColor', e.target.value)} className="bg-muted/50 border-border font-mono" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Text Color</Label>
                                        <div className="flex gap-2">
                                            <input type="color" value={cardConfig.textColor} onChange={e => updateCard('textColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                                            <Input value={cardConfig.textColor} onChange={e => updateCard('textColor', e.target.value)} className="bg-muted/50 border-border font-mono" />
                                        </div>
                                    </div>

                                    {/* Logo upload */}
                                    <UploadButton
                                        label="Logo / Brand Icon"
                                        value={cardConfig.logoUrl}
                                        onUpload={url => updateCard('logoUrl', url)}
                                        onClear={() => updateCard('logoUrl', null)}
                                    />

                                    <div className="space-y-2">
                                        <Label>Font Family</Label>
                                        <Select value={cardConfig.fontFamily} onValueChange={v => updateCard('fontFamily', v)}>
                                            <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {['Inter', 'Poppins', 'Roboto', 'Montserrat', 'Playfair Display', 'Space Grotesk'].map(f => (
                                                    <SelectItem key={f} value={f}>{f}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Progress Bar Style</Label>
                                        <Select value={cardConfig.progressBarStyle} onValueChange={v => updateCard('progressBarStyle', v as any)}>
                                            <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="rounded">Rounded</SelectItem>
                                                <SelectItem value="square">Square</SelectItem>
                                                <SelectItem value="pill">Pill</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Progress Bar Color</Label>
                                        <div className="flex gap-2">
                                            <input type="color" value={cardConfig.progressBarColor} onChange={e => updateCard('progressBarColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                                            <Input value={cardConfig.progressBarColor} onChange={e => updateCard('progressBarColor', e.target.value)} className="bg-muted/50 border-border font-mono" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Card Border Radius</Label>
                                        <div className="flex items-center gap-3">
                                            <input type="range" min={0} max={32} value={cardConfig.cardBorderRadius} onChange={e => updateCard('cardBorderRadius', parseInt(e.target.value))} className="flex-1 accent-primary" />
                                            <span className="text-foreground text-sm font-mono w-8">{cardConfig.cardBorderRadius}px</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Switch checked={cardConfig.showBranchName} onCheckedChange={v => updateCard('showBranchName', v)} />
                                        <Label>Show Branch Name</Label>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── STAMP DESIGN TAB ── */}
                        <TabsContent value="stamps" className="space-y-4">
                            <Card className="bg-card border-border">
                                <CardContent className="pt-5 space-y-5">
                                    <div className="space-y-2">
                                        <Label>Stamp Icon</Label>
                                        <Select value={stampConfig.iconType} onValueChange={v => updateStamp('iconType', v as any)}>
                                            <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {['star', 'heart', 'circle', 'crown', 'diamond', 'coffee'].map(i => (
                                                    <SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>
                                                ))}
                                                <SelectItem value="custom">Custom Logo / Image</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Custom stamp logo upload */}
                                    {stampConfig.iconType === 'custom' && (
                                        <UploadButton
                                            label="Custom Stamp Logo"
                                            value={stampConfig.iconUrl}
                                            onUpload={url => updateStamp('iconUrl', url)}
                                            onClear={() => updateStamp('iconUrl', null)}
                                        />
                                    )}

                                    {stampConfig.iconType !== 'custom' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Filled Color</Label>
                                                <div className="flex gap-2">
                                                    <input type="color" value={stampConfig.filledColor} onChange={e => updateStamp('filledColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
                                                    <Input value={stampConfig.filledColor} onChange={e => updateStamp('filledColor', e.target.value)} className="bg-muted/50 border-border font-mono text-sm" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Empty Style</Label>
                                                <Select value={stampConfig.emptyStyle} onValueChange={v => updateStamp('emptyStyle', v as any)}>
                                                    <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="outline">Outline</SelectItem>
                                                        <SelectItem value="filled">Filled</SelectItem>
                                                        <SelectItem value="dashed">Dashed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Fill Animation</Label>
                                        <Select value={stampConfig.filledAnimation} onValueChange={v => updateStamp('filledAnimation', v as any)}>
                                            <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bounce">Bounce</SelectItem>
                                                <SelectItem value="pulse">Pulse</SelectItem>
                                                <SelectItem value="scale">Scale In</SelectItem>
                                                <SelectItem value="none">None</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Stamp Size</Label>
                                        <Select value={stampConfig.size} onValueChange={v => updateStamp('size', v as any)}>
                                            <SelectTrigger className="bg-muted/50 border-border"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="small">Small</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="large">Large</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Label Text</Label>
                                        <Input value={stampConfig.labelText} onChange={e => updateStamp('labelText', e.target.value)} className="bg-muted/50 border-border" />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ── SOCIAL & LINKS TAB ── */}
                        <TabsContent value="social" className="space-y-4">
                            <Card className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle className="text-foreground text-sm flex items-center gap-2">
                                        <Link2 className="w-4 h-4 text-primary" /> Social Media on Card
                                    </CardTitle>
                                    <p className="text-muted-foreground text-xs">Links added here appear as icons at the bottom of the customer's loyalty card.</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {[
                                        { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourbrand', icon: '📸' },
                                        { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/yourbrand', icon: '🐦' },
                                        { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourbrand', icon: '📘' },
                                        { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourbrand', icon: '🎵' },
                                        { key: 'website', label: 'Website', placeholder: 'https://yourbrand.com', icon: '🌐' },
                                    ].map(({ key, label, placeholder, icon }) => (
                                        <div key={key} className="space-y-1.5">
                                            <Label className="flex items-center gap-1.5 text-sm">
                                                <span>{icon}</span> {label}
                                            </Label>
                                            <Input
                                                type="url"
                                                placeholder={placeholder}
                                                value={cardConfig.socialLinks?.[key as keyof typeof cardConfig.socialLinks] ?? ''}
                                                onChange={e => updateSocial(key, e.target.value)}
                                                className="bg-muted/50 border-border text-sm"
                                            />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
