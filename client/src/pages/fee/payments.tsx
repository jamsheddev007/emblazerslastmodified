import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { feeNavItems, useChallans, usePayments } from "./fee-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Eye, Search, Filter, Receipt, CreditCard, Wallet, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { type Student, type Payment, type InsertPayment } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

const paymentModes = ["Cash", "Bank Transfer", "Cheque", "Online", "Card"] as const;

export default function FeePayments() {
  const { payments, createPayment, isPending } = usePayments();
  const { challans } = useChallans();
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    challanId: "",
    amount: 0,
    paymentMode: "Cash" as typeof paymentModes[number],
    transactionRef: "",
    notes: "",
    type: "Payment" as "Payment" | "Refund" | "Adjustment",
  });

  const pendingChallans = challans.filter(c => c.status !== "Paid" && c.status !== "Cancelled");
  const selectedChallan = challans.find(c => c.id === formData.challanId);

  const handleCreatePayment = async () => {
    if (!formData.challanId || formData.amount <= 0) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    if (selectedChallan && formData.type === "Payment" && formData.amount > selectedChallan.balanceAmount) {
      toast({ 
        title: "Error", 
        description: `Payment amount cannot exceed balance of Rs. ${selectedChallan.balanceAmount.toLocaleString()}`, 
        variant: "destructive" 
      });
      return;
    }

    try {
      const payment: InsertPayment = {
        challanId: formData.challanId,
        challanNo: selectedChallan?.challanNo || "",
        studentId: selectedChallan?.studentId || "",
        studentName: selectedChallan?.studentName || "",
        amount: formData.amount,
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMode: formData.paymentMode,
        type: formData.type,
        transactionRef: formData.transactionRef || undefined,
        notes: formData.notes || undefined,
        receivedBy: "System",
        status: "Completed",
      };

      await createPayment(payment);
      toast({ title: "Success", description: `${formData.type} recorded successfully` });
      setDialogOpen(false);
      setFormData({
        challanId: "",
        amount: 0,
        paymentMode: "Cash",
        transactionRef: "",
        notes: "",
        type: "Payment",
      });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setViewDialogOpen(true);
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Payment": "default",
      "Refund": "destructive",
      "Adjustment": "outline",
    };
    return <Badge variant={variants[type] || "secondary"}>{type}</Badge>;
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "Cash": return <Banknote className="w-4 h-4" />;
      case "Card": return <CreditCard className="w-4 h-4" />;
      case "Bank Transfer": return <Wallet className="w-4 h-4" />;
      default: return <Receipt className="w-4 h-4" />;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.receiptNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.challanNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || payment.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalCollected = payments
    .filter(p => p.type === "Payment")
    .reduce((sum, p) => sum + p.amount, 0);
  
  const totalRefunds = payments
    .filter(p => p.type === "Refund")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <ModuleLayout module="fee" navItems={feeNavItems}>
      <PageHeader
        title="Payment Collection"
        description="Record and manage fee payments, refunds, and adjustments"
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <Banknote className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalCollected.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{payments.filter(p => p.type === "Payment").length} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
            <Receipt className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Rs. {totalRefunds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{payments.filter(p => p.type === "Refund").length} refunds</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Net Collection</CardTitle>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Rs. {(totalCollected - totalRefunds).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">After refunds</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt number..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-payment"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36" data-testid="select-type-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Payment">Payment</SelectItem>
                <SelectItem value="Refund">Refund</SelectItem>
                <SelectItem value="Adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setDialogOpen(true)} data-testid="button-record-payment">
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Challan #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                  <TableCell className="font-medium">{payment.receiptNo}</TableCell>
                  <TableCell>{payment.challanNo}</TableCell>
                  <TableCell>{payment.studentName}</TableCell>
                  <TableCell>{payment.paymentDate}</TableCell>
                  <TableCell className={payment.type === "Refund" ? "text-red-600" : ""}>
                    {payment.type === "Refund" ? "-" : ""}Rs. {payment.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getMethodIcon(payment.paymentMode)}
                      <span>{payment.paymentMode}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(payment.type)}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => handleViewPayment(payment)} data-testid={`button-view-payment-${payment.id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No payments found. Click "Record Payment" to add one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a payment, refund, or adjustment against a challan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Transaction Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(v: "Payment" | "Refund" | "Adjustment") => setFormData(prev => ({ ...prev, type: v }))}
              >
                <SelectTrigger data-testid="select-payment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Payment">Payment</SelectItem>
                  <SelectItem value="Refund">Refund</SelectItem>
                  <SelectItem value="Adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Challan</Label>
              <Select value={formData.challanId} onValueChange={(v) => setFormData(prev => ({ ...prev, challanId: v }))}>
                <SelectTrigger data-testid="select-challan">
                  <SelectValue placeholder="Select a pending challan" />
                </SelectTrigger>
                <SelectContent>
                  {pendingChallans.map((challan) => (
                    <SelectItem key={challan.id} value={challan.id}>
                      {challan.challanNo} - {challan.studentName} (Balance: Rs. {challan.balanceAmount.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedChallan && (
              <Card className="bg-muted/50">
                <CardContent className="py-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Net Amount:</span>
                    <span>Rs. {selectedChallan.netAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Already Paid:</span>
                    <span>Rs. {selectedChallan.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-primary">
                    <span>Balance Due:</span>
                    <span>Rs. {selectedChallan.balanceAmount.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={formData.amount || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  data-testid="input-payment-amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select 
                  value={formData.paymentMode} 
                  onValueChange={(v: typeof paymentModes[number]) => setFormData(prev => ({ ...prev, paymentMode: v }))}
                >
                  <SelectTrigger data-testid="select-payment-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentModes.map((mode) => (
                      <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Transaction Reference (Optional)</Label>
              <Input
                placeholder="Transaction/Cheque number"
                value={formData.transactionRef}
                onChange={(e) => setFormData(prev => ({ ...prev, transactionRef: e.target.value }))}
                data-testid="input-transaction-ref"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                placeholder="Any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                data-testid="input-payment-notes"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreatePayment} disabled={isPending} data-testid="button-submit-payment">
                {isPending ? "Processing..." : `Record ${formData.type}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>Receipt #{selectedPayment?.receiptNo}</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Challan No:</span>
                  <p className="font-medium">{selectedPayment.challanNo}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Student:</span>
                  <p className="font-medium">{selectedPayment.studentName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">{selectedPayment.paymentDate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Mode:</span>
                  <p className="font-medium">{selectedPayment.paymentMode}</p>
                </div>
              </div>

              <Card>
                <CardContent className="py-4 text-center">
                  <div className="text-3xl font-bold">
                    {selectedPayment.type === "Refund" ? "-" : ""}Rs. {selectedPayment.amount.toLocaleString()}
                  </div>
                  <div className="mt-2">{getTypeBadge(selectedPayment.type)}</div>
                </CardContent>
              </Card>

              {selectedPayment.transactionRef && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Reference: </span>
                  <span className="font-medium">{selectedPayment.transactionRef}</span>
                </div>
              )}

              {selectedPayment.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes: </span>
                  <span>{selectedPayment.notes}</span>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
