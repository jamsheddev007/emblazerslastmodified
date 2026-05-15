import { useState } from "react";
import { format, subDays } from "date-fns";
import { ModuleLayout } from "@/components/layout/module-layout";
import {
  attendanceNavItems,
  useAttendanceReport,
  classes,
  sections,
} from "./attendance-data";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, UserCheck, UserX, Clock } from "lucide-react";

export default function AttendanceReports() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [targetType, setTargetType] = useState<"STUDENT" | "STAFF">("STUDENT");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const { toast } = useToast();

  const { data: reportData = [], isLoading } = useAttendanceReport({
    targetType,
    startDate,
    endDate,
    className: targetType === "STUDENT" && selectedClass && selectedClass !== "all" ? selectedClass : undefined,
    section: targetType === "STUDENT" && selectedSection && selectedSection !== "all" ? selectedSection : undefined,
  });

  const totalRecords = reportData.length;
  const presentCount = reportData.filter((r) => r.status === "PRESENT").length;
  const absentCount = reportData.filter((r) => r.status === "ABSENT").length;
  const leaveCount = reportData.filter((r) => r.status === "LEAVE").length;

  const presentPct = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : "0";
  const absentPct = totalRecords > 0 ? ((absentCount / totalRecords) * 100).toFixed(1) : "0";
  const leavePct = totalRecords > 0 ? ((leaveCount / totalRecords) * 100).toFixed(1) : "0";

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PRESENT": return "default" as const;
      case "ABSENT": return "destructive" as const;
      case "LEAVE": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  return (
    <ModuleLayout module="attendance" navItems={attendanceNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">
            Attendance Reports
          </h1>
          <p className="text-muted-foreground mt-1">Generate and view attendance reports</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Report Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <Select value={targetType} onValueChange={(v) => setTargetType(v as "STUDENT" | "STAFF")}>
                  <SelectTrigger className="w-[140px]" data-testid="select-target-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Students</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {targetType === "STUDENT" && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Class</label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-[160px]" data-testid="select-class">
                        <SelectValue placeholder="All Classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">Section</label>
                    <Select value={selectedSection} onValueChange={setSelectedSection}>
                      <SelectTrigger className="w-[120px]" data-testid="select-section">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {sections.map((sec) => (
                          <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <StatsGrid>
          <StatsCard
            title="Total Records"
            value={totalRecords}
            icon={FileText}
            iconColor="text-blue-500"
          />
          <StatsCard
            title="Present"
            value={`${presentPct}%`}
            icon={UserCheck}
            iconColor="text-green-500"
            subtitle={`${presentCount} records`}
          />
          <StatsCard
            title="Absent"
            value={`${absentPct}%`}
            icon={UserX}
            iconColor="text-red-500"
            subtitle={`${absentCount} records`}
          />
          <StatsCard
            title="Leave"
            value={`${leavePct}%`}
            icon={Clock}
            iconColor="text-orange-500"
            subtitle={`${leaveCount} records`}
          />
        </StatsGrid>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Report Data</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-muted-foreground">Loading report...</span>
              </div>
            ) : reportData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No records found for the selected date range
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs uppercase tracking-wide">Date</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">ID</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="text-sm" data-testid={`text-date-${record.id}`}>
                          {record.date}
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-name-${record.id}`}>
                          {record.entityName}
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-id-${record.id}`}>
                          {record.studentId || record.staffId}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(record.status)} data-testid={`badge-status-${record.id}`}>
                            {record.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record.remarks || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
