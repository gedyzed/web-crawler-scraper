import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function AppShellSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="h-16 border-b border-neutral-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#0a0e14]/80 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                </div>
            </div>
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                <Skeleton className="h-8 w-56" />
                <Card className="border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03]">
                    <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export function ConsolePreviewSkeleton() {
    return (
        <div className="space-y-3 py-2" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-5 bg-neutral-800" />
                    <Skeleton
                        className={`h-3 bg-neutral-700 ${idx % 3 === 0 ? "w-3/4" : idx % 3 === 1 ? "w-2/3" : "w-5/6"}`}
                    />
                </div>
            ))}
        </div>
    )
}

export function DashboardResultSkeleton() {
    return (
        <Card className="border-neutral-200 dark:border-white/10 shadow-sm overflow-hidden bg-white dark:bg-white/[0.03]">
            <CardContent className="p-0">
                <div className="px-5 pt-4 pb-3 border-b border-neutral-200 dark:border-white/10">
                    <Skeleton className="h-5 w-28" />
                </div>
                <div className="bg-neutral-950 p-5 space-y-3">
                    <Skeleton className="h-3 w-5/6 bg-neutral-700" />
                    <Skeleton className="h-3 w-2/3 bg-neutral-700" />
                    <Skeleton className="h-3 w-4/5 bg-neutral-700" />
                    <Skeleton className="h-3 w-1/2 bg-neutral-700" />
                </div>
            </CardContent>
        </Card>
    )
}

export function RecentJobsSkeletonGrid() {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-20" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, idx) => (
                    <Card key={idx} className="border-neutral-200 dark:border-white/10 bg-white dark:bg-[#131920]">
                        <CardContent className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <Skeleton className="h-4 w-14 rounded-full" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-white/5">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export function HistoryGridSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, idx) => (
                <Card key={idx} className="border-neutral-200 dark:border-white/10 bg-white dark:bg-[#131920]">
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <Skeleton className="h-4 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-20" />
                        <div className="grid grid-cols-3 gap-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export function ApiKeysListSkeleton() {
    return (
        <div className="space-y-6" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="pb-6 border-b border-neutral-100 dark:border-white/5 last:border-0 last:pb-0 space-y-3">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center justify-between gap-3">
                        <Skeleton className="h-10 flex-1 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                    <Skeleton className="h-3 w-24" />
                </div>
            ))}
        </div>
    )
}