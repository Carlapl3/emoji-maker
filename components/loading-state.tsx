import { Skeleton } from "@/components/ui/skeleton"

export function LoadingState() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-64 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
            ))}
        </div>
    )
}
