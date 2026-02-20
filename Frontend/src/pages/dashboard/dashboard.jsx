import { useSelector, useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Globe,
    Search,
    Play,
    Loader2,
    Zap,
    ArrowRight,
} from "lucide-react"
import {
    setJobUrl,
    setJobType,
    runJob,
} from "@/store/dashboardSlice"
import { Link } from "react-router-dom"

export default function DashboardPage() {
    const dispatch = useDispatch()
    const { config, jobUrl, jobType, jobLoading, jobError, history } = useSelector(
        (state) => state.dashboard
    )
    const user = useSelector((state) => state.auth.user)

    const handleRun = () => {
        if (!jobUrl.trim()) return
        dispatch(runJob({ url: jobUrl, type: jobType, config }))
    }

    const recentJobs = history.slice(0, 3)

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Welcome */}
            <div>
                <h2 className="text-2xl font-bold text-neutral-900">
                    Welcome back, <span className="text-cyan-600">{user?.name || "User"}</span>
                </h2>
                <p className="text-neutral-500 mt-1">Start a new crawl or scrape job below.</p>
            </div>

            {/*  Run a Job  */}
            <Card className="border-neutral-200 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="px-5 pt-4 pb-1">
                        <h3 className="text-base font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-cyan-600" />
                            New Job
                        </h3>
                    </div>

                    {/* URL Input */}
                    <div className="px-5 pb-3">
                        <div className="relative">
                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400" />
                            <Input
                                value={jobUrl}
                                onChange={(e) => dispatch(setJobUrl(e.target.value))}
                                onKeyDown={(e) => e.key === "Enter" && handleRun()}
                                placeholder={jobType === "scrape" ? "https://example.com/page" : "https://example.com"}
                                className="pl-11 h-12 rounded-xl border-neutral-200 bg-neutral-50 text-sm focus-visible:ring-cyan-500"
                            />
                        </div>
                    </div>

                    {/* Tabs row + Go button */}
                    <div className="flex items-center justify-between px-5 pb-4">
                        <Tabs value={jobType} onValueChange={(v) => dispatch(setJobType(v))}>
                            <TabsList className="bg-transparent p-0 h-auto gap-1">
                                <TabsTrigger
                                    value="scrape"
                                    className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900 data-[state=active]:shadow-none transition-colors"
                                >
                                    <Search className="h-3.5 w-3.5 mr-1.5" /> Scrape
                                </TabsTrigger>
                                <TabsTrigger
                                    value="crawl"
                                    className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 data-[state=active]:bg-neutral-100 data-[state=active]:text-neutral-900 data-[state=active]:shadow-none transition-colors"
                                >
                                    <Globe className="h-3.5 w-3.5 mr-1.5" /> Crawl
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Button
                            onClick={handleRun}
                            disabled={jobLoading || !jobUrl.trim()}
                            className="h-10 w-10 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm transition-all hover:shadow-md p-0 flex items-center justify-center cursor-pointer"
                        >
                            {jobLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowRight className="h-4.5 w-4.5" />
                            )}
                        </Button>
                    </div>

                    {jobError && <p className="text-sm text-red-500 px-5 pb-4">{jobError}</p>}
                </CardContent>
            </Card>

            {/*  Recent Activity (quick preview) */}
            {recentJobs.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-neutral-900">Recent Activity</h3>
                        <Link to="/dashboard/history" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium inline-flex items-center gap-1">
                            View all <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {recentJobs.map((job) => (
                            <div
                                key={job.id}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 bg-white hover:shadow-sm transition-shadow"
                            >
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${job.type === "crawl" ? "bg-neutral-100 border border-neutral-200" : "bg-cyan-50 border border-cyan-100"}`}>
                                    {job.type === "crawl" ? <Globe className="h-4 w-4 text-neutral-600" /> : <Search className="h-4 w-4 text-cyan-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 truncate">{job.url}</p>
                                    <p className="text-xs text-neutral-400">{job.type} · {job.pagesFound} {job.pagesFound === 1 ? "page" : "pages"} · {job.duration}</p>
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${job.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                                    {job.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
