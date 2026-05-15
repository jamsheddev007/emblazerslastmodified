import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ModuleLayout } from "@/components/layout/module-layout";
import { teacherNavItems, useTeacherAssignments, useTeacherContent, useTeacherQuizzes } from "./teacher-data";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, ClipboardList, Zap, AlertTriangle, Users, CalendarDays, Info } from "lucide-react";

const CARD_COLORS = [
  "bg-violet-500/10 border-violet-500/30",
  "bg-emerald-500/10 border-emerald-500/30",
  "bg-blue-500/10 border-blue-500/30",
  "bg-amber-500/10 border-amber-500/30",
  "bg-rose-500/10 border-rose-500/30",
  "bg-cyan-500/10 border-cyan-500/30",
  "bg-fuchsia-500/10 border-fuchsia-500/30",
  "bg-lime-500/10 border-lime-500/30",
];

const CARD_TEXT_COLORS = [
  "text-violet-700 dark:text-violet-400",
  "text-emerald-700 dark:text-emerald-400",
  "text-blue-700 dark:text-blue-400",
  "text-amber-700 dark:text-amber-400",
  "text-rose-700 dark:text-rose-400",
  "text-cyan-700 dark:text-cyan-400",
  "text-fuchsia-700 dark:text-fuchsia-400",
  "text-lime-700 dark:text-lime-400",
];

export default function TeacherDashboard() {
  const { session } = useAuth();
  const staffId = session?.staffId || "";

  const { data: assignments = [], isLoading: assignmentsLoading } = useTeacherAssignments(staffId);
  const { content, isLoading: contentLoading } = useTeacherContent(staffId);
  const { quizzes, isLoading: quizzesLoading } = useTeacherQuizzes(staffId);
  const { data: timetableRows = [] } = useQuery<any[]>({ queryKey: ['/api/teacher/timetable'], enabled: !!staffId });

  const [pendingGradingCount, setPendingGradingCount] = useState(0);
  const [gradingLoading, setGradingLoading] = useState(false);

  const now = new Date();
  const activeQuizzes = quizzes.filter((q: any) => {
    if (!q.isPublished || !q.startDateTime || !q.endDateTime) return false;
    const start = new Date(q.startDateTime);
    const end = new Date(q.endDateTime);
    return now >= start && now <= end;
  });

  useEffect(() => {
    if (quizzes.length === 0) {
      setPendingGradingCount(0);
      return;
    }
    const token = localStorage.getItem("teacher_token") || localStorage.getItem("emblazers_token");
    if (!token) return;

    setGradingLoading(true);
    const fetchAttempts = async () => {
      let pending = 0;
      for (const quiz of quizzes) {
        try {
          const res = await fetch(`/api/teacher/quizzes/${quiz._id || quiz.id}/attempts`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const attempts: any[] = await res.json();
            for (const attempt of attempts) {
              if (attempt.answers && Array.isArray(attempt.answers)) {
                for (const ans of attempt.answers) {
                  if (ans.questionType === "short-answer" && (ans.marksAwarded === undefined || ans.marksAwarded === null)) {
                    pending++;
                  }
                }
              }
            }
          }
        } catch {
          // skip
        }
      }
      setPendingGradingCount(pending);
      setGradingLoading(false);
    };
    fetchAttempts();
  }, [quizzes]);

  const isLoading = assignmentsLoading || contentLoading || quizzesLoading;

  const stats = [
    {
      label: "Total Content Uploaded",
      value: content.length,
      icon: FileText,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Total Quizzes Created",
      value: quizzes.length,
      icon: ClipboardList,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Active Quizzes Right Now",
      value: activeQuizzes.length,
      icon: Zap,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Pending Short-Answer Grading",
      value: gradingLoading ? "..." : pendingGradingCount,
      icon: AlertTriangle,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-500/10",
      needsAttention: pendingGradingCount > 0 && !gradingLoading,
    },
  ];

  return (
    <ModuleLayout module="curriculum" navItems={teacherNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session?.name}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((s) => (
                <Card key={s.label}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                          {s.label}
                          {s.needsAttention && (
                            <Badge variant="destructive" data-testid="badge-needs-attention">
                              Needs Attention
                            </Badge>
                          )}
                        </p>
                        <p
                          className="text-3xl font-bold mt-1"
                          data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}
                        >
                          {s.value}
                        </p>
                      </div>
                      <div className={`p-2 rounded-md ${s.bgColor}`}>
                        <s.icon className={`w-6 h-6 ${s.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-4" data-testid="text-my-assignments">My Assignments</h2>
              {assignments.length === 0 ? (
                <Card className="border-amber-500/40 bg-amber-500/5">
                  <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <Info className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-700 dark:text-amber-400">No Classes Assigned Yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your account is active but you have not been assigned to any class.<br />
                        Please ask the admin to assign you a class from the <strong>Teacher Assignments</strong> section.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {assignments.map((a: any, index: number) => {
                    const colorIdx = index % CARD_COLORS.length;
                    return (
                      <Card
                        key={a._id || a.id || index}
                        className={`border ${CARD_COLORS[colorIdx]}`}
                        data-testid={`card-assignment-${a._id || a.id || index}`}
                      >
                        <CardContent className="pt-5 pb-4">
                          <div className="space-y-2">
                            <p className={`text-lg font-semibold ${CARD_TEXT_COLORS[colorIdx]}`}>
                              {a.className}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Section {a.section}
                            </p>
                            <Badge variant="outline" className={CARD_TEXT_COLORS[colorIdx]}>
                              {a.subject}
                            </Badge>
                            {a.studentCount !== undefined && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                                <Users className="w-4 h-4" />
                                <span data-testid={`text-student-count-${a._id || a.id || index}`}>
                                  {a.studentCount} students
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          {timetableRows.length > 0 && (
            <div data-testid="section-timetable">
              <h2 className="text-lg font-semibold mb-4" data-testid="text-timetable-heading">My Timetable</h2>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="w-5 h-5 text-indigo-500" />
                    Class Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <tbody>
                        {timetableRows.map((row: any) => {
                          const slots: any[] = Array.isArray(row.slots) ? row.slots : (typeof row.slots === "string" ? JSON.parse(row.slots) : []);
                          return (
                            <tr key={row.id} className="border-b last:border-b-0">
                              <td className="py-2 pr-3 font-medium text-muted-foreground whitespace-nowrap">{row.class} — {row.section}</td>
                              <td className="py-2">
                                <div className="flex flex-wrap gap-2">
                                  {slots.map((slot: any, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs" data-testid={`badge-tt-slot-${row.id}-${i}`}>
                                      {slot.day} {slot.time}: {slot.subject}
                                    </Badge>
                                  ))}
                                  {slots.length === 0 && <span className="text-muted-foreground text-xs">No slots</span>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          </>
        )}
      </div>
    </ModuleLayout>
  );
}
