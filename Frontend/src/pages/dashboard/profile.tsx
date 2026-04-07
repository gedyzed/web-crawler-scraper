import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    User,
    Mail,
    Shield,
    Calendar,
    AlertTriangle,
    ExternalLink,
    Loader2,
} from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "@/lib/api"
import { logout } from "@/store/authSlice"
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

export default function ProfilePage() {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const user = useAppSelector((state) => state.auth.user)
    const email = user?.email || "user@example.com"
    const firstName = user?.firstname?.trim() || "-"
    const lastName = user?.lastname?.trim() || "-"
    const fullName = `${user?.firstname || ""} ${user?.lastname || ""}`.trim()
    const displayName = fullName || user?.name || email
    const initial = email.charAt(0).toUpperCase()
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState("")
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

    const handleDeleteAccount = async () => {
        setDeleteError("")
        setIsDeleting(true)
        try {
            await api.delete("/auth/me")
            dispatch(logout())
            navigate("/signup", { replace: true })
        } catch (err: any) {
            setDeleteError(
                err?.response?.data?.message ||
                "Delete account is not available yet from the API."
            )
        } finally {
            setIsDeleting(false)
            setDeleteConfirmOpen(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Profile</h2>
                <p className="text-neutral-500 mt-1">Your account information</p>
            </div>

            <Card className="border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03]">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                        <div className="h-16 w-16 rounded-full bg-cyan-100 dark:bg-cyan-950/40 border-2 border-cyan-200 dark:border-cyan-800 flex items-center justify-center">
                            <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{initial}</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{displayName}</h3>
                            <div className="flex items-center gap-4 text-sm text-neutral-500 flex-wrap justify-center sm:justify-start">
                                <span className="flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5" />
                                    {email}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Joined recently
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03]">
                    <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10">
                        <User className="h-4 w-4 text-cyan-600" />
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Account</span>
                    </div>
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-500">First Name</span>
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{firstName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-500">Last Name</span>
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{lastName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-500">Email</span>
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{email}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.03]">
                    <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10">
                        <Shield className="h-4 w-4 text-cyan-600" />
                        <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">Security</span>
                    </div>
                    <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-500">Password</span>
                            <Button variant="outline" size="sm" className="h-8 px-4 py-2 text-xs rounded-sm border-neutral-200 dark:border-white/10">
                                Change Password
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-500">API Documentation</span>
                            <Button variant="outline" size="sm" className="h-8 px-4 py-2 text-xs gap-1.5 rounded-sm border-neutral-200 dark:border-white/10" asChild>
                                <a href="https://docs.spidergo.app" target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3" />
                                    View Docs
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10">
                <div className="flex items-center gap-2 px-4 py-3 bg-red-100/60 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900/40">
                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">Danger Zone</span>
                </div>
                <CardContent className="p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Delete account</p>
                            <p className="text-xs text-neutral-500">Permanently remove your account and access.</p>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteConfirmOpen(true)}
                            disabled={isDeleting}
                            className="h-8 px-4 py-2 rounded-sm"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Account"
                            )}
                        </Button>
                    </div>
                    {deleteError && (
                        <p className="text-xs text-red-600 dark:text-red-400">{deleteError}</p>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent className="bg-white dark:bg-[#131920] border-neutral-200 dark:border-white/10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-neutral-900 dark:text-neutral-100">Delete Account</AlertDialogTitle>
                        <AlertDialogDescription className="text-neutral-500">
                            Delete your account permanently? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            className="border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 cursor-pointer"
                            disabled={isDeleting}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Account"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
