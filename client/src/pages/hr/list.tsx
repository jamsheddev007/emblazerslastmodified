import { useState } from "react";
import { useLocation } from "wouter";
import { Users } from "lucide-react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge, type Column, type Filter } from "@/components/shared/data-table";
import { hrNavItems, useHRData, departments, staffStatuses } from "./hr-data";
import { type Staff } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function StaffList() {
  const [, setLocation] = useLocation();
  const { staff, deleteStaff, isLoading } = useHRData();
  const { toast } = useToast();
  const { canCreate, canEdit, canDelete } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: Column<Staff>[] = [
    { key: "staffId", label: "Staff ID" },
    { key: "name", label: "Name" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    { key: "joiningDate", label: "Joining Date" },
  ];

  const filters: Filter[] = [
    {
      key: "department",
      label: "Department",
      options: departments.map((d) => ({ value: d, label: d })),
    },
    {
      key: "status",
      label: "Status",
      options: staffStatuses.map((s) => ({ value: s, label: s })),
    },
  ];

  const handleDelete = () => {
    if (deleteId) {
      deleteStaff(deleteId);
      toast({ title: "Staff deleted", description: "The staff record has been removed." });
      setDeleteId(null);
    }
  };

  return (
    <ModuleLayout module="hr" navItems={hrNavItems}>
      <PageHeader
        title="Staff List"
        description="Manage all staff members"
        action={{
          label: "Add Staff",
          onClick: () => setLocation("/hr/add"),
          hidden: !canCreate(),
        }}
      />

      <DataTable
        data={staff}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search by name or ID..."
        searchKeys={["name", "staffId"]}
        onView={(item) => setLocation(`/hr/profile/${item.id}`)}
        onEdit={(item) => setLocation(`/hr/edit/${item.id}`)}
        onDelete={(item) => setDeleteId(item.id)}
        canEdit={canEdit()}
        canDelete={canDelete()}
        getRowKey={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="No staff found"
        emptyState={{
          icon: Users,
          title: "No staff found",
          description: "Add your first staff member to get started.",
          action: canCreate() ? { label: "Add Staff", onClick: () => setLocation("/hr/add") } : undefined,
        }}
        mobileCardRender={(item) => (
          <div className="p-4" data-testid={`card-staff-mobile-${item.id}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.staffId}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <div className="text-xs text-muted-foreground">
              <span>{item.designation}</span> · <span>{item.department}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Joined: {item.joiningDate}</p>
          </div>
        )}
        exportOptions={{
          enabled: true,
          title: "Staff List",
          filename: "staff",
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this staff record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
