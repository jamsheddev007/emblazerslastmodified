import { useState, useEffect, useRef, useCallback } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { studentNavItems, useStudentQuizzes, useSubmitQuiz } from "./student-data";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Home,
  Eye,
  Timer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getGradeColor } from "@/lib/grade-utils";

type QuizView = "list" | "taking" | "result";

interface QuizResult {
  totalMarksObtained: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  isPassed: boolean;
  answers?: Array<{
    questionText: string;
    questionType: string;
    givenAnswer: string;
    correctAnswer: string;
    isCorrect: boolean | null;
    marks: number;
    marksObtained: number;
    options?: string[];
  }>;
}

function CountdownDisplay({ endDateTime }: { endDateTime: string }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(endDateTime).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Expired");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) {
        setRemaining(`${h}h ${m}m remaining`);
      } else {
        setRemaining(`${m}m ${s}s remaining`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDateTime]);

  return <span data-testid="text-countdown">{remaining}</span>;
}

export default function StudentQuizzesPage() {
  const { session } = useAuth();
  const { toast } = useToast();

  const { data: quizzes = [], isLoading } = useStudentQuizzes();
  const submitQuizMutation = useSubmitQuiz();

  const [view, setView] = useState<QuizView>("list");
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [activeQuizData, setActiveQuizData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [selectedCompletedQuiz, setSelectedCompletedQuiz] = useState<any>(null);
  const timerRef = useRef<any>(null);
  const autoSubmitRef = useRef(false);

  const activeQuizzes = quizzes.filter((q: any) => q.status === "active" && !q.attempted);
  const upcomingQuizzes = quizzes.filter((q: any) => q.status === "upcoming");
  const completedQuizzes = quizzes.filter((q: any) => q.attempted);

  const handleSubmitQuiz = useCallback(async () => {
    if (!activeQuizId || !activeQuizData) return;
    clearInterval(timerRef.current);

    const answerArray = (activeQuizData.questions || []).map((_: any, idx: number) => ({
      questionIndex: idx,
      givenAnswer: answers[idx] || "",
    }));

    const timeTaken = activeQuizData.timeLimitMinutes - Math.floor(timeLeft / 60);

    try {
      const result = await submitQuizMutation.mutateAsync({
        quizId: activeQuizId,
        answers: answerArray,
        timeTakenMinutes: Math.max(1, timeTaken),
      });
      setQuizResult(result);
      setView("result");
      toast({ title: `Quiz submitted! Score: ${result.percentage}% (${result.grade})` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setView("list");
      setActiveQuizId(null);
      setActiveQuizData(null);
    }
  }, [activeQuizId, activeQuizData, answers, timeLeft, submitQuizMutation, toast]);

  useEffect(() => {
    if (view === "taking" && activeQuizData && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            if (!autoSubmitRef.current) {
              autoSubmitRef.current = true;
              handleSubmitQuiz();
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [view, activeQuizData]);

  const startQuiz = async (quizId: string, timeLimitMinutes: number) => {
    setLoadingQuiz(true);
    try {
      const res = await fetch(`/api/student-portal/quizzes/${quizId}/start`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("student_token") || localStorage.getItem("emblazers_token")}` },
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Cannot start quiz", description: data.error, variant: "destructive" });
        setLoadingQuiz(false);
        return;
      }
      const data = await res.json();
      setActiveQuizId(quizId);
      setActiveQuizData(data);
      setAnswers({});
      setCurrentQuestion(0);
      setTimeLeft(timeLimitMinutes * 60);
      autoSubmitRef.current = false;
      setView("taking");
    } catch {
      toast({ title: "Connection error", variant: "destructive" });
    }
    setLoadingQuiz(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).filter((k) => answers[Number(k)]?.trim()).length;
  const totalQuestions = activeQuizData?.questions?.length || 0;

  const goHome = () => {
    setView("list");
    setActiveQuizId(null);
    setActiveQuizData(null);
    setQuizResult(null);
    setShowDetailedResults(false);
    setCurrentQuestion(0);
    setAnswers({});
  };

  if (view === "taking" && activeQuizData) {
    const questions = activeQuizData.questions || [];
    const q = questions[currentQuestion];
    const isTimerCritical = timeLeft < 300;

    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background" data-testid="quiz-fullscreen">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-card">
          <h2 className="font-semibold text-lg truncate" data-testid="text-quiz-title">
            {activeQuizData.title}
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-muted-foreground" data-testid="text-question-progress">
              Question {currentQuestion + 1} of {totalQuestions}
            </span>
            <div
              className={`flex items-center gap-1 text-sm font-mono px-3 py-1 rounded-md ${
                isTimerCritical
                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
              }`}
              data-testid="text-timer"
            >
              <Timer className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-2xl mx-auto">
            {q && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <p className="font-medium text-base" data-testid="text-question">
                      Q{currentQuestion + 1}. {q.questionText}
                    </p>
                    <Badge variant="outline">{q.marks} marks</Badge>
                  </div>

                  {q.questionType === "mcq" && (
                    <RadioGroup
                      value={answers[q.questionIndex] || ""}
                      onValueChange={(v) =>
                        setAnswers((a) => ({ ...a, [q.questionIndex]: v }))
                      }
                    >
                      {(q.options || []).map((opt: string, oi: number) => {
                        const letter = String.fromCharCode(65 + oi);
                        return (
                          <div
                            key={oi}
                            className="flex items-center space-x-3 py-2 px-3 rounded-md hover-elevate"
                          >
                            <RadioGroupItem
                              value={opt}
                              id={`q${currentQuestion}-o${oi}`}
                              data-testid={`radio-q${currentQuestion}-o${oi}`}
                            />
                            <Label
                              htmlFor={`q${currentQuestion}-o${oi}`}
                              className="cursor-pointer flex-1"
                            >
                              <span className="font-medium mr-2">{letter}.</span>
                              {opt}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  )}

                  {q.questionType === "truefalse" && (
                    <RadioGroup
                      value={answers[q.questionIndex] || ""}
                      onValueChange={(v) =>
                        setAnswers((a) => ({ ...a, [q.questionIndex]: v }))
                      }
                    >
                      {["True", "False"].map((opt) => (
                        <div
                          key={opt}
                          className="flex items-center space-x-3 py-2 px-3 rounded-md hover-elevate"
                        >
                          <RadioGroupItem
                            value={opt}
                            id={`q${currentQuestion}-${opt}`}
                            data-testid={`radio-q${currentQuestion}-${opt.toLowerCase()}`}
                          />
                          <Label
                            htmlFor={`q${currentQuestion}-${opt}`}
                            className="cursor-pointer flex-1"
                          >
                            {opt}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {q.questionType === "short" && (
                    <Input
                      value={answers[q.questionIndex] || ""}
                      onChange={(e) =>
                        setAnswers((a) => ({
                          ...a,
                          [q.questionIndex]: e.target.value,
                        }))
                      }
                      placeholder="Type your answer here..."
                      data-testid={`input-answer-${currentQuestion}`}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex items-center justify-between gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion((c) => Math.max(0, c - 1))}
                disabled={currentQuestion === 0}
                data-testid="button-prev-question"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              {currentQuestion < totalQuestions - 1 ? (
                <Button
                  onClick={() => setCurrentQuestion((c) => c + 1)}
                  data-testid="button-next-question"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={() => setShowSubmitConfirm(true)}
                  data-testid="button-open-submit"
                >
                  <Send className="w-4 h-4 mr-1" /> Submit Quiz
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="border-t bg-card px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs text-muted-foreground mb-2">
              {answeredCount} of {totalQuestions} answered
            </p>
            <div className="flex flex-wrap gap-2">
              {questions.map((_: any, idx: number) => {
                const isAnswered = !!answers[questions[idx]?.questionIndex]?.trim();
                const isCurrent = idx === currentQuestion;
                let classes =
                  "w-8 h-8 text-xs font-medium rounded-md flex items-center justify-center cursor-pointer border";
                if (isCurrent) {
                  classes +=
                    " bg-blue-500 text-white border-blue-600 dark:bg-blue-600 dark:border-blue-500";
                } else if (isAnswered) {
                  classes +=
                    " bg-green-500 text-white border-green-600 dark:bg-green-600 dark:border-green-500";
                } else {
                  classes += " bg-card border-border text-foreground";
                }
                return (
                  <button
                    key={idx}
                    className={classes}
                    onClick={() => setCurrentQuestion(idx)}
                    data-testid={`button-palette-${idx}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <Dialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Quiz?</DialogTitle>
              <DialogDescription>
                You have answered {answeredCount} of {totalQuestions} questions. Are you sure you
                want to submit?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowSubmitConfirm(false)}
                data-testid="button-cancel-submit"
              >
                Continue Quiz
              </Button>
              <Button
                onClick={() => {
                  setShowSubmitConfirm(false);
                  handleSubmitQuiz();
                }}
                disabled={submitQuizMutation.isPending}
                data-testid="button-confirm-submit"
              >
                {submitQuizMutation.isPending ? "Submitting..." : "Yes, Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (view === "result" && quizResult) {
    const pct = quizResult.percentage || 0;

    if (showDetailedResults && quizResult.answers) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background" data-testid="quiz-detailed-results">
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-card">
            <h2 className="font-semibold text-lg">Detailed Results</h2>
            <Button variant="outline" onClick={() => setShowDetailedResults(false)} data-testid="button-back-results">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back to Summary
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-4">
              {quizResult.answers.map((a, idx) => {
                const isPendingReview = a.isCorrect === null || (a.questionType === "short" && a.isCorrect === null);
                return (
                <Card
                  key={idx}
                  className={
                    isPendingReview
                      ? ""
                      : a.isCorrect === true
                      ? "border-green-300 dark:border-green-700"
                      : "border-red-300 dark:border-red-700"
                  }
                  data-testid={`card-result-q${idx}`}
                >
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <p className="font-medium">
                        Q{idx + 1}. {a.questionText}
                      </p>
                      <span className="text-sm text-muted-foreground">
                        {a.marksObtained}/{a.marks} marks
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">Your answer: </span>
                        <span className={a.isCorrect === true ? "text-green-700 dark:text-green-400 font-medium" : a.isCorrect === null ? "font-medium" : "text-red-700 dark:text-red-400 font-medium"}>
                          {a.givenAnswer || "(No answer)"}
                        </span>
                      </p>
                      {a.isCorrect === false && a.questionType !== "short" && (
                        <p>
                          <span className="text-muted-foreground">Correct answer: </span>
                          <span className="text-green-700 dark:text-green-400 font-medium">
                            {a.correctAnswer}
                          </span>
                        </p>
                      )}
                      {a.isCorrect === null && (
                        <Badge variant="outline" className="mt-1" data-testid={`badge-pending-review-${idx}`}>
                          Pending teacher review
                        </Badge>
                      )}
                    </div>

                    <div className="pt-1">
                      {isPendingReview ? (
                        <Badge variant="outline">
                          <AlertCircle className="w-3 h-3 mr-1" /> Manual grading
                        </Badge>
                      ) : a.isCorrect === true ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 no-default-hover-elevate no-default-active-elevate">
                          <CheckCircle className="w-3 h-3 mr-1" /> Correct
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 no-default-hover-elevate no-default-active-elevate">
                          <XCircle className="w-3 h-3 mr-1" /> Wrong
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
                );
              })}

              <div className="pt-4">
                <Button onClick={goHome} data-testid="button-go-home-detailed">
                  <Home className="w-4 h-4 mr-1" /> Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background" data-testid="quiz-result-screen">
        <div className="max-w-md w-full mx-4">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-6">
              <div>
                <Award className="w-16 h-16 mx-auto text-amber-500 mb-3" />
                <h1 className="text-2xl font-bold" data-testid="text-quiz-complete">
                  Quiz Complete!
                </h1>
              </div>

              <div className="space-y-3">
                <p className="text-lg" data-testid="text-score">
                  Score:{" "}
                  <span className="font-bold">
                    {quizResult.totalMarksObtained} / {quizResult.totalMarks}
                  </span>
                </p>

                <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct >= 80
                        ? "bg-green-500"
                        : pct >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                    data-testid="progress-percentage"
                  />
                </div>
                <p className="text-2xl font-bold" data-testid="text-percentage">
                  {pct}%
                </p>

                <div className="flex items-center justify-center gap-3">
                  <Badge
                    className={`text-sm px-3 py-1 no-default-hover-elevate no-default-active-elevate ${getGradeColor(quizResult.grade)}`}
                    data-testid="badge-grade"
                  >
                    Grade: {quizResult.grade}
                  </Badge>
                  <Badge
                    className={`text-sm px-3 py-1 no-default-hover-elevate no-default-active-elevate ${
                      quizResult.isPassed
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                    data-testid="badge-pass-fail"
                  >
                    {quizResult.isPassed ? "Passed" : "Failed"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {quizResult.answers && quizResult.answers.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailedResults(true)}
                    data-testid="button-view-detailed"
                  >
                    <Eye className="w-4 h-4 mr-1" /> View Detailed Results
                  </Button>
                )}
                <Button onClick={goHome} data-testid="button-go-home">
                  <Home className="w-4 h-4 mr-1" /> Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <ModuleLayout module="curriculum" navItems={studentNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Quizzes
          </h1>
          <p className="text-muted-foreground">Take quizzes and test your knowledge</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-md bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <Tabs defaultValue="active">
            <TabsList data-testid="tabs-quiz-list">
              <TabsTrigger value="active" data-testid="tab-active">
                Active ({activeQuizzes.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming" data-testid="tab-upcoming">
                Upcoming ({upcomingQuizzes.length})
              </TabsTrigger>
              <TabsTrigger value="completed" data-testid="tab-completed">
                Completed ({completedQuizzes.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-4">
              {activeQuizzes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No active quizzes right now.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeQuizzes.map((q: any) => (
                    <Card
                      key={q.id}
                      className="border-green-300 dark:border-green-700"
                      data-testid={`card-quiz-active-${q.id}`}
                    >
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{q.title}</h3>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 no-default-hover-elevate no-default-active-elevate">
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {q.subject} - by {q.teacherName}
                        </p>
                        <div className="flex gap-3 text-sm text-muted-foreground flex-wrap">
                          <span>{q.questionsCount} questions</span>
                          <span>{q.totalMarks} marks</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {q.timeLimitMinutes} min
                          </span>
                        </div>
                        {q.instructions && (
                          <p className="text-sm text-muted-foreground">{q.instructions}</p>
                        )}
                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <Clock className="w-3 h-3" />
                          <CountdownDisplay endDateTime={q.endDateTime} />
                        </div>
                        <Button
                          onClick={() => startQuiz(q.id, q.timeLimitMinutes)}
                          disabled={loadingQuiz}
                          data-testid={`button-start-quiz-${q.id}`}
                        >
                          {loadingQuiz ? "Loading..." : "Start Quiz"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-4">
              {upcomingQuizzes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No upcoming quizzes scheduled.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingQuizzes.map((q: any) => (
                    <Card
                      key={q.id}
                      className="border-blue-300 dark:border-blue-700"
                      data-testid={`card-quiz-upcoming-${q.id}`}
                    >
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{q.title}</h3>
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 no-default-hover-elevate no-default-active-elevate">
                            Upcoming
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {q.subject} - by {q.teacherName}
                        </p>
                        <div className="flex gap-3 text-sm text-muted-foreground flex-wrap">
                          <span>{q.questionsCount} questions</span>
                          <span>{q.totalMarks} marks</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {q.timeLimitMinutes} min
                          </span>
                        </div>
                        <Button variant="outline" disabled data-testid={`button-upcoming-${q.id}`}>
                          Opens on {new Date(q.startDateTime).toLocaleString()}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              {completedQuizzes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    You haven't completed any quizzes yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedQuizzes.map((q: any) => (
                    <Card key={q.id} data-testid={`card-quiz-completed-${q.id}`}>
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{q.title}</h3>
                          <Badge
                            className={`no-default-hover-elevate no-default-active-elevate ${getGradeColor(
                              q.myResult?.grade
                            )}`}
                            data-testid={`badge-grade-${q.id}`}
                          >
                            {q.myResult?.grade}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{q.subject}</p>
                        <div className="flex items-center gap-3 text-sm flex-wrap">
                          <span>
                            {q.myResult?.totalMarksObtained}/{q.totalMarks} marks
                          </span>
                          <span>{q.myResult?.percentage}%</span>
                          <Badge
                            className={`no-default-hover-elevate no-default-active-elevate ${
                              q.myResult?.isPassed
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {q.myResult?.isPassed ? "Passed" : "Failed"}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedCompletedQuiz(q)}
                          data-testid={`button-view-details-${q.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" /> View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <Dialog
          open={!!selectedCompletedQuiz}
          onOpenChange={(open) => !open && setSelectedCompletedQuiz(null)}
        >
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            {selectedCompletedQuiz && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedCompletedQuiz.title}</DialogTitle>
                  <DialogDescription>{selectedCompletedQuiz.subject}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Score</p>
                      <p className="font-semibold">
                        {selectedCompletedQuiz.myResult?.totalMarksObtained}/
                        {selectedCompletedQuiz.totalMarks}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Percentage</p>
                      <p className="font-semibold">
                        {selectedCompletedQuiz.myResult?.percentage}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Grade</p>
                      <Badge
                        className={`no-default-hover-elevate no-default-active-elevate ${getGradeColor(
                          selectedCompletedQuiz.myResult?.grade
                        )}`}
                      >
                        {selectedCompletedQuiz.myResult?.grade}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge
                        className={`no-default-hover-elevate no-default-active-elevate ${
                          selectedCompletedQuiz.myResult?.isPassed
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {selectedCompletedQuiz.myResult?.isPassed ? "Passed" : "Failed"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}
