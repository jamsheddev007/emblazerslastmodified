import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { hrNavItems } from "../hr-data";
import { usePayrollData } from "@/pages/payroll/payroll-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import type { Column } from "@/components/shared/data-table";

export default function HRPayrollReports() {
  const { payrolls } = usePayrollData();

  const totalGross = payrolls.reduce((s, p) => s + p.grossSalary, 0);
  const totalNet = payrolls.reduce((s, p) => s + p.netSalary, 0);
  const totalDeductions = payrolls.reduce((s, p) => s + p.deductions.reduce((a, d) => a + d.amount, 0), 0);

  const byDepartment = [...new Set(payrolls.map((p) => p.department))].map((dept) => {
    const deptPayrolls = payrolls.filter((p) => p.department === dept);
    return {
      department: dept,
      staff: deptPayrolls.length,
      gross: deptPayrolls.reduce((s, p) => s + p.grossSalary, 0),
      net: deptPayrolls.reduce((s, p) => s + p.netSalary, 0),
    };
  });

  const deptColumns: Column<typeof byDepartment[0]>[] = [
    { key: "department", label: "Department" },
    { key: "staff", label: "Staff" },
    { key: "gross", label: "Gross" },
    { key: "net", label: "Net" },
  ];

  const handleExportPDF = () => {
    exportToPDF({ title: "Payroll Reports - By Department", filename: "payroll-reports", data: byDepartment, columns: deptColumns });
  };

  const handleExportExcel = () => {
    exportToExcel({ title: "Payroll Reports", filename: "payroll-reports", data: byDepartment, columns: deptColumns });
  };

  return (
    <ModuleLayout module="hr" navItems={hrNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Payroll Reports"
          description="Payroll analytics and summary"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
                <FileDown className="w-4 h-4 mr-2" />PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel} data-testid="button-export-excel">
                <FileSpreadsheet className="w-4 h-4 mr-2" />Excel
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Gross</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-gross">Rs. {totalGross.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-total-deductions">Rs. {totalDeductions.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Payable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400" data-testid="text-net-payable">Rs. {totalNet.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payroll by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Department</th>
                    <th className="text-left py-3 px-4 font-medium">Staff</th>
                    <th className="text-left py-3 px-4 font-medium">Gross</th>
                    <th className="text-left py-3 px-4 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {byDepartment.map((row) => (
                    <tr key={row.department} className="border-b last:border-0" data-testid={`row-dept-${row.department}`}>
                      <td className="py-3 px-4"><Badge variant="outline">{row.department}</Badge></td>
                      <td className="py-3 px-4">{row.staff}</td>
                      <td className="py-3 px-4">Rs. {row.gross.toLocaleString()}</td>
                      <td className="py-3 px-4 font-medium text-teal-600 dark:text-teal-400">Rs. {row.net.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
