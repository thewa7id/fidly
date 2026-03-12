import { Skeleton } from "@/components/ui/skeleton"

export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="stat-card">
                    <div className="flex items-start justify-between mb-4">
                        <Skeleton className="h-9 w-9 rounded-xl" />
                    </div>
                    <Skeleton className="h-10 w-24 mb-1" />
                    <Skeleton className="h-4 w-32" />
                </div>
            ))}
        </div>
    )
}

export function ListSkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-[72px] w-full bg-card/30 border border-border rounded-xl p-4 flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-60" />
                    </div>
                    <div className="hidden sm:flex gap-4">
                        <Skeleton className="h-10 w-12" />
                        <Skeleton className="h-10 w-12" />
                    </div>
                    <Skeleton className="h-4 w-4 shrink-0" />
                </div>
            ))}
        </div>
    )
}

export function TableSkeleton() {
    return (
        <div className="rounded-xl border border-border bg-card/30 overflow-hidden">
            {/* Header row */}
            <div className="flex items-center gap-4 px-4 py-3 border-b border-border">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16 hidden md:block" />
                <Skeleton className="h-4 w-14 hidden md:block" />
                <Skeleton className="h-4 w-20 hidden lg:block" />
                <Skeleton className="h-4 w-20 hidden lg:block" />
                <Skeleton className="h-4 w-20 hidden sm:block" />
                <Skeleton className="h-4 w-6" />
            </div>
            {/* Data rows */}
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-14 hidden md:block" />
                    <Skeleton className="h-4 w-12 hidden md:block" />
                    <Skeleton className="h-5 w-20 rounded-full hidden lg:block" />
                    <Skeleton className="h-4 w-16 hidden lg:block" />
                    <Skeleton className="h-4 w-16 hidden sm:block" />
                    <Skeleton className="h-7 w-7 rounded" />
                </div>
            ))}
        </div>
    )
}

export function PageHeaderSkeleton() {
    return (
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-32" />
        </div>
    )
}
