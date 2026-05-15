import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { ModuleLayout } from "@/components/layout/module-layout";
import { teacherNavItems, useTeacherQuizzes, useQuizAttempts, useGradeShortAnswer } from "./teacher-data";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Eye,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";
import { getGradeFromPercentage as getGrade } from "@/lib/grade-utils";

function QuizAttemptDetails({ attempt, quiz, quizId }: { attempt: any; quiz: any; quizId: string }) {
  const { toast } = useToast();
  const gradeShortAnswer = useGradeShortAnswer(quizId);
  const [shortAnswerMarks, setShortAnswerMarks] = useState<Record<number, number>>({});

  const questions = quiz?.questions || [];
  const answers = attempt?.answers || [];

  const handleSaveMarks = async (questionIndex: number, maxMarks: number) => {
    const marks = shortAnswerMarks[questionIndex];
    if (marks === undefined || marks < 0 || marks > maxMarks) {
      toast({ title: "Invalid marks", description: `Marks must be between 0 and ${maxMarks}`, variant: "destructive" });
      return;
    }
    try {
      await gradeShortAnswer.mutateAsync({ attemptId: attempt.id || attempt._id, questionIndex, marksAwarded: marks });
      toast({ title: "Marks saved", description: `Awarded ${marks}/${maxMarks} marks` });
    } catch {
      toast({ title: "Error", description: "Failed to save marks", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center gap-3 flex-wrap">
        <Badge data-testid="badge-student-name">{attempt.studentName || "Unknown Student"}</Badge>
        <Badge variant="outline" data-testid="badge-student-id">{attempt.studentId || "N/A"}</Badge>
        <Badge variant="outline" data-testid="badge-attempt-score">
          Score: {attempt.totalMarksObtained ?? attempt.totalMarks ?? attempt.score ?? 0}/{quiz?.totalMarks ?? attempt.maxMarks ?? 0}
        </Badge>
      </div>

      <div className="space-y-3">
        {questions.map((q: any, idx: number) => {
          const studentAnswer = answers[idx];
          const isShortAnswer = q.questionType === "short" || q.type === "short-answer" || q.type === "shortAnswer";
          const marksAwarded = studentAnswer?.marksAwarded ?? studentAnswer?.marks;

          return (
            <Card key={idx} data-testid={`card-question-${idx}`}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="font-medium text-sm">Q{idx + 1}: {q.questionText || q.question || q.text}</p>
                  <Badge variant="outline" className="text-xs">{q.marks || 1} marks</Badge>
                </div>

                {(q.questionType === "mcq" || q.type === "mcq") && (
                  <div className="space-y-1 text-sm">
                    {(q.options || []).map((opt: string, oi: number) => {
                      const isCorrect = opt === q.correctAnswer || oi === q.correctOption;
                      const isSelected = studentAnswer?.givenAnswer === opt || studentAnswer?.selectedOption === oi || studentAnswer?.answer === opt;
                      return (
                        <div
                          key={oi}
                          className={`px-2 py-1 rounded-md ${isCorrect ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300" : ""} ${isSelected && !isCorrect ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300" : ""}`}
                        >
                          {isSelected ? ">> " : ""}{opt} {isCorrect ? "(Correct)" : ""}
                        </div>
                      );
                    })}
                  </div>
                )}

                {(q.questionType === "truefalse" || q.type === "true-false" || q.type === "trueFalse") && (
                  <div className="text-sm space-y-1">
                    <p>Student answered: <span className="font-medium">{String(studentAnswer?.givenAnswer ?? studentAnswer?.answer ?? "N/A")}</span></p>
                    <p>Correct answer: <span className="font-medium text-green-600 dark:text-green-400">{String(q.correctAnswer ?? q.correctOption)}</span></p>
                  </div>
                )}

                {isShortAnswer && (
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Student's answer:</p>
                      <p className="mt-1 p-2 rounded-md bg-muted">{studentAnswer?.givenAnswer || studentAnswer?.answer || studentAnswer?.text || "No answer provided"}</p>
                    </div>
                    {q.modelAnswer && (
                      <div>
                        <p className="text-muted-foreground">Model answer:</p>
                        <p className="mt-1 p-2 rounded-md bg-muted">{q.modelAnswer}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-muted-foreground">Marks (0-{q.marks || 1}):</span>
                      <Input
                        type="number"
                        min={0}
                        max={q.marks || 1}
                        value={shortAnswerMarks[idx] ?? marksAwarded ?? ""}
                        onChange={(e) => setShortAnswerMarks((prev) => ({ ...prev, [idx]: Number(e.target.value) }))}
                        className="w-20"
                        data-testid={`input-marks-${idx}`}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveMarks(idx, q.marks || 1)}
                        disabled={gradeShortAnswer.isPending}
                        data-testid={`button-save-marks-${idx}`}
                      >
                        Save Marks
                      </Button>
                      {marksAwarded !== undefined && marksAwarded !== null && (
                        <Badge variant="outline" className="text-xs">Currently: {marksAwarded}/{q.marks || 1}</Badge>
                      )}
                    </div>
                  </div>
                )}

                {!isShortAnswer && marksAwarded !== undefined && marksAwarded !== null && (
                  <p className="text-xs text-muted-foreground">Marks awarded: {marksAwarded}/{q.marks || 1}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function QuizAttemptsView({ quizId, quiz, onBack }: { quizId: string; quiz: any; onBack: () => void }) {
  const { data: attempts = [], isLoading } = useQuizAttempts(quizId);
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);

  const stats = useMemo(() => {
    if (!attempts.length) return { total: 0, passed: 0, failed: 0, avg: 0, highest: 0, lowest: 0 };
    const total = attempts.length;
    const maxMarks = quiz?.totalMarks || 100;
    const passingMarks = quiz?.passingMarks || Math.ceil(maxMarks * 0.4);
    const scores = attempts.map((a: any) => a.totalMarksObtained ?? a.totalMarks ?? a.score ?? 0);
    const passed = scores.filter((s: number) => s >= passingMarks).length;
    const failed = total - passed;
    const avg = scores.reduce((a: number, b: number) => a + b, 0) / total;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);
    return { total, passed, failed, avg: Math.round(avg * 10) / 10, highest, lowest };
  }, [attempts, quiz]);

  const statCards = [
    { label: "Total Attempts", value: stats.total, icon: Users, color: "text-blue-600" },
    { label: "Passed", value: stats.passed, icon: CheckCircle, color: "text-green-600" },
    { label: "Failed", value: stats.failed, icon: XCircle, color: "text-red-600" },
    { label: "Avg Score", value: stats.avg, icon: TrendingUp, color: "text-amber-600" },
    { label: "Highest", value: stats.highest, icon: ArrowUp, color: "text-emerald-600" },
    { label: "Lowest", value: stats.lowest, icon: ArrowDown, color: "text-orange-600" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-quiz-list">
          <ArrowLeft />
        </Button>
        <div>
          <h2 className="text-lg font-semibold" data-testid="text-quiz-title">{quiz?.title || "Quiz"}</h2>
          <p className="text-sm text-muted-foreground">
            {quiz?.className} {quiz?.section} - {quiz?.subject}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 flex flex-col items-center gap-1 text-center">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <p className="text-xl font-bold" data-testid={`text-stat-${s.label.toLowerCase().replace(/\s/g, "-")}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {attempts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No attempts yet for this quiz.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Attempts</CardTitle>
            <Badge variant="outline">{attempts.length} total</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attempts.map((attempt: any, idx: number) => {
                    const score = attempt.totalMarksObtained ?? attempt.totalMarks ?? attempt.score ?? 0;
                    const maxMarks = quiz?.totalMarks || 100;
                    const percentage = maxMarks > 0 ? Math.round((score / maxMarks) * 100) : 0;
                    const { grade, color } = getGrade(percentage);
                    const passingMarks = quiz?.passingMarks || Math.ceil(maxMarks * 0.4);
                    const passed = score >= passingMarks;

                    return (
                      <TableRow key={attempt.id || attempt._id || idx} data-testid={`row-attempt-${idx}`}>
                        <TableCell data-testid={`text-student-name-${idx}`}>{attempt.studentName || "Unknown"}</TableCell>
                        <TableCell data-testid={`text-student-id-${idx}`}>{attempt.studentId || "N/A"}</TableCell>
                        <TableCell data-testid={`text-score-${idx}`}>{score}/{maxMarks}</TableCell>
                        <TableCell data-testid={`text-percentage-${idx}`}>{percentage}%</TableCell>
                        <TableCell>
                          <Badge className={color} data-testid={`badge-grade-${idx}`}>{grade}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={passed ? "default" : "destructive"}
                            data-testid={`badge-status-${idx}`}
                          >
                            {passed ? "Passed" : "Failed"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground" data-testid={`text-submitted-${idx}`}>
                          {attempt.submittedAt || attempt.completedAt
                            ? new Date(attempt.submittedAt || attempt.completedAt).toLocaleString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAttempt(attempt)}
                            data-testid={`button-view-details-${idx}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedAttempt} onOpenChange={() => setSelectedAttempt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attempt Details</DialogTitle>
          </DialogHeader>
          {selectedAttempt && (
            <QuizAttemptDetails attempt={selectedAttempt} quiz={quiz} quizId={quizId} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TeacherQuizResults() {
  const { session } = useAuth();
  const staffId = session?.staffId || "";
  const [location] = useLocation();
  const { quizzes, isLoading } = useTeacherQuizzes(staffId);

  const params = new URLSearchParams(location.split("?")[1] || "");
  const urlQuizId = params.get("quiz");

  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(urlQuizId);

  const selectedQuiz = quizzes.find((q: any) => (q.id || q._id) === selectedQuizId);

  return (
    <ModuleLayout module="curriculum" navItems={teacherNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Quiz Results</h1>
          <p className="text-muted-foreground" data-testid="text-page-subtitle">
            {selectedQuizId ? "View student attempts and grade responses" : "Select a quiz to view results"}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : selectedQuizId && selectedQuiz ? (
          <QuizAttemptsView
            quizId={selectedQuizId}
            quiz={selectedQuiz}
            onBack={() => setSelectedQuizId(null)}
          />
        ) : (
          <div className="space-y-3">
            {quizzes.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>No quizzes created yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {quizzes.map((quiz: any) => {
                  const now = new Date();
                  const start = quiz.startDateTime ? new Date(quiz.startDateTime) : null;
                  const end = quiz.endDateTime ? new Date(quiz.endDateTime) : null;
                  let status = "Draft";
                  let statusColor = "bg-muted text-muted-foreground";
                  if (quiz.isPublished) {
                    if (start && end && now >= start && now <= end) {
                      status = "Active";
                      statusColor = "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
                    } else if (end && now > end) {
                      status = "Expired";
                      statusColor = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
                    } else if (start && now < start) {
                      status = "Scheduled";
                      statusColor = "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
                    }
                  }

                  return (
                    <Card
                      key={quiz.id || quiz._id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => setSelectedQuizId(quiz.id || quiz._id)}
                      data-testid={`card-quiz-${quiz.id || quiz._id}`}
                    >
                      <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3 flex-wrap">
                          <ClipboardList className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium" data-testid={`text-quiz-title-${quiz.id || quiz._id}`}>{quiz.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {quiz.className} {quiz.section} - {quiz.subject}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={statusColor} data-testid={`badge-quiz-status-${quiz.id || quiz._id}`}>{status}</Badge>
                          <Badge variant="outline" data-testid={`badge-quiz-questions-${quiz.id || quiz._id}`}>
                            {quiz.questions?.length || 0} questions
                          </Badge>
                          <Button variant="outline" size="sm" data-testid={`button-view-attempts-${quiz.id || quiz._id}`}>
                            View Attempts
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
