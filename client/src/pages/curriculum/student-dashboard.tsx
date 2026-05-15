import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ModuleLayout } from "@/components/layout/module-layout";
import { studentNavItems, useStudentDashboard, useChangePassword, useStudentResults } from "./student-data";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClipboardList, BarChart3, CreditCard, CalendarCheck, ArrowRight, LogOut, Info, Lock, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getGradeColor } from "@/lib/grade-utils";

export default function StudentDashboard() {
  const { session, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const className = session?.className || "";
  const section = session?.section || "";

  const { data: dashboard, isLoading } = useStudentDashboard();
  const { data: results } = useStudentResults();
  const changePasswordMutation = useChangePassword();
  const { data: timetableRows = [] } = useQuery<any[]>({ queryKey: ['/api/student-portal/timetable'] });

  const isFirstLogin = (session as any)?.isFirstLogin || false;
  const [showPasswordDialog, setShowPasswordDialog] = useState(isFirstLogin);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const recentResults = (results || []).slice(0, 5);

  const summaryCards = [
    {
      label: "Active Quizzes",
      value: dashboard?.activeQuizzesCount ?? 0,
      icon: ClipboardList,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      link: "/curriculum/student-quizzes",
      linkText: "Take Now",
    },
    {
      label: "Completed Quizzes",
      value: dashboard?.completedQuizzesCount ?? 0,
      icon: BarChart3,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-50 dark:bg-violet-950",
      link: "/curriculum/student-results",
      linkText: "View",
    },
    {
      label: "Pending Fees",
      value: dashboard?.pendingFeesTotal ? `Rs. ${dashboard.pendingFeesTotal.toLocaleString()}` : "Rs. 0",
      icon: CreditCard,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950",
      link: "/curriculum/student-fees",
      linkText: "Pay Info",
    },
    {
      label: "Attendance This Month",
      value: `${dashboard?.thisMonthAttendance ?? 0}%`,
      icon: CalendarCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-950",
      link: "/curriculum/student-attendance",
      linkText: "View",
    },
  ];

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    try {
      await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
      toast({ title: "Password changed successfully" });
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout?.();
    navigate("/curriculum/login");
  };

  return (
    <ModuleLayout module="curriculum" navItems={studentNavItems}>
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 flex-wrap py-4">
            <div className="flex items-center gap-6 flex-wrap text-sm" data-testid="text-welcome-bar">
              <span className="font-semibold text-base" data-testid="text-welcome-name">Welcome, {session?.name || dashboard?.profile?.name || "Student"}</span>
              <span className="text-muted-foreground" data-testid="text-class-info">Class {dashboard?.profile?.className || className} - {dashboard?.profile?.section || section}</span>
              <span className="text-muted-foreground" data-testid="text-student-id">Student ID: <span className="font-mono font-medium">{dashboard?.profile?.studentId || session?.studentId || "—"}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPasswordDialog(true)} data-testid="button-change-password">
                <Lock className="w-4 h-4 mr-1" />
                Change Password
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <Card
              key={card.label}
              className="cursor-pointer hover-elevate transition-colors"
              onClick={() => navigate(card.link)}
              data-testid={`card-${card.label.toLowerCase().replace(/\s/g, '-')}`}
            >
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold" data-testid={`stat-${card.label.toLowerCase().replace(/\s/g, '-')}`}>
                      {isLoading ? "..." : card.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-md ${card.bgColor}`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-sm font-medium" style={{ color: "hsl(var(--primary))" }}>
                  <span data-testid={`link-${card.label.toLowerCase().replace(/\s/g, '-')}`}>{card.linkText}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg" data-testid="text-recent-activity-title">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentResults.length === 0 ? (
              <p className="text-sm text-muted-foreground" data-testid="text-no-activity">No quiz results yet. Take a quiz to see your activity here.</p>
            ) : (
              <div className="space-y-3">
                {recentResults.map((result: any, idx: number) => (
                  <div
                    key={result.id || result._id || idx}
                    className="flex items-center justify-between gap-4 flex-wrap py-2 border-b last:border-b-0"
                    data-testid={`row-recent-result-${idx}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`text-quiz-title-${idx}`}>{result.quizTitle || result.title || "Quiz"}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.subject && <span>{result.subject} · </span>}
                        {result.submittedAt ? new Date(result.submittedAt).toLocaleDateString() : result.completedAt ? new Date(result.completedAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground" data-testid={`text-score-${idx}`}>
                        {result.totalMarksObtained ?? result.obtainedMarks ?? result.score ?? 0}/{result.totalMarks ?? result.total ?? 0}
                      </span>
                      <Badge className={`no-default-hover-elevate no-default-active-elevate ${getGradeColor(result.grade)}`} data-testid={`badge-grade-${idx}`}>
                        {result.grade || "—"}
                      </Badge>
                      <Badge variant={result.isPassed ?? result.passed ? "default" : "destructive"} data-testid={`badge-status-${idx}`}>
                        {(result.isPassed ?? result.passed) ? "Pass" : "Fail"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {timetableRows.length > 0 && (
          <Card data-testid="card-timetable">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="w-5 h-5 text-indigo-500" />
                My Timetable
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
                                <Badge key={i} variant="outline" className="text-xs" data-testid={`badge-slot-${row.id}-${i}`}>
                                  {slot.day} {slot.time}: {slot.subject}
                                  {slot.teacher ? ` (${slot.teacher})` : ""}
                                </Badge>
                              ))}
                              {slots.length === 0 && <span className="text-muted-foreground text-xs">No slots defined</span>}
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
        )}

        <Dialog open={showPasswordDialog} onOpenChange={(open) => { if (!isFirstLogin) setShowPasswordDialog(open); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isFirstLogin ? "Set Your Password" : "Change Password"}</DialogTitle>
            </DialogHeader>
            {isFirstLogin && (
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  You must set a new password before continuing. Please choose a password with at least 8 characters.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} data-testid="input-current-password" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 8 characters" data-testid="input-new-password" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" data-testid="input-confirm-password" />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changePasswordMutation.isPending || !currentPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                className="w-full"
                data-testid="button-submit-password"
              >
                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}
