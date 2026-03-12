import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeaderSkeleton } from "@/components/admin/AdminSkeletons"

export default function Loading() {
    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {/* Rewards Section Skeleton */}
            <div className="space-y-6">
                <PageHeaderSkeleton />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="bg-card border-border">
                            <CardContent className="pt-5">
                                <Skeleton className="h-5 w-24 rounded-full mb-3" />
                                <Skeleton className="h-6 w-48 mb-2" />
                                <Skeleton className="h-4 w-full mb-4" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Bonus Rewards Section Skeleton */}
            <div className="space-y-6 pt-10 border-t border-border">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="bg-card/30 border-border">
                            <CardContent className="pt-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-4">
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
