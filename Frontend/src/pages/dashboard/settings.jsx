import { useSelector, useDispatch } from "react-redux"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Layers,
    Hash,
    ShieldCheck,
    ShieldOff,
    X,
    Plus,
    Trash2,
} from "lucide-react"
import {
    setConfigField,
    addAllowedPattern,
    removeAllowedPattern,
    addDeniedPattern,
    removeDeniedPattern,
    setNewAllowedPattern,
    setNewDeniedPattern,
} from "@/store/dashboardSlice"

export default function SettingsPage() {
    const dispatch = useDispatch()
    const { config, newAllowedPattern, newDeniedPattern } = useSelector(
        (state) => state.dashboard
    )

    const handleAddAllowed = () => {
        if (newAllowedPattern.trim()) {
            dispatch(addAllowedPattern(newAllowedPattern))
            dispatch(setNewAllowedPattern(""))
        }
    }

    const handleAddDenied = () => {
        if (newDeniedPattern.trim()) {
            dispatch(addDeniedPattern(newDeniedPattern))
            dispatch(setNewDeniedPattern(""))
        }
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h2 className="text-2xl font-bold text-neutral-900">Settings</h2>
                <p className="text-neutral-500 mt-1">Configure your default crawler and scraper settings</p>
            </div>

            {/* ─── Default Crawler Configuration ───────────── */}
            <Card className="border-neutral-200 shadow-sm">
                <CardContent className="p-6">
                    <h3 className="text-base font-semibold text-neutral-900 mb-5 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-cyan-600" />
                        Crawler Configuration
                    </h3>
                    <div className="space-y-5">
                        <div className="grid sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                                    <Hash className="h-3.5 w-3.5 text-neutral-400" /> Max Pages
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={1000}
                                    value={config.maxPages}
                                    onChange={(e) => dispatch(setConfigField({ field: "maxPages", value: parseInt(e.target.value) || 1 }))}
                                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50 text-sm focus-visible:ring-cyan-500"
                                />
                                <p className="text-xs text-neutral-400">Maximum number of pages to crawl per job</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                                    <Layers className="h-3.5 w-3.5 text-neutral-400" /> Depth
                                </label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={10}
                                    value={config.depth}
                                    onChange={(e) => dispatch(setConfigField({ field: "depth", value: parseInt(e.target.value) || 0 }))}
                                    className="h-10 rounded-lg border-neutral-200 bg-neutral-50 text-sm focus-visible:ring-cyan-500"
                                />
                                <p className="text-xs text-neutral-400">How deep to follow links from the seed URL</p>
                            </div>
                        </div>

                        {/* Allowed Patterns */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Allowed Patterns
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    value={newAllowedPattern}
                                    onChange={(e) => dispatch(setNewAllowedPattern(e.target.value))}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddAllowed()}
                                    placeholder="e.g. /blog/*, /docs/*"
                                    className="h-9 rounded-lg border-neutral-200 bg-neutral-50 text-sm focus-visible:ring-cyan-500"
                                />
                                <Button size="sm" variant="outline" onClick={handleAddAllowed} className="h-9 px-2.5 shrink-0">
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {config.allowedPatterns.map((p, i) => (
                                    <Badge key={i} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 px-2 py-0.5 text-xs gap-1">
                                        {p}
                                        <button onClick={() => dispatch(removeAllowedPattern(p))} className="hover:text-red-500 ml-0.5">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {config.allowedPatterns.length === 0 && <span className="text-xs text-neutral-400">No patterns — all URLs allowed</span>}
                            </div>
                        </div>

                        {/* Denied Patterns */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                                <ShieldOff className="h-3.5 w-3.5 text-red-500" /> Denied Patterns
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    value={newDeniedPattern}
                                    onChange={(e) => dispatch(setNewDeniedPattern(e.target.value))}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddDenied()}
                                    placeholder="e.g. /admin/*, /private/*"
                                    className="h-9 rounded-lg border-neutral-200 bg-neutral-50 text-sm focus-visible:ring-cyan-500"
                                />
                                <Button size="sm" variant="outline" onClick={handleAddDenied} className="h-9 px-2.5 shrink-0">
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {config.deniedPatterns.map((p, i) => (
                                    <Badge key={i} variant="outline" className="bg-red-50 text-red-700 border-red-200 px-2 py-0.5 text-xs gap-1">
                                        {p}
                                        <button onClick={() => dispatch(removeDeniedPattern(p))} className="hover:text-red-800 ml-0.5">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {config.deniedPatterns.length === 0 && <span className="text-xs text-neutral-400">No patterns — no URLs blocked</span>}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ─── Danger Zone ──────────────────────────────── */}
            <Card className="border-red-200 shadow-sm">
                <CardContent className="p-6">
                    <h3 className="text-base font-semibold text-red-600 mb-4 flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Danger Zone
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-neutral-900">Delete Account</p>
                            <p className="text-xs text-neutral-400">Permanently delete your account and all data</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                            Delete Account
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
