"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNotificationStore } from "@/store/notification";
import { markNotificationsAsReadAction } from "@/lib/actions/ws";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function SidebarNotifications() {
  const { notifications, unreadCount, markAllAsRead, fetchHistory } =
    useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  // Singleton pattern: Ensure we fetch notifications history when the component mounts, but only if it hasn't been loaded yet (store manages this internally)
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      markAllAsRead();
      await markNotificationsAsReadAction();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isOpen
              ? "bg-white/15 text-white"
              : "text-white/60 hover:bg-white/10 hover:text-white",
          )}
        >
          <Bell size={16} className="shrink-0" />
          <span>Notifications</span>

          {unreadCount > 0 && (
            <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-in zoom-in">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        className="w-80 p-0 shadow-lg"
        sideOffset={16}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount === 0 && notifications.length > 0 && (
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCheck className="w-3 h-3 mr-1" />
              Read
            </div>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex flex-col px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors",
                    !notif.isRead && "bg-blue-50/40 dark:bg-blue-950/20",
                  )}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className="text-sm font-medium leading-none">
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {notif.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
