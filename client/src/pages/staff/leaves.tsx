import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { staffNavItems } from "./staff-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { queryClient } from "@/lib/queryClient";
import { Plus, Loader2 } from "lucide-react";

interface LeaveApplication {
  id: number;
  staffId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
}

const LEAVE_TYPE_COLORS: Record<string, string> = {
  sick: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  casual: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  annual: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  emergency: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("staff_portal_token") || localStorage.getItem("emblazers_token")}`,
});

export default function StaffLeaves() {
  const { toast } = useToast();

  const { data: leaves = [], isLoading, refetch } = useQuery<LeaveApplication[]>({
    queryKey: ["/api/staff-portal/leave-applications"],
    queryFn: async () => {
      const res = await fetch("/api/staff-portal/leave-applications", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to fetch leave applications");
      return res.json();
    },
  });

  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const totalDays = form.startDate && form.endDate
    ? Math.max(1, Math.floor((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000) + 1)
    : 0;

  const handleSubmit = async () => {
    if (!form.leaveType || !form.startDate || !form.endDate || !form.reason) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      toast({ title: "Error", description: "End date must be on or after start date", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff-portal/leave-applications", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit");
      }
      toast({ title: "Success", description: "Leave application submitted successfully. Pending HR approval." });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-portal/leave-applications"] });
      refetch();
      setApplyDialogOpen(false);
      setForm({ leaveType: "", startDate: "", endDate: "", reason: "" });
    } catch (err) {
      toast({ title: "Submission Failed", description: String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModuleLayout module="hr" navItems={staffNavItems}>
      <PageHeader
        title="My Leaves"
        description="View your leave applications and apply for leave"
      />

      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setApplyDialogOpen(true)} data-testid="button-apply-leave">
            <Plus className="w-4 h-4 mr-2" />
            Apply for Leave
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map(leave => (
                  <TableRow key={leave.id} data-testid={`row-my-leave-${leave.id}`}>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${LEAVE_TYPE_COLORS[leave.leaveType] || "bg-gray-100 text-gray-800"}`}>
                        {leave.leaveType}
                      </span>
                    </TableCell>
                    <TableCell>{leave.startDate}</TableCell>
                    <TableCell>{leave.endDate}</TableCell>
                    <TableCell>{leave.totalDays}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">{leave.reason}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[leave.status] || "bg-gray-100 text-gray-800"}`}>
                          {leave.status}
                        </span>
                        {leave.status === "rejected" && leave.rejectionReason && (
                          <p className="text-xs text-muted-foreground">{leave.rejectionReason}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {leaves.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {isLoading ? "Loading..." : `No leave applications yet. Click "Apply for Leave" to submit one.`}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Apply for Leave Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Fill in the details for your leave application. It will be reviewed by HR.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Leave Type <span className="text-destructive">*</span></Label>
              <Select value={form.leaveType} onValueChange={v => setForm(p => ({ ...p, leaveType: v }))}>
                <SelectTrigger data-testid="select-leave-type">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="annual">Annual Leave</SelectItem>
                  <SelectItem value="emergency">Emergency Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label>End Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                  data-testid="input-end-date"
                />
              </div>
            </div>

            {totalDays > 0 && (
              <div className="bg-muted/50 rounded-md px-3 py-2 text-sm">
                <span className="text-muted-foreground">Total days: </span>
                <span className="font-semibold" data-testid="text-total-days">{totalDays} day{totalDays !== 1 ? "s" : ""}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label>Reason <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Briefly describe the reason for your leave..."
                value={form.reason}
                onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                rows={3}
                data-testid="textarea-leave-reason"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setApplyDialogOpen(false)} disabled={submitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting} data-testid="button-submit-leave">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Submit Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
