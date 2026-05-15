import { ModuleLayout } from "@/components/layout/module-layout";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { RecentTable } from "@/components/shared/recent-table";
import { StatusBadge } from "@/components/shared/data-table";
import { hrNavItems, useHRData } from "./hr-data";
import { usePayrollData } from "@/pages/payroll/payroll-data";
import { Users, UserPlus, Clock, AlertTriangle, CreditCard, CheckCircle } from "lucide-react";
import { useAutoNotificationPermission } from "@/hooks/use-notifications";

function computeTrend(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { value: 100, label: "vs last month", direction: "up" as const } : undefined;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return undefined;
  return { value: Math.abs(pct), label: "vs last month", direction: pct >= 0 ? "up" as const : "down" as const };
}

export default function HRDashboard() {
  useAutoNotificationPermission();
  const { staff, vacancies } = useHRData();
  const { payrolls } = usePayrollData();

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  const totalStaff = staff.filter((s) => s.status === "Active" || s.status === "Probation").length;
  const prevTotalStaff = staff.filter((s) => {
    const d = new Date(s.joiningDate);
    return (s.status === "Active" || s.status === "Probation") && d < thisMonthStart;
  }).length;

  const newJoinees = staff.filter((s) => {
    const joinDate = new Date(s.joiningDate);
    return joinDate >= threeMonthsAgo;
  }).length;
  const prevNewJoinees = staff.filter((s) => {
    const joinDate = new Date(s.joiningDate);
    return joinDate >= sixMonthsAgo && joinDate < threeMonthsAgo;
  }).length;

  const onProbation = staff.filter((s) => s.status === "Probation").length;
  const openVacancies = vacancies.filter((v) => v.status === "Open").length;

  const thisMonthLabel = `${["January","February","March","April","May","June","July","August","September","October","November","December"][now.getMonth()]} ${now.getFullYear()}`;
  const thisMonthPayrolls = payrolls.filter((p) => p.month === thisMonthLabel);
  const totalPayroll = thisMonthPayrolls.reduce((s, p) => s + p.netSalary, 0);
  const paidPayroll = thisMonthPayrolls.filter((p) => p.status === "Paid").reduce((s, p) => s + p.netSalary, 0);
  const unpaidPayroll = thisMonthPayrolls.filter((p) => p.status === "Unpaid").reduce((s, p) => s + p.netSalary, 0);

  const recentJoinees = staff
    .sort((a, b) => new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime())
    .slice(0, 5);

  return (
    <ModuleLayout module="hr" navItems={hrNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold">HR &amp; Payroll Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of staff, HR operations, and payroll</p>
        </div>

        <StatsGrid>
          <StatsCard
            title="Total Staff"
            value={totalStaff}
            icon={Users}
            iconColor="text-purple-500"
            trend={computeTrend(totalStaff, prevTotalStaff)}
          />
          <StatsCard
            title="New Joinees"
            value={newJoinees}
            icon={UserPlus}
            iconColor="text-green-500"
            subtitle="Last 3 months"
            trend={computeTrend(newJoinees, prevNewJoinees)}
          />
          <StatsCard
            title="On Probation"
            value={onProbation}
            icon={Clock}
            iconColor="text-orange-500"
          />
          <StatsCard
            title="Open Vacancies"
            value={openVacancies}
            icon={AlertTriangle}
            iconColor="text-blue-500"
          />
        </StatsGrid>

        <div>
          <h2 className="text-lg font-semibold mb-3">This Month's Payroll — {thisMonthLabel}</h2>
          <StatsGrid>
            <StatsCard
              title="Total Payroll"
              value={`Rs. ${totalPayroll.toLocaleString()}`}
              icon={CreditCard}
              iconColor="text-teal-500"
              subtitle={`${thisMonthPayrolls.length} staff`}
            />
            <StatsCard
              title="Paid"
              value={`Rs. ${paidPayroll.toLocaleString()}`}
              icon={CheckCircle}
              iconColor="text-green-500"
              subtitle={`${thisMonthPayrolls.filter(p => p.status === "Paid").length} staff`}
            />
            <StatsCard
              title="Unpaid"
              value={`Rs. ${unpaidPayroll.toLocaleString()}`}
              icon={Clock}
              iconColor="text-red-500"
              subtitle={`${thisMonthPayrolls.filter(p => p.status === "Unpaid").length} staff`}
            />
          </StatsGrid>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTable
            title="Recent Joinees"
            data={recentJoinees}
            columns={[
              { key: "staffId", label: "ID" },
              { key: "name", label: "Name" },
              { key: "designation", label: "Designation" },
              { key: "joiningDate", label: "Joining Date" },
              { key: "status", label: "Status", render: (item) => <StatusBadge status={item.status} /> },
            ]}
            getRowKey={(item) => item.id}
          />

          <RecentTable
            title="Staff by Department"
            data={[
              { dept: "Mathematics", count: staff.filter((s) => s.department === "Mathematics").length },
              { dept: "English", count: staff.filter((s) => s.department === "English").length },
              { dept: "Science", count: staff.filter((s) => s.department === "Science").length },
              { dept: "Administration", count: staff.filter((s) => s.department === "Administration").length },
              { dept: "Finance", count: staff.filter((s) => s.department === "Finance").length },
            ]}
            columns={[
              { key: "dept", label: "Department" },
              { key: "count", label: "Staff Count" },
            ]}
            getRowKey={(item) => item.dept}
          />
        </div>
      </div>
    </ModuleLayout>
  );
}
