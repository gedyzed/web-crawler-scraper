import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Eye, EyeOff, Plus, Trash2, Key } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { generateApiKey, removeApiKeyLocally } from "@/store/authSlice"

export default function ApiKeysPage() {
    const dispatch = useAppDispatch()
    const { keys, loading } = useAppSelector(state => state.auth.apiKeys)
    const [localVisibility, setLocalVisibility] = useState<Record<string, boolean>>({})
    const [copied, setCopied] = useState<string | null>(null)
    const [createOpen, setCreateOpen] = useState(false)
    const [newKeyName, setNewKeyName] = useState("")

    const toggleVisibility = (id: string) => {
        setLocalVisibility(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const copyToClipboard = (id: string, text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(id)
        setTimeout(() => setCopied(null), 2000)
    }

    const handleCreateKey = async () => {
        if (!newKeyName.trim() || loading) return
        await dispatch(generateApiKey({ name: newKeyName.trim() })).unwrap()
        setNewKeyName("")
        setCreateOpen(false)
    }

    const handleDeleteKey = (id: string) => {
        dispatch(removeApiKeyLocally(id))
    }

    const maskToken = (token: string) => {
        if (!token) return '••••••••••••••••'
        if (token.length <= 12) return '•'.repeat(token.length)
        return token.substring(0, 12) + '•'.repeat(token.length - 12)
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">API Keys</h2>
                <p className="text-neutral-500 mt-1">Manage your account API keys.</p>
            </div>

            {/* API Keys Section */}
            <Card className="border-neutral-200 dark:border-white/10 shadow-sm bg-white dark:bg-[#131920]">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">API Keys</h3>
                            <p className="text-sm text-neutral-500">Manage API keys for programmatic access</p>
                        </div>
                        <Button
                            onClick={() => setCreateOpen(true)}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg px-4 h-9 font-medium shadow-none transition-colors cursor-pointer"
                        >
                            <Plus className="h-4 w-4 mr-1.5" /> Create Key
                        </Button>
                    </div>

                    {keys.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                            <Key className="h-10 w-10 mb-3 text-neutral-300 dark:text-neutral-600" />
                            <p className="text-sm font-medium text-neutral-500">No API keys yet</p>
                            <p className="text-xs text-neutral-400 mt-1">Create your first key to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {keys.map((key) => (
                                <div key={key.id} className="pb-6 border-b border-neutral-100 dark:border-white/5 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2 mb-3">
                                        <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{key.name}</h4>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-neutral-100 dark:bg-black/30 rounded-lg px-3 py-2 border border-neutral-200 dark:border-white/5 font-mono text-sm text-neutral-600 dark:text-neutral-300 select-all">
                                                {localVisibility[key.id] ? key.token : maskToken(key.token)}
                                            </div>
                                            <button
                                                onClick={() => toggleVisibility(key.id)}
                                                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-white/5"
                                                title={localVisibility[key.id] ? "Hide Key" : "Show Key"}
                                            >
                                                {localVisibility[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(key.id, key.token)}
                                                className="text-neutral-400 hover:text-cyan-600 transition-colors p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-white/5"
                                                title="Copy to Clipboard"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                            {copied === key.id && (
                                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">Copied!</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteKey(key.id)}
                                            className="text-neutral-400 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20"
                                            title="Delete Key"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="mt-2 text-[11px] text-neutral-400">
                                        Created {key.created}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Usage Section */}
            <Card className="border-neutral-200 dark:border-white/10 shadow-sm bg-white dark:bg-[#131920]">
                <CardContent className="p-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Usage</h3>
                        <p className="text-sm text-neutral-500">Use your API key in the Authorization header:</p>
                    </div>
                    <div className="bg-neutral-900 dark:bg-black rounded-lg p-4 border border-neutral-200 dark:border-white/10 overflow-x-auto select-all">
                        <code className="text-[13px] font-mono whitespace-pre text-neutral-300">
                            <span className="text-cyan-400">$</span> curl -H <span className="text-emerald-400">"Authorization: Bearer YOUR_API_KEY"</span> https://api.spidergo.com/v1/scrape
                        </code>
                    </div>
                </CardContent>
            </Card>

            {/* Create Key Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-[#131920] border-neutral-200 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-900 dark:text-neutral-100">Create API Key</DialogTitle>
                        <DialogDescription className="text-neutral-500">
                            Create a new API key for accessing SpiderGo programmatically.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                Key Name
                            </label>
                            <Input
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreateKey()
                                }}
                                placeholder="e.g., Production Key"
                                className="bg-neutral-50 dark:bg-white/5 border-neutral-200 dark:border-white/10 focus-visible:ring-cyan-500"
                            />
                            <p className="text-xs text-neutral-400">
                                Give your key a memorable name to identify its purpose.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => { setCreateOpen(false); setNewKeyName("") }}
                            className="border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateKey}
                            disabled={!newKeyName.trim()}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer"
                        >
                            Create Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
