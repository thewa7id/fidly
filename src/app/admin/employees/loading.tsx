import { ListSkeleton, PageHeaderSkeleton } from "@/components/admin/AdminSkeletons"

export default function Loading() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <PageHeaderSkeleton />
            <ListSkeleton />
        </div>
    )
}
