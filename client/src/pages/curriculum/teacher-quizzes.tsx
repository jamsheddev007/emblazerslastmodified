import { useState, useMemo } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { teacherNavItems, useTeacherAssignments, useTeacherQuizzes } from "./teacher-data";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Minus, CheckCircle, ClipboardList, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface QuizQuestion {
  questionText: string;
  questionType: "mcq" | "truefalse" | "short";
  options: string[];
  correctAnswer: string;
  marks: number;
}

function getQuizStatus(quiz: any): { label: string; variant: "secondary" | "default" | "destructive" | "outline"; color: string } {
  if (!quiz.isPublished) return { label: "Draft", variant: "secondary", color: "bg-muted text-muted-foreground" };
  const now = new Date();
  const start = quiz.startDateTime ? new Date(quiz.startDateTime) : null;
  const end = quiz.endDateTime ? new Date(quiz.endDateTime) : null;
  if (start && now < start) return { label: "Scheduled", variant: "outline", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
  if (end && now > end) return { label: "Expired", variant: "destructive", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  return { label: "Active", variant: "default", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
}

function formatTimeSlot(start?: string, end?: string) {
  if (!start && !end) return "Not set";
  const fmt = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " " + date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };
  if (start && end) return `${fmt(start)} - ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return `Until ${fmt(end!)}`;
}

export default function TeacherQuizzesPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const staffId = session?.staffId || "";
  const { data: assignments = [] } = useTeacherAssignments(staffId);
  const { quizzes, createQuiz, deleteQuiz, togglePublish, isPending } = useTeacherQuizzes(staffId);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  const [form, setForm] = useState({
    className: "", section: "", subject: "", title: "", instructions: "",
    timeLimitMinutes: 30, passingMarks: 0,
    startDateTime: "", endDateTime: "",
  });
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const totalMarks = useMemo(() => questions.reduce((sum, q) => sum + q.marks, 0), [questions]);

  const resetWizard = () => {
    setWizardStep(1);
    setForm({ className: "", section: "", subject: "", title: "", instructions: "", timeLimitMinutes: 30, passingMarks: 0, startDateTime: "", endDateTime: "" });
    setQuestions([]);
  };

  const openWizard = () => {
    resetWizard();
    setWizardOpen(true);
  };

  const handleAssignmentSelect = (assignmentId: string) => {
    const a = assignments.find((x: any) => x.id === assignmentId);
    if (a) setForm(f => ({ ...f, className: a.className, section: a.section, subject: a.subject }));
  };

  const addQuestion = () => {
    setQuestions(q => [...q, { questionText: "", questionType: "mcq", options: ["", "", "", ""], correctAnswer: "", marks: 1 }]);
  };

  const updateQuestion = (idx: number, updates: Partial<QuizQuestion>) => {
    setQuestions(q => q.map((item, i) => i === idx ? { ...item, ...updates } : item));
  };

  const removeQuestion = (idx: number) => {
    setQuestions(q => q.filter((_, i) => i !== idx));
  };

  const canProceedStep1 = form.title && form.className;
  const canProceedStep2 = questions.length > 0 && questions.every(q => q.questionText && q.correctAnswer);

  const handleSubmit = async (publish: boolean) => {
    const computedTotal = questions.reduce((sum, q) => sum + q.marks, 0);
    try {
      await createQuiz({
        ...form,
        staffId,
        teacherName: session?.name || "",
        totalMarks: computedTotal,
        passingMarks: form.passingMarks || Math.ceil(computedTotal * 0.4),
        questions,
        isPublished: publish,
      });
      toast({ title: publish ? "Quiz created & published" : "Quiz saved as draft" });
      setWizardOpen(false);
      resetWizard();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleTogglePublish = async (quizId: string) => {
    try {
      await togglePublish(quizId);
      toast({ title: "Quiz publish status updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quiz?")) return;
    try {
      await deleteQuiz(id);
      toast({ title: "Quiz deleted" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <ModuleLayout module="curriculum" navItems={teacherNavItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">My Quizzes</h1>
            <p className="text-muted-foreground">Create and manage quizzes for your classes</p>
          </div>
          <Button onClick={openWizard} data-testid="button-create-quiz">
            <Plus className="w-4 h-4 mr-2" /> Create New Quiz
          </Button>
        </div>

        {quizzes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No quizzes yet. Click "Create New Quiz" to get started.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Class/Section</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Time Slot</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizzes.map((quiz: any) => {
                    const status = getQuizStatus(quiz);
                    return (
                      <TableRow key={quiz.id} data-testid={`row-quiz-${quiz.id}`}>
                        <TableCell className="font-medium" data-testid={`text-quiz-title-${quiz.id}`}>{quiz.title}</TableCell>
                        <TableCell>{quiz.className} - {quiz.section}</TableCell>
                        <TableCell>{quiz.subject}</TableCell>
                        <TableCell>{quiz.questions?.length || 0}</TableCell>
                        <TableCell>{quiz.totalMarks}</TableCell>
                        <TableCell className="text-xs">{formatTimeSlot(quiz.startDateTime, quiz.endDateTime)}</TableCell>
                        <TableCell>
                          <Badge className={status.color} data-testid={`badge-status-${quiz.id}`}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/curriculum/teacher-quiz-results?quiz=${quiz.id}`)}
                              data-testid={`button-view-attempts-${quiz.id}`}
                            >
                              <BarChart3 className="w-3 h-3 mr-1" /> Attempts
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTogglePublish(quiz.id)}
                              data-testid={`button-toggle-quiz-${quiz.id}`}
                            >
                              {quiz.isPublished ? <><EyeOff className="w-3 h-3 mr-1" /> Unpublish</> : <><Eye className="w-3 h-3 mr-1" /> Publish</>}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(quiz.id)}
                              data-testid={`button-delete-quiz-${quiz.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={wizardOpen} onOpenChange={(open) => { if (!open) setWizardOpen(false); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    wizardStep === step
                      ? "bg-primary text-primary-foreground"
                      : wizardStep > step
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                  }`} data-testid={`wizard-step-indicator-${step}`}>
                    {wizardStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                  </div>
                  <span className={`text-sm hidden sm:inline ${wizardStep === step ? "font-medium" : "text-muted-foreground"}`}>
                    {step === 1 ? "Settings" : step === 2 ? "Questions" : "Review"}
                  </span>
                  {step < 3 && <div className="flex-1 h-px bg-border" />}
                </div>
              ))}
            </div>

            {wizardStep === 1 && (
              <div className="space-y-4" data-testid="wizard-step-1">
                <div className="space-y-2">
                  <Label>Assignment (Class/Section/Subject)</Label>
                  <Select onValueChange={handleAssignmentSelect}>
                    <SelectTrigger data-testid="select-quiz-assignment"><SelectValue placeholder="Select assignment" /></SelectTrigger>
                    <SelectContent>
                      {assignments.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>{a.className} - {a.section} ({a.subject})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quiz Title</Label>
                  <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 5 Assessment" data-testid="input-quiz-title" />
                </div>
                <div className="space-y-2">
                  <Label>Instructions (optional)</Label>
                  <Textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Instructions for students..." data-testid="input-quiz-instructions" />
                </div>
                <div className="space-y-2">
                  <Label>Time Limit (minutes)</Label>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => setForm(f => ({ ...f, timeLimitMinutes: Math.max(5, f.timeLimitMinutes - 5) }))} data-testid="button-time-decrease">
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input type="number" className="w-24 text-center" value={form.timeLimitMinutes} onChange={e => setForm(f => ({ ...f, timeLimitMinutes: Math.max(1, parseInt(e.target.value) || 30) }))} data-testid="input-quiz-time" />
                    <Button size="icon" variant="outline" onClick={() => setForm(f => ({ ...f, timeLimitMinutes: f.timeLimitMinutes + 5 }))} data-testid="button-time-increase">
                      <Plus className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date/Time</Label>
                    <Input type="datetime-local" value={form.startDateTime} onChange={e => setForm(f => ({ ...f, startDateTime: e.target.value }))} data-testid="input-quiz-start" />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date/Time</Label>
                    <Input type="datetime-local" value={form.endDateTime} onChange={e => setForm(f => ({ ...f, endDateTime: e.target.value }))} data-testid="input-quiz-end" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Passing Marks (0 = auto 40%)</Label>
                  <Input type="number" value={form.passingMarks} onChange={e => setForm(f => ({ ...f, passingMarks: parseInt(e.target.value) || 0 }))} data-testid="input-quiz-passing" />
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={() => setWizardStep(2)} disabled={!canProceedStep1} data-testid="button-next-step-1">
                    Next: Add Questions <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4" data-testid="wizard-step-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <Label className="text-base font-semibold">Questions ({questions.length})</Label>
                    <p className="text-sm text-muted-foreground">Total marks: {totalMarks}</p>
                  </div>
                  <Button size="sm" onClick={addQuestion} data-testid="button-add-question">
                    <Plus className="w-3 h-3 mr-1" /> Add Question
                  </Button>
                </div>

                {questions.length === 0 && (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No questions added yet. Click "Add Question" to start.
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <Card key={idx} data-testid={`card-question-${idx}`}>
                      <CardContent className="pt-6 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <Label className="font-medium">Question {idx + 1}</Label>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{q.marks} mark{q.marks !== 1 ? "s" : ""}</Badge>
                            <Button size="icon" variant="ghost" onClick={() => removeQuestion(idx)} data-testid={`button-remove-question-${idx}`}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <Input value={q.questionText} onChange={e => updateQuestion(idx, { questionText: e.target.value })} placeholder="Enter question text" data-testid={`input-question-${idx}`} />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Type</Label>
                            <Select value={q.questionType} onValueChange={(v: any) => {
                              const opts = v === "truefalse" ? ["True", "False"] : v === "mcq" ? ["", "", "", ""] : [];
                              updateQuestion(idx, { questionType: v, options: opts, correctAnswer: "" });
                            }}>
                              <SelectTrigger data-testid={`select-type-${idx}`}><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mcq">MCQ</SelectItem>
                                <SelectItem value="truefalse">True/False</SelectItem>
                                <SelectItem value="short">Short Answer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Marks</Label>
                            <Input type="number" value={q.marks} onChange={e => updateQuestion(idx, { marks: Math.max(1, parseInt(e.target.value) || 1) })} min={1} data-testid={`input-marks-${idx}`} />
                          </div>
                        </div>

                        {q.questionType === "mcq" && (
                          <div className="space-y-2">
                            <Label className="text-xs">Options (select the correct one)</Label>
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${idx}`}
                                  checked={q.correctAnswer === opt && opt !== ""}
                                  onChange={() => updateQuestion(idx, { correctAnswer: opt })}
                                  className="accent-primary"
                                  data-testid={`radio-correct-${idx}-${oi}`}
                                />
                                <Input
                                  value={opt}
                                  onChange={e => {
                                    const newOpts = [...q.options];
                                    const wasCorrect = q.correctAnswer === newOpts[oi];
                                    newOpts[oi] = e.target.value;
                                    updateQuestion(idx, { options: newOpts, ...(wasCorrect ? { correctAnswer: e.target.value } : {}) });
                                  }}
                                  placeholder={`Option ${oi + 1}`}
                                  data-testid={`input-option-${idx}-${oi}`}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {q.questionType === "truefalse" && (
                          <div className="space-y-2">
                            <Label className="text-xs">Correct Answer</Label>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name={`tf-${idx}`} checked={q.correctAnswer === "True"} onChange={() => updateQuestion(idx, { correctAnswer: "True" })} className="accent-primary" data-testid={`radio-true-${idx}`} />
                                <span className="text-sm">True</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name={`tf-${idx}`} checked={q.correctAnswer === "False"} onChange={() => updateQuestion(idx, { correctAnswer: "False" })} className="accent-primary" data-testid={`radio-false-${idx}`} />
                                <span className="text-sm">False</span>
                              </label>
                            </div>
                          </div>
                        )}

                        {q.questionType === "short" && (
                          <div className="space-y-1">
                            <Label className="text-xs">Model Answer</Label>
                            <Textarea value={q.correctAnswer} onChange={e => updateQuestion(idx, { correctAnswer: e.target.value })} placeholder="Enter the model/expected answer" data-testid={`input-answer-${idx}`} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setWizardStep(1)} data-testid="button-back-step-2">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    Running total: <span className="font-semibold">{totalMarks}</span> marks
                  </div>
                  <Button onClick={() => setWizardStep(3)} disabled={!canProceedStep2} data-testid="button-next-step-2">
                    Next: Review <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {wizardStep === 3 && (
              <div className="space-y-4" data-testid="wizard-step-3">
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <h3 className="font-semibold text-lg" data-testid="text-review-title">{form.title}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Class:</span> {form.className} - {form.section}</div>
                      <div><span className="text-muted-foreground">Subject:</span> {form.subject}</div>
                      <div><span className="text-muted-foreground">Time Limit:</span> {form.timeLimitMinutes} minutes</div>
                      <div><span className="text-muted-foreground">Total Marks:</span> {totalMarks}</div>
                      <div><span className="text-muted-foreground">Passing Marks:</span> {form.passingMarks || Math.ceil(totalMarks * 0.4)}</div>
                      <div><span className="text-muted-foreground">Questions:</span> {questions.length}</div>
                    </div>
                    {form.startDateTime && (
                      <div className="text-sm"><span className="text-muted-foreground">Start:</span> {new Date(form.startDateTime).toLocaleString()}</div>
                    )}
                    {form.endDateTime && (
                      <div className="text-sm"><span className="text-muted-foreground">End:</span> {new Date(form.endDateTime).toLocaleString()}</div>
                    )}
                    {form.instructions && (
                      <div className="text-sm"><span className="text-muted-foreground">Instructions:</span> {form.instructions}</div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">Questions Preview</Label>
                  {questions.map((q, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex-1">
                            <p className="font-medium text-sm">Q{idx + 1}. {q.questionText}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <Badge variant="secondary" className="text-xs">{q.questionType === "mcq" ? "MCQ" : q.questionType === "truefalse" ? "True/False" : "Short Answer"}</Badge>
                              <span className="text-xs text-muted-foreground">{q.marks} mark{q.marks !== 1 ? "s" : ""}</span>
                            </div>
                            {q.questionType === "mcq" && (
                              <div className="mt-2 space-y-1">
                                {q.options.map((opt, oi) => (
                                  <p key={oi} className={`text-xs ${opt === q.correctAnswer ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}`}>
                                    {String.fromCharCode(65 + oi)}. {opt} {opt === q.correctAnswer ? "(correct)" : ""}
                                  </p>
                                ))}
                              </div>
                            )}
                            {q.questionType === "truefalse" && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">Answer: {q.correctAnswer}</p>
                            )}
                            {q.questionType === "short" && (
                              <p className="text-xs text-muted-foreground mt-1">Model answer: {q.correctAnswer}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setWizardStep(2)} data-testid="button-back-step-3">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" onClick={() => handleSubmit(false)} disabled={isPending} data-testid="button-save-draft">
                      <ClipboardList className="w-4 h-4 mr-1" /> {isPending ? "Saving..." : "Save as Draft"}
                    </Button>
                    <Button onClick={() => handleSubmit(true)} disabled={isPending} data-testid="button-save-publish">
                      <CheckCircle className="w-4 h-4 mr-1" /> {isPending ? "Publishing..." : "Save & Publish"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}
