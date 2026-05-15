import { LayoutDashboard, Users, ClipboardCheck, DollarSign, Briefcase, Building2, BookOpen, BookMarked, Bus, Home, ShoppingCart } from "lucide-react";

export const reportsNavItems = [
  { label: "Dashboard", path: "/reports/dashboard", icon: LayoutDashboard },
  { label: "Student Reports", path: "/student/reports", icon: Users },
  { label: "Attendance Reports", path: "/attendance/reports", icon: ClipboardCheck },
  { label: "Fee Reports", path: "/fee/reports", icon: DollarSign },
  { label: "HR Reports", path: "/hr/reports", icon: Briefcase },
  { label: "Finance Reports", path: "/finance/reports", icon: Building2 },
  { label: "Curriculum Reports", path: "/curriculum/reports", icon: BookOpen },
  { label: "Library Reports", path: "/library/reports", icon: BookMarked },
  { label: "Transport Reports", path: "/transport/reports", icon: Bus },
  { label: "Hostel Reports", path: "/hostel/reports", icon: Home },
  { label: "POS Reports", path: "/pos/reports", icon: ShoppingCart },
];
