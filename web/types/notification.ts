export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationStore {
  notifications: NotificationDto[];
  unreadCount: number;
  isLoaded: boolean;
  fetchHistory: () => Promise<void>;
  setNotifications: (notifications: NotificationDto[]) => void;
  addNotification: (notification: NotificationDto) => void;
  markAllAsRead: () => void;
}