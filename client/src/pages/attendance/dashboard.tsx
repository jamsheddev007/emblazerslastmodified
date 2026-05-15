import { useState } from "react";
import { format } from "date-fns";
import { ModuleLayout } from "@/components/layout/module-layout";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { RecentTable } from "@/components/shared/recent-table";
import { attendanceNavItems, useAttendanceSummary, useAttendanceData } from "./attendance-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, UserCheck, UserX, Clock, GraduationCap, Loader2 } from "lucide-react";

export default function AttendanceDashboard() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: studentSummary, isLoading: studentLoading } = useAttendanceSummary(selectedDate, "STUDENT");
  const { data: staffSummary, isLoading: staffLoading } = useAttendanceSummary(selectedDate, "STAFF");
  const { records, isLoading: recordsLoading } = useAttendanceData({ date: selectedDate });

  const isLoading = studentLoading || staffLoading || recordsLoading;

  const totalPresent = (studentSummary?.present || 0) + (staffSummary?.present || 0);
  const totalAbsent = (studentSummary?.absent || 0) + (staffSummary?.absent || 0);
  const totalLeave = (studentSummary?.leave || 0) + (staffSummary?.leave || 0);
  const totalCount = (studentSummary?.total || 0) + (staffSummary?.total || 0);

  const recentRecords = [...records]
    .sort((a, b) => new Date(b.markedAt || b.date).getTime() - new Date(a.markedAt || a.date).getTime())
    .slice(0, 10);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PRESENT": return "default";
      case "ABSENT": return "destructive";
      case "LEAVE": return "secondary";
      default: return "outline";
    }
  };

  return (
    <ModuleLayout module="attendance" navItems={attendanceNavItems}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">
              Attendance Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Overview of daily attendance</p>
          </div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
            data-testid="input-date-picker"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-muted-foreground">Loading attendance data...</span>
          </div>
        ) : (
          <>
            <StatsGrid>
              <StatsCard
                title="Total Marked"
                value={totalCount}
                icon={Users}
                iconColor="text-blue-500"
              />
              <StatsCard
                title="Present"
                value={totalPresent}
                icon={UserCheck}
                iconColor="text-green-500"
              />
              <StatsCard
                title="Absent"
                value={totalAbsent}
                icon={UserX}
                iconColor="text-red-500"
              />
              <StatsCard
                title="On Leave"
                value={totalLeave}
                icon={Clock}
                iconColor="text-orange-500"
              />
            </StatsGrid>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-student-summary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Student Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(studentSummary?.total || 0) === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No student attendance marked yet for this date</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold" data-testid="text-student-total">{studentSummary?.total || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Present</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-student-present">{studentSummary?.present || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Absent</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-student-absent">{studentSummary?.absent || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Leave</p>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-student-leave">{studentSummary?.leave || 0}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-staff-summary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Staff Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(staffSummary?.total || 0) === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No staff attendance marked yet for this date</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold" data-testid="text-staff-total">{staffSummary?.total || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Present</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-staff-present">{staffSummary?.present || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Absent</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-staff-absent">{staffSummary?.absent || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Leave</p>
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-staff-leave">{staffSummary?.leave || 0}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        <RecentTable
          title="Recent Attendance Records"
          data={recentRecords}
          columns={[
            { key: "entityName", label: "Name" },
            { key: "targetType", label: "Type", render: (item) => (
              <Badge variant="outline" className="text-xs">{item.targetType}</Badge>
            )},
            { key: "className", label: "Class", render: (item) => item.className || "-" },
            { key: "status", label: "Status", render: (item) => (
              <Badge variant={getStatusVariant(item.status)} data-testid={`badge-status-${item.id}`}>
                {item.status}
              </Badge>
            )},
            { key: "date", label: "Date" },
          ]}
          getRowKey={(item) => item.id}
          maxRows={10}
          emptyMessage="No attendance records for this date"
        />
      </div>
    </ModuleLayout>
  );
}
