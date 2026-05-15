import { ModuleLayout } from "@/components/layout/module-layout";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { RecentTable } from "@/components/shared/recent-table";
import { StatusBadge } from "@/components/shared/data-table";
import { hostelNavItems, useHostelData } from "./hostel-data";
import { Home, Bed, Users, CreditCard } from "lucide-react";

export default function HostelDashboard() {
  const { rooms, residents, fees } = useHostelData();

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === "Available").length;
  const totalResidents = residents.filter((r) => r.status === "Active").length;
  const unpaidFees = fees.filter((f) => f.status === "Unpaid").length;

  const recentResidents = residents
    .filter((r) => r.status === "Active")
    .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
    .slice(0, 5);

  const unpaidFeesList = fees.filter((f) => f.status === "Unpaid").slice(0, 5);

  return (
    <ModuleLayout module="hostel" navItems={hostelNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">Hostel Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage hostel rooms, residents, and fees</p>
        </div>

        <StatsGrid>
          <StatsCard
            title="Total Rooms"
            value={totalRooms}
            icon={Bed}
            iconColor="text-lime-500"
          />
          <StatsCard
            title="Available Rooms"
            value={availableRooms}
            icon={Home}
            iconColor="text-green-500"
          />
          <StatsCard
            title="Total Residents"
            value={totalResidents}
            icon={Users}
            iconColor="text-blue-500"
          />
          <StatsCard
            title="Unpaid Fees"
            value={unpaidFees}
            icon={CreditCard}
            iconColor="text-red-500"
          />
        </StatsGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTable
            title="Recent Residents"
            data={recentResidents}
            columns={[
              { key: "studentName", label: "Student" },
              { key: "class", label: "Class" },
              { key: "roomNumber", label: "Room" },
              { key: "joinDate", label: "Join Date" },
            ]}
            getRowKey={(item) => item.id}
          />

          <RecentTable
            title="Pending Fees"
            data={unpaidFeesList}
            columns={[
              { key: "studentName", label: "Student" },
              { key: "month", label: "Month" },
              { key: "amount", label: "Amount", render: (item) => `Rs. ${item.amount.toLocaleString()}` },
              {
                key: "status",
                label: "Status",
                render: (item) => <StatusBadge status={item.status} />,
              },
            ]}
            getRowKey={(item) => item.id}
          />
        </div>
      </div>
    </ModuleLayout>
  );
}
