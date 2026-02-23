import * as React from "react"
import {
    History,
    LayoutDashboard,
    Settings2,
    User,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAppSelector } from "@/store/hooks"

const navItems = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        isActive: true,
    },
    {
        title: "History",
        url: "/dashboard/history",
        icon: History,
    },
    {
        title: "Profile",
        url: "/dashboard/profile",
        icon: User,
    },
    {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings2,
    },
]

export function AppSidebar({
    ...props
}: React.ComponentProps<typeof Sidebar>) {
    const user = useAppSelector((state) => state.auth.user)

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2 px-4 h-12 shrink-0">
                    <SidebarTrigger className="h-7 w-7 p-0 hover:bg-transparent [&_svg]:size-5">
                        <img src="/spidergo-logo.png" alt="SpiderGo" className="h-6 w-6" />
                    </SidebarTrigger>
                    <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
                        Spider<span className="text-primary">Go</span>
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
