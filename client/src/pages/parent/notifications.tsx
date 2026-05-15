import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { ModuleLayout } from "@/components/layout/module-layout";
import { parentNavItems, useParentNotifications, useMarkNotificationRead } from "./parent-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, DollarSign, Calendar, BarChart3, MessageSquare } from "lucide-react";

function getNotifIcon(type: string) {
  switch (type) {
    case "fee_due": return <DollarSign className="w-5 h-5 text-green-500" />;
    case "absent": return <Calendar className="w-5 h-5 text-red-500" />;
    case "result": return <BarChart3 className="w-5 h-5 text-violet-500" />;
    case "message": return <MessageSquare className="w-5 h-5 text-blue-500" />;
    default: return <Bell className="w-5 h-5 text-orange-500" />;
  }
}

export default function ParentNotifications() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, session } = useAuth();
  const { data: notifications = [], isLoading } = useParentNotifications();
  const markRead = useMarkNotificationRead();

  useEffect(() => {
    if (!isAuthenticated("parent") || session?.role !== "parent") {
      setLocation("/parent/login");
    }
  }, [isAuthenticated, session, setLocation]);

  if (!isAuthenticated("parent") || session?.role !== "parent") return null;

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const handleClick = (notif: any) => {
    if (!notif.isRead) {
      markRead.mutate(notif.id);
    }
  };

  return (
    <ModuleLayout module="parent" navItems={parentNavItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">Notifications</h1>
            <p className="text-muted-foreground mt-1">School ki taraf se notifications</p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-orange-500 text-white" data-testid="badge-unread-count">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground" data-testid="text-no-notifications">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif: any) => (
              <Card
                key={notif.id}
                className={`cursor-pointer transition-colors ${
                  !notif.isRead ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800" : ""
                }`}
                onClick={() => handleClick(notif)}
                data-testid={`notification-${notif.id}`}
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {getNotifIcon(notif.type || "")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm" data-testid={`text-notif-title-${notif.id}`}>{notif.title || "Notification"}</span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5" data-testid={`text-notif-body-${notif.id}`}>{notif.body || ""}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
