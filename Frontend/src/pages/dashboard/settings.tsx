import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Save,
    RefreshCcw,
    Trash2,
    CheckCircle2,
    Plus,
    X,
    Settings as SettingsIcon,
} from "lucide-react"
import {
    setFullConfig,
    type JobConfig,
} from "@/store/dashboardSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

export default function SettingsPage() {
    const dispatch = useAppDispatch()
    const { config } = useAppSelector((state) => state.dashboard)
    const [localConfig, setLocalConfig] = useState<JobConfig>({ ...config })
    const [success, setSuccess] = useState(false)
    const [newAllowedPattern, setNewAllowedPattern] = useState("")
    const [newDeniedPattern, setNewDeniedPattern] = useState("")

    useEffect(() => {
        setLocalConfig({ ...config })
    }, [config])

    const handleSave = () => {
        dispatch(setFullConfig(localConfig))
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
    }

    const handleReset = () => {
        setLocalConfig({ ...config })
        setSuccess(false)
    }

    const updateField = <K extends keyof JobConfig>(field: K, value: JobConfig[K]) => {
        setLocalConfig((prev: JobConfig) => ({ ...prev, [field]: value }))
    }

    const addPattern = (type: 'allowed' | 'denied') => {
        const pattern = type === 'allowed' ? newAllowedPattern.trim() : newDeniedPattern.trim()
        if (!pattern) return

        const field = type === 'allowed' ? 'allowedPatterns' : 'deniedPatterns'
        if (!localConfig[field].includes(pattern)) {
            setLocalConfig((prev: JobConfig) => ({
                ...prev,
                [field]: [...prev[field], pattern]
            }))
        }

        if (type === 'allowed') setNewAllowedPattern("")
        else setNewDeniedPattern("")
    }

    const removePattern = (type: 'allowed' | 'denied', pattern: string) => {
        const field = type === 'allowed' ? 'allowedPatterns' : 'deniedPatterns'
        setLocalConfig((prev: JobConfig) => ({
            ...prev,
            [field]: prev[field].filter((p: string) => p !== pattern)
        }))
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Settings</h2>
                    <p className="text-neutral-500 mt-1">Configure your crawler and scraper settings</p>
                </div>
                <div className="flex items-center gap-3">
                    {success && (
                        <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in slide-in-from-right-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Saved
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        className="h-9 gap-2 border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        Reset
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        className="h-9 gap-2 bg-cyan-600 hover:bg-cyan-700 text-white border-none shadow-sm"
                    >
                        <Save className="h-4 w-4" />
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-neutral-200 dark:border-white/10 shadow-sm overflow-hidden bg-white dark:bg-white/[0.03]">
                    <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10">
                        <SettingsIcon className="h-4 w-4 text-cyan-600" />
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">General Config</span>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="maxPages">Max Pages</Label>
                            <Input
                                id="maxPages"
                                type="number"
                                value={localConfig.maxPages}
                                onChange={(e) => updateField('maxPages', parseInt(e.target.value) || 0)}
                                placeholder="e.g. 50"
                                className="bg-transparent"
                            />
                            <p className="text-[11px] text-neutral-400">The maximum number of pages to crawl per job.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="depth">Max Crawl Depth</Label>
                            <Input
                                id="depth"
                                type="number"
                                value={localConfig.depth}
                                onChange={(e) => updateField('depth', parseInt(e.target.value) || 0)}
                                placeholder="e.g. 3"
                                className="bg-transparent"
                            />
                            <p className="text-[11px] text-neutral-400">How many levels of links to follow from the seed URL.</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {/* Allowed Patterns */}
                    <Card className="border-neutral-200 dark:border-white/10 shadow-sm bg-white dark:bg-white/[0.03]">
                        <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10">
                            <Plus className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Allowed Patterns</span>
                        </div>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    value={newAllowedPattern}
                                    onChange={(e) => setNewAllowedPattern(e.target.value)}
                                    placeholder="e.g. /blog/*"
                                    onKeyDown={(e) => e.key === 'Enter' && addPattern('allowed')}
                                    className="h-8 text-xs bg-transparent"
                                />
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => addPattern('allowed')}>
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {localConfig.allowedPatterns.map((pattern: string) => (
                                    <div key={pattern} className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded text-xs text-emerald-700 dark:text-emerald-400 font-mono">
                                        {pattern}
                                        <button onClick={() => removePattern('allowed', pattern)} className="hover:text-emerald-900 dark:hover:text-emerald-200">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {localConfig.allowedPatterns.length === 0 && (
                                    <p className="text-xs text-neutral-400 italic">No inclusion patterns defined.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Denied Patterns */}
                    <Card className="border-neutral-200 dark:border-white/10 shadow-sm bg-white dark:bg-white/[0.03]">
                        <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10">
                            <X className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Denied Patterns</span>
                        </div>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    value={newDeniedPattern}
                                    onChange={(e) => setNewDeniedPattern(e.target.value)}
                                    placeholder="e.g. /admin/*"
                                    onKeyDown={(e) => e.key === 'Enter' && addPattern('denied')}
                                    className="h-8 text-xs bg-transparent"
                                />
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => addPattern('denied')}>
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {localConfig.deniedPatterns.map((pattern: string) => (
                                    <div key={pattern} className="flex items-center gap-1.5 px-2 py-1 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded text-xs text-red-700 dark:text-red-400 font-mono">
                                        {pattern}
                                        <button onClick={() => removePattern('denied', pattern)} className="hover:text-red-900 dark:hover:text-red-200">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {localConfig.deniedPatterns.length === 0 && (
                                    <p className="text-xs text-neutral-400 italic">No exclusion patterns defined.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="p-4 rounded-xl border border-red-100 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10">
                <h4 className="text-sm font-semibold text-red-900 dark:text-red-400 mb-2 flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    Danger Zone
                </h4>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-500">Delete all your account data permanently. This action cannot be undone.</p>
                    <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40 h-8 text-xs hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        Delete Account
                    </Button>
                </div>
            </div>
        </div>
    )
}
