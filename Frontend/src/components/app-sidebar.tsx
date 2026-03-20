import * as React from "react"
import {
    History,
    Key,
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
} from "@/components/ui/sidebar"
import { useAppSelector } from "@/store/hooks"
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton"

const platformItems = [
    {
        title: "Homepage",
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

const developerItems = [
    {
        title: "API Keys",
        url: "/dashboard/api-keys",
        icon: Key,
    }
]

export function AppSidebar({
    ...props
}: React.ComponentProps<typeof Sidebar>) {
    const user = useAppSelector((state) => state.auth.user)
    const mappedUser = user ? {
        name: user.name || `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.username || 'User',
        email: user.email,
    } : null;

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center px-4 group-data-[collapsible=icon]:px-0 h-12 shrink-0">
                    <ImageWithSkeleton
                        src="/spidergo-logo.png"
                        alt="SpiderGo"
                        className="h-6 w-6 shrink-0"
                        containerClassName="h-6 w-6 shrink-0"
                    />
                    <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden truncate">
                        Spider<span className="text-primary">Go</span>
                    </span>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain title="PLATFORM" items={platformItems} />
                <NavMain title="DEVELOPER" items={developerItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={mappedUser} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
