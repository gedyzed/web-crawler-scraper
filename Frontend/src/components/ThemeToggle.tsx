import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
    const { setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer focus-visible:ring-0">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-[#0a0e14] border-neutral-200 dark:border-white/10">
                <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer focus:bg-neutral-100 dark:focus:bg-white/5">
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer focus:bg-neutral-100 dark:focus:bg-white/5">
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer focus:bg-neutral-100 dark:focus:bg-white/5">
                    <Laptop className="h-4 w-4 mr-2" />
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
