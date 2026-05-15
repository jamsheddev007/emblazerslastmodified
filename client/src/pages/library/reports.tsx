import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { RecentTable } from "@/components/shared/recent-table";
import { libraryNavItems, useLibraryData } from "./library-data";
import { BookOpen, Users, BookMarked, AlertTriangle, FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import type { Column } from "@/components/shared/data-table";

const categories = ["General", "Fiction", "Non-Fiction", "Reference", "Textbook", "Science", "History", "Biography", "Children"];

export default function LibraryReports() {
  const { books, issues } = useLibraryData();

  const totalBooks = books.length;
  const issuedBooks = books.filter((b) => b.status === "Issued").length;
  const overdueBooks = issues.filter((i) => i.status === "Overdue").length;
  const totalFines = issues.reduce((acc, i) => acc + i.fine, 0);

  const booksByCategory = categories.slice(0, 6).map((cat) => ({
    category: cat,
    total: books.filter((b) => b.category === cat).length,
    issued: issues.filter((i) => {
      const book = books.find((b) => b.id === i.bookId);
      return book?.category === cat && i.status === "Issued";
    }).length,
  }));

  const categoryColumns: Column<typeof booksByCategory[0]>[] = [
    { key: "category", label: "Category" },
    { key: "total", label: "Total Books" },
    { key: "issued", label: "Currently Issued" },
  ];

  const handleExportPDF = () => {
    exportToPDF({
      title: "Library Reports - By Category",
      filename: "library-reports",
      data: booksByCategory,
      columns: categoryColumns,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: "Library Reports",
      filename: "library-reports",
      data: booksByCategory,
      columns: categoryColumns,
    });
  };

  return (
    <ModuleLayout module="library" navItems={libraryNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Library Reports"
          description="Library analytics and statistics"
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
            title="Total Books"
            value={totalBooks}
            icon={BookOpen}
            iconColor="text-amber-500"
          />
          <StatsCard
            title="Books Issued"
            value={issuedBooks}
            icon={BookMarked}
            iconColor="text-blue-500"
          />
          <StatsCard
            title="Overdue Books"
            value={overdueBooks}
            icon={AlertTriangle}
            iconColor="text-red-500"
          />
          <StatsCard
            title="Total Fines"
            value={`Rs. ${totalFines}`}
            icon={Users}
            iconColor="text-green-500"
          />
        </StatsGrid>

        <RecentTable
          title="Books by Category"
          data={booksByCategory}
          columns={[
            { key: "category", label: "Category" },
            { key: "total", label: "Total Books" },
            { key: "issued", label: "Currently Issued" },
          ]}
          getRowKey={(item) => item.category}
        />
      </div>
    </ModuleLayout>
  );
}
