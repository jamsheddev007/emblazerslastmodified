import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ModuleLayout } from "@/components/layout/module-layout";
import {
  attendanceNavItems,
  useStaffForAttendance,
  useAttendanceData,
  useMarkAttendance,
} from "./attendance-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { CheckCircle, XCircle, Loader2, Info } from "lucide-react";

type StatusMap = Record<string, "PRESENT" | "ABSENT" | "LEAVE">;

export default function MarkStaff() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const { toast } = useToast();

  const { data: allStaff = [], isLoading: staffLoading } = useStaffForAttendance();
  const { records: existingRecords, isLoading: recordsLoading } = useAttendanceData({
    date: selectedDate,
    targetType: "STAFF",
  });
  const markMutation = useMarkAttendance();

  const activeStaff = allStaff.filter((s) => s.status === "Active");

  const markedStaffIds = useMemo(() => {
    const set = new Set<string>();
    existingRecords.forEach((r) => {
      if (r.staffId) set.add(r.staffId);
    });
    return set;
  }, [existingRecords]);

  const markedCount = activeStaff.filter((s) => markedStaffIds.has(s.staffId)).length;
  const allMarked = activeStaff.length > 0 && markedCount === activeStaff.length;
  const partiallyMarked = markedCount > 0 && markedCount < activeStaff.length;

  const staffIdKey = useMemo(() => activeStaff.map((s) => s.staffId).join(","), [activeStaff]);
  const recordIdKey = useMemo(() => existingRecords.map((r) => r.id).join(","), [existingRecords]);

  useEffect(() => {
    const newStatusMap: StatusMap = {};
    activeStaff.forEach((staff) => {
      const existing = existingRecords.find(
        (r) => r.staffId === staff.staffId && r.date === selectedDate
      );
      newStatusMap[staff.staffId] = existing ? existing.status as "PRESENT" | "ABSENT" | "LEAVE" : "PRESENT";
    });
    setStatusMap(newStatusMap);
    setHasLocalChanges(false);
  }, [staffIdKey, recordIdKey, selectedDate]);

  const handleStatusChange = (staffId: string, status: "PRESENT" | "ABSENT" | "LEAVE") => {
    setStatusMap((prev) => ({ ...prev, [staffId]: status }));
    setHasLocalChanges(true);
  };

  const handleMarkAll = (status: "PRESENT" | "ABSENT") => {
    const newMap: StatusMap = {};
    activeStaff.forEach((s) => {
      newMap[s.staffId] = status;
    });
    setStatusMap(newMap);
    setHasLocalChanges(true);
  };

  const handleSubmit = async () => {
    if (activeStaff.length === 0) {
      toast({ title: "No staff", description: "No active staff found.", variant: "destructive" });
      return;
    }

    const records = activeStaff.map((staff) => ({
      date: selectedDate,
      targetType: "STAFF" as const,
      staffId: staff.staffId,
      entityName: staff.name,
      status: statusMap[staff.staffId] || "PRESENT",
    }));

    try {
      await markMutation.mutateAsync(records);
      setHasLocalChanges(false);
      toast({
        title: allMarked ? "Attendance updated" : "Attendance saved",
        description: `Attendance ${allMarked ? "updated" : "saved"} for ${records.length} staff members.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to mark attendance";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <ModuleLayout module="attendance" navItems={attendanceNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">
            Mark Staff Attendance
          </h1>
          <p className="text-muted-foreground mt-1">Mark daily attendance for staff members</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Date</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  data-testid="input-date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {recordsLoading ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Checking existing records...</span>
          </div>
        ) : allMarked ? (
          <div className="flex items-center gap-3 rounded-md border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 px-4 py-3" data-testid="banner-already-marked">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-300">
                Attendance already marked for {selectedDate}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500">
                All {markedCount} staff marked. You can change any status below and click "Update Attendance" to save.
              </p>
            </div>
          </div>
        ) : partiallyMarked ? (
          <div className="flex items-center gap-3 rounded-md border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30 px-4 py-3" data-testid="banner-partially-marked">
            <Info className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                Partially marked for {selectedDate}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-500">
                {markedCount} of {activeStaff.length} staff marked. Click "Save Attendance" to save all.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-md border px-4 py-3" data-testid="banner-not-marked">
            <Info className="w-5 h-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              No attendance recorded yet for {selectedDate}. Select status for each staff member and click "Save Attendance".
            </p>
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="text-lg">
                Staff Members ({activeStaff.length})
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll("PRESENT")}
                  data-testid="button-mark-all-present"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAll("ABSENT")}
                  data-testid="button-mark-all-absent"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Mark All Absent
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {staffLoading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-muted-foreground">Loading staff...</span>
              </div>
            ) : activeStaff.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No active staff members found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs uppercase tracking-wide">Staff ID</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Department</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Designation</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide w-[100px]">Saved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeStaff.map((staff) => {
                      const isSaved = markedStaffIds.has(staff.staffId);
                      return (
                        <TableRow key={staff.staffId}>
                          <TableCell className="text-sm" data-testid={`text-staff-id-${staff.staffId}`}>
                            {staff.staffId}
                          </TableCell>
                          <TableCell className="text-sm" data-testid={`text-staff-name-${staff.staffId}`}>
                            {staff.name}
                          </TableCell>
                          <TableCell className="text-sm">{staff.department}</TableCell>
                          <TableCell className="text-sm">{staff.designation}</TableCell>
                          <TableCell>
                            <Select
                              value={statusMap[staff.staffId] || "PRESENT"}
                              onValueChange={(val) => handleStatusChange(staff.staffId, val as "PRESENT" | "ABSENT" | "LEAVE")}
                            >
                              <SelectTrigger className="w-[130px]" data-testid={`select-status-${staff.staffId}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PRESENT">PRESENT</SelectItem>
                                <SelectItem value="ABSENT">ABSENT</SelectItem>
                                <SelectItem value="LEAVE">LEAVE</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {isSaved ? (
                              <Badge variant="secondary" className="text-xs" data-testid={`badge-saved-${staff.staffId}`}>
                                Saved
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">Not saved</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {activeStaff.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                {hasLocalChanges && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">You have unsaved changes</p>
                )}
                <div className="ml-auto">
                  <Button
                    onClick={handleSubmit}
                    disabled={markMutation.isPending}
                    data-testid="button-submit-attendance"
                  >
                    {markMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {allMarked ? "Update Attendance" : "Save Attendance"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
