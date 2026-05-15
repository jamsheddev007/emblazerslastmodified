import { Bell, Check, CheckCheck, Trash2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/lib/notifications";
import { type Notification } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

function getPriorityIcon(priority: Notification["priority"]) {
  switch (priority) {
    case "high":
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    case "medium":
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    default:
      return <Info className="w-4 h-4 text-muted-foreground" />;
  }
}

function NotificationItem({ notification, onMarkRead, onDelete }: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <div
      className={`p-3 border-b last:border-b-0 ${
        notification.read ? "bg-background" : "bg-muted/30"
      } ${notification.link ? "cursor-pointer hover-elevate" : ""}`}
      onClick={notification.link ? handleClick : undefined}
      data-testid={`notification-item-${notification.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getPriorityIcon(notification.priority)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm truncate" data-testid={`notification-title-${notification.id}`}>
              {notification.title}
            </span>
            {!notification.read && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                New
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`notification-message-${notification.id}`}>
            {notification.message}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            <div className="flex gap-1">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(notification.id);
                  }}
                  data-testid={`button-mark-read-${notification.id}`}
                >
                  <Check className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                data-testid={`button-delete-notification-${notification.id}`}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notification-bell"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-unread-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" data-testid="notification-dropdown">
        <div className="flex items-center justify-between gap-2 p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllAsRead()}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Bell className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
