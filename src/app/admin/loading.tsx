import { StatsSkeleton } from "@/components/admin/AdminSkeletons"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Loading() {
    return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>

            <StatsSkeleton />

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Activity — Last 30 Days</CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                </CardContent>
            </Card>
        </div>
    )
}
