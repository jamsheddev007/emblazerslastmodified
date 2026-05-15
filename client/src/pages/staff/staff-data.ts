import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  UserCircle,
  CalendarCheck,
  Wallet,
  FileText,
  CalendarClock,
} from "lucide-react";

export const staffNavItems = [
  { label: "Dashboard", path: "/staff/dashboard", icon: LayoutDashboard },
  { label: "My Profile", path: "/staff/profile", icon: UserCircle },
  { label: "Attendance", path: "/staff/attendance", icon: CalendarCheck },
  { label: "Salary Slips", path: "/staff/salary", icon: Wallet },
  { label: "My Leaves", path: "/staff/leaves", icon: CalendarClock },
  { label: "Documents", path: "/staff/documents", icon: FileText },
];

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("staff_portal_token") || localStorage.getItem("emblazers_token")}`,
});

export function useStaffDashboard() {
  return useQuery<any>({
    queryKey: ["/api/staff-portal/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/staff-portal/dashboard", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
  });
}

export function useStaffProfile() {
  return useQuery<any>({
    queryKey: ["/api/staff-portal/profile"],
    queryFn: async () => {
      const res = await fetch("/api/staff-portal/profile", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });
}

export function useStaffAttendance(month?: string) {
  return useQuery<any>({
    queryKey: ["/api/staff-portal/attendance", month],
    queryFn: async () => {
      const url = month ? `/api/staff-portal/attendance?month=${month}` : "/api/staff-portal/attendance";
      const res = await fetch(url, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
  });
}

export function useStaffSalary() {
  return useQuery<any[]>({
    queryKey: ["/api/staff-portal/salary"],
    queryFn: async () => {
      const res = await fetch("/api/staff-portal/salary", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch salary");
      return res.json();
    },
  });
}

export function useStaffDocuments() {
  return useQuery<any[]>({
    queryKey: ["/api/staff-portal/documents"],
    queryFn: async () => {
      const res = await fetch("/api/staff-portal/documents", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
  });
}
