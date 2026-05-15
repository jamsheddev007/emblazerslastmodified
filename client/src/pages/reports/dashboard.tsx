import { ModuleLayout } from "@/components/layout/module-layout";
import { reportsNavItems } from "./reports-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Users, ClipboardCheck, DollarSign, Briefcase,
  Building2, BookOpen, BookMarked, Bus, Home, ShoppingCart,
  BarChart3, ArrowRight
} from "lucide-react";

const reportModules = [
  {
    title: "Student Reports",
    description: "Admissions, class-wise lists, alumni, and student statistics",
    href: "/student/reports",
    icon: Users,
    color: "bg-blue-500",
  },
  {
    title: "Attendance Reports",
    description: "Daily, monthly, and subject-wise attendance summaries",
    href: "/attendance/reports",
    icon: ClipboardCheck,
    color: "bg-teal-500",
  },
  {
    title: "Fee Reports",
    description: "Collection summaries, defaulters, and voucher history",
    href: "/fee/reports",
    icon: DollarSign,
    color: "bg-green-500",
  },
  {
    title: "HR Reports",
    description: "Staff lists, payroll summaries, and departmental reports",
    href: "/hr/reports",
    icon: Briefcase,
    color: "bg-purple-500",
  },
  {
    title: "Finance Reports",
    description: "Income, expenses, ledger, and balance sheet reports",
    href: "/finance/reports",
    icon: Building2,
    color: "bg-indigo-500",
  },
  {
    title: "Curriculum Reports",
    description: "Exam results, grade distributions, and academic performance",
    href: "/curriculum/reports",
    icon: BookOpen,
    color: "bg-violet-500",
  },
  {
    title: "Library Reports",
    description: "Book inventory, issued books, and overdue records",
    href: "/library/reports",
    icon: BookMarked,
    color: "bg-amber-500",
  },
  {
    title: "Transport Reports",
    description: "Route-wise students, vehicle logs, and transport fees",
    href: "/transport/reports",
    icon: Bus,
    color: "bg-orange-500",
  },
  {
    title: "Hostel Reports",
    description: "Room occupancy, residents list, and hostel fee status",
    href: "/hostel/reports",
    icon: Home,
    color: "bg-rose-500",
  },
  {
    title: "POS Reports",
    description: "Sales summaries, inventory usage, and revenue reports",
    href: "/pos/reports",
    icon: ShoppingCart,
    color: "bg-cyan-500",
  },
];

export default function ReportsDashboard() {
  const [, setLocation] = useLocation();

  return (
    <ModuleLayout module="reports" navItems={reportsNavItems}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">
              Reports & History
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Centralized access to all module reports and analytics
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {reportModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card
                key={mod.href}
                className="hover-elevate cursor-pointer transition-all duration-200 group"
                onClick={() => setLocation(mod.href)}
                data-testid={`card-report-${mod.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-11 h-11 ${mod.color} rounded-lg flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                  </div>
                  <CardTitle className="text-base mt-2">{mod.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm leading-relaxed">
                    {mod.description}
                  </CardDescription>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 px-0 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-transparent"
                    data-testid={`button-open-${mod.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    View Reports <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </ModuleLayout>
  );
}
