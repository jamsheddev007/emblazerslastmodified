import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { BulkUpload, type BulkUploadResult } from "@/components/shared/bulk-upload";
import { feeVoucherCSVColumns } from "@/lib/csv-utils";
import { feeNavItems, useFeeData } from "./fee-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Upload, User, Calendar, DollarSign, FileText, CreditCard, GraduationCap, Banknote, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { type FeeVoucher } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FeeVouchers() {
  const { vouchers, refreshVouchers, updateVoucher } = useFeeData();
  const { canCreate } = useAuth();
  const { toast } = useToast();
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<FeeVoucher | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkUpload = async (data: Record<string, unknown>[]): Promise<BulkUploadResult> => {
    try {
      const response = await apiRequest("POST", "/api/bulk/fee-vouchers", { vouchers: data });
      const result = await response.json();
      if (result.success > 0) {
        refreshVouchers();
        queryClient.invalidateQueries({ queryKey: ["/api/fee-vouchers"] });
      }
      return result;
    } catch (error) {
      return {
        success: 0,
        failed: data.length,
        errors: [{ row: 0, message: String(error) }],
      };
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedVoucher || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Error", description: "Please enter a valid payment amount", variant: "destructive" });
      return;
    }

    const balance = selectedVoucher.netAmount - selectedVoucher.paidAmount;
    if (amount > balance) {
      toast({ title: "Error", description: `Payment amount cannot exceed balance of Rs. ${balance.toLocaleString()}`, variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const newPaidAmount = selectedVoucher.paidAmount + amount;
      const newStatus = newPaidAmount >= selectedVoucher.netAmount ? "Paid" : "Partial";
      
      const paymentRecord = {
        amount,
        date: new Date().toISOString().split("T")[0],
        method: paymentMethod,
      };

      await updateVoucher(selectedVoucher.id, {
        paidAmount: newPaidAmount,
        status: newStatus,
        paymentHistory: [...(selectedVoucher.paymentHistory || []), paymentRecord],
      });

      toast({ 
        title: "Payment Recorded", 
        description: `Rs. ${amount.toLocaleString()} payment recorded successfully. Status: ${newStatus}` 
      });
      
      setPaymentDialogOpen(false);
      setPaymentAmount("");
      setSelectedVoucher(null);
      refreshVouchers();
    } catch (error) {
      console.error("Failed to record payment:", error);
      toast({ title: "Error", description: "Failed to record payment. Please try again.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsPaid = async (voucher: FeeVoucher) => {
    if (voucher.status === "Paid") return;
    
    setIsProcessing(true);
    try {
      const balance = voucher.netAmount - voucher.paidAmount;
      const paymentRecord = {
        amount: balance,
        date: new Date().toISOString().split("T")[0],
        method: "Cash",
      };

      await updateVoucher(voucher.id, {
        paidAmount: voucher.netAmount,
        status: "Paid",
        paymentHistory: [...(voucher.paymentHistory || []), paymentRecord],
      });

      toast({ title: "Success", description: `Voucher ${voucher.voucherId} marked as Paid` });
      refreshVouchers();
    } catch (error) {
      console.error("Failed to update status:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Unpaid": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Partial": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const columns = [
    { key: "voucherId" as const, label: "Voucher ID", sortable: true },
    { key: "studentName" as const, label: "Student", sortable: true },
    { key: "class" as const, label: "Class" },
    { key: "month" as const, label: "Month" },
    { 
      key: "netAmount" as const, 
      label: "Net Amount", 
      sortable: true,
      render: (item: typeof vouchers[0]) => `Rs. ${item.netAmount.toLocaleString()}` 
    },
    { 
      key: "paidAmount" as const, 
      label: "Paid", 
      render: (item: typeof vouchers[0]) => `Rs. ${item.paidAmount.toLocaleString()}` 
    },
    {
      key: "status" as const,
      label: "Status",
      render: (item: typeof vouchers[0]) => <StatusBadge status={item.status} />,
    },
    {
      key: "id" as const,
      label: "Actions",
      render: (item: typeof vouchers[0]) => (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSelectedVoucher(item)}
            data-testid={`button-view-${item.id}`}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {item.status !== "Paid" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMarkAsPaid(item)}
              data-testid={`button-mark-paid-${item.id}`}
              title="Mark as Paid"
              className="text-green-600 hover:text-green-700"
            >
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <ModuleLayout module="fee" navItems={feeNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Fee Vouchers"
          description="View and manage all fee vouchers"
          actions={
            canCreate() && (
              <Button
                variant="outline"
                onClick={() => setBulkOpen(true)}
                data-testid="button-bulk-import"
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            )
          }
          action={{ label: "Generate Voucher", href: "/fee/generate" }}
        />

        <DataTable
          data={vouchers}
          columns={columns}
          searchKey="studentName"
          searchPlaceholder="Search by student name..."
          filterKey="status"
          filterOptions={["Paid", "Unpaid", "Partial"]}
          getRowKey={(item) => item.id}
          exportOptions={{
            enabled: true,
            title: "Fee Vouchers",
            filename: "fee-vouchers",
          }}
        />

        <BulkUpload
          isOpen={bulkOpen}
          onClose={() => setBulkOpen(false)}
          title="Bulk Fee Voucher Generation"
          description="Upload a CSV file to generate fee vouchers for multiple students at once."
          columns={feeVoucherCSVColumns}
          templateFilename="fee-voucher-template"
          onUpload={handleBulkUpload}
        />

        <Dialog open={!!selectedVoucher && !paymentDialogOpen} onOpenChange={(open) => !open && setSelectedVoucher(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-5 h-5" />
                Voucher Details
              </DialogTitle>
            </DialogHeader>
            
            {selectedVoucher && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold">{selectedVoucher.voucherId}</h3>
                    <p className="text-muted-foreground">{selectedVoucher.month}</p>
                  </div>
                  <Badge className={`${getStatusColor(selectedVoucher.status)} px-3 py-1`}>
                    {selectedVoucher.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">Student Information</h4>
                    
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Student Name</p>
                        <p className="font-medium">{selectedVoucher.studentName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Student ID</p>
                        <p className="font-medium">{selectedVoucher.studentId}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Class</p>
                        <p className="font-medium">{selectedVoucher.class}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Month</p>
                        <p className="font-medium">{selectedVoucher.month}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">Payment Details</h4>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Net Amount</p>
                        <p className="font-medium text-lg">Rs. {selectedVoucher.netAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Paid Amount</p>
                        <p className="font-medium text-lg text-green-600">Rs. {selectedVoucher.paidAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Balance Due</p>
                        <p className="font-medium text-lg text-red-600">
                          Rs. {(selectedVoucher.netAmount - selectedVoucher.paidAmount).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedVoucher.feeHeads && selectedVoucher.feeHeads.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-lg mb-3">Fee Breakdown</h4>
                    <div className="bg-muted/50 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-medium">Fee Head</th>
                            <th className="text-right p-3 font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedVoucher.feeHeads.map((head, idx) => (
                            <tr key={idx} className="border-t border-muted">
                              <td className="p-3">{head.name}</td>
                              <td className="p-3 text-right">Rs. {head.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-muted font-semibold">
                            <td className="p-3">Total</td>
                            <td className="p-3 text-right">Rs. {selectedVoucher.netAmount.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {selectedVoucher.paymentHistory && selectedVoucher.paymentHistory.length > 0 && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-lg mb-3">Payment History</h4>
                    <div className="bg-muted/50 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 font-medium">Date</th>
                            <th className="text-left p-3 font-medium">Method</th>
                            <th className="text-right p-3 font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedVoucher.paymentHistory.map((payment, idx) => (
                            <tr key={idx} className="border-t border-muted">
                              <td className="p-3">{payment.date}</td>
                              <td className="p-3">{payment.method}</td>
                              <td className="p-3 text-right text-green-600">Rs. {payment.amount.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedVoucher(null)}
                    data-testid="button-close-details"
                  >
                    Close
                  </Button>
                  {selectedVoucher.status !== "Paid" && (
                    <Button
                      onClick={() => setPaymentDialogOpen(true)}
                      data-testid="button-record-payment"
                    >
                      <Banknote className="w-4 h-4 mr-2" />
                      Record Payment
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                Record Payment
              </DialogTitle>
              <DialogDescription>
                Record a payment for voucher {selectedVoucher?.voucherId}
              </DialogDescription>
            </DialogHeader>
            
            {selectedVoucher && (
              <div className="space-y-4 pt-4">
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student:</span>
                    <span className="font-medium">{selectedVoucher.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Amount:</span>
                    <span>Rs. {selectedVoucher.netAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Already Paid:</span>
                    <span className="text-green-600">Rs. {selectedVoucher.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>Balance Due:</span>
                    <span className="text-red-600">
                      Rs. {(selectedVoucher.netAmount - selectedVoucher.paidAmount).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Amount (Rs.)</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    max={selectedVoucher.netAmount - selectedVoucher.paidAmount}
                    data-testid="input-payment-amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger data-testid="select-payment-method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Online">Online Payment</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setPaymentDialogOpen(false);
                      setPaymentAmount("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      setPaymentAmount((selectedVoucher.netAmount - selectedVoucher.paidAmount).toString());
                    }}
                    variant="secondary"
                    data-testid="button-pay-full"
                  >
                    Pay Full Amount
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleRecordPayment}
                    disabled={isProcessing || !paymentAmount}
                    data-testid="button-confirm-payment"
                  >
                    {isProcessing ? "Processing..." : "Confirm"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}
