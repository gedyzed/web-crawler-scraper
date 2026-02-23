import { Outlet, useLocation, Link, useNavigate } from "react-router-dom"
import { Search, Globe, History, LayoutDashboard, User, Settings2, Command, X, type LucideIcon } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { TooltipProvider } from "@/components/ui/tooltip"
import { setSearchQuery, setIsSearchOpen } from "@/store/dashboardSlice"
import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { ThemeToggle } from "@/components/ThemeToggle"

interface NavItem {
    label: string
    path: string
    icon: LucideIcon
}

const navItems: NavItem[] = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "History", path: "/dashboard/history", icon: History },
    { label: "Profile", path: "/dashboard/profile", icon: User },
    { label: "Settings", path: "/dashboard/settings", icon: Settings2 },
]

export default function DashboardLayout() {
    const location = useLocation()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const user = useAppSelector((state) => state.auth.user)
    const { searchQuery, isSearchOpen, history } = useAppSelector((state) => state.dashboard)

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                dispatch(setIsSearchOpen(!isSearchOpen))
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [dispatch, isSearchOpen])

    const activeItem = navItems.find((item) => {
        if (item.path === "/dashboard") return location.pathname === "/dashboard"
        return location.pathname.startsWith(item.path)
    })

    const filteredNav = navItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredHistory = history.filter(job =>
        job.url.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)

    return (
        <TooltipProvider>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-6 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-neutral-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#0a0e14]/80 backdrop-blur-xl sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink asChild>
                                            <Link to="/dashboard">SpiderGo</Link>
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>{activeItem?.label || "Dashboard"}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <div className="flex items-center gap-3 relative mr-4">
                                <div
                                    onClick={() => dispatch(setIsSearchOpen(true))}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-white/5 text-sm text-neutral-500 cursor-pointer hover:border-neutral-300 dark:hover:border-white/20 transition-colors"
                                >
                                    <Search className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Search...</span>
                                    <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 rounded text-neutral-400">
                                        ⌘K
                                    </kbd>
                                </div>

                                {isSearchOpen && (
                                    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4 bg-black/20 dark:bg-black/40 backdrop-blur-sm" onClick={() => dispatch(setIsSearchOpen(false))}>
                                        <div
                                            className="w-full max-w-xl bg-white dark:bg-[#131920] rounded-xl shadow-2xl border border-neutral-200 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 dark:border-white/[0.06]">
                                                <Search className="h-4 w-4 text-neutral-400" />
                                                <input
                                                    autoFocus
                                                    value={searchQuery}
                                                    onChange={e => dispatch(setSearchQuery(e.target.value))}
                                                    placeholder="Search history or navigate..."
                                                    className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                                                />
                                                <button onClick={() => dispatch(setIsSearchOpen(false))} className="text-neutral-400 hover:text-neutral-600">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <div className="max-h-[400px] overflow-y-auto p-2">
                                                {searchQuery && (
                                                    <>
                                                        {filteredNav.length > 0 && (
                                                            <div className="mb-2">
                                                                <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Navigation</div>
                                                                {filteredNav.map(item => (
                                                                    <button
                                                                        key={item.path}
                                                                        onClick={() => {
                                                                            navigate(item.path)
                                                                            dispatch(setIsSearchOpen(false))
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 text-left transition-colors group"
                                                                    >
                                                                        <div className="h-7 w-7 rounded-md bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-neutral-500 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/50 group-hover:text-cyan-600">
                                                                            <item.icon className="h-4 w-4" />
                                                                        </div>
                                                                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{item.label}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {filteredHistory.length > 0 && (
                                                            <div>
                                                                <div className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Recent Jobs</div>
                                                                {filteredHistory.map(job => (
                                                                    <button
                                                                        key={job.id}
                                                                        onClick={() => {
                                                                            navigate("/dashboard/history")
                                                                            dispatch(setIsSearchOpen(false))
                                                                        }}
                                                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 text-left transition-colors group"
                                                                    >
                                                                        <div className="h-7 w-7 rounded-md bg-neutral-100 flex items-center justify-center text-neutral-500 group-hover:bg-cyan-50 group-hover:text-cyan-600">
                                                                            {job.type === 'crawl' ? <Globe className="h-4 w-4" /> : <Command className="h-4 w-4" />}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">{job.url}</div>
                                                                            <div className="text-[10px] text-neutral-400">{job.type} · {job.status}</div>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {filteredNav.length === 0 && filteredHistory.length === 0 && (
                                                            <div className="py-8 text-center text-neutral-400">
                                                                <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                                                <p className="text-sm">No results found for "{searchQuery}"</p>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                                {!searchQuery && (
                                                    <div className="py-8 text-center text-neutral-400">
                                                        <p className="text-sm">Type to search history or navigate...</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {user && (
                                <Link to="/dashboard/profile" className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                                    {user.name?.[0] || "U"}
                                </Link>
                            )}
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        <div className="p-6">
                            <Outlet />
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </TooltipProvider>
    )
}
