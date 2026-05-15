import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { hrNavItems } from "./hr-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { type Staff } from "@shared/schema";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface LeaveApplication {
  id: number;
  staffId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  approvedBy: number | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  branchId: number;
  createdAt: string;
  staffName: string | null;
  staffDesignation: string | null;
}

interface LeaveBalance {
  sickUsed: number; sickTotal: number;
  casualUsed: number; casualTotal: number;
  annualUsed: number; annualTotal: number;
  emergencyUsed: number; emergencyTotal: number;
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

function LeaveTypeBadge({ type }: { type: string }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${LEAVE_TYPE_COLORS[type] || "bg-gray-100 text-gray-800"}`}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

export default function HrLeaves() {
  const { toast } = useToast();
  const { data: allLeaves = [], isLoading, refetch } = useQuery<LeaveApplication[]>({
    queryKey: ["/api/leave-applications"],
  });
  const { data: staff = [] } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [balanceStaffId, setBalanceStaffId] = useState("");
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const pendingLeaves = allLeaves.filter(l => l.status === "pending");

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      await apiRequest("PATCH", `/api/leave-applications/${id}/approve`, {});
      toast({ title: "Approved", description: "Leave application approved successfully" });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (id: number) => {
    setRejectingId(id);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    setActionLoading(true);
    try {
      await apiRequest("PATCH", `/api/leave-applications/${rejectingId}/reject`, { rejectionReason });
      toast({ title: "Rejected", description: "Leave application rejected" });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setRejectDialogOpen(false);
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoadBalance = async () => {
    if (!balanceStaffId) return;
    setBalanceLoading(true);
    try {
      const res = await fetch(`/api/leave-applications/balance/${balanceStaffId}`, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
      if (!res.ok) throw new Error("Failed to fetch balance");
      setBalance(await res.json());
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setBalanceLoading(false);
    }
  };

  const balanceItems = balance ? [
    { label: "Sick Leave", used: balance.sickUsed, total: balance.sickTotal, color: "bg-red-500" },
    { label: "Casual Leave", used: balance.casualUsed, total: balance.casualTotal, color: "bg-blue-500" },
    { label: "Annual Leave", used: balance.annualUsed, total: balance.annualTotal, color: "bg-green-500" },
    { label: "Emergency Leave", used: balance.emergencyUsed, total: balance.emergencyTotal, color: "bg-orange-500" },
  ] : [];

  const LeaveTable = ({ leaves, showActions }: { leaves: LeaveApplication[]; showActions?: boolean }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Staff Name</TableHead>
          <TableHead>Designation</TableHead>
          <TableHead>Leave Type</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Reason</TableHead>
          {!showActions && <TableHead>Status</TableHead>}
          {showActions && <TableHead>Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {leaves.map(leave => (
          <TableRow key={leave.id} data-testid={`row-leave-${leave.id}`}>
            <TableCell className="font-medium">{leave.staffName || `Staff #${leave.staffId}`}</TableCell>
            <TableCell className="text-muted-foreground text-sm">{leave.staffDesignation || "—"}</TableCell>
            <TableCell><LeaveTypeBadge type={leave.leaveType} /></TableCell>
            <TableCell>{leave.startDate}</TableCell>
            <TableCell>{leave.endDate}</TableCell>
            <TableCell>{leave.totalDays}</TableCell>
            <TableCell className="max-w-[200px] truncate text-sm">{leave.reason}</TableCell>
            {!showActions && <TableCell><StatusBadge status={leave.status} /></TableCell>}
            {showActions && (
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleApprove(leave.id)} disabled={actionLoading}
                    data-testid={`button-approve-${leave.id}`}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => openRejectDialog(leave.id)} disabled={actionLoading}
                    data-testid={`button-reject-${leave.id}`}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
        {leaves.length === 0 && (
          <TableRow>
            <TableCell colSpan={showActions ? 8 : 8} className="text-center py-8 text-muted-foreground">
              {isLoading ? "Loading..." : "No leave applications found."}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <ModuleLayout module="hr" navItems={hrNavItems}>
      <PageHeader title="Leave Management" description="Manage staff leave applications and balances" />

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending Applications
            {pendingLeaves.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">{pendingLeaves.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All Applications</TabsTrigger>
          <TabsTrigger value="balance" data-testid="tab-balance">Leave Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardContent className="p-0">
              <LeaveTable leaves={pendingLeaves} showActions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <LeaveTable leaves={allLeaves} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Check Leave Balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 items-end">
                <div className="space-y-2 flex-1 max-w-xs">
                  <Label>Select Staff Member</Label>
                  <Select value={balanceStaffId} onValueChange={setBalanceStaffId}>
                    <SelectTrigger data-testid="select-balance-staff">
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.map(s => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name} — {s.designation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleLoadBalance} disabled={balanceLoading || !balanceStaffId} data-testid="button-load-balance">
                  {balanceLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Load Balance
                </Button>
              </div>

              {balance && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {balanceItems.map(item => (
                    <Card key={item.label} className="bg-muted/30">
                      <CardContent className="pt-4 pb-3 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{item.label}</span>
                          <span className="text-sm text-muted-foreground">{item.used} / {item.total} days used</span>
                        </div>
                        <Progress value={Math.min(100, (item.used / item.total) * 100)} className="h-2" />
                        <p className="text-xs text-muted-foreground">{Math.max(0, item.total - item.used)} days remaining</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {!balance && !balanceLoading && (
                <p className="text-sm text-muted-foreground py-4">Select a staff member and click Load Balance to see their leave balance.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Application</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this leave application.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={3}
                data-testid="textarea-rejection-reason"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={actionLoading} data-testid="button-confirm-reject">
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Reject Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
