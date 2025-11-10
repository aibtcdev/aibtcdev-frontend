import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import { Button } from "./button";
import { Bell } from "lucide-react";
import { Badge } from "./badge";
import { ScrollArea } from "./scroll-area";
import { useToast } from "@/hooks/useToast";

export type Notification = {
  id: string;
  title: string;
  description: string;
  type: "success" | "error" | "warning" | "info";
  timestamp: Date;
};

export const useNotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp">
  ) => {
    const newNotification = {
      ...notification,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
    toast({
      title: notification.title,
      description: notification.description,
      variant: notification.type === "error" ? "destructive" : "default",
    });
  };

  return { notifications, addNotification };
};

export const NotificationCenter = ({
  notifications,
}: {
  notifications: Notification[];
}) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.length);
  }, [notifications]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center bg-blue-500"
              variant="secondary"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-6rem)] mt-4">
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-sm border ${
                  notification.type === "success"
                    ? "bg-green-500/10 border-green-500/20"
                    : notification.type === "error"
                      ? "bg-red-500/10 border-red-500/20"
                      : notification.type === "warning"
                        ? "bg-yellow-500/10 border-yellow-500/20"
                        : "bg-blue-500/10 border-blue-500/20"
                }`}
              >
                <h4 className="font-medium mb-1">{notification.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {notification.description}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {notification.timestamp.toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
