import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="min-h-screen bg-background pb-8">
            {/* Header Skeleton */}
            <div className="px-4 pt-8 pb-4 text-center space-y-2">
                <Skeleton className="h-4 w-24 mx-auto opacity-50" />
                <Skeleton className="h-7 w-48 mx-auto" />
            </div>

            {/* Loyalty Card Skeleton */}
            <div className="px-4 flex justify-center mb-6">
                <Skeleton className="w-full max-w-sm h-[220px] rounded-[20px]" />
            </div>

            {/* Stats Skeleton */}
            <div className="px-4 grid grid-cols-3 gap-3 mb-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="stat-card border-white/5 bg-card/30 !p-3">
                        <Skeleton className="h-8 w-12 mx-auto mb-1" />
                        <Skeleton className="h-3 w-16 mx-auto opacity-50" />
                    </Card>
                ))}
            </div>

            {/* Buttons & Rewards Skeletons */}
            <div className="px-4 space-y-4">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <div className="space-y-2 pt-2">
                    <Skeleton className="h-5 w-40" />
                    <div className="space-y-2">
                        {[...Array(2)].map((_, i) => (
                            <Card key={i} className="bg-card/30 border-white/5">
                                <CardContent className="py-4 flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48 opacity-50" />
                                    </div>
                                    <Skeleton className="h-6 w-12 rounded-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
