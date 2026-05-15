import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  LayoutDashboard,
  MessageSquare,
  Bell,
  KeyRound,
} from "lucide-react";

export const parentNavItems = [
  { label: "Dashboard", path: "/parent/dashboard", icon: LayoutDashboard },
  { label: "Messages", path: "/parent/messages", icon: MessageSquare },
  { label: "Notifications", path: "/parent/notifications", icon: Bell },
  { label: "Change Password", path: "/parent/change-password", icon: KeyRound },
];

export function useParentChildren() {
  return useQuery<any[]>({
    queryKey: ["/api/parent/children"],
  });
}

export function useParentDashboard(studentId: string | null) {
  return useQuery<any>({
    queryKey: ["/api/parent/dashboard", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      const res = await fetch(`/api/parent/dashboard/${studentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("emblazers_token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
    enabled: !!studentId,
  });
}

export function useParentMessages(studentId: string | null) {
  return useQuery<any[]>({
    queryKey: ["/api/parent/messages", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const res = await fetch(`/api/parent/messages/${studentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("emblazers_token")}` },
      });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!studentId,
  });
}

export function useSendParentMessage() {
  return useMutation({
    mutationFn: async (data: { studentId: string; receiverId: string; message: string }) => {
      const res = await apiRequest("POST", "/api/parent/messages", data);
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent/messages", variables.studentId] });
    },
  });
}

export function useParentNotifications() {
  return useQuery<any[]>({
    queryKey: ["/api/parent/notifications"],
  });
}

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PATCH", `/api/parent/notifications/${id}/read`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent/notifications"] });
    },
  });
}
