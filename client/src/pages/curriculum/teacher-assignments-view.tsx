import { ModuleLayout } from "@/components/layout/module-layout";
import { teacherNavItems, useTeacherAssignments } from "./teacher-data";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

const colorMap: Record<number, string> = {
  0: "border-l-4 border-l-violet-500 bg-violet-50 dark:bg-violet-900/20",
  1: "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-900/20",
  2: "border-l-4 border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
  3: "border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-900/20",
  4: "border-l-4 border-l-rose-500 bg-rose-50 dark:bg-rose-900/20",
  5: "border-l-4 border-l-cyan-500 bg-cyan-50 dark:bg-cyan-900/20",
};

function getCardColor(index: number): string {
  return colorMap[index % 6];
}

export default function TeacherAssignmentsView() {
  const { session } = useAuth();
  const staffId = session?.staffId || "";

  const { data: assignments = [], isLoading } = useTeacherAssignments(staffId);

  return (
    <ModuleLayout module="curriculum" navItems={teacherNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">My Assignments</h1>
          <p className="text-muted-foreground">View all your class assignments</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />)}
          </div>
        ) : (
          <>
            {assignments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No assignments yet. Contact admin to get started.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((assignment: any, index: number) => (
                  <Card key={assignment.id} className={`${getCardColor(index)} hover-elevate cursor-pointer`}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-lg" data-testid={`assignment-class-${assignment.id}`}>
                            {assignment.className}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`assignment-section-${assignment.id}`}>
                            Section {assignment.section}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Subject</p>
                          <p className="text-base" data-testid={`assignment-subject-${assignment.id}`}>
                            {assignment.subject}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex gap-2">
                            <Badge variant="outline">{assignment.className}</Badge>
                            <Badge variant="outline">{assignment.subject}</Badge>
                          </div>
                          <Badge 
                            variant={assignment.isActive ? "default" : "secondary"}
                            data-testid={`assignment-status-${assignment.id}`}
                          >
                            {assignment.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </ModuleLayout>
  );
}
