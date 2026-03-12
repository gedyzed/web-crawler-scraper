import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Globe,
    Clock,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Trash2,
    History as HistoryIcon,
    ChevronDown,
    ChevronUp,
    FileText,
    Code2,
} from "lucide-react"
import { clearHistory } from "@/store/dashboardSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { type HistoryItem, fetchHistory } from "@/store/dashboardSlice"

function formatDate(dateStr: string) {
    if (!dateStr) return "N/A"
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

interface JsonBlockProps {
    data: any
    label: string
}

function JsonBlock({ data, label }: JsonBlockProps) {
    return (
        <div className="rounded-xl border border-neutral-200 dark:border-white/10 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10">
                <Code2 className="h-3.5 w-3.5 text-neutral-500" />
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">{label}</span>
            </div>
            <div className="bg-neutral-950 p-4 overflow-x-auto custom-scrollbar">
                <pre className="text-[13px] leading-relaxed font-mono text-neutral-300 whitespace-pre-wrap">
                    {JSON.stringify(data, null, 2)}
                </pre>
            </div>
        </div>
    )
}

interface HistoryCardProps {
    job: HistoryItem
}

function HistoryCard({ job }: HistoryCardProps) {
    const [expanded, setExpanded] = useState(false)

    return (
        <Card className={`border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03] transition-all duration-200 ${expanded ? "shadow-lg ring-1 ring-neutral-200 dark:ring-white/10" : "hover:shadow-md"}`}>
            {/* Card Header — always visible */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-left cursor-pointer"
            >
                <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10`}>
                            <Globe className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                        </div>

                        {/* Main info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{job.url}</p>
                                <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-neutral-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs text-neutral-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(job.fetched_at)}
                                </span>
                            </div>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center gap-3 shrink-0">
                            <Badge
                                variant="outline"
                                className="text-xs bg-neutral-100 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-white/10"
                            >
                                {job.status}
                            </Badge>
                            {job.response_code === 200 ? (
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-4.5 w-4.5" />
                                    <span className="text-xs font-medium hidden sm:inline">Success</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400">
                                    <XCircle className="h-4.5 w-4.5" />
                                    <span className="text-xs font-medium hidden sm:inline">Error</span>
                                </div>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 border-neutral-200 dark:border-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/10 text-[10px] sm:text-xs font-semibold uppercase tracking-wider gap-1.5 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    const blob = new Blob([JSON.stringify(job, null, 2)], { type: "application/json" })
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement("a")
                                    a.href = url
                                    a.download = `job-${job.hid}.json`
                                    a.click()
                                    URL.revokeObjectURL(url)
                                }}
                                title="Export to JSON"
                            >
                                <Code2 className="h-3.5 w-3.5" />
                                <span>Export</span>
                            </Button>
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${expanded ? "bg-neutral-100 dark:bg-white/10" : "bg-neutral-50 dark:bg-white/5"}`}>
                                {expanded ? (
                                    <ChevronUp className="h-4 w-4 text-neutral-500" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </button>

            {/* Expanded Detail Panel */}
            {expanded && (
                <div className="border-t border-neutral-200 dark:border-white/10 bg-neutral-50/50 dark:bg-black/20">
                    <div className="p-5 space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Status Details
                                <Badge
                                    variant="outline"
                                    className={`text-xs font-mono ml-1 ${job.response_code >= 200 && job.response_code < 300
                                        ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800"
                                        : "text-red-700 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                                        }`}
                                >
                                    {job.response_code}
                                </Badge>
                            </div>
                            <JsonBlock data={job} label="Full Result Data" />
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}

export default function HistoryPage() {
    const dispatch = useAppDispatch()
    const history = useAppSelector((state) => state.dashboard.history)

    useEffect(() => {
        dispatch(fetchHistory())
    }, [dispatch])

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">History</h2>
                    <p className="text-neutral-500 mt-1">Your recent crawl & scrape activity. Click a card to view details.</p>
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

            {/* History List */}
            {history.length === 0 ? (
                <Card className="border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03]">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-neutral-400">
                        <HistoryIcon className="h-12 w-12 mb-3 text-neutral-300 dark:text-neutral-600" />
                        <p className="text-base font-medium text-neutral-500">No history yet</p>
                        <p className="text-sm text-neutral-400 mt-1">Run a crawl or scrape job to see it here</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {history.map((job) => (
                        <HistoryCard key={job.hid} job={job} />
                    ))}
                </div>
            )}
        </div>
    )
}
