import { TableSkeleton } from "@/components/ui/skeleton-loader";
import { Skeleton } from "@/components/ui/skeleton-loader";

export default function StockVerificationLoading() {
    return (
        <div className="container mx-auto py-6 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-10 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
            </div>

            <TableSkeleton />
        </div>
    );
}
