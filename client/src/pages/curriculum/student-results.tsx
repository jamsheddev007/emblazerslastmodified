import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { studentNavItems, useStudentResults, useStudentExamResults } from "./student-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, TrendingUp, ClipboardList, ChevronRight, CheckCircle2, XCircle, Clock, Download, ShieldCheck, GraduationCap } from "lucide-react";
import { getGradeColor } from "@/lib/grade-utils";
import { ReportCardDialog } from "@/components/report-card-dialog";

function studentFetch(url: string): Promise<Response> {
  const token = localStorage.getItem("student_token") || localStorage.getItem("emblazers_token");
  return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
}

const EXAM_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Pending",  cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  saved:    { label: "Saved",    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  verified: { label: "Verified", cls: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  edited:   { label: "Edited",   cls: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
};

export default function StudentResultsPage() {
  const { data: results = [], isLoading } = useStudentResults();
  const { data: examResults = [], isLoading: examLoading } = useStudentExamResults();
  const [selectedResult, setSelectedResult] = useState<any>(null);

  const totalAttempts = results.length;
  const bestScore = totalAttempts > 0
    ? Math.max(...results.map((a: any) => a.percentage || 0))
    : 0;
  const avgGrade = totalAttempts > 0
    ? (() => {
        const order = ["A+", "A", "B", "C", "D", "F"];
        const grades = results.map((a: any) => order.indexOf(a.grade)).filter((i: number) => i >= 0);
        if (grades.length === 0) return "-";
        const avgIdx = Math.round(grades.reduce((s: number, v: number) => s + v, 0) / grades.length);
        return order[Math.min(avgIdx, order.length - 1)];
      })()
    : "-";

  return (
    <ModuleLayout module="curriculum" navItems={studentNavItems}>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">My Results</h1>
              <p className="text-muted-foreground">View your quiz and exam results</p>
            </div>
            <ReportCardDialog
              studentId="me"
              studentName="My"
              fetchFn={studentFetch}
              trigger={
                <Button variant="outline" className="gap-2" data-testid="button-download-my-report-card">
                  <Download className="w-4 h-4" />
                  Download Report Card
                </Button>
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-violet-100 dark:bg-violet-900">
                  <Award className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground" data-testid="text-avg-grade-label">Average Grade</p>
                  <p className="text-2xl font-bold" data-testid="text-avg-grade-value">{avgGrade}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground" data-testid="text-best-score-label">Best Score</p>
                  <p className="text-2xl font-bold" data-testid="text-best-score-value">{bestScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
                  <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground" data-testid="text-total-quizzes-label">Total Quizzes Attempted</p>
                  <p className="text-2xl font-bold" data-testid="text-total-quizzes-value">{totalAttempts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam Results Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="w-4 h-4" />
              Exam Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {examLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-10 rounded bg-muted animate-pulse" />)}
              </div>
            ) : examResults.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No exam results yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-exam-results">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-muted-foreground font-medium">Subject</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Class</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Marks</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Grade</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examResults.map((r: any) => {
                      const sb = EXAM_STATUS_BADGE[r.status || "pending"] || EXAM_STATUS_BADGE.pending;
                      return (
                        <tr key={r.id} className="border-b last:border-b-0" data-testid={`row-exam-result-${r.id}`}>
                          <td className="p-2 font-medium">{r.subject}</td>
                          <td className="p-2 text-muted-foreground">{r.class}</td>
                          <td className="p-2">
                            <span className="font-medium">{r.marksObtained}</span>
                            <span className="text-muted-foreground">/{r.maxMarks}</span>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline" className={`${getGradeColor(r.grade)} no-default-hover-elevate no-default-active-elevate`}>
                              {r.grade || "-"}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sb.cls}`}>
                              {r.status === "verified" && <ShieldCheck className="w-3 h-3" />}
                              {sb.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Results Section */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No quiz results yet. Take a quiz to see your results here.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="w-4 h-4" />
                Quiz Results
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-results">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 text-sm font-medium">Quiz Title</th>
                    <th className="text-left p-3 text-sm font-medium">Subject</th>
                    <th className="text-left p-3 text-sm font-medium">Teacher</th>
                    <th className="text-left p-3 text-sm font-medium">Date</th>
                    <th className="text-left p-3 text-sm font-medium">Score</th>
                    <th className="text-left p-3 text-sm font-medium">Grade</th>
                    <th className="text-left p-3 text-sm font-medium">Status</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r: any) => (
                    <tr
                      key={r.id}
                      className="border-b last:border-b-0 hover-elevate cursor-pointer"
                      onClick={() => setSelectedResult(r)}
                      data-testid={`row-result-${r.id}`}
                    >
                      <td className="p-3 text-sm font-medium">{r.quizTitle}</td>
                      <td className="p-3 text-sm text-muted-foreground">{r.subject}</td>
                      <td className="p-3 text-sm text-muted-foreground">{r.teacherName}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-3 text-sm">
                        <span className="font-medium">{r.totalMarksObtained}</span>
                        <span className="text-muted-foreground">/{r.totalMarks}</span>
                        <span className="ml-2 text-muted-foreground">({r.percentage}%)</span>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className={`${getGradeColor(r.grade)} no-default-hover-elevate no-default-active-elevate`} data-testid={`badge-grade-${r.id}`}>
                          {r.grade}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={r.isPassed ? "default" : "destructive"} data-testid={`badge-status-${r.id}`}>
                          {r.isPassed ? "Pass" : "Fail"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedResult} onOpenChange={(open) => { if (!open) setSelectedResult(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-result-detail-title">
              {selectedResult?.quizTitle} - Result Details
            </DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 p-4 rounded-md bg-muted/50">
                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-lg font-bold">{selectedResult.totalMarksObtained}/{selectedResult.totalMarks}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Percentage</p>
                  <p className="text-lg font-bold">{selectedResult.percentage}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grade</p>
                  <Badge variant="outline" className={`${getGradeColor(selectedResult.grade)} text-base no-default-hover-elevate no-default-active-elevate`}>
                    {selectedResult.grade}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedResult.isPassed ? "default" : "destructive"}>
                    {selectedResult.isPassed ? "Pass" : "Fail"}
                  </Badge>
                </div>
              </div>

              {selectedResult.answers && selectedResult.answers.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Per-Question Breakdown</h3>
                  {selectedResult.answers.map((ans: any, idx: number) => {
                    const isShort = ans.questionType === "short" || ans.questionType === "short_answer" || ans.questionType === "short-answer";
                    const isPending = isShort && (ans.marksAwarded === undefined || ans.marksAwarded === null || ans.marksAwarded === 0) && !ans.isCorrect;
                    const isCorrect = ans.isCorrect;
                    const isWrong = !isShort && !ans.isCorrect;

                    let bgClass = "";
                    if (isPending) bgClass = "bg-muted/50";
                    else if (isCorrect) bgClass = "bg-emerald-50 dark:bg-emerald-950/30";
                    else if (isWrong) bgClass = "bg-red-50 dark:bg-red-950/30";

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-md border ${bgClass}`}
                        data-testid={`question-result-${idx}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">
                            Q{idx + 1}. {ans.questionText || `Question ${idx + 1}`}
                          </p>
                          {isPending ? (
                            <Badge variant="outline" className="shrink-0 no-default-hover-elevate no-default-active-elevate">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending teacher review
                            </Badge>
                          ) : isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                          )}
                        </div>
                        <div className="mt-2 text-sm space-y-1">
                          <p>
                            <span className="text-muted-foreground">Your answer: </span>
                            <span className="font-medium">{ans.givenAnswer || ans.selectedAnswer || ans.answer || "-"}</span>
                          </p>
                          {isWrong && ans.correctAnswer && (
                            <p>
                              <span className="text-muted-foreground">Correct answer: </span>
                              <span className="font-medium text-emerald-600 dark:text-emerald-400">{ans.correctAnswer}</span>
                            </p>
                          )}
                          {ans.marksAwarded !== undefined && (
                            <p className="text-muted-foreground">
                              Marks: {ans.marksAwarded}/{ans.marks || ans.totalMarks || "-"}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Detailed question breakdown is not available for this result.
                </p>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setSelectedResult(null)} data-testid="button-close-detail">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}