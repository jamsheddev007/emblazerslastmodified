import { ModuleLayout } from "@/components/layout/module-layout";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { RecentTable } from "@/components/shared/recent-table";
import { StatusBadge } from "@/components/shared/data-table";
import { feeNavItems, useFeeData } from "./fee-data";
import { DollarSign, CheckCircle, AlertCircle, Clock } from "lucide-react";

export default function FeeDashboard() {
  const { vouchers } = useFeeData();

  const totalCollection = vouchers.reduce((sum, v) => sum + v.paidAmount, 0);
  const paidVouchers = vouchers.filter((v) => v.status === "Paid").length;
  const unpaidVouchers = vouchers.filter((v) => v.status === "Unpaid").length;
  const partialVouchers = vouchers.filter((v) => v.status === "Partial").length;
  const pendingAmount = vouchers.reduce((sum, v) => sum + (v.netAmount - v.paidAmount), 0);

  const recentVouchers = vouchers
    .sort((a, b) => b.voucherId.localeCompare(a.voucherId))
    .slice(0, 5);

  return (
    <ModuleLayout module="fee" navItems={feeNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">Fee Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of fee collection and vouchers</p>
        </div>

        <StatsGrid>
          <StatsCard
            title="Total Collection"
            value={`Rs. ${totalCollection.toLocaleString()}`}
            icon={DollarSign}
            iconColor="text-green-500"
            trend={{ value: 12, label: "vs last month", direction: "up" }}
          />
          <StatsCard
            title="Paid Vouchers"
            value={paidVouchers}
            icon={CheckCircle}
            iconColor="text-blue-500"
            subtitle="This month"
          />
          <StatsCard
            title="Unpaid Vouchers"
            value={unpaidVouchers}
            icon={AlertCircle}
            iconColor="text-red-500"
          />
          <StatsCard
            title="Pending Amount"
            value={`Rs. ${pendingAmount.toLocaleString()}`}
            icon={Clock}
            iconColor="text-orange-500"
            subtitle={`${partialVouchers} partial payments`}
          />
        </StatsGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTable
            title="Recent Vouchers"
            data={recentVouchers}
            columns={[
              { key: "voucherId", label: "Voucher ID" },
              { key: "studentName", label: "Student" },
              { key: "netAmount", label: "Amount", render: (item) => `Rs. ${item.netAmount.toLocaleString()}` },
              {
                key: "status",
                label: "Status",
                render: (item) => <StatusBadge status={item.status} />,
              },
            ]}
            getRowKey={(item) => item.id}
          />

          <RecentTable
            title="Collection by Status"
            data={[
              { status: "Paid", count: paidVouchers, amount: vouchers.filter(v => v.status === "Paid").reduce((s, v) => s + v.paidAmount, 0) },
              { status: "Partial", count: partialVouchers, amount: vouchers.filter(v => v.status === "Partial").reduce((s, v) => s + v.paidAmount, 0) },
              { status: "Unpaid", count: unpaidVouchers, amount: 0 },
            ]}
            columns={[
              { key: "status", label: "Status", render: (item) => <StatusBadge status={item.status} /> },
              { key: "count", label: "Vouchers" },
              { key: "amount", label: "Collected", render: (item) => `Rs. ${item.amount.toLocaleString()}` },
            ]}
            getRowKey={(item) => item.status}
          />
        </div>
      </div>
    </ModuleLayout>
  );
}
