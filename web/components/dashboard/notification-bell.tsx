"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNotificationStore } from "@/store/notification";
import { markNotificationsAsReadAction } from "@/lib/actions/ws";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead, fetchHistory } =
    useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  // Ensure we fetch notifications history when the component mounts, but only if it hasn't been loaded yet (singleton pattern in store)
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
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent"
        >
          <div className="relative inline-flex items-center justify-center">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground shadow-sm ring-2 ring-background animate-in zoom-in">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 shadow-lg" sideOffset={8}>
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount === 0 && notifications.length > 0 && (
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCheck className="mr-1 h-3 w-3" />
              Read
            </div>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-20" />
              <p className="text-sm">No new notifications</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex flex-col border-b px-4 py-3 transition-colors last:border-0 hover:bg-muted/50",
                    !notif.isRead && "bg-blue-50/40 dark:bg-blue-950/20",
                  )}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-none">
                      {notif.title}
                    </span>
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
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
