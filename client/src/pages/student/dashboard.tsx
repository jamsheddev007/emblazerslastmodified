import { ModuleLayout } from "@/components/layout/module-layout";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { RecentTable } from "@/components/shared/recent-table";
import { StatusBadge } from "@/components/shared/data-table";
import { studentNavItems, useStudentData } from "./student-data";
import { Users, UserPlus, GraduationCap, UserMinus } from "lucide-react";

function computeTrend(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { value: 100, label: "vs last month", direction: "up" as const } : undefined;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return undefined;
  return { value: Math.abs(pct), label: "vs last month", direction: pct >= 0 ? "up" as const : "down" as const };
}

export default function StudentDashboard() {
  const { students } = useStudentData();

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const totalStudents = students.filter((s) => s.status === "Active").length;
  const lastMonthTotal = students.filter((s) => {
    const d = new Date(s.admissionDate);
    return s.status === "Active" && d < thisMonthStart;
  }).length;

  const newAdmissions = students.filter((s) => {
    const admDate = new Date(s.admissionDate);
    return admDate >= thisMonthStart && s.status === "Active";
  }).length;
  const lastMonthAdmissions = students.filter((s) => {
    const admDate = new Date(s.admissionDate);
    return admDate >= lastMonthStart && admDate <= lastMonthEnd && s.status === "Active";
  }).length;

  const alumni = students.filter((s) => s.status === "Alumni" || s.status === "Left").length;
  const inactive = students.filter((s) => s.status === "Inactive").length;
  const lastMonthInactive = students.filter((s) => {
    const d = new Date(s.admissionDate);
    return s.status === "Inactive" && d < thisMonthStart;
  }).length;

  const recentAdmissions = students
    .filter((s) => s.status === "Active")
    .sort((a, b) => new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime())
    .slice(0, 5);

  return (
    <ModuleLayout module="student" navItems={studentNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold">Student Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of student admissions and records</p>
        </div>

        <StatsGrid>
          <StatsCard
            title="Total Students"
            value={totalStudents}
            icon={Users}
            iconColor="text-blue-500"
            trend={computeTrend(totalStudents, lastMonthTotal)}
          />
          <StatsCard
            title="New Admissions"
            value={newAdmissions}
            icon={UserPlus}
            iconColor="text-green-500"
            subtitle="This month"
            trend={computeTrend(newAdmissions, lastMonthAdmissions)}
          />
          <StatsCard
            title="Alumni / Left"
            value={alumni}
            icon={GraduationCap}
            iconColor="text-purple-500"
          />
          <StatsCard
            title="Inactive"
            value={inactive}
            icon={UserMinus}
            iconColor="text-orange-500"
            trend={computeTrend(inactive, lastMonthInactive)}
          />
        </StatsGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTable
            title="Recent Admissions"
            data={recentAdmissions}
            columns={[
              { key: "studentId", label: "ID" },
              { key: "name", label: "Name" },
              { key: "class", label: "Class" },
              { key: "admissionDate", label: "Admission Date" },
              {
                key: "status",
                label: "Status",
                render: (item) => <StatusBadge status={item.status} />,
              },
            ]}
            getRowKey={(item) => item.id}
          />

          <RecentTable
            title="Students by Class"
            data={["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map(cls => ({
              class: cls,
              count: students.filter((s) => s.class === cls && s.status === "Active").length,
            }))}
            columns={[
              { key: "class", label: "Class" },
              { key: "count", label: "Students" },
            ]}
            getRowKey={(item) => item.class}
          />
        </div>
      </div>
    </ModuleLayout>
  );
}
