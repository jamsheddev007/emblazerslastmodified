import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { hrNavItems } from "../hr-data";
import { usePayrollData } from "@/pages/payroll/payroll-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Eye, User, Building2, Briefcase, Calendar, DollarSign, FileText, Download, UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type Payroll } from "@shared/schema";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function HRPayrollList() {
  const { payrolls, updatePayroll, isLoading } = usePayrollData();
  const { toast } = useToast();
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

  const handleMarkPaid = async (payroll: Payroll) => {
    try {
      await updatePayroll(payroll.id, { status: "Paid", paidDate: new Date().toISOString().split("T")[0] });
      toast({ title: "Success", description: "Payroll marked as paid" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update payroll", variant: "destructive" });
    }
  };

  const downloadPayrollSlip = (payroll: Payroll) => {
    const doc = new jsPDF();
    
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.08 }));
    doc.setFontSize(60);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.text("EMBLAZERS ACADEMY", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 });
    doc.restoreGraphicsState();
    
    doc.setFillColor(0, 128, 128);
    doc.circle(30, 20, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("E", 30, 23, { align: "center" });
    
    doc.setTextColor(0);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("EMBLAZERS SCHOOL", 105, 20, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("SALARY SLIP", 105, 30, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`For the month of ${payroll.month}`, 105, 38, { align: "center" });
    doc.setDrawColor(200);
    doc.line(14, 45, 196, 45);
    
    doc.setTextColor(0);
    doc.setFontSize(11);
    const leftCol = 20;
    const rightCol = 110;
    let yPos = 55;
    
    doc.setFont("helvetica", "bold");
    doc.text("Employee Information", leftCol, yPos);
    yPos += 10;
    
    doc.setFont("helvetica", "normal");
    const employeeInfo: string[][] = [
      ["Staff ID:", payroll.staffId],
      ["Name:", payroll.staffName],
      ["Designation:", payroll.designation],
      ["Department:", payroll.department],
      ["Status:", payroll.status],
    ];
    if (payroll.paidDate) employeeInfo.push(["Paid Date:", payroll.paidDate]);
    
    employeeInfo.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, leftCol, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(value, leftCol + 35, yPos);
      yPos += 7;
    });
    
    yPos = 55;
    doc.setFont("helvetica", "bold");
    doc.text("Salary Summary", rightCol, yPos);
    yPos += 10;
    doc.setFont("helvetica", "normal");
    [
      ["Basic Salary:", `Rs. ${payroll.basicSalary.toLocaleString()}`],
      ["Gross Salary:", `Rs. ${payroll.grossSalary.toLocaleString()}`],
      ["Net Salary:", `Rs. ${payroll.netSalary.toLocaleString()}`],
    ].forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, rightCol, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(value, rightCol + 35, yPos);
      yPos += 7;
    });
    
    let tableY = 120;
    if (payroll.allowances && payroll.allowances.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(34, 139, 34);
      doc.text("Allowances", 14, tableY);
      tableY += 5;
      autoTable(doc, {
        startY: tableY,
        head: [["Description", "Amount"]],
        body: [
          ...payroll.allowances.map(a => [a.name, `Rs. ${a.amount.toLocaleString()}`]),
          ["Total Allowances", `Rs. ${payroll.allowances.reduce((s, a) => s + a.amount, 0).toLocaleString()}`],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [34, 139, 34], textColor: 255 },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 14, right: 105 },
        tableWidth: 85,
      });
      tableY = (doc as any).lastAutoTable?.finalY + 10 || tableY + 40;
    }
    
    if (payroll.deductions && payroll.deductions.length > 0) {
      const dedStartY = payroll.allowances && payroll.allowances.length > 0 ? 125 : tableY;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(220, 53, 69);
      doc.text("Deductions", 110, dedStartY);
      autoTable(doc, {
        startY: dedStartY + 5,
        head: [["Description", "Amount"]],
        body: [
          ...payroll.deductions.map(d => [
            d.name.startsWith("Absent Deduction") ? `[Attendance] ${d.name}` : d.name,
            `Rs. ${d.amount.toLocaleString()}`,
          ]),
          ["Total Deductions", `Rs. ${payroll.deductions.reduce((s, d) => s + d.amount, 0).toLocaleString()}`],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 53, 69], textColor: 255 },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 110, right: 14 },
        tableWidth: 85,
      });
      const dedEndY = (doc as any).lastAutoTable?.finalY + 10 || dedStartY + 40;
      tableY = Math.max(tableY, dedEndY);
    }
    
    tableY = Math.max(tableY, 180);
    doc.setDrawColor(200);
    doc.line(14, tableY, 196, tableY);
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Net Payable:", 14, tableY + 15);
    doc.setTextColor(0, 128, 128);
    doc.text(`Rs. ${payroll.netSalary.toLocaleString()}`, 196, tableY + 15, { align: "right" });
    doc.setTextColor(100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 285, { align: "center" });
    doc.text("This is a computer-generated document.", 105, 290, { align: "center" });
    
    doc.save(`payroll_${payroll.staffId}_${payroll.month.replace(/\s+/g, "_")}.pdf`);
    toast({ title: "Downloaded", description: `Payroll slip for ${payroll.staffName} - ${payroll.month}` });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Unpaid": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const columns = [
    { key: "staffId" as const, label: "Staff ID", sortable: true },
    { key: "staffName" as const, label: "Name", sortable: true },
    { key: "designation" as const, label: "Designation" },
    { key: "department" as const, label: "Department" },
    { key: "month" as const, label: "Month" },
    { key: "grossSalary" as const, label: "Gross", render: (item: typeof payrolls[0]) => `Rs. ${item.grossSalary.toLocaleString()}` },
    { key: "netSalary" as const, label: "Net", sortable: true, render: (item: typeof payrolls[0]) => `Rs. ${item.netSalary.toLocaleString()}` },
    { key: "status" as const, label: "Status", render: (item: typeof payrolls[0]) => <StatusBadge status={item.status} /> },
    {
      key: "id" as const,
      label: "Actions",
      render: (item: typeof payrolls[0]) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setSelectedPayroll(item)} data-testid={`button-view-${item.id}`} title="View Details">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-700" onClick={() => downloadPayrollSlip(item)} data-testid={`button-download-${item.id}`} title="Download Payroll Slip">
            <Download className="w-4 h-4" />
          </Button>
          {item.status === "Unpaid" && (
            <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700" onClick={() => handleMarkPaid(item)} data-testid={`button-pay-${item.id}`} title="Mark as Paid">
              <CheckCircle className="w-4 h-4" />
            </Button>
          )}
          {item.status === "Paid" && item.paidDate && (
            <span className="text-xs text-muted-foreground ml-1">{item.paidDate}</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <ModuleLayout module="hr" navItems={hrNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Payroll List"
          description="View and manage staff payroll"
          action={{ label: "Generate Payroll", href: "/hr/payroll/generate" }}
        />

        <DataTable
          data={payrolls}
          columns={columns}
          isLoading={isLoading}
          searchKey="staffName"
          searchPlaceholder="Search by staff name..."
          filterKey="status"
          filterOptions={["Paid", "Unpaid"]}
          getRowKey={(item) => item.id}
          exportOptions={{
            enabled: true,
            excludeColumns: ["id"],
            summaryRows: [
              { label: "Total Paid Amount", value: `Rs. ${payrolls.filter(p => p.status === "Paid").reduce((sum, p) => sum + p.netSalary, 0).toLocaleString()}` },
              { label: "Total Unpaid Amount", value: `Rs. ${payrolls.filter(p => p.status === "Unpaid").reduce((sum, p) => sum + p.netSalary, 0).toLocaleString()}` },
              { label: "Grand Total", value: `Rs. ${payrolls.reduce((sum, p) => sum + p.netSalary, 0).toLocaleString()}` },
            ],
            title: "Payroll List",
            filename: "payroll",
          }}
        />

        <Dialog open={!!selectedPayroll} onOpenChange={(open) => !open && setSelectedPayroll(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-5 h-5" />
                Payroll Details
              </DialogTitle>
            </DialogHeader>
            {selectedPayroll && (
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold">{selectedPayroll.staffName}</h3>
                    <p className="text-muted-foreground">{selectedPayroll.month}</p>
                  </div>
                  <Badge className={`${getStatusColor(selectedPayroll.status)} px-3 py-1`}>{selectedPayroll.status}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">Staff Information</h4>
                    {[
                      [<User className="w-4 h-4 text-muted-foreground" />, "Staff ID", selectedPayroll.staffId],
                      [<Briefcase className="w-4 h-4 text-muted-foreground" />, "Designation", selectedPayroll.designation],
                      [<Building2 className="w-4 h-4 text-muted-foreground" />, "Department", selectedPayroll.department],
                      [<Calendar className="w-4 h-4 text-muted-foreground" />, "Month", selectedPayroll.month],
                    ].map(([icon, label, value], i) => (
                      <div key={i} className="flex items-center gap-3">
                        {icon}
                        <div>
                          <p className="text-sm text-muted-foreground">{label as string}</p>
                          <p className="font-medium">{value as string}</p>
                        </div>
                      </div>
                    ))}
                    {selectedPayroll.paidDate && (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Paid On</p>
                          <p className="font-medium">{selectedPayroll.paidDate}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-lg border-b pb-2">Salary Details</h4>
                    {[
                      ["Basic Salary", `Rs. ${selectedPayroll.basicSalary.toLocaleString()}`, "text-foreground"],
                      ["Gross Salary", `Rs. ${selectedPayroll.grossSalary.toLocaleString()}`, "text-foreground"],
                      ["Net Salary", `Rs. ${selectedPayroll.netSalary.toLocaleString()}`, "text-teal-600 dark:text-teal-400 text-xl"],
                    ].map(([label, value, cls], i) => (
                      <div key={i} className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className={`font-medium ${cls}`}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  {selectedPayroll.allowances && selectedPayroll.allowances.length > 0 && (
                    <div>
                      <h4 className="font-medium text-lg mb-3 text-green-600 dark:text-green-400">Allowances</h4>
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <tbody>
                            {selectedPayroll.allowances.map((item, idx) => (
                              <tr key={idx} className="border-b border-green-100 dark:border-green-800 last:border-0">
                                <td className="p-3 text-sm">{item.name}</td>
                                <td className="p-3 text-right text-sm font-medium text-green-600 dark:text-green-400">+ Rs. {item.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr className="font-semibold bg-green-100 dark:bg-green-900/40">
                              <td className="p-3 text-sm">Total Allowances</td>
                              <td className="p-3 text-right text-sm text-green-700 dark:text-green-300">+ Rs. {selectedPayroll.allowances.reduce((s, a) => s + a.amount, 0).toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {selectedPayroll.deductions && selectedPayroll.deductions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-lg mb-3 text-red-600 dark:text-red-400">Deductions</h4>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <tbody>
                            {selectedPayroll.deductions.map((item, idx) => {
                              const isAbsent = item.name.startsWith("Absent Deduction");
                              return (
                                <tr key={idx} className="border-b border-red-100 dark:border-red-800 last:border-0">
                                  <td className="p-3 text-sm">
                                    {isAbsent ? (
                                      <span className="flex items-center gap-1.5 flex-wrap">
                                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] px-1.5 py-0 h-4 font-medium">
                                          <UserX className="w-2.5 h-2.5 mr-0.5" />Attendance
                                        </Badge>
                                        <span>{item.name}</span>
                                      </span>
                                    ) : item.name}
                                  </td>
                                  <td className="p-3 text-right text-sm font-medium text-red-600 dark:text-red-400">- Rs. {item.amount.toLocaleString()}</td>
                                </tr>
                              );
                            })}
                            <tr className="font-semibold bg-red-100 dark:bg-red-900/40">
                              <td className="p-3 text-sm">Total Deductions</td>
                              <td className="p-3 text-right text-sm text-red-700 dark:text-red-300">- Rs. {selectedPayroll.deductions.reduce((s, d) => s + d.amount, 0).toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedPayroll(null)} data-testid="button-close-details">Close</Button>
                  <Button variant="outline" onClick={() => downloadPayrollSlip(selectedPayroll)} data-testid="button-download-slip">
                    <Download className="w-4 h-4 mr-2" />Download Slip
                  </Button>
                  {selectedPayroll.status === "Unpaid" && (
                    <Button onClick={() => { handleMarkPaid(selectedPayroll); setSelectedPayroll(null); }} data-testid="button-mark-paid">
                      <CheckCircle className="w-4 h-4 mr-2" />Mark as Paid
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}
