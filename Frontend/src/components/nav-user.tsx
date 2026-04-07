import {
    LogOut,
    Loader2,
} from "lucide-react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import {
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

import { useAppDispatch } from "@/store/hooks"
import { useNavigate } from "react-router-dom"
import { logout, logoutUser } from "@/store/authSlice"
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
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [loggingOut, setLoggingOut] = useState(false)
    const [showLogoutSuccess, setShowLogoutSuccess] = useState(false)

    const handleLogout = async () => {
        setLoggingOut(true)
        setShowLogoutSuccess(true)
        try {
            await dispatch(logoutUser()).unwrap()
        } catch {
            // Still clear local state to avoid leaving the UI in an authenticated state.
        } finally {
            dispatch(logout())
            setTimeout(() => navigate("/"), 1500)
            setLoggingOut(false)
        }
    }

    // Get initials for avatar fallback (up to 2 characters)
    const getInitials = (name: string, email: string) => {
        if (name) {
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
            }
            return name.substring(0, 2).toUpperCase();
        }
        return email ? email[0].toUpperCase() : "U";
    };

    const initials = user ? getInitials(user.name, user.email) : "U";

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
                    <div className="flex items-center gap-3 px-2 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                        <Avatar className="h-9 w-9 rounded-full shrink-0">
                            <AvatarImage src={user?.avatar} alt={user?.name} />
                            <AvatarFallback className="rounded-full bg-cyan-600 text-white font-bold tracking-wider text-xs">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                            <span className="truncate font-semibold text-sidebar-foreground">{user?.name}</span>
                            <span className="truncate text-xs text-sidebar-foreground/70">{user?.email}</span>
                        </div>
                    </div>
                </SidebarMenuItem>
                <SidebarMenuItem className="px-1 mt-2 mb-1 group-data-[collapsible=icon]:px-0">
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-sidebar-accent disabled:opacity-50 transition-all duration-200 group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:p-0"
                    >
                        {loggingOut ? (
                            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        ) : (
                            <LogOut className="h-4 w-4 shrink-0" />
                        )}
                        <span className="group-data-[collapsible=icon]:hidden">
                            {loggingOut ? "Signing out…" : "Sign out"}
                        </span>
                    </button>
                </SidebarMenuItem>
            </SidebarMenu>
        </>
    );
}
