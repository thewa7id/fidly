import { TableSkeleton, PageHeaderSkeleton } from "@/components/admin/AdminSkeletons"

export default function Loading() {
    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <PageHeaderSkeleton />
            <TableSkeleton />
        </div>
    )
}
