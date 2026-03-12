'use client'

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface DataPoint {
    date: string
    newCustomers: number
    transactions: number
}

interface AdminAnalyticsChartProps {
    data: DataPoint[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-xl p-3 border bg-popover text-popover-foreground shadow-md text-sm">
                <p className="text-muted-foreground mb-2">{label}</p>
                {payload.map((entry: any) => (
                    <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                        <span>{entry.name}: <strong>{entry.value}</strong></span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

export default function AdminAnalyticsChart({ data }: AdminAnalyticsChartProps) {
    if (!data.length) {
        return (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data available for this period
            </div>
        )
    }

    const formattedData = data.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))

    // Use the primary brand color (#F18701) for the main chart line
    const primaryColor = '#F18701'
    const secondaryColor = '#2563eb'

    return (
        <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="gradTransactions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCustomers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={secondaryColor} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    formatter={(value) => <span className="text-muted-foreground text-xs">{value}</span>}
                />
                <Area
                    type="monotone"
                    dataKey="transactions"
                    name="Transactions"
                    stroke={primaryColor}
                    strokeWidth={2}
                    fill="url(#gradTransactions)"
                    dot={false}
                />
                <Area
                    type="monotone"
                    dataKey="newCustomers"
                    name="New Customers"
                    stroke={secondaryColor}
                    strokeWidth={2}
                    fill="url(#gradCustomers)"
                    dot={false}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}
