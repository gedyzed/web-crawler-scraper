import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    User,
    Mail,
    Shield,
    Calendar,
    ExternalLink,
} from "lucide-react"
import { useAppSelector } from "@/store/hooks"

export default function ProfilePage() {
    const user = useAppSelector((state) => state.auth.user)
    const email = user?.email || "user@example.com"
    const initial = email.charAt(0).toUpperCase()

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
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{email}</h3>
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
                            <span className="text-sm text-neutral-500">Email</span>
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-500">Role</span>
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">User</span>
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
                            <Button variant="outline" size="sm" className="h-8 text-xs border-neutral-200 dark:border-white/10">
                                Change Password
                            </Button>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-neutral-500">API Documentation</span>
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-neutral-200 dark:border-white/10" asChild>
                                <a href="https://github.com/gedyzed/web-crawler-scraper" target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3" />
                                    View Docs
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
