import { useQuery, useMutation } from "@tanstack/react-query";
import { type AttendanceRecord, type AttendanceSummary, type Student, type Staff } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ClipboardList,
  BarChart3,
} from "lucide-react";

export const attendanceNavItems = [
  { label: "Dashboard", path: "/attendance/dashboard", icon: LayoutDashboard },
  { label: "Mark Students", path: "/attendance/mark-students", icon: GraduationCap },
  { label: "Mark Staff", path: "/attendance/mark-staff", icon: Users },
  { label: "Records", path: "/attendance/records", icon: ClipboardList },
  { label: "Reports", path: "/attendance/reports", icon: BarChart3 },
];

export const classes = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
export const sections = ["A", "B", "C"];

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface AttendanceFilters {
  date?: string;
  targetType?: "STUDENT" | "STAFF";
  className?: string;
  section?: string;
}

interface ReportFilters {
  targetType?: "STUDENT" | "STAFF";
  startDate?: string;
  endDate?: string;
  className?: string;
  section?: string;
}

export function useAttendanceData(filters: AttendanceFilters = {}) {
  const params = new URLSearchParams();
  if (filters.date) params.set("date", filters.date);
  if (filters.targetType) params.set("targetType", filters.targetType);
  if (filters.className) params.set("className", filters.className);
  if (filters.section) params.set("section", filters.section);
  const queryString = params.toString();

  const { data: records = [], isLoading: recordsLoading, error: recordsError } = useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance-records', queryString],
    queryFn: async () => {
      const res = await fetch(`/api/attendance-records${queryString ? `?${queryString}` : ''}`, {
        credentials: "include",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch records");
      return res.json();
    },
    enabled: !!filters.date,
    staleTime: 0,
  });

  return {
    records,
    isLoading: recordsLoading,
    error: recordsError,
  };
}

export function useAttendanceSummary(date: string, targetType?: "STUDENT" | "STAFF") {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (targetType) params.set("targetType", targetType);
  const queryString = params.toString();

  return useQuery<AttendanceSummary>({
    queryKey: ['/api/attendance/summary', queryString],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/summary?${queryString}`, {
        credentials: "include",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
    enabled: !!date,
    staleTime: 0,
  });
}

export function useAttendanceReport(filters: ReportFilters = {}) {
  const params = new URLSearchParams();
  if (filters.targetType) params.set("targetType", filters.targetType);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.className) params.set("className", filters.className);
  if (filters.section) params.set("section", filters.section);
  const queryString = params.toString();

  return useQuery<AttendanceRecord[]>({
    queryKey: ['/api/attendance/report', queryString],
    queryFn: async () => {
      const res = await fetch(`/api/attendance/report?${queryString}`, {
        credentials: "include",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
    enabled: !!filters.startDate && !!filters.endDate,
    staleTime: 0,
  });
}

export function useStudentsForAttendance() {
  return useQuery<Student[]>({
    queryKey: ['/api/students'],
  });
}

export function useStaffForAttendance() {
  return useQuery<Staff[]>({
    queryKey: ['/api/staff'],
  });
}

export function useMarkAttendance() {
  return useMutation({
    mutationFn: async (data: Record<string, unknown> | Record<string, unknown>[]) => {
      const res = await apiRequest('POST', '/api/attendance-records', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/report'] });
    },
  });
}

export function useUpdateAttendance() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AttendanceRecord> }) => {
      const res = await apiRequest('PATCH', `/api/attendance-records/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/report'] });
    },
  });
}

export function useDeleteAttendance() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/attendance-records/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/report'] });
    },
  });
}
