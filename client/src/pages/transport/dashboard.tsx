import { ModuleLayout } from "@/components/layout/module-layout";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { RecentTable } from "@/components/shared/recent-table";
import { StatusBadge } from "@/components/shared/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { transportNavItems, useTransportData } from "./transport-data";
import { Bus, MapPin, Users } from "lucide-react";

export default function TransportDashboard() {
  const { routes, vehicles, drivers, isLoading } = useTransportData();

  const activeVehicles = vehicles.filter((v) => v.status === "Active").length;

  if (isLoading) {
    return (
      <ModuleLayout module="transport" navItems={transportNavItems}>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-md" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-md" />
            <Skeleton className="h-64 rounded-md" />
          </div>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="transport" navItems={transportNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">Transport Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage routes, vehicles, and drivers</p>
        </div>

        <StatsGrid>
          <StatsCard
            title="Total Routes"
            value={routes.length}
            icon={MapPin}
            iconColor="text-cyan-500"
          />
          <StatsCard
            title="Active Vehicles"
            value={activeVehicles}
            icon={Bus}
            iconColor="text-blue-500"
            subtitle={`of ${vehicles.length} total`}
          />
          <StatsCard
            title="Total Drivers"
            value={drivers.length}
            icon={Users}
            iconColor="text-green-500"
          />
        </StatsGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTable
            title="Routes"
            data={routes.slice(0, 5)}
            columns={[
              { key: "routeCode", label: "Code" },
              { key: "routeName", label: "Route Name" },
            ]}
            getRowKey={(item) => item.id}
          />

          <RecentTable
            title="Vehicles Status"
            data={vehicles}
            columns={[
              { key: "registrationNumber", label: "Reg No" },
              { key: "type", label: "Type" },
              { key: "capacity", label: "Capacity" },
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
