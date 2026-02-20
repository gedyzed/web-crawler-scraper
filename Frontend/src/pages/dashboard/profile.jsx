import { useSelector } from "react-redux"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    User,
    Mail,
    Shield,
    Clock,
    Activity,
} from "lucide-react"

export default function ProfilePage() {
    const user = useSelector((state) => state.auth.user)
    const history = useSelector((state) => state.dashboard.history)

    const totalJobs = history.length
    const completedJobs = history.filter((j) => j.status === "completed").length
    const totalPages = history.reduce((acc, j) => acc + j.pagesFound, 0)

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h2 className="text-2xl font-bold text-neutral-900">Profile</h2>
                <p className="text-neutral-500 mt-1">Your account information</p>
            </div>

            {/* Profile Card */}
            <Card className="border-neutral-200 shadow-sm overflow-hidden">
                <CardContent className="p-6">
                    {/* Avatar + Info */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-16 w-16 rounded-xl bg-neutral-900 flex items-center justify-center text-xl font-bold text-white uppercase">
                            {user?.name?.[0] || "U"}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-neutral-900">{user?.name || "User"}</h3>
                            <p className="text-sm text-neutral-500">{user?.email}</p>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-neutral-400" /> Full Name
                            </label>
                            <p className="text-sm text-neutral-900 bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-200">
                                {user?.name || "—"}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5 text-neutral-400" /> Email
                            </label>
                            <p className="text-sm text-neutral-900 bg-neutral-50 rounded-lg px-3 py-2.5 border border-neutral-200">
                                {user?.email || "—"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Status */}
            <Card className="border-neutral-200 shadow-sm">
                <CardContent className="p-6">
                    <h3 className="text-base font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-cyan-600" />
                        Account
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                            <span className="text-sm text-neutral-600">Account Status</span>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between py-2 border-t border-neutral-100">
                            <span className="text-sm text-neutral-600">Member Since</span>
                            <span className="text-sm text-neutral-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> February 2026
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
