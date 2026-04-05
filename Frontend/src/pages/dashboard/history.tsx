import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Globe,
    Clock,
    ExternalLink,
    Trash2,
    History as HistoryIcon,
    FileText,
    Download,
} from "lucide-react"
import api from "@/lib/api"
import { clearHistory } from "@/store/dashboardSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { type HistoryItem, fetchHistory } from "@/store/dashboardSlice"
import { HistoryGridSkeleton } from "@/components/loading-skeletons"

function formatShortDate(dateStr: string) {
    if (!dateStr) return "N/A"
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
}

function getStatusColor(status: string, code?: number) {
    const normalized = status.toLowerCase()

    if (normalized === 'failed' || normalized === 'error' || (code !== undefined && code >= 400)) {
        return "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800/30"
    }
    if (normalized === 'completed' || normalized === 'success') {
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30"
    }
    if (normalized === 'pending' || normalized === 'queued' || normalized === 'running') {
        return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30"
    }
    if (code === 200) {
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30"
    }
    return "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30"
}

function getStatusText(status: string, code?: number) {
    const normalized = status.toLowerCase()

    if (normalized === 'failed' || normalized === 'error' || (code !== undefined && code >= 400)) return 'Failed'
    if (normalized === 'completed' || normalized === 'success') return 'Success'
    if (normalized === 'pending' || normalized === 'queued' || normalized === 'running') return 'Pending'
    if (code === 200) return 'Success'
    return 'Pending'
}

interface HistoryCardProps {
    job: HistoryItem
}

function HistoryCard({ job }: HistoryCardProps) {
    return (
        <Card className="border-neutral-200 dark:border-white/10 bg-white dark:bg-[#131920] hover:border-cyan-500/30 transition-all duration-200 group">
            <CardContent className="p-5 flex flex-col h-full">
                {/* Top: Icon + Status Badge */}
                <div className="flex items-start justify-between mb-4">
                    <div className="h-9 w-9 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-neutral-500" />
                    </div>
                    <span className={`px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${getStatusColor(job.status, job.response_code)}`}>
                        {getStatusText(job.status, job.response_code)}
                    </span>
                </div>

                {/* URL + Type */}
                <div className="flex-1 min-w-0 mb-4">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {job.url}
                    </p>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-white/10 capitalize">
                        {job.type || 'Scrape'}
                    </span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-sm bg-neutral-50 dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5 mb-4 text-center">
                    <div>
                        <div className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider mb-0.5">Pages</div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{job.pages_crawled ?? 1}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider mb-0.5">Duration</div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{job.duration || 'N/A'}</div>
                    </div>
                    <div>
                        <div className="text-[10px] text-neutral-400 uppercase font-semibold tracking-wider mb-0.5">Size</div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{job.size || 'N/A'}</div>
                    </div>
                </div>

                {/* Footer: Date + Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                        <Clock className="h-3 w-3" />
                        {formatShortDate(job.fetched_at)}
                    </div>
                    <div className="flex items-center gap-1">
                        <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md text-neutral-400 hover:text-cyan-600 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                            title="Open URL"
                            onClick={e => e.stopPropagation()}
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                        <button
                            onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                    console.log("Fetching full result for job", job.hid)
                                    const response = await api.get(`/history/${job.hid}/result`)
                                    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" })
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement("a")
                                    a.href = url
                                    a.download = `job-result-${job.hid}.json`
                                    a.click()
                                    URL.revokeObjectURL(url)
                                } catch (err) {
                                    console.error("Failed to download result", err)
                                    const blob = new Blob([JSON.stringify(job, null, 2)], { type: "application/json" })
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement("a")
                                    a.href = url
                                    a.download = `job-metadata-${job.hid}.json`
                                    a.click()
                                    URL.revokeObjectURL(url)
                                }
                            }}
                            className="p-1.5 rounded-md text-neutral-400 hover:text-cyan-600 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                            title="Download JSON"
                        >
                            <Download className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

type FilterTab = 'all' | 'success' | 'failed' | 'pending'

export default function HistoryPage() {
    const dispatch = useAppDispatch()
    const { history, historyLoading, searchQuery } = useAppSelector((state) => state.dashboard)
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

    useEffect(() => {
        dispatch(fetchHistory())
    }, [dispatch])

    const filteredHistory = history.filter(job => {
        const matchesStatus = activeFilter === 'all' || getStatusText(job.status, job.response_code).toLowerCase() === activeFilter
        const matchesSearch = !searchQuery || job.url?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesStatus && matchesSearch
    })

    const filters: { label: string, value: FilterTab }[] = [
        { label: 'All', value: 'all' },
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
        { label: 'Pending', value: 'pending' },
    ]

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Job History</h2>
                    <p className="text-neutral-500 mt-1">View and manage all your scrape and crawl jobs.</p>
                </div>
                {history.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement("a")
                                a.href = url
                                a.download = `spidergo-history-${new Date().toISOString().split('T')[0]}.json`
                                a.click()
                                URL.revokeObjectURL(url)
                            }}
                            className="h-9 px-4 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Export All
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dispatch(clearHistory())}
                            className="h-9 px-4 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear all
                        </Button>
                    </div>
                )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {filters.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setActiveFilter(f.value)}
                        className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${activeFilter === f.value
                            ? 'bg-neutral-900 dark:bg-white/10 text-white dark:text-neutral-100'
                            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* History Grid */}
            {historyLoading ? (
                <HistoryGridSkeleton />
            ) : filteredHistory.length === 0 ? (
                <Card className="border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03]">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-neutral-400">
                        <HistoryIcon className="h-12 w-12 mb-3 text-neutral-300 dark:text-neutral-600" />
                        <p className="text-base font-medium text-neutral-500">
                            {activeFilter === 'all' ? 'No history yet' : `No ${activeFilter} jobs`}
                        </p>
                        <p className="text-sm text-neutral-400 mt-1">
                            {activeFilter === 'all' ? 'Run a crawl or scrape job to see it here' : 'Try a different filter'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredHistory.map((job) => (
                        <HistoryCard key={job.hid} job={job} />
                    ))}
                </div>
            )}
        </div>
    )
}
