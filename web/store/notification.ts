import { create } from 'zustand';
import type { NotificationStore } from '@/types/notification';
import { getNotificationsAction } from '@/lib/actions/ws';

// Zmienna poza storem, która działa jak "zamek" chroniący przed dublowaniem zapytań
let fetchPromise: Promise<void> | null = null;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoaded: false,

  // Main fetch function with singleton pattern to prevent multiple simultaneous fetches
  fetchHistory: async () => {
    if (get().isLoaded) return;
    if (fetchPromise) return fetchPromise;

    fetchPromise = getNotificationsAction(15)
      .then((data) => {
        if (data) {
          set({
            notifications: data,
            unreadCount: data.filter(n => !n.isRead).length,
            isLoaded: true
          });
        }
      })
      .catch(err => console.error("Błąd pobierania powiadomień", err))
      .finally(() => {
        fetchPromise = null;
      });

    return fetchPromise;
  },

  setNotifications: (notifications) => set({
    notifications,
    unreadCount: notifications.filter(n => !n.isRead).length
  }),
  
  addNotification: (notification) => set((state) => {
    // Protection against duplicates: If the notification already exists in the state, we skip adding it again
    if (state.notifications.some((n) => n.id === notification.id)) {
      return state;
    }

    const updatedNotifications = [notification, ...state.notifications];
    return {
      notifications: updatedNotifications,
      unreadCount: updatedNotifications.filter(n => !n.isRead).length
    };
  }),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, isRead: true })),
    unreadCount: 0
  }))
}));