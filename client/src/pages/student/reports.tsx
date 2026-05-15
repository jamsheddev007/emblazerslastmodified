import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { RecentTable } from "@/components/shared/recent-table";
import { studentNavItems, useStudentData, classes } from "./student-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import type { Column } from "@/components/shared/data-table";

export default function StudentReports() {
  const { students } = useStudentData();

  const activeStudents = students.filter((s) => s.status === "Active");

  const classSummary = classes.map((c) => ({
    class: c,
    total: activeStudents.filter((s) => s.class === c).length,
    boys: activeStudents.filter((s) => s.class === c && s.gender === "Male").length,
    girls: activeStudents.filter((s) => s.class === c && s.gender === "Female").length,
  }));

  const sectionSummary = ["A", "B", "C"].map((section) => ({
    section: `Section ${section}`,
    count: activeStudents.filter((s) => s.section === section).length,
  }));

  const classColumns: Column<typeof classSummary[0]>[] = [
    { key: "class", label: "Class" },
    { key: "boys", label: "Boys" },
    { key: "girls", label: "Girls" },
    { key: "total", label: "Total" },
  ];

  const handleExportPDF = () => {
    exportToPDF({
      title: "Student Reports - Class Summary",
      filename: "student-reports",
      data: classSummary,
      columns: classColumns,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: "Student Reports",
      filename: "student-reports",
      data: classSummary,
      columns: classColumns,
    });
  };

  return (
    <ModuleLayout module="student" navItems={studentNavItems}>
      <PageHeader
        title="Student Reports"
        description="Analytics and summaries"
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
        <Card>
          <CardHeader>
            <CardTitle>Students by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Class</th>
                    <th className="text-center p-3 font-medium">Boys</th>
                    <th className="text-center p-3 font-medium">Girls</th>
                    <th className="text-center p-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {classSummary.map((row) => (
                    <tr key={row.class} className="border-b last:border-0">
                      <td className="p-3">{row.class}</td>
                      <td className="p-3 text-center">{row.boys}</td>
                      <td className="p-3 text-center">{row.girls}</td>
                      <td className="p-3 text-center font-medium">{row.total}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted">
                    <td className="p-3 font-semibold">Total</td>
                    <td className="p-3 text-center font-semibold">
                      {classSummary.reduce((sum, r) => sum + r.boys, 0)}
                    </td>
                    <td className="p-3 text-center font-semibold">
                      {classSummary.reduce((sum, r) => sum + r.girls, 0)}
                    </td>
                    <td className="p-3 text-center font-semibold">
                      {classSummary.reduce((sum, r) => sum + r.total, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <RecentTable
          title="Students by Section"
          data={sectionSummary}
          columns={[
            { key: "section", label: "Section" },
            { key: "count", label: "Students" },
          ]}
          getRowKey={(item) => item.section}
        />

        <Card>
          <CardHeader>
            <CardTitle>Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Average Attendance</span>
                <span className="font-semibold text-green-600">87%</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Students with &gt;90%</span>
                <span className="font-semibold">45</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Students with &lt;75%</span>
                <span className="font-semibold text-red-600">8</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Perfect Attendance</span>
                <span className="font-semibold">12</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Total Expected</span>
                <span className="font-semibold">Rs. 5,00,000</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Total Received</span>
                <span className="font-semibold text-green-600">Rs. 4,25,000</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Pending Amount</span>
                <span className="font-semibold text-red-600">Rs. 75,000</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Defaulters</span>
                <span className="font-semibold text-red-600">15</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
