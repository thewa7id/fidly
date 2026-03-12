import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Zap, Star, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Subscription' }

const plans = [
    {
        name: 'Free',
        price: 0,
        description: 'Perfect for small shops',
        icon: Star,
        features: [
            '1 branch',
            'Up to 30 customers',
            'Owner-only POS (0 employees)',
            'Stamp-based program',
            'Basic analytics',
            'Goyalty Solution Branding',
        ],
        limits: { customers: 30, branches: 1, employees: 0 },
    },
    {
        name: 'Pro',
        price: 49,
        description: 'Everything you need to grow',
        icon: Zap,
        popular: true,
        features: [
            '2 branches',
            '1,000 customers',
            '4 employee accounts',
            'NFC Support (Link/Scan)',
            'Apple & Google Wallet',
            'Points-based programs',
            'Basic Marketing (5 pushes/mo)',
            'Full customization',
        ],
        limits: { customers: 1000, branches: 2, employees: 4 },
    },
    {
        name: 'Platinium',
        price: 199,
        description: 'For chains & enterprises',
        icon: Building2,
        features: [
            '5 branches',
            '5,000 customers',
            '10 employee accounts',
            'Scheduled Marketing Campaigns',
            'Advanced Analytics suite',
            'API Access & Integrations',
            'Priority Support',
            'All Pro features included',
        ],
        limits: { customers: 5000, branches: 5, employees: 10 },
    },
]

export default function SubscriptionPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground mb-2">Subscription Plans</h1>
                <p className="text-muted-foreground">Choose the plan that fits your business</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <Card
                        key={plan.name}
                        className={`relative border ${plan.popular ? 'border-primary/50 bg-primary/5' : 'border-border bg-card'}`}
                    >
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className="gradient-primary border-0 text-foreground px-4">Most Popular</Badge>
                            </div>
                        )}
                        <CardHeader className="pt-6">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${plan.popular ? 'gradient-primary' : 'bg-muted/50'}`}>
                                <plan.icon className={`w-5 h-5 ${plan.popular ? 'text-foreground' : 'text-muted-foreground'}`} />
                            </div>
                            <CardTitle className="text-foreground">{plan.name}</CardTitle>
                            <p className="text-muted-foreground text-sm">{plan.description}</p>
                            <div className="flex items-baseline gap-1 mt-2">
                                <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                                <span className="text-muted-foreground">/mo</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {plan.features.map(f => (
                                <div key={f} className="flex items-start gap-2 text-sm">
                                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground">{f}</span>
                                </div>
                            ))}

                            <div className="pt-4">
                                <Button
                                    className={`w-full ${plan.popular ? 'gradient-primary border-0 text-foreground' : 'border-border'}`}
                                    variant={plan.popular ? 'default' : 'outline'}
                                >
                                    {plan.price === 0 ? 'Current Plan' : `Upgrade to ${plan.name}`}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-card border-border">
                <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground text-sm">
                        Need custom pricing?{' '}
                        <a href="mailto:sales@goyalty.app" className="text-primary hover:underline">Contact our sales team</a>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
