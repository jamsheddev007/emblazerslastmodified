import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Notification, type ModuleType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refetch: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
  module?: ModuleType;
}

export function NotificationProvider({ children, module }: NotificationProviderProps) {
  const queryClient = useQueryClient();

  const queryKey = module ? ["/api/notifications", module] : ["/api/notifications"];
  const countQueryKey = module ? ["/api/notifications/unread-count", module] : ["/api/notifications/unread-count"];

  const { data: notifications = [], isLoading, refetch } = useQuery<Notification[]>({
    queryKey,
    queryFn: async () => {
      const url = module ? `/api/notifications?module=${module}` : "/api/notifications";
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      return response.json();
    },
  });

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: countQueryKey,
    queryFn: async () => {
      const url = module ? `/api/notifications/unread-count?module=${module}` : "/api/notifications/unread-count";
      const token = getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error("Failed to fetch unread count");
      return response.json();
    },
  });

  const unreadCount = countData?.count ?? 0;

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected for notifications");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "notification") {
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
        }
      } catch {
        console.error("Failed to parse WebSocket message");
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.onerror = () => {
      console.log("WebSocket error");
    };

    return () => {
      ws.close();
    };
  }, [queryClient]);

  const markAsRead = useCallback(async (id: string) => {
    await apiRequest("PATCH", `/api/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
  }, [queryClient]);

  const markAllAsRead = useCallback(async () => {
    const url = module ? `/api/notifications/mark-all-read?module=${module}` : "/api/notifications/mark-all-read";
    await apiRequest("PATCH", url);
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
  }, [module, queryClient]);

  const deleteNotification = useCallback(async (id: string) => {
    await apiRequest("DELETE", `/api/notifications/${id}`);
    queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
  }, [queryClient]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetch,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
