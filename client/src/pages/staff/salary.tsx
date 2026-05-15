import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { ModuleLayout } from "@/components/layout/module-layout";
import { staffNavItems, useStaffSalary } from "./staff-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Eye, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function computeTotals(items: any[]) {
  return (items || []).reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
}

export default function StaffSalary() {
  const [, setLocation] = useLocation();
  const { session } = useAuth();
  const { data: slips = [], isLoading } = useStaffSalary();
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);

  useEffect(() => {
    if (!session || session.role !== "staff" || !session.loggedIn) {
      setLocation("/staff/login");
    }
  }, [session, setLocation]);

  if (!session || session.role !== "staff") return null;

  const downloadSlipPDF = (slip: any) => {
    const doc = new jsPDF();
    const empName = session.name || "Employee";
    const staffId = slip.staffId || session.staffId || "";

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Emblazers School", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Salary Slip", 105, 28, { align: "center" });
    doc.line(14, 32, 196, 32);

    doc.setFontSize(10);
    doc.text(`Employee: ${empName}`, 14, 40);
    doc.text(`Staff ID: ${staffId}`, 14, 46);
    doc.text(`Month: ${slip.month}`, 120, 40);
    doc.text(`Status: ${slip.status || "Generated"}`, 120, 46);

    const rows: any[][] = [];
    rows.push(["Basic Salary", "", `Rs. ${Number(slip.basicSalary || 0).toLocaleString()}`]);

    (slip.allowances || []).forEach((a: any) => {
      rows.push([`  ${a.name || "Allowance"}`, "+", `Rs. ${Number(a.amount || 0).toLocaleString()}`]);
    });

    (slip.deductions || []).forEach((d: any) => {
      rows.push([`  ${d.name || "Deduction"}`, "-", `Rs. ${Number(d.amount || 0).toLocaleString()}`]);
    });

    const totalAllow = computeTotals(slip.allowances);
    const totalDeduct = computeTotals(slip.deductions);

    rows.push(["Total Allowances", "+", `Rs. ${totalAllow.toLocaleString()}`]);
    rows.push(["Total Deductions", "-", `Rs. ${totalDeduct.toLocaleString()}`]);
    rows.push(["Net Salary", "", `Rs. ${Number(slip.netSalary || 0).toLocaleString()}`]);

    autoTable(doc, {
      startY: 52,
      head: [["Description", "", "Amount"]],
      body: rows,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      didParseCell: (data: any) => {
        if (data.row.index === rows.length - 1) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save(`salary_slip_${staffId}_${(slip.month || "").replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <ModuleLayout module="hr" navItems={staffNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">Salary Slips</h1>
          <p className="text-muted-foreground mt-1">View and download your salary slips</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : slips.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground" data-testid="text-no-slips">No salary slips found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slips.map((slip: any) => {
              const totalAllowances = computeTotals(slip.allowances);
              const totalDeductions = computeTotals(slip.deductions);
              return (
                <Card key={slip.id} className="hover:shadow-md transition-shadow" data-testid={`card-slip-${slip.id}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{slip.month}</span>
                      <Badge variant={slip.status === "Paid" ? "default" : "secondary"} data-testid={`badge-slip-status-${slip.id}`}>
                        {slip.status || "Generated"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Basic Salary</span>
                        <span className="font-medium">Rs. {Number(slip.basicSalary || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Allowances</span>
                        <span className="font-medium text-green-600">+Rs. {totalAllowances.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deductions</span>
                        <span className="font-medium text-red-600">-Rs. {totalDeductions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t font-semibold">
                        <span>Net Salary</span>
                        <span data-testid={`text-net-salary-${slip.id}`}>Rs. {Number(slip.netSalary || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => setSelectedSlip(slip)}
                      data-testid={`button-view-slip-${slip.id}`}
                    >
                      <Eye className="w-4 h-4" /> View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selectedSlip} onOpenChange={() => setSelectedSlip(null)}>
        <DialogContent className="max-w-lg print:max-w-full print:shadow-none">
          <DialogHeader>
            <DialogTitle data-testid="text-slip-title">
              Salary Slip — {selectedSlip?.month}
            </DialogTitle>
          </DialogHeader>
          {selectedSlip && (
            <div className="space-y-4" id="salary-slip-print">
              <div className="text-center border-b pb-3">
                <h3 className="font-bold text-lg">Emblazers School</h3>
                <p className="text-sm text-muted-foreground">Salary Slip</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Employee:</span> <span className="font-medium">{session.name}</span></div>
                <div><span className="text-muted-foreground">Staff ID:</span> <span className="font-medium">{selectedSlip.staffId || session.staffId}</span></div>
                <div><span className="text-muted-foreground">Month:</span> <span className="font-medium">{selectedSlip.month}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={selectedSlip.status === "Paid" ? "default" : "secondary"}>{selectedSlip.status || "Generated"}</Badge></div>
              </div>

              <div className="space-y-2 text-sm border-t pt-3">
                <div className="flex justify-between"><span>Basic Salary</span><span>Rs. {Number(selectedSlip.basicSalary || 0).toLocaleString()}</span></div>
                {(selectedSlip.allowances || []).map((a: any, i: number) => (
                  <div key={i} className="flex justify-between text-green-600 pl-4">
                    <span>{a.name || "Allowance"}</span><span>+Rs. {Number(a.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
                {(selectedSlip.deductions || []).map((d: any, i: number) => (
                  <div key={i} className="flex justify-between text-red-600 pl-4">
                    <span>{d.name || "Deduction"}</span><span>-Rs. {Number(d.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>Net Salary</span>
                  <span data-testid="text-modal-net-salary">Rs. {Number(selectedSlip.netSalary || 0).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 print:hidden">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => downloadSlipPDF(selectedSlip)} data-testid="button-download-slip">
                  <Download className="w-4 h-4" /> Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
