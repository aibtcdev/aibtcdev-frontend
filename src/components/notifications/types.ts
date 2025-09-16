export interface Notification {
  id: string;
  type:
    | "asset-deposit"
    | "custom-instructions"
    | "info"
    | "warning"
    | "success";
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isDismissed: boolean;
  createdAt: Date;
  priority: "low" | "medium" | "high";
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  dismissNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "isDismissed">
  ) => void;
}
