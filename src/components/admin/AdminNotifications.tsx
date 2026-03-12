'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, UserPlus, Star, Gift, Clock } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

export default function AdminNotifications({ organizationId }: { organizationId: string }) {
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        if (!organizationId) return

        // 1. Initial fetch
        const fetchNotifications = async () => {
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })
                .limit(10)

            if (data) {
                setNotifications(data)
                setUnreadCount(data.filter((n: any) => !n.is_read).length)
            }
        }

        fetchNotifications()

        // 2. Real-time subscription
        const channel = supabase
            .channel('admin_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `organization_id=eq.${organizationId}`
                },
                (payload: any) => {
                    const newNotif = payload.new
                    setNotifications(prev => [newNotif, ...prev.slice(0, 9)])
                    setUnreadCount(c => c + 1)

                    // Show a toast for the new notification
                    toast(newNotif.title, {
                        description: newNotif.message,
                        icon: getIcon(newNotif.type)
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [organizationId])

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)

        if (!error) {
            setNotifications((prev: any[]) => prev.map((n: any) => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount(c => Math.max(0, c - 1))
        }
    }

    const markAllAsRead = async () => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('organization_id', organizationId)
            .eq('is_read', false)

        if (!error) {
            setNotifications((prev: any[]) => prev.map((n: any) => ({ ...n, is_read: true })))
            setUnreadCount(0)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'new_customer': return <UserPlus className="w-4 h-4 text-blue-500" />
            case 'stamp_earned': return <Star className="w-4 h-4 text-yellow-500" />
            case 'reward_redeemed': return <Gift className="w-4 h-4 text-green-500" />
            default: return <Bell className="w-4 h-4 text-primary" />
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden bg-card border-border">
                <div className="p-4 flex items-center justify-between border-b border-border">
                    <DropdownMenuLabel className="p-0 font-bold">Notifications</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <button
                            onClick={(e) => { e.preventDefault(); markAllAsRead() }}
                            className="text-[10px] text-primary hover:underline font-medium"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="text-xs">No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <DropdownMenuItem
                                key={n.id}
                                className={`flex items-start gap-3 p-4 focus:bg-accent cursor-pointer border-b border-border/50 last:border-0 ${!n.is_read ? 'bg-primary/5' : ''}`}
                                onClick={() => !n.is_read && markAsRead(n.id)}
                            >
                                <div className={`p-2 rounded-full shrink-0 ${!n.is_read ? 'bg-background shadow-sm' : 'bg-muted/50'}`}>
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 space-y-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={`text-sm leading-none ${!n.is_read ? 'font-bold' : 'font-medium'}`}>{n.title}</p>
                                        {!n.is_read && <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
                                        "{n.message}"
                                    </p>
                                    <div className="flex items-center gap-1.5 pt-1 text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="p-2 bg-muted/30 border-t border-border mt-auto">
                        <button className="w-full py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium">
                            View all activity history
                        </button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
