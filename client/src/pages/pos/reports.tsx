import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { RecentTable } from "@/components/shared/recent-table";
import { posNavItems, usePosData, categories } from "./pos-data";
import { DollarSign, ShoppingCart, Package, TrendingUp, FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import type { Column } from "@/components/shared/data-table";

export default function PosReports() {
  const { items, sales } = usePosData();

  const totalRevenue = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalSales = sales.length;
  const avgSaleValue = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;
  const totalItemsSold = sales.reduce((acc, s) => acc + s.items.reduce((a, i) => a + i.quantity, 0), 0);

  const salesByCategory = categories.map((cat) => {
    const categoryItems = items.filter((i) => i.category === cat);
    const revenue = sales.reduce((acc, s) => {
      return acc + s.items.filter((si) => {
        const item = items.find((i) => i.id === si.itemId);
        return item?.category === cat;
      }).reduce((a, si) => a + si.total, 0);
    }, 0);
    return { category: cat, items: categoryItems.length, revenue };
  });

  const categoryColumns: Column<typeof salesByCategory[0]>[] = [
    { key: "category", label: "Category" },
    { key: "items", label: "Products" },
    { key: "revenue", label: "Revenue" },
  ];

  const handleExportPDF = () => {
    exportToPDF({
      title: "POS Reports - Sales by Category",
      filename: "pos-reports",
      data: salesByCategory,
      columns: categoryColumns,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: "POS Reports",
      filename: "pos-reports",
      data: salesByCategory,
      columns: categoryColumns,
    });
  };

  return (
    <ModuleLayout module="pos" navItems={posNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="POS Reports"
          description="Sales analytics and reports"
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

        <StatsGrid>
          <StatsCard
            title="Total Revenue"
            value={`Rs. ${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            iconColor="text-green-500"
          />
          <StatsCard
            title="Total Sales"
            value={totalSales}
            icon={ShoppingCart}
            iconColor="text-blue-500"
          />
          <StatsCard
            title="Items Sold"
            value={totalItemsSold}
            icon={Package}
            iconColor="text-purple-500"
          />
          <StatsCard
            title="Avg Sale Value"
            value={`Rs. ${avgSaleValue.toLocaleString()}`}
            icon={TrendingUp}
            iconColor="text-orange-500"
          />
        </StatsGrid>

        <RecentTable
          title="Sales by Category"
          data={salesByCategory}
          columns={[
            { key: "category", label: "Category" },
            { key: "items", label: "Products" },
            { key: "revenue", label: "Revenue", render: (item) => `Rs. ${item.revenue.toLocaleString()}` },
          ]}
          getRowKey={(item) => item.category}
        />
      </div>
    </ModuleLayout>
  );
}
