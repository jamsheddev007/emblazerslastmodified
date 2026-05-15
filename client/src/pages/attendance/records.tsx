import { useState } from "react";
import { format } from "date-fns";
import { ModuleLayout } from "@/components/layout/module-layout";
import {
  attendanceNavItems,
  useAttendanceData,
  useUpdateAttendance,
  useDeleteAttendance,
  classes,
  sections,
} from "./attendance-data";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

export default function AttendanceRecords() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [targetType, setTargetType] = useState<"STUDENT" | "STAFF">("STUDENT");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const { toast } = useToast();

  const { records, isLoading } = useAttendanceData({
    date: selectedDate,
    targetType,
    className: targetType === "STUDENT" && selectedClass ? selectedClass : undefined,
    section: targetType === "STUDENT" && selectedSection ? selectedSection : undefined,
  });

  const updateMutation = useUpdateAttendance();
  const deleteMutation = useDeleteAttendance();

  const handleStatusChange = async (id: string, status: "PRESENT" | "ABSENT" | "LEAVE") => {
    try {
      await updateMutation.mutateAsync({ id, updates: { status } });
      toast({ title: "Updated", description: "Attendance status updated." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Deleted", description: "Attendance record deleted." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

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
            Attendance Records
          </h1>
          <p className="text-muted-foreground mt-1">View and edit attendance records</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <Tabs value={targetType} onValueChange={(v) => setTargetType(v as "STUDENT" | "STAFF")}>
              <TabsList data-testid="tabs-target-type">
                <TabsTrigger value="STUDENT" data-testid="tab-students">Students</TabsTrigger>
                <TabsTrigger value="STAFF" data-testid="tab-staff">Staff</TabsTrigger>
              </TabsList>

              <TabsContent value="STUDENT">
                <div className="flex flex-wrap items-end gap-4 mt-4">
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
                </div>
              </TabsContent>

              <TabsContent value="STAFF">
                <p className="text-sm text-muted-foreground mt-4">
                  Showing all staff attendance records for the selected date.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              Records ({records.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-muted-foreground">Loading records...</span>
              </div>
            ) : records.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No attendance records found for the selected filters
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs uppercase tracking-wide">Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">ID</TableHead>
                      {targetType === "STUDENT" && (
                        <>
                          <TableHead className="text-xs uppercase tracking-wide">Class</TableHead>
                          <TableHead className="text-xs uppercase tracking-wide">Section</TableHead>
                        </>
                      )}
                      <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Remarks</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Marked At</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="text-sm" data-testid={`text-name-${record.id}`}>
                          {record.entityName}
                        </TableCell>
                        <TableCell className="text-sm" data-testid={`text-id-${record.id}`}>
                          {record.studentId || record.staffId}
                        </TableCell>
                        {targetType === "STUDENT" && (
                          <>
                            <TableCell className="text-sm">{record.className || "-"}</TableCell>
                            <TableCell className="text-sm">{record.section || "-"}</TableCell>
                          </>
                        )}
                        <TableCell>
                          <Select
                            value={record.status}
                            onValueChange={(val) => handleStatusChange(record.id, val as "PRESENT" | "ABSENT" | "LEAVE")}
                          >
                            <SelectTrigger className="w-[130px] p-0 border-0 h-auto" data-testid={`select-edit-status-${record.id}`}>
                              <Badge variant={getStatusVariant(record.status)}>
                                {record.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PRESENT">PRESENT</SelectItem>
                              <SelectItem value="ABSENT">ABSENT</SelectItem>
                              <SelectItem value="LEAVE">LEAVE</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record.remarks || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {record.markedAt ? format(new Date(record.markedAt), "hh:mm a") : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(record.id)}
                            disabled={deleteMutation.isPending}
                            data-testid={`button-delete-${record.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
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
