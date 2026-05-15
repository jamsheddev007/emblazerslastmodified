import { Link } from "wouter";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { datesheetNavItems, useDateSheetData } from "./datesheet-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Pencil } from "lucide-react";

export default function DateSheetList() {
  const { dateSheets } = useDateSheetData();

  const columns = [
    { key: "examName" as const, label: "Exam Name", sortable: true },
    { key: "examType" as const, label: "Type", render: (item: typeof dateSheets[0]) => <Badge variant="outline">{item.examType}</Badge> },
    { key: "class" as const, label: "Class", sortable: true },
    { key: "startDate" as const, label: "Start Date", sortable: true },
    { key: "endDate" as const, label: "End Date" },
    {
      key: "entries" as const,
      label: "Subjects",
      render: (item: typeof dateSheets[0]) => item.entries.length
    },
  ];

  const actions = (item: typeof dateSheets[0]) => (
    <div className="flex items-center gap-2">
      <Link href={`/curriculum/datesheet/edit/${item.id}`}>
        <Button variant="ghost" size="icon" data-testid={`button-edit-${item.id}`} title="Edit Date Sheet">
          <Pencil className="w-4 h-4" />
        </Button>
      </Link>
      <Link href={`/curriculum/datesheet/view/${item.id}`}>
        <Button variant="ghost" size="icon" data-testid={`button-view-${item.id}`} title="View Details">
          <Eye className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );

  return (
    <ModuleLayout module="curriculum" navItems={datesheetNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Date Sheets"
          description="View and manage exam date sheets"
          actions={
            <Link href="/curriculum/datesheet/create">
              <Button data-testid="button-create-datesheet">
                <Plus className="w-4 h-4 mr-2" />
                Create Date Sheet
              </Button>
            </Link>
          }
        />

        <DataTable
          data={dateSheets}
          columns={columns}
          searchKey="examName"
          searchPlaceholder="Search date sheets..."
          actions={actions}
          getRowKey={(item) => item.id}
        />
      </div>
    </ModuleLayout>
  );
}
