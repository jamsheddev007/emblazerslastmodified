import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { RecentTable } from "@/components/shared/recent-table";
import { hostelNavItems, useHostelData, hostelNames } from "./hostel-data";
import { Home, Bed, Users, CreditCard, FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import type { Column } from "@/components/shared/data-table";

export default function HostelReports() {
  const { rooms, residents, fees } = useHostelData();

  const totalBeds = rooms.reduce((acc, r) => acc + r.bedCount, 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.occupiedBeds, 0);
  const totalFeeCollected = fees.filter((f) => f.status === "Paid").reduce((acc, f) => acc + f.amount, 0);
  const pendingFees = fees.filter((f) => f.status === "Unpaid").reduce((acc, f) => acc + f.amount, 0);

  const occupancyByHostel = hostelNames.slice(0, 4).map((hostel) => {
    const hostelRooms = rooms.filter((r) => r.hostelName === hostel);
    const totalBeds = hostelRooms.reduce((acc, r) => acc + r.bedCount, 0);
    const occupied = hostelRooms.reduce((acc, r) => acc + r.occupiedBeds, 0);
    return {
      hostel,
      rooms: hostelRooms.length,
      totalBeds,
      occupied,
      occupancy: totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0,
    };
  });

  const hostelColumns: Column<typeof occupancyByHostel[0]>[] = [
    { key: "hostel", label: "Hostel" },
    { key: "rooms", label: "Rooms" },
    { key: "totalBeds", label: "Total Beds" },
    { key: "occupied", label: "Occupied" },
    { key: "occupancy", label: "Occupancy %" },
  ];

  const handleExportPDF = () => {
    exportToPDF({
      title: "Hostel Reports - Occupancy by Hostel",
      filename: "hostel-reports",
      data: occupancyByHostel,
      columns: hostelColumns,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: "Hostel Reports",
      filename: "hostel-reports",
      data: occupancyByHostel,
      columns: hostelColumns,
    });
  };

  return (
    <ModuleLayout module="hostel" navItems={hostelNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Hostel Reports"
          description="Hostel analytics and statistics"
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
            title="Total Beds"
            value={totalBeds}
            icon={Bed}
            iconColor="text-lime-500"
          />
          <StatsCard
            title="Occupied Beds"
            value={occupiedBeds}
            icon={Users}
            iconColor="text-blue-500"
            subtitle={`${Math.round((occupiedBeds / totalBeds) * 100)}% occupancy`}
          />
          <StatsCard
            title="Fee Collected"
            value={`Rs. ${totalFeeCollected.toLocaleString()}`}
            icon={CreditCard}
            iconColor="text-green-500"
          />
          <StatsCard
            title="Pending Fees"
            value={`Rs. ${pendingFees.toLocaleString()}`}
            icon={Home}
            iconColor="text-red-500"
          />
        </StatsGrid>

        <RecentTable
          title="Occupancy by Hostel"
          data={occupancyByHostel}
          columns={[
            { key: "hostel", label: "Hostel" },
            { key: "rooms", label: "Rooms" },
            { key: "totalBeds", label: "Total Beds" },
            { key: "occupied", label: "Occupied" },
            { key: "occupancy", label: "Occupancy %", render: (item) => `${item.occupancy}%` },
          ]}
          getRowKey={(item) => item.hostel}
        />
      </div>
    </ModuleLayout>
  );
}
