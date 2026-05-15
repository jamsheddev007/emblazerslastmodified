import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { ModuleLayout } from "@/components/layout/module-layout";
import { staffNavItems, useStaffAttendance } from "./staff-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function StaffAttendance() {
  const [, setLocation] = useLocation();
  const { session } = useAuth();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const { data, isLoading } = useStaffAttendance(selectedMonth);

  useEffect(() => {
    if (!session || session.role !== "staff" || !session.loggedIn) {
      setLocation("/staff/login");
    }
  }, [session, setLocation]);

  if (!session || session.role !== "staff") return null;

  const records = data?.records || [];
  const summary = data?.summary || {};
  const totalPresent = summary.totalPresent || 0;
  const totalAbsent = summary.totalAbsent || 0;
  const totalLeave = summary.totalLeave || 0;
  const total = summary.total || 0;
  const percentage = summary.attendancePercentage || 0;

  const yearOptions = [now.getFullYear(), now.getFullYear() - 1];
  const monthOptions: { label: string; value: string }[] = [];
  yearOptions.forEach(y => {
    months.forEach((m, i) => {
      monthOptions.push({ label: `${m} ${y}`, value: `${y}-${String(i + 1).padStart(2, '0')}` });
    });
  });

  return (
    <ModuleLayout module="hr" navItems={staffNavItems}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">My Attendance</h1>
            <p className="text-muted-foreground mt-1">View your attendance records</p>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48" data-testid="select-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <Card data-testid="card-stat-percentage">
                <CardContent className="pt-6 text-center">
                  <p className={`text-3xl font-bold ${percentage >= 75 ? 'text-green-600' : 'text-red-600'}`} data-testid="text-percentage">{percentage}%</p>
                  <p className="text-sm text-muted-foreground">Attendance</p>
                </CardContent>
              </Card>
              <Card data-testid="card-stat-present">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-green-600" data-testid="text-present">{totalPresent}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </CardContent>
              </Card>
              <Card data-testid="card-stat-absent">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-red-600" data-testid="text-absent">{totalAbsent}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </CardContent>
              </Card>
              <Card data-testid="card-stat-leave">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-blue-600" data-testid="text-leave">{totalLeave}</p>
                  <p className="text-sm text-muted-foreground">Leave</p>
                </CardContent>
              </Card>
              <Card data-testid="card-stat-total">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-gray-600" data-testid="text-total">{total}</p>
                  <p className="text-sm text-muted-foreground">Total Days</p>
                </CardContent>
              </Card>
            </div>

            <Card data-testid="card-attendance-records">
              <CardHeader>
                <CardTitle className="text-lg">Daily Records</CardTitle>
              </CardHeader>
              <CardContent>
                {records.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8" data-testid="text-no-records">No attendance records for this period</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3 font-medium">Date</th>
                          <th className="text-left py-2 px-3 font-medium">Status</th>
                          <th className="text-left py-2 px-3 font-medium">Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {records.map((rec: any, idx: number) => (
                          <tr key={rec.id || idx} className="border-b last:border-b-0" data-testid={`row-attendance-${idx}`}>
                            <td className="py-2 px-3">{rec.date}</td>
                            <td className="py-2 px-3">
                              <Badge
                                variant={rec.status?.toUpperCase() === "PRESENT" ? "default" : rec.status?.toUpperCase() === "LEAVE" ? "outline" : "destructive"}
                                className="gap-1"
                                data-testid={`badge-status-${idx}`}
                              >
                                {rec.status?.toUpperCase() === "PRESENT" ? <CheckCircle className="w-3 h-3" /> :
                                 rec.status?.toUpperCase() === "LEAVE" ? <Clock className="w-3 h-3" /> :
                                 <XCircle className="w-3 h-3" />}
                                {rec.status}
                              </Badge>
                            </td>
                            <td className="py-2 px-3 text-muted-foreground">{rec.remarks || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ModuleLayout>
  );
}
