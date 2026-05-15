import { useLocation } from "wouter";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge, type Column, type Filter } from "@/components/shared/data-table";
import { studentNavItems, useStudentData, classes } from "./student-data";
import { type Student } from "@shared/schema";

export default function StudentAlumni() {
  const [, setLocation] = useLocation();
  const { students } = useStudentData();

  const alumni = students.filter((s) => s.status === "Alumni" || s.status === "Left");

  const columns: Column<Student>[] = [
    { key: "studentId", label: "Student ID" },
    { key: "name", label: "Name" },
    { key: "class", label: "Last Class" },
    { key: "parentContact", label: "Contact" },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    { key: "admissionDate", label: "Left Date" },
  ];

  const filters: Filter[] = [
    {
      key: "class",
      label: "Class",
      options: classes.map((c) => ({ value: c, label: c })),
    },
    {
      key: "status",
      label: "Status",
      options: [
        { value: "Alumni", label: "Alumni" },
        { value: "Left", label: "Left" },
      ],
    },
  ];

  return (
    <ModuleLayout module="student" navItems={studentNavItems}>
      <PageHeader
        title="Alumni"
        description="View former students and their records"
      />

      <DataTable
        data={alumni}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search alumni..."
        searchKeys={["name", "studentId"]}
        onView={(item) => setLocation(`/student/profile/${item.id}`)}
        getRowKey={(item) => item.id}
        emptyMessage="No alumni records found"
      />
    </ModuleLayout>
  );
}
