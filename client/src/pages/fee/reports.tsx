import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { feeNavItems, useFeeData } from "./fee-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import type { Column } from "@/components/shared/data-table";

export default function FeeReports() {
  const { vouchers } = useFeeData();

  const totalCollection = vouchers.reduce((sum, v) => sum + v.paidAmount, 0);
  const totalPending = vouchers.reduce((sum, v) => sum + (v.netAmount - v.paidAmount), 0);
  const totalVouchers = vouchers.length;

  const byClass = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map((cls) => {
    const classVouchers = vouchers.filter((v) => v.class === cls);
    return {
      class: cls,
      total: classVouchers.length,
      collected: classVouchers.reduce((s, v) => s + v.paidAmount, 0),
      pending: classVouchers.reduce((s, v) => s + (v.netAmount - v.paidAmount), 0),
    };
  });

  const classColumns: Column<typeof byClass[0]>[] = [
    { key: "class", label: "Class" },
    { key: "total", label: "Vouchers" },
    { key: "collected", label: "Collected" },
    { key: "pending", label: "Pending" },
  ];

  const handleExportPDF = () => {
    exportToPDF({
      title: "Fee Reports - Collection by Class",
      filename: "fee-reports",
      data: byClass,
      columns: classColumns,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: "Fee Reports",
      filename: "fee-reports",
      data: byClass,
      columns: classColumns,
    });
  };

  return (
    <ModuleLayout module="fee" navItems={feeNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Fee Reports"
          description="Fee collection analytics and reports"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-collection">
                Rs. {totalCollection.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-total-pending">
                Rs. {totalPending.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Vouchers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-vouchers">{totalVouchers}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Collection by Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Class</th>
                    <th className="text-left py-3 px-4 font-medium">Vouchers</th>
                    <th className="text-left py-3 px-4 font-medium">Collected</th>
                    <th className="text-left py-3 px-4 font-medium">Pending</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {byClass.map((row) => (
                    <tr key={row.class} className="border-b last:border-0" data-testid={`row-class-${row.class}`}>
                      <td className="py-3 px-4">{row.class}</td>
                      <td className="py-3 px-4">{row.total}</td>
                      <td className="py-3 px-4 text-green-600 dark:text-green-400">Rs. {row.collected.toLocaleString()}</td>
                      <td className="py-3 px-4 text-red-600 dark:text-red-400">Rs. {row.pending.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <Badge variant={row.pending === 0 ? "default" : "secondary"} className="text-xs">
                          {row.pending === 0 ? "Cleared" : "Pending"}
                        </Badge>
                      </td>
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
