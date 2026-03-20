import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Eye, EyeOff, Plus, Trash2, Key, Loader2, AlertTriangle } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { GlobalNotification } from "@/components/ui/global-notification"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { generateApiKey, getApiKeys, deleteApiKey } from "@/store/authSlice"
import { ApiKeysListSkeleton } from "@/components/loading-skeletons"

export default function ApiKeysPage() {
    const dispatch = useAppDispatch()
    const { keys, loading, error } = useAppSelector(state => state.auth.apiKeys)

    const [localVisibility, setLocalVisibility] = useState<Record<string, boolean>>({})
    const [copied, setCopied] = useState<string | null>(null)

    // Create key dialog
    const [createOpen, setCreateOpen] = useState(false)
    const [newKeyName, setNewKeyName] = useState("")
    const [creating, setCreating] = useState(false)

    // Raw key display dialog (shown once after creation)
    const [rawKeyDialog, setRawKeyDialog] = useState<{ open: boolean; key: string; name: string }>({
        open: false, key: "", name: ""
    })

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; keyId: string; name: string }>({
        open: false, keyId: "", name: ""
    })
    const [deleting, setDeleting] = useState(false)

    // Notifications
    const [notification, setNotification] = useState<{ open: boolean; message: string; type: "success" | "error" | "info" }>({
        open: false, message: "", type: "info"
    })

    // Fetch keys on mount
    useEffect(() => {
        dispatch(getApiKeys())
    }, [dispatch])

    // Show error from store
    useEffect(() => {
        if (error) {
            setNotification({ open: true, message: error, type: "error" })
        }
    }, [error])

    const toggleVisibility = (id: string) => {
        setLocalVisibility(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const copyToClipboard = (id: string, text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(id)
        setTimeout(() => setCopied(null), 2000)
    }

    const handleCreateKey = async () => {
        if (!newKeyName.trim() || creating) return
        setCreating(true)
        try {
            const result = await dispatch(generateApiKey({ name: newKeyName.trim() })).unwrap()
            setNewKeyName("")
            setCreateOpen(false)
            // Show the raw key in a special one-time dialog
            setRawKeyDialog({
                open: true,
                key: result.api_key,
                name: result.meta?.name || newKeyName.trim()
            })
        } catch (err: any) {
            setNotification({
                open: true,
                message: typeof err === 'string' ? err : err?.message || "Failed to create API key",
                type: "error"
            })
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteKey = async () => {
        if (!deleteConfirm.keyId || deleting) return
        setDeleting(true)
        try {
            await dispatch(deleteApiKey(deleteConfirm.keyId)).unwrap()
            setNotification({ open: true, message: "API key revoked successfully", type: "success" })
            setDeleteConfirm({ open: false, keyId: "", name: "" })
        } catch (err: any) {
            setNotification({
                open: true,
                message: typeof err === 'string' ? err : err?.message || "Failed to revoke API key",
                type: "error"
            })
        } finally {
            setDeleting(false)
        }
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—"
        try {
            return new Date(dateStr).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric"
            })
        } catch {
            return dateStr
        }
    }

    const maskKey = (prefix: string, last4: string) => {
        return `${prefix}••••••••${last4}`
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Notification */}
            <GlobalNotification
                open={notification.open}
                onOpenChange={(open) => setNotification(prev => ({ ...prev, open }))}
                message={notification.message}
                type={notification.type}
                autoCloseMs={4000}
            />

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

                    {loading && keys.length === 0 ? (
                        <ApiKeysListSkeleton />
                    ) : keys.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                            <Key className="h-10 w-10 mb-3 text-neutral-300 dark:text-neutral-600" />
                            <p className="text-sm font-medium text-neutral-500">No API keys yet</p>
                            <p className="text-xs text-neutral-400 mt-1">Create your first key to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {keys.map((key: any) => {
                                const keyId = key.key_id
                                const displayToken = key.rawKey
                                    ? key.rawKey
                                    : maskKey(key.key_prefix || "", key.last4 || "")
                                const isVisible = localVisibility[keyId]

                                return (
                                    <div key={keyId} className="pb-6 border-b border-neutral-100 dark:border-white/5 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-2 mb-3">
                                            <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{key.name}</h4>
                                            {key.is_active === false && (
                                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400">
                                                    Revoked
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center bg-neutral-100 dark:bg-black/30 rounded-lg px-3 py-2 border border-neutral-200 dark:border-white/5 font-mono text-sm text-neutral-600 dark:text-neutral-300 select-all">
                                                    {key.rawKey
                                                        ? (isVisible ? displayToken : maskKey(key.key_prefix || displayToken.substring(0, 8), key.last4 || displayToken.slice(-4)))
                                                        : displayToken
                                                    }
                                                </div>
                                                {key.rawKey && (
                                                    <button
                                                        onClick={() => toggleVisibility(keyId)}
                                                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-white/5"
                                                        title={isVisible ? "Hide Key" : "Show Key"}
                                                    >
                                                        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                )}
                                                {key.rawKey && (
                                                    <button
                                                        onClick={() => copyToClipboard(keyId, key.rawKey)}
                                                        className="text-neutral-400 hover:text-cyan-600 transition-colors p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-white/5"
                                                        title="Copy to Clipboard"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {copied === keyId && (
                                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">Copied!</span>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setDeleteConfirm({ open: true, keyId, name: key.name })}
                                                className="text-neutral-400 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20"
                                                title="Revoke Key"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-400">
                                            <span>Created {formatDate(key.created_at)}</span>
                                            {key.daily_limit && (
                                                <span>• {key.daily_limit.toLocaleString()} req/day</span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
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
            <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setNewKeyName(""); }}>
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
                                disabled={creating}
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
                            disabled={creating}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateKey}
                            disabled={!newKeyName.trim() || creating}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer"
                        >
                            {creating ? (
                                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Creating...</>
                            ) : (
                                "Create Key"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Raw Key Display Dialog (one-time) */}
            <Dialog open={rawKeyDialog.open} onOpenChange={(open) => setRawKeyDialog(prev => ({ ...prev, open }))}>
                <DialogContent className="sm:max-w-lg bg-white dark:bg-[#131920] border-neutral-200 dark:border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                            <Key className="h-5 w-5 text-cyan-600" />
                            API Key Created
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500">
                            Your API key <span className="font-semibold text-neutral-700 dark:text-neutral-300">"{rawKeyDialog.name}"</span> has been created.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-700/30 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                                Copy this key now. It will not be shown again!
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-neutral-100 dark:bg-black/30 rounded-lg px-3 py-2.5 border border-neutral-200 dark:border-white/5 font-mono text-sm text-neutral-800 dark:text-neutral-200 break-all select-all">
                                {rawKeyDialog.key}
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    navigator.clipboard.writeText(rawKeyDialog.key)
                                    setNotification({ open: true, message: "API key copied to clipboard", type: "success" })
                                }}
                                className="shrink-0 border-neutral-200 dark:border-white/10 cursor-pointer"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => setRawKeyDialog(prev => ({ ...prev, open: false }))}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white cursor-pointer"
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}>
                <AlertDialogContent className="bg-white dark:bg-[#131920] border-neutral-200 dark:border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-neutral-900 dark:text-neutral-100">Revoke API Key</AlertDialogTitle>
                        <AlertDialogDescription className="text-neutral-500">
                            Are you sure you want to revoke <span className="font-semibold text-neutral-700 dark:text-neutral-300">"{deleteConfirm.name}"</span>? This action cannot be undone and any applications using this key will lose access.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            className="border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 cursor-pointer"
                            disabled={deleting}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteKey}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                        >
                            {deleting ? (
                                <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Revoking...</>
                            ) : (
                                "Revoke Key"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
