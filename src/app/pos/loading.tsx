import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 glass border-b border-border">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16 opacity-50" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-32 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
            </header>

            <div className="flex border-b border-border">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex-1 py-4 px-4">
                        <Skeleton className="h-4 w-full mx-auto" />
                    </div>
                ))}
            </div>

            <div className="flex-1 p-4 max-w-lg mx-auto w-full space-y-6">
                <div className="space-y-2 text-center">
                    <Skeleton className="h-6 w-48 mx-auto" />
                    <Skeleton className="h-4 w-64 mx-auto opacity-50" />
                </div>
                <Skeleton className="w-full h-56 rounded-2xl" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 flex-1 rounded-lg" />
                    <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
            </div>
        </div>
    )
}
