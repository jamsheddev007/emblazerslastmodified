import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { RecentTable } from "@/components/shared/recent-table";
import { transportNavItems, useTransportData } from "./transport-data";
import { Bus, MapPin, Users, FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import type { Column } from "@/components/shared/data-table";

export default function TransportReports() {
  const { routes, vehicles, drivers } = useTransportData();

  const routeSummary = routes.map((route) => ({
    routeCode: route.routeCode,
    routeName: route.routeName,
    stops: route.stops.length,
  }));

  const routeColumns: Column<typeof routeSummary[0]>[] = [
    { key: "routeCode", label: "Code" },
    { key: "routeName", label: "Route" },
    { key: "stops", label: "Stops" },
  ];

  const handleExportPDF = () => {
    exportToPDF({
      title: "Transport Reports - Routes",
      filename: "transport-reports",
      data: routeSummary,
      columns: routeColumns,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: "Transport Reports",
      filename: "transport-reports",
      data: routeSummary,
      columns: routeColumns,
    });
  };

  return (
    <ModuleLayout module="transport" navItems={transportNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Transport Reports"
          description="Transport analytics and statistics"
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
            title="Total Routes"
            value={routes.length}
            icon={MapPin}
            iconColor="text-cyan-500"
          />
          <StatsCard
            title="Total Vehicles"
            value={vehicles.length}
            icon={Bus}
            iconColor="text-blue-500"
          />
          <StatsCard
            title="Total Drivers"
            value={drivers.length}
            icon={Users}
            iconColor="text-green-500"
          />
        </StatsGrid>

        <RecentTable
          title="Route Summary"
          data={routeSummary}
          columns={[
            { key: "routeCode", label: "Code" },
            { key: "routeName", label: "Route" },
            { key: "stops", label: "Stops" },
          ]}
          getRowKey={(item) => item.routeName}
        />
      </div>
    </ModuleLayout>
  );
}
