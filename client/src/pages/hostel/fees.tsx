import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { hostelNavItems, useHostelData } from "./hostel-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, CreditCard, Edit, CheckSquare, Square } from "lucide-react";
import type { HostelFee } from "@shared/schema";

const months = [
  "January 2025", "February 2025", "March 2025", "April 2025", "May 2025", "June 2025",
  "July 2025", "August 2025", "September 2025", "October 2025", "November 2025", "December 2025",
  "January 2026", "February 2026", "March 2026", "April 2026", "May 2026", "June 2026",
  "July 2026", "August 2026", "September 2026", "October 2026", "November 2026", "December 2026",
];

export default function HostelFees() {
  const { fees, residents, addFee, updateFee, isPending } = useHostelData();
  const { toast } = useToast();

  const [generateOpen, setGenerateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<HostelFee | null>(null);

  const [genMonth, setGenMonth] = useState("May 2026");
  const [genAmount, setGenAmount] = useState(5000);
  const [selectedResidents, setSelectedResidents] = useState<string[]>([]);

  const [editMonth, setEditMonth] = useState("");
  const [editAmount, setEditAmount] = useState(0);
  const [editStatus, setEditStatus] = useState<"Paid" | "Unpaid">("Unpaid");
  const [editPaidDate, setEditPaidDate] = useState("");

  const activeResidents = residents.filter((r) => r.status === "Active");

  const toggleResident = (id: string) => {
    setSelectedResidents((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedResidents.length === activeResidents.length) {
      setSelectedResidents([]);
    } else {
      setSelectedResidents(activeResidents.map((r) => r.id));
    }
  };

  const handleGenerate = async () => {
    if (!genMonth) {
      toast({ title: "Error", description: "Please select a month", variant: "destructive" });
      return;
    }
    if (genAmount <= 0) {
      toast({ title: "Error", description: "Amount must be greater than 0", variant: "destructive" });
      return;
    }
    if (selectedResidents.length === 0) {
      toast({ title: "Error", description: "Please select at least one resident", variant: "destructive" });
      return;
    }

    const alreadyExists = fees.filter(
      (f) => f.month === genMonth && selectedResidents.includes(f.residentId)
    );
    if (alreadyExists.length > 0) {
      toast({
        title: "Warning",
        description: `${alreadyExists.length} resident(s) already have fees for ${genMonth}. They will be skipped.`,
      });
    }

    const toCreate = selectedResidents.filter(
      (rid) => !fees.some((f) => f.month === genMonth && f.residentId === rid)
    );

    if (toCreate.length === 0) {
      toast({ title: "Info", description: "All selected residents already have fees for this month." });
      return;
    }

    try {
      await Promise.all(
        toCreate.map((rid) => {
          const resident = activeResidents.find((r) => r.id === rid)!;
          return addFee({
            residentId: rid,
            studentName: resident.studentName,
            month: genMonth,
            amount: genAmount,
            status: "Unpaid",
          });
        })
      );
      toast({ title: "Success", description: `Fee generated for ${toCreate.length} resident(s)` });
      setGenerateOpen(false);
      setSelectedResidents([]);
    } catch {
      toast({ title: "Error", description: "Failed to generate fees. Please try again.", variant: "destructive" });
    }
  };

  const openEdit = (fee: HostelFee) => {
    setEditingFee(fee);
    setEditMonth(fee.month);
    setEditAmount(fee.amount);
    setEditStatus(fee.status as "Paid" | "Unpaid");
    setEditPaidDate(fee.paidDate || "");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingFee) return;
    try {
      await updateFee(editingFee.id, {
        month: editMonth,
        amount: editAmount,
        status: editStatus,
        paidDate: editStatus === "Paid" ? (editPaidDate || new Date().toISOString().split("T")[0]) : undefined,
      });
      toast({ title: "Success", description: "Fee record updated" });
      setEditOpen(false);
      setEditingFee(null);
    } catch {
      toast({ title: "Error", description: "Failed to update fee record", variant: "destructive" });
    }
  };

  const handleMarkPaid = (id: string) => {
    updateFee(id, { status: "Paid", paidDate: new Date().toISOString().split("T")[0] });
  };

  const columns = [
    { key: "studentName" as const, label: "Student", sortable: true },
    { key: "month" as const, label: "Month" },
    {
      key: "amount" as const,
      label: "Amount",
      render: (item: HostelFee) => `Rs. ${item.amount.toLocaleString()}`,
    },
    {
      key: "paidDate" as const,
      label: "Paid Date",
      render: (item: HostelFee) => item.paidDate || "-",
    },
    {
      key: "status" as const,
      label: "Status",
      render: (item: HostelFee) => <StatusBadge status={item.status} />,
    },
  ];

  const actions = (item: HostelFee) => (
    <div className="flex items-center gap-2">
      {item.status === "Unpaid" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleMarkPaid(item.id)}
          data-testid={`button-pay-${item.id}`}
        >
          <CreditCard className="w-4 h-4 mr-1" />
          Mark Paid
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => openEdit(item)}
        data-testid={`button-edit-${item.id}`}
      >
        <Edit className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <ModuleLayout module="hostel" navItems={hostelNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Hostel Fee"
          description="Manage hostel fee collection"
          actions={
            <Button onClick={() => { setSelectedResidents([]); setGenerateOpen(true); }} data-testid="button-generate-fee">
              <Plus className="w-4 h-4 mr-2" />
              Generate Fee
            </Button>
          }
        />

        <DataTable
          data={fees}
          columns={columns}
          searchKey="studentName"
          searchPlaceholder="Search by student..."
          actions={actions}
          getRowKey={(item) => item.id}
        />

        {/* Generate Fee Dialog */}
        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generate Hostel Fee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Month *</Label>
                  <Select value={genMonth} onValueChange={setGenMonth}>
                    <SelectTrigger data-testid="select-month">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (Rs.) *</Label>
                  <Input
                    type="number"
                    value={genAmount}
                    onChange={(e) => setGenAmount(Number(e.target.value))}
                    min={1}
                    data-testid="input-amount"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select Residents *</Label>
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    data-testid="button-toggle-all"
                  >
                    {selectedResidents.length === activeResidents.length ? (
                      <CheckSquare className="w-3.5 h-3.5" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                    {selectedResidents.length === activeResidents.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                {activeResidents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-3 text-center border rounded-md">
                    No active residents found. Add residents first.
                  </p>
                ) : (
                  <div className="border rounded-md max-h-52 overflow-y-auto divide-y">
                    {activeResidents.map((resident) => {
                      const alreadyHasFee = fees.some(
                        (f) => f.residentId === resident.id && f.month === genMonth
                      );
                      return (
                        <label
                          key={resident.id}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors ${alreadyHasFee ? "opacity-50" : ""}`}
                          data-testid={`label-resident-${resident.id}`}
                        >
                          <Checkbox
                            checked={selectedResidents.includes(resident.id)}
                            onCheckedChange={() => !alreadyHasFee && toggleResident(resident.id)}
                            disabled={alreadyHasFee}
                            data-testid={`checkbox-resident-${resident.id}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{resident.studentName}</p>
                            <p className="text-xs text-muted-foreground">{resident.class} · Room {resident.roomNumber}</p>
                          </div>
                          {alreadyHasFee && (
                            <span className="text-xs text-muted-foreground shrink-0">Fee exists</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {selectedResidents.length} of {activeResidents.length} selected
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setGenerateOpen(false)}>Cancel</Button>
                <Button onClick={handleGenerate} disabled={isPending} data-testid="button-confirm-generate">
                  {isPending ? "Generating..." : `Generate for ${selectedResidents.length} Resident(s)`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Fee Dialog */}
        <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) setEditingFee(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Edit Fee Record</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {editingFee && (
                <p className="text-sm text-muted-foreground">
                  Student: <span className="font-medium text-foreground">{editingFee.studentName}</span>
                </p>
              )}
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={editMonth} onValueChange={setEditMonth}>
                  <SelectTrigger data-testid="select-edit-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (Rs.)</Label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(Number(e.target.value))}
                  min={1}
                  data-testid="input-edit-amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as "Paid" | "Unpaid")}>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editStatus === "Paid" && (
                <div className="space-y-2">
                  <Label>Paid Date</Label>
                  <Input
                    type="date"
                    value={editPaidDate}
                    onChange={(e) => setEditPaidDate(e.target.value)}
                    data-testid="input-edit-paid-date"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveEdit} disabled={isPending} data-testid="button-save-edit">
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}
