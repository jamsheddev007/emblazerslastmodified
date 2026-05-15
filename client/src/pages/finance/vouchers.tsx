import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { financeNavItems, useFinanceVouchers, useChartOfAccounts, voucherTypes } from "./finance-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Eye, Pencil, Check, X, Trash2, Search, Filter } from "lucide-react";
import { type FinanceVoucher, type InsertFinanceVoucher } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VoucherEntryLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string;
}

const emptyLine = (): VoucherEntryLine => ({
  accountId: "",
  accountName: "",
  debit: 0,
  credit: 0,
  description: "",
});

export default function FinanceVouchers() {
  const { vouchers, createVoucher, updateVoucher, deleteVoucher, postVoucher, cancelVoucher, isLoading, isPending } = useFinanceVouchers();
  const { accounts } = useChartOfAccounts();
  const { toast } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<FinanceVoucher | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const defaultFormData = () => ({
    type: "Receipt" as typeof voucherTypes[number],
    date: new Date().toISOString().split("T")[0],
    narration: "",
    reference: "",
    entries: [emptyLine(), emptyLine()],
  });

  const [formData, setFormData] = useState(defaultFormData());

  const resetForm = () => setFormData(defaultFormData());

  const handleLineChange = (index: number, field: keyof VoucherEntryLine, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      entries: prev.entries.map((entry, i) => {
        if (i !== index) return entry;
        if (field === "accountId") {
          const account = accounts.find(a => a.id === value);
          return { ...entry, accountId: value as string, accountName: account?.accountName || "" };
        }
        return { ...entry, [field]: value };
      }),
    }));
  };

  const addLine = () => {
    setFormData(prev => ({ ...prev, entries: [...prev.entries, emptyLine()] }));
  };

  const removeLine = (index: number) => {
    if (formData.entries.length <= 2) return;
    setFormData(prev => ({ ...prev, entries: prev.entries.filter((_, i) => i !== index) }));
  };

  const totals = {
    debits: formData.entries.reduce((s, e) => s + (e.debit || 0), 0),
    credits: formData.entries.reduce((s, e) => s + (e.credit || 0), 0),
  };
  const isBalanced = totals.debits === totals.credits && totals.debits > 0;

  const handleCreate = async () => {
    if (!formData.narration || !isBalanced) {
      toast({ title: "Error", description: !isBalanced ? "Debits must equal credits" : "Narration is required", variant: "destructive" });
      return;
    }
    try {
      const data: InsertFinanceVoucher = {
        type: formData.type,
        date: formData.date,
        narration: formData.narration,
        reference: formData.reference || undefined,
        entries: formData.entries.filter(e => e.accountId && (e.debit > 0 || e.credit > 0)).map(e => ({
          accountId: e.accountId,
          accountName: e.accountName,
          debit: e.debit || 0,
          credit: e.credit || 0,
          description: e.description || undefined,
        })),
        totalDebit: totals.debits,
        totalCredit: totals.credits,
        status: "Draft",
        createdBy: "System",
      };
      await createVoucher(data);
      toast({ title: "Success", description: "Voucher created as Draft" });
      setCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handleEdit = async () => {
    if (!selectedVoucher || !formData.narration || !isBalanced) {
      toast({ title: "Error", description: !isBalanced ? "Debits must equal credits" : "Narration is required", variant: "destructive" });
      return;
    }
    try {
      await updateVoucher(selectedVoucher.id, {
        type: formData.type,
        date: formData.date,
        narration: formData.narration,
        reference: formData.reference || undefined,
        entries: formData.entries.filter(e => e.accountId && (e.debit > 0 || e.credit > 0)).map(e => ({
          accountId: e.accountId,
          accountName: e.accountName,
          debit: e.debit || 0,
          credit: e.credit || 0,
          description: e.description || undefined,
        })),
        totalDebit: totals.debits,
        totalCredit: totals.credits,
      });
      toast({ title: "Success", description: "Voucher updated" });
      setEditDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handlePost = async () => {
    if (!selectedVoucher) return;
    try {
      await postVoucher(selectedVoucher.id);
      toast({ title: "Success", description: "Voucher posted successfully" });
      setPostDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handleCancel = async () => {
    if (!selectedVoucher) return;
    try {
      await cancelVoucher(selectedVoucher.id);
      toast({ title: "Success", description: "Voucher cancelled" });
      setCancelDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVoucher(id);
      toast({ title: "Success", description: "Voucher deleted" });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const openView = (v: FinanceVoucher) => { setSelectedVoucher(v); setViewDialogOpen(true); };
  const openEdit = (v: FinanceVoucher) => {
    setSelectedVoucher(v);
    setFormData({
      type: v.type,
      date: v.date,
      narration: v.narration,
      reference: v.reference || "",
      entries: v.entries.map(e => ({ accountId: e.accountId, accountName: e.accountName, debit: e.debit, credit: e.credit, description: e.description || "" })),
    });
    setEditDialogOpen(true);
  };
  const openPost = (v: FinanceVoucher) => { setSelectedVoucher(v); setPostDialogOpen(true); };
  const openCancel = (v: FinanceVoucher) => { setSelectedVoucher(v); setCancelDialogOpen(true); };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Draft: "secondary",
      Posted: "default",
      Cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      Receipt: "default",
      Payment: "secondary",
      Journal: "outline",
      Contra: "outline",
    };
    return <Badge variant={variants[type] || "outline"}>{type}</Badge>;
  };

  const filteredVouchers = vouchers.filter(v => {
    const matchesSearch = v.narration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || v.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const renderEntryForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={formData.type} onValueChange={(v: typeof voucherTypes[number]) => setFormData(prev => ({ ...prev, type: v }))}>
            <SelectTrigger data-testid="select-voucher-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {voucherTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={formData.date} onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))} data-testid="input-voucher-date" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Narration</Label>
        <Input placeholder="Enter narration" value={formData.narration} onChange={e => setFormData(prev => ({ ...prev, narration: e.target.value }))} data-testid="input-voucher-narration" />
      </div>
      <div className="space-y-2">
        <Label>Reference (Optional)</Label>
        <Input placeholder="Reference number" value={formData.reference} onChange={e => setFormData(prev => ({ ...prev, reference: e.target.value }))} data-testid="input-voucher-reference" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>Entry Lines</Label>
          <Button type="button" size="sm" variant="outline" onClick={addLine} data-testid="button-add-line">
            <Plus className="w-4 h-4 mr-1" /> Add Line
          </Button>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {formData.entries.map((entry, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Select value={entry.accountId} onValueChange={v => handleLineChange(index, "accountId", v)}>
                <SelectTrigger className="flex-1" data-testid={`select-entry-account-${index}`}>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.accountCode} - {a.accountName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Debit" className="w-24" value={entry.debit || ""} onChange={e => handleLineChange(index, "debit", Number(e.target.value))} data-testid={`input-entry-debit-${index}`} />
              <Input type="number" placeholder="Credit" className="w-24" value={entry.credit || ""} onChange={e => handleLineChange(index, "credit", Number(e.target.value))} data-testid={`input-entry-credit-${index}`} />
              <Input placeholder="Desc" className="w-28" value={entry.description} onChange={e => handleLineChange(index, "description", e.target.value)} data-testid={`input-entry-desc-${index}`} />
              {formData.entries.length > 2 && (
                <Button type="button" size="icon" variant="ghost" onClick={() => removeLine(index)} data-testid={`button-remove-line-${index}`}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
      <Card className={isBalanced ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"}>
        <CardContent className="py-3">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-muted-foreground">Total Debits: </span>
              <span className="font-semibold text-green-600 dark:text-green-400">Rs. {totals.debits.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Credits: </span>
              <span className="font-semibold text-red-600 dark:text-red-400">Rs. {totals.credits.toLocaleString()}</span>
            </div>
            <Badge variant={isBalanced ? "default" : "destructive"}>
              {isBalanced ? "Balanced" : "Unbalanced"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <ModuleLayout module="finance" navItems={financeNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Finance Vouchers"
          description="Manage receipt, payment, journal, and contra vouchers"
        />

        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search vouchers..." className="pl-10 w-64" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} data-testid="input-search-voucher" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40" data-testid="select-type-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {voucherTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => { resetForm(); setCreateDialogOpen(true); }} data-testid="button-create-voucher">
            <Plus className="w-4 h-4 mr-2" /> Create Voucher
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voucher #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Narration</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVouchers.map(v => (
                <TableRow key={v.id} data-testid={`row-voucher-${v.id}`}>
                  <TableCell className="font-medium">{v.voucherNumber}</TableCell>
                  <TableCell>{v.date}</TableCell>
                  <TableCell>{getTypeBadge(v.type)}</TableCell>
                  <TableCell>
                    {(v as any).sourceModule === "fee" ? (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-400 text-xs" data-testid={`badge-source-${v.id}`}>Fee</Badge>
                    ) : (v as any).sourceModule === "payroll" ? (
                      <Badge variant="outline" className="text-violet-600 border-violet-400 text-xs" data-testid={`badge-source-${v.id}`}>Payroll</Badge>
                    ) : (v as any).sourceModule === "pos" ? (
                      <Badge variant="outline" className="text-green-600 border-green-400 text-xs" data-testid={`badge-source-${v.id}`}>POS</Badge>
                    ) : (v as any).sourceModule === "hostel" ? (
                      <Badge variant="outline" className="text-blue-600 border-blue-400 text-xs" data-testid={`badge-source-${v.id}`}>Hostel</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground text-xs" data-testid={`badge-source-${v.id}`}>Manual</Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-48 truncate">{v.narration}</TableCell>
                  <TableCell className="text-right">Rs. {(v.totalDebit || 0).toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(v.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openView(v)} data-testid={`button-view-voucher-${v.id}`}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {v.status === "Draft" && (
                        <Button size="icon" variant="ghost" onClick={() => openEdit(v)} data-testid={`button-edit-voucher-${v.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {v.status === "Draft" && (
                        <Button size="icon" variant="ghost" onClick={() => openPost(v)} data-testid={`button-post-voucher-${v.id}`}>
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      {v.status === "Posted" && (
                        <Button size="icon" variant="ghost" onClick={() => openCancel(v)} data-testid={`button-cancel-voucher-${v.id}`}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      {v.status === "Draft" && (
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(v.id)} data-testid={`button-delete-voucher-${v.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredVouchers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No vouchers found. Click "Create Voucher" to add one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Voucher</DialogTitle>
            <DialogDescription>Create a new voucher as Draft</DialogDescription>
          </DialogHeader>
          {renderEntryForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isPending || !isBalanced} data-testid="button-save-voucher">
              {isPending ? "Saving..." : "Submit as Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Voucher</DialogTitle>
            <DialogDescription>Edit draft voucher: {selectedVoucher?.voucherNumber}</DialogDescription>
          </DialogHeader>
          {renderEntryForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={isPending || !isBalanced} data-testid="button-update-voucher">
              {isPending ? "Saving..." : "Update Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Voucher Details</DialogTitle>
            <DialogDescription>{selectedVoucher?.voucherNumber}</DialogDescription>
          </DialogHeader>
          {selectedVoucher && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <div className="mt-1">{getTypeBadge(selectedVoucher.type)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">{selectedVoucher.date}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="mt-1">{getStatusBadge(selectedVoucher.status)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Reference:</span>
                  <p className="font-medium">{selectedVoucher.reference || "-"}</p>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Narration:</span>
                <p className="font-medium">{selectedVoucher.narration}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedVoucher.entries.map((e, i) => (
                    <TableRow key={i}>
                      <TableCell>{e.accountName}</TableCell>
                      <TableCell className="text-right">{e.debit > 0 ? `Rs. ${e.debit.toLocaleString()}` : "-"}</TableCell>
                      <TableCell className="text-right">{e.credit > 0 ? `Rs. ${e.credit.toLocaleString()}` : "-"}</TableCell>
                      <TableCell>{e.description || "-"}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell>Totals</TableCell>
                    <TableCell className="text-right">Rs. {selectedVoucher.totalDebit.toLocaleString()}</TableCell>
                    <TableCell className="text-right">Rs. {selectedVoucher.totalCredit.toLocaleString()}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>Created by: {selectedVoucher.createdBy} at {selectedVoucher.createdAt}</div>
                {selectedVoucher.postedBy && <div>Posted by: {selectedVoucher.postedBy} at {selectedVoucher.postedAt}</div>}
                {selectedVoucher.cancelledBy && <div>Cancelled by: {selectedVoucher.cancelledBy} at {selectedVoucher.cancelledAt}</div>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Post Voucher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to post voucher {selectedVoucher?.voucherNumber}? This will create ledger entries and cannot be undone easily.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePost} data-testid="button-confirm-post">
              {isPending ? "Posting..." : "Post Voucher"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Voucher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel voucher {selectedVoucher?.voucherNumber}? This will reverse the ledger entries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} data-testid="button-confirm-cancel">
              {isPending ? "Cancelling..." : "Cancel Voucher"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
