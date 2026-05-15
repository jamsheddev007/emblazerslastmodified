import { ModuleLayout } from "@/components/layout/module-layout";
import { studentNavItems, useStudentAttendance } from "./student-data";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";

export default function StudentAttendancePage() {
  const { data: attendance = [], isLoading } = useStudentAttendance();

  const totalPresent = attendance.reduce((sum: number, m: any) => sum + m.presentDays, 0);
  const totalAbsent = attendance.reduce((sum: number, m: any) => sum + m.absentDays, 0);
  const totalDays = totalPresent + totalAbsent;
  const overallPercentage = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;

  const getColorClass = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-red-600";
  };

  const getColorForBg = (percentage: number) => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formatMonth = (m: string) => {
    const [year, month] = m.split("-");
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Circular progress SVG
  const circleRadius = 90;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (overallPercentage / 100) * circumference;

  return (
    <ModuleLayout module="curriculum" navItems={studentNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">My Attendance</h1>
          <p className="text-muted-foreground">View your monthly attendance records</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg
                  className="absolute"
                  width="200"
                  height="200"
                  viewBox="0 0 200 200"
                  data-testid="circle-progress"
                >
                  <circle
                    cx="100"
                    cy="100"
                    r={circleRadius}
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="8"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r={circleRadius}
                    fill="none"
                    stroke={
                      overallPercentage >= 90
                        ? "rgb(34, 197, 94)"
                        : overallPercentage >= 75
                        ? "rgb(234, 179, 8)"
                        : "rgb(239, 68, 68)"
                    }
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "100px 100px" }}
                  />
                </svg>
                <div className="text-center z-10">
                  <p className={`text-4xl font-bold ${getColorClass(overallPercentage)}`} data-testid="text-overall-percentage">
                    {overallPercentage}%
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Overall Attendance</p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-6 w-full">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Total Days</p>
                  <p className="text-2xl font-bold" data-testid="text-total-days">{totalDays}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Present</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-total-present">{totalPresent}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Absent</p>
                  <p className="text-2xl font-bold text-red-600" data-testid="text-total-absent">{totalAbsent}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
        ) : attendance.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CalendarCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              No attendance records found.
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Month</th>
                  <th className="text-left p-3 text-sm font-medium">Present Days</th>
                  <th className="text-left p-3 text-sm font-medium">Absent Days</th>
                  <th className="text-left p-3 text-sm font-medium">Total Days</th>
                  <th className="text-left p-3 text-sm font-medium">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((m: any) => {
                  const totalMonthDays = (m.presentDays || 0) + (m.absentDays || 0);
                  const monthPercentage = totalMonthDays > 0 ? Math.round(((m.presentDays || 0) / totalMonthDays) * 100) : 0;
                  return (
                    <tr key={m.month} className="border-t" data-testid={`row-attendance-${m.month}`}>
                      <td className="p-3 text-sm font-medium">{formatMonth(m.month)}</td>
                      <td className="p-3 text-sm font-medium text-green-600" data-testid={`text-present-${m.month}`}>
                        {m.presentDays || 0}
                      </td>
                      <td className="p-3 text-sm font-medium text-red-600" data-testid={`text-absent-${m.month}`}>
                        {m.absentDays || 0}
                      </td>
                      <td className="p-3 text-sm font-medium" data-testid={`text-total-${m.month}`}>
                        {totalMonthDays}
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getColorForBg(monthPercentage)}`}
                              style={{ width: `${monthPercentage}%` }}
                            />
                          </div>
                          <span className={`font-medium min-w-fit ${getColorClass(monthPercentage)}`} data-testid={`text-percentage-${m.month}`}>
                            {monthPercentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
