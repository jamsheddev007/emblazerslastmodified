import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { RecentTable } from "@/components/shared/recent-table";
import { hrNavItems, useHRData, departments } from "./hr-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import type { Column } from "@/components/shared/data-table";

export default function HRReports() {
  const { staff } = useHRData();

  const deptSummary = departments.map((d) => ({
    department: d,
    count: staff.filter((s) => s.department === d).length,
  })).filter((d) => d.count > 0);

  const typeSummary = [
    { type: "Full-time", count: staff.filter((s) => s.employmentType === "Full-time").length },
    { type: "Part-time", count: staff.filter((s) => s.employmentType === "Part-time").length },
    { type: "Contract", count: staff.filter((s) => s.employmentType === "Contract").length },
  ];

  const deptColumns: Column<typeof deptSummary[0]>[] = [
    { key: "department", label: "Department" },
    { key: "count", label: "Staff Count" },
  ];

  const handleExportPDF = () => {
    exportToPDF({
      title: "HR Reports - Department Summary",
      filename: "hr-reports",
      data: deptSummary,
      columns: deptColumns,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: "HR Reports",
      filename: "hr-reports",
      data: deptSummary,
      columns: deptColumns,
    });
  };

  return (
    <ModuleLayout module="hr" navItems={hrNavItems}>
      <PageHeader
        title="HR Reports"
        description="Staff analytics and summaries"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
              <FileDown className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} data-testid="button-export-excel">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentTable
          title="Staff by Department"
          data={deptSummary}
          columns={[
            { key: "department", label: "Department" },
            { key: "count", label: "Staff Count" },
          ]}
          getRowKey={(item) => item.department}
        />

        <RecentTable
          title="Staff by Employment Type"
          data={typeSummary}
          columns={[
            { key: "type", label: "Type" },
            { key: "count", label: "Count" },
          ]}
          getRowKey={(item) => item.type}
        />

        <Card>
          <CardHeader>
            <CardTitle>Salary Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Total Monthly Payroll</span>
                <span className="font-semibold">Rs. {staff.reduce((sum, s) => sum + s.basicSalary, 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Average Salary</span>
                <span className="font-semibold">Rs. {Math.round(staff.reduce((sum, s) => sum + s.basicSalary, 0) / staff.length).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Highest Salary</span>
                <span className="font-semibold">Rs. {Math.max(...staff.map((s) => s.basicSalary)).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Active</span>
                <span className="font-semibold text-green-600">{staff.filter((s) => s.status === "Active").length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">On Probation</span>
                <span className="font-semibold text-orange-600">{staff.filter((s) => s.status === "Probation").length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">On Leave</span>
                <span className="font-semibold text-blue-600">{staff.filter((s) => s.status === "On Leave").length}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Terminated</span>
                <span className="font-semibold text-red-600">{staff.filter((s) => s.status === "Terminated").length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
