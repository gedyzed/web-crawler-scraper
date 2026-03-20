import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Globe,
    Search,
    Loader2,
    Zap,
    ArrowRight,
    Code2,
    FileText,
    XCircle,
} from "lucide-react"
import {
    setJobUrl,
    setJobType,
    runJob,
    fetchHistory,
} from "@/store/dashboardSlice"
import { Link } from "react-router-dom"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useEffect } from "react"
import {
    DashboardResultSkeleton,
    RecentJobsSkeletonGrid,
} from "@/components/loading-skeletons"

export default function DashboardPage() {
    const dispatch = useAppDispatch()
    const { config, jobUrl, jobType, jobLoading, historyLoading, jobError, history, lastResult, searchQuery } = useAppSelector(
        (state) => state.dashboard
    )
    const user = useAppSelector((state) => state.auth.user)

    useEffect(() => {
        dispatch(fetchHistory())
    }, [dispatch])

    const handleRun = () => {
        if (!jobUrl.trim()) return
        dispatch(runJob({ url: jobUrl, type: jobType as 'crawl' | 'scrape', config }))
    }

    const recentJobs = history
        .filter(job => !searchQuery || job.url?.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 6)

    const getStatusColor = (status: string, code?: number) => {
        if (code === 200 || status.toLowerCase() === 'completed' || status.toLowerCase() === 'success') {
            return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30"
        }
        if (status.toLowerCase() === 'failed' || status.toLowerCase() === 'error' || (code && code >= 400)) {
            return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800/30"
        }
        return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30"
    }

    const getStatusText = (status: string, code?: number) => {
        if (code === 200 || status.toLowerCase() === 'completed' || status.toLowerCase() === 'success') return 'Success'
        if (status.toLowerCase() === 'failed' || status.toLowerCase() === 'error' || (code && code >= 400)) return 'Failed'
        return 'Pending'
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {/* Welcome */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    Welcome back, <span className="text-cyan-600">
                        {user?.name || (user?.firstname || user?.lastname
                            ? `${user?.firstname || ''} ${user?.lastname || ''}`.trim()
                            : user?.username || "User")}
                    </span>
                </h2>
                <p className="text-neutral-500 mt-1">Start a new crawl or scrape job below.</p>
            </div>

            {/*  Run a Job  */}
            <Card className="border-neutral-200 dark:border-white/10 shadow-sm overflow-hidden bg-white dark:bg-white/[0.03] max-w-3xl mx-auto">
                <CardContent className="p-6">
                    <div className="mb-4">
                        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-cyan-600" />
                            New Job
                        </h3>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* URL Input */}
                        <div className="relative">
                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400" />
                            <Input
                                value={jobUrl}
                                onChange={(e) => dispatch(setJobUrl(e.target.value))}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleRun();
                                    }
                                }}
                                placeholder="https://example.com/page"
                                className="pl-11 h-12 rounded-xl border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-sm focus-visible:ring-cyan-500"
                            />
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center justify-between">
                            <Tabs value={jobType} onValueChange={(v) => dispatch(setJobType(v as 'crawl' | 'scrape'))}>
                                <TabsList className="bg-transparent p-0 h-auto gap-1">
                                    <TabsTrigger
                                        value="scrape"
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 data-[state=active]:bg-neutral-100 dark:data-[state=active]:bg-white/10 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-100 transition-colors border border-neutral-200 dark:border-white/10 dark:data-[state=active]:border-white/20"
                                    >
                                        <Search className="h-3.5 w-3.5 mr-2" /> Scrape
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="crawl"
                                        className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 data-[state=active]:bg-neutral-100 dark:data-[state=active]:bg-white/10 data-[state=active]:text-neutral-900 dark:data-[state=active]:text-neutral-100 transition-colors border border-neutral-200 dark:border-white/10 dark:data-[state=active]:border-white/20"
                                    >
                                        <Globe className="h-3.5 w-3.5 mr-2" /> Crawl
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>

                            <Button
                                onClick={handleRun}
                                disabled={jobLoading || !jobUrl.trim()}
                                className="h-10 px-6 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-all hover:shadow-md flex items-center justify-center gap-2 cursor-pointer font-medium"
                            >
                                {jobLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Starting...
                                    </>
                                ) : (
                                    <>
                                        Start Job <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/*  Result Display / Error Display */}
            {jobError && (
                <Card className="border-red-200 dark:border-red-900/40 shadow-sm overflow-hidden bg-red-50/50 dark:bg-red-950/10">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-base font-semibold text-red-900 dark:text-red-400">Job Failed</h3>
                                <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                                    {jobError}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {lastResult && (
                <Card className="border-neutral-200 dark:border-white/10 shadow-sm overflow-hidden bg-white dark:bg-white/[0.03]">
                    <CardContent className="p-0">
                        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-neutral-200 dark:border-white/10">
                            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                <Code2 className="h-4 w-4 text-cyan-600" />
                                Job Result
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-neutral-200 dark:border-white/10 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                                onClick={() => {
                                    const blob = new Blob([JSON.stringify(lastResult, null, 2)], { type: "application/json" })
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement("a")
                                    a.href = url
                                    a.download = `result-${lastResult.CRID || 'data'}.json`
                                    a.click()
                                    URL.revokeObjectURL(url)
                                }}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Export JSON
                            </Button>
                        </div>
                        <div className="bg-neutral-950 p-5 overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                            <pre className="text-[13px] leading-relaxed font-mono text-neutral-300 whitespace-pre-wrap">
                                {JSON.stringify(lastResult, null, 2)}
                            </pre>
                        </div>
                    </CardContent>
                </Card>
            )}

            {historyLoading && !lastResult && !jobError && <DashboardResultSkeleton />}

            {/*  Recent Activity (Grid) */}
            {historyLoading ? (
                <RecentJobsSkeletonGrid />
            ) : recentJobs.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">Recent Activity</h3>
                        <Link to="/dashboard/history" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium inline-flex items-center gap-1">
                            View all <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentJobs.map((job) => (
                            <Link
                                key={job.hid}
                                to="/dashboard/history"
                                className="flex flex-col p-5 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#131920] hover:border-cyan-500/30 transition-colors group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
                                        <Globe className="h-4 w-4 text-neutral-500" />
                                    </div>
                                    <span className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(job.status, job.response_code)}`}>
                                        {getStatusText(job.status, job.response_code)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0 mb-4">
                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                        {job.url}
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                                        <span className="capitalize">{job.type || 'Scrape'}</span>
                                        <span>•</span>
                                        <span>{new Date(job.fetched_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-semibold text-neutral-700 dark:text-neutral-300 pt-4 border-t border-neutral-100 dark:border-white/5">
                                    <span>
                                        {job.pages_crawled ?? 1} pages
                                    </span>
                                    <span>
                                        {job.duration || 'N/A'}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
