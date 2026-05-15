import { ModuleLayout } from "@/components/layout/module-layout";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { RecentTable } from "@/components/shared/recent-table";
import { posNavItems, usePosData } from "./pos-data";
import { ShoppingCart, Package, DollarSign, TrendingUp } from "lucide-react";

export default function PosDashboard() {
  const { items, sales } = usePosData();

  const totalItems = items.length;
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((acc, s) => acc + s.grandTotal, 0);
  const lowStockItems = items.filter((i) => i.stock < 10).length;

  const recentSales = sales
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const lowStockList = items.filter((i) => i.stock < 20).slice(0, 5);

  return (
    <ModuleLayout module="pos" navItems={posNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">POS Dashboard</h1>
          <p className="text-muted-foreground mt-1">Point of sale for school supplies</p>
        </div>

        <StatsGrid>
          <StatsCard
            title="Total Items"
            value={totalItems}
            icon={Package}
            iconColor="text-emerald-500"
          />
          <StatsCard
            title="Total Sales"
            value={totalSales}
            icon={ShoppingCart}
            iconColor="text-blue-500"
          />
          <StatsCard
            title="Total Revenue"
            value={`Rs. ${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            iconColor="text-green-500"
          />
          <StatsCard
            title="Low Stock Items"
            value={lowStockItems}
            icon={TrendingUp}
            iconColor="text-orange-500"
            subtitle="Below 10 units"
          />
        </StatsGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTable
            title="Recent Sales"
            data={recentSales}
            columns={[
              { key: "invoiceNo", label: "Invoice" },
              { key: "date", label: "Date" },
              { key: "customer", label: "Customer" },
              { key: "grandTotal", label: "Total", render: (item) => `Rs. ${item.grandTotal.toLocaleString()}` },
            ]}
            getRowKey={(item) => item.id}
          />

          <RecentTable
            title="Low Stock Alert"
            data={lowStockList}
            columns={[
              { key: "itemCode", label: "Code" },
              { key: "name", label: "Item" },
              { key: "category", label: "Category" },
              { key: "stock", label: "Stock" },
            ]}
            getRowKey={(item) => item.id}
          />
        </div>
      </div>
    </ModuleLayout>
  );
}
