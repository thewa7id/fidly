'use client'

import { Shield, Bell } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

export default function SuperAdminHeader() {
    return (
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-foreground">Super Admin</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
            </div>
        </header>
    )
}
