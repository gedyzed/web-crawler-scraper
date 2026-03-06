import {
    ChevronsUpDown,
    LogOut,
    Loader2,
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

import { useAppDispatch } from "@/store/hooks"
import { useNavigate } from "react-router-dom"
import { logout } from "@/store/authSlice"
import { GlobalNotification } from "@/components/ui/global-notification"
import { useState } from "react"

interface NavUserProps {
    user: {
        name: string
        email: string
        avatar?: string
    } | null
}

export function NavUser({
    user
}: NavUserProps) {
    const { isMobile } = useSidebar()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [loggingOut, setLoggingOut] = useState(false)
    const [showLogoutSuccess, setShowLogoutSuccess] = useState(false)

    const handleLogout = () => {
        setLoggingOut(true)
        setShowLogoutSuccess(true)
        dispatch(logout())
        setTimeout(() => navigate("/"), 1500)
    }

    return (
        <>
            <GlobalNotification
                open={showLogoutSuccess}
                onOpenChange={setShowLogoutSuccess}
                message="Logged out successfully!"
                type="error"
            />
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user?.avatar} alt={user?.name} />
                                    <AvatarFallback className="rounded-lg bg-cyan-600 text-white font-bold uppercase">{user?.email?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user?.name}</span>
                                    <span className="truncate text-xs">{user?.email}</span>
                                </div>
                                <ChevronsUpDown className="ml-auto size-4" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align="end"
                            sideOffset={4}>
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage src={user?.avatar} alt={user?.name} />
                                        <AvatarFallback className="rounded-lg bg-cyan-600 text-white font-bold uppercase">{user?.email?.[0] || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">{user?.name}</span>
                                        <span className="truncate text-xs">{user?.email}</span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} disabled={loggingOut} className="text-red-500 focus:text-red-500">
                                {loggingOut ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <LogOut className="mr-2 h-4 w-4" />
                                )}
                                {loggingOut ? "Logging out…" : "Log out"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    );
}
