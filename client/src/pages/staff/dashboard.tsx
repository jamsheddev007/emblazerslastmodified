import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { ModuleLayout } from "@/components/layout/module-layout";
import { staffNavItems, useStaffDashboard } from "./staff-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CalendarCheck, Wallet, FileText, UserCircle } from "lucide-react";
import { useAutoNotificationPermission } from "@/hooks/use-notifications";

export default function StaffDashboard() {
  useAutoNotificationPermission();
  const [, setLocation] = useLocation();
  const { session } = useAuth();
  const { data, isLoading } = useStaffDashboard();

  useEffect(() => {
    if (!session || session.role !== "staff" || !session.loggedIn) {
      setLocation("/staff/login");
    }
  }, [session, setLocation]);

  if (!session || session.role !== "staff") return null;

  const totalDays = (data?.presentThisMonth || 0) + (data?.absentThisMonth || 0);
  const attendancePct = totalDays > 0 ? Math.round((data?.presentThisMonth / totalDays) * 100) : 0;

  return (
    <ModuleLayout module="hr" navItems={staffNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">
            Welcome, {session.name}
          </h1>
          <p className="text-muted-foreground mt-1">Employee Self-Service Portal</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/staff/profile")} data-testid="card-profile">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserCircle className="w-5 h-5 text-teal-600" />
                  My Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-staff-id">{data?.profile?.staffId || session.staffId || "—"}</p>
                <p className="text-sm text-muted-foreground">{data?.profile?.designation || "Employee"}</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/staff/attendance")} data-testid="card-attendance">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarCheck className="w-5 h-5 text-blue-600" />
                  Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-attendance-pct">
                  {totalDays > 0 ? `${attendancePct}%` : "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data?.presentThisMonth || 0} present / {data?.absentThisMonth || 0} absent this month
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/staff/salary")} data-testid="card-salary">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="w-5 h-5 text-green-600" />
                  Last Salary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-last-salary">
                  {data?.latestNetSalary ? `Rs. ${Number(data.latestNetSalary).toLocaleString()}` : "—"}
                </p>
                <p className="text-sm text-muted-foreground">Latest payslip</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/staff/documents")} data-testid="card-documents">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-5 h-5 text-violet-600" />
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" data-testid="text-days-since">{data?.daysSinceJoining ?? 0}</p>
                <p className="text-sm text-muted-foreground">Days since joining</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
