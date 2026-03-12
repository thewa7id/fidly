import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeaderSkeleton } from "@/components/admin/AdminSkeletons"

export default function Loading() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <PageHeaderSkeleton />

            {/* QR Card Skeleton */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                        <Skeleton className="h-[140px] w-[140px] rounded-2xl shrink-0" />
                        <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-full rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-40" />
                                <Skeleton className="h-3 w-40" />
                                <Skeleton className="h-3 w-40" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Branches Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="bg-card border-border">
                        <CardContent className="pt-5">
                            <div className="flex items-start justify-between mb-4">
                                <Skeleton className="h-8 w-8 rounded-xl" />
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-32 mt-1" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
