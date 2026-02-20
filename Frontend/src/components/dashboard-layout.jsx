import { useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
    Globe,
    History,
    Settings,
    User,
    LogOut,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Search,
} from "lucide-react"
import { logout } from "@/store/authSlice"

const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "History", icon: History, path: "/dashboard/history" },
    { label: "Profile", icon: User, path: "/dashboard/profile" },
    { label: "Settings", icon: Settings, path: "/dashboard/settings" },
]

export default function DashboardLayout() {
    const [collapsed, setCollapsed] = useState(false)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()
    const user = useSelector((state) => state.auth.user)

    const handleLogout = () => {
        dispatch(logout())
        navigate("/")
    }

    const isActive = (path) => {
        if (path === "/dashboard") return location.pathname === "/dashboard"
        return location.pathname.startsWith(path)
    }

    return (
        <div className="flex h-screen bg-neutral-50">
            {/* ─── Sidebar ─────────────────────────────────── */}
            <aside
                className={`relative flex flex-col border-r border-neutral-200 bg-neutral-950 text-white transition-all duration-300 ${collapsed ? "w-[68px]" : "w-64"
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-4 h-16 border-b border-neutral-800 shrink-0">
                    <img src="/spidergo-logo.svg" alt="SpiderGo" className="h-7 w-7 shrink-0" />
                    {!collapsed && (
                        <span className="text-lg font-bold tracking-tight whitespace-nowrap">
                            Spider<span className="text-cyan-400">Go</span>
                        </span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const active = isActive(item.path)
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active
                                    ? "bg-cyan-600/20 text-cyan-400"
                                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                                    } ${collapsed ? "justify-center" : ""}`}
                                title={collapsed ? item.label : undefined}
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom user section */}
                <div className={`border-t border-neutral-800 p-3 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
                    {!collapsed && user && (
                        <div className="flex items-center gap-3 px-2 py-2 mb-2">
                            <div className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                                {user.name?.[0] || "U"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-neutral-200 truncate">{user.name}</p>
                                <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className={`text-neutral-400 hover:text-red-400 hover:bg-red-500/10 ${collapsed ? "w-9 h-9 p-0" : "w-full justify-start gap-2"}`}
                        title="Logout"
                    >
                        <LogOut className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>Logout</span>}
                    </Button>
                </div>

                {/* Toggle button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 z-10 h-6 w-6 flex items-center justify-center rounded-full bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                >
                    {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </button>
            </aside>

            {/* ─── Main Content ─────────────────────────────── */}
            <main className="flex-1 overflow-y-auto">
                {/* Top bar */}
                <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 border-b border-neutral-200 bg-white/80 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-semibold text-neutral-900">
                            {navItems.find((item) => isActive(item.path))?.label || "Dashboard"}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-500">
                            <Search className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Search...</span>
                            <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 rounded text-neutral-400">
                                ⌘K
                            </kbd>
                        </div>
                        {user && (
                            <Link to="/dashboard/profile" className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                                {user.name?.[0] || "U"}
                            </Link>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}
