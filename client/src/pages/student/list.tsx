import { useState } from "react";
import { useLocation } from "wouter";
import { Upload, Users } from "lucide-react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge, type Column, type Filter } from "@/components/shared/data-table";
import { BulkUpload, type BulkUploadResult } from "@/components/shared/bulk-upload";
import { studentCSVColumns } from "@/lib/csv-utils";
import { studentNavItems, useStudentData, classes, sections, statuses } from "./student-data";
import { type Student } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function StudentList() {
  const [, setLocation] = useLocation();
  const { students, deleteStudent, refreshStudents, isLoading } = useStudentData();
  const { toast } = useToast();
  const { canCreate, canEdit, canDelete, canFeature } = useAuth();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const handleBulkUpload = async (data: Record<string, unknown>[]): Promise<BulkUploadResult> => {
    try {
      const response = await apiRequest("POST", "/api/bulk/students", { students: data });
      const result = await response.json();
      if (result.success > 0) {
        refreshStudents();
        queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      }
      return result;
    } catch (error) {
      return {
        success: 0,
        failed: data.length,
        errors: [{ row: 0, message: String(error) }],
      };
    }
  };

  const activeStudents = students.filter((s) => s.status === "Active" || s.status === "Inactive");

  const columns: Column<Student>[] = [
    { key: "studentId", label: "Student ID" },
    { key: "name", label: "Name" },
    { key: "class", label: "Class" },
    { key: "section", label: "Section" },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    { key: "admissionDate", label: "Admission Date" },
  ];

  const filters: Filter[] = [
    {
      key: "class",
      label: "Class",
      options: classes.map((c) => ({ value: c, label: c })),
    },
    {
      key: "section",
      label: "Section",
      options: sections.map((s) => ({ value: s, label: `Section ${s}` })),
    },
    {
      key: "status",
      label: "Status",
      options: statuses.slice(0, 2).map((s) => ({ value: s, label: s })),
    },
  ];

  const handleDelete = () => {
    if (deleteId) {
      deleteStudent(deleteId);
      toast({ title: "Student deleted", description: "The student record has been removed." });
      setDeleteId(null);
    }
  };

  return (
    <ModuleLayout module="student" navItems={studentNavItems}>
      <PageHeader
        title="Student List"
        description="Manage all enrolled students"
        actions={
          canCreate() && canFeature("bulk_import", "bulk_import") && (
            <Button
              variant="outline"
              onClick={() => setBulkOpen(true)}
              data-testid="button-bulk-import"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
          )
        }
        action={{
          label: "Add Student",
          onClick: () => setLocation("/student/add"),
          hidden: !canCreate() || !canFeature("students", "create"),
        }}
      />

      <DataTable
        data={activeStudents}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search by name or ID..."
        searchKeys={["name", "studentId"]}
        onView={(item) => setLocation(`/student/profile/${item.id}`)}
        onEdit={(item) => setLocation(`/student/edit/${item.id}`)}
        onDelete={(item) => setDeleteId(item.id)}
        canEdit={canEdit() && canFeature("students", "edit")}
        canDelete={canDelete() && canFeature("students", "delete")}
        getRowKey={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="No students found"
        emptyState={{
          icon: Users,
          title: "No students found",
          description: "Add your first student to get started.",
          action: canCreate() ? { label: "Add Student", onClick: () => setLocation("/student/add") } : undefined,
        }}
        mobileCardRender={(item) => (
          <div className="p-4" data-testid={`card-student-mobile-${item.id}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.studentId}</p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{item.class} — {item.section}</span>
              <span>Admitted: {item.admissionDate}</span>
            </div>
          </div>
        )}
        exportOptions={{
          enabled: canFeature("students", "export"),
          title: "Student List",
          filename: "students",
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkUpload
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Student Admission"
        description="Upload a CSV file to add multiple students at once. Download the template for the correct format."
        columns={studentCSVColumns}
        templateFilename="student-admission-template"
        onUpload={handleBulkUpload}
      />
    </ModuleLayout>
  );
}
