"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useNotificationStore } from "@/store/notification";
import {
  getNotificationsAction,
  markNotificationsAsReadAction,
} from "@/lib/actions/ws";
import { GlassPanel } from "@/components/ui/glass";
export function NotificationBell() {
  const { notifications, unreadCount, setNotifications, markAllAsRead } =
    useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notification history on mount to populate the dropdown when user clicks the bell
  useEffect(() => {
    const fetchHistory = async () => {
      const data = await getNotificationsAction(15);
      if (data && data.length > 0) {
        setNotifications(data);
      }
    };
    fetchHistory();
  }, [setNotifications]);

  // Handle opening/closing the notification dropdown
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && unreadCount > 0) {
      // Optimistically mark all as read in the UI immediately for better UX
      markAllAsRead();
      await markNotificationsAsReadAction();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => handleOpenChange(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full animate-in zoom-in">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <GlassPanel className="absolute right-0 mt-2 w-80 border border-gray-200 shadow-lg rounded-md z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-700">
            Notifications
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${!notif.isRead ? "bg-blue-50/50" : ""}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-semibold text-gray-800">
                      {notif.title}
                    </h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
