import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { ModuleLayout } from "@/components/layout/module-layout";
import { teacherNavItems } from "@/pages/curriculum/teacher-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, BookOpen, Eye, Trash2, Edit, CheckCircle2, Clock, XCircle, Star, FileText, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const teacherAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("teacher_token") || localStorage.getItem("emblazers_token")}` });

const SUBMISSION_TYPE_LABELS: Record<string, string> = { text: "Text Answer", file: "File Upload", both: "Text + File" };

function statusBadge(status: string, isLate?: number) {
  if (status === "graded") return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Graded</Badge>;
  if (status === "submitted") return <Badge className={isLate ? "bg-orange-100 text-orange-800 hover:bg-orange-100" : "bg-green-100 text-green-800 hover:bg-green-100"}>{isLate ? "Late" : "Submitted"}</Badge>;
  if (status === "late") return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Late</Badge>;
  return <Badge variant="secondary">Not Submitted</Badge>;
}

function hwStatusBadge(hw: any) {
  const isPast = new Date(hw.dueDate) < new Date();
  if (hw.status === "closed") return <Badge variant="destructive">Closed</Badge>;
  if (isPast) return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Expired</Badge>;
  return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Open</Badge>;
}

type FormState = {
  assignmentKey: string;
  title: string;
  description: string;
  attachmentUrl: string;
  submissionType: string;
  totalMarks: string;
  dueDate: string;
};

const emptyForm = (): FormState => ({ assignmentKey: "", title: "", description: "", attachmentUrl: "", submissionType: "both", totalMarks: "", dueDate: "" });

export default function TeacherHomework() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [gradeTarget, setGradeTarget] = useState<any>(null);
  const [gradeForm, setGradeForm] = useState({ marks: "", feedback: "" });
  const [form, setForm] = useState<FormState>(emptyForm());
  const [viewSubmission, setViewSubmission] = useState<any>(null);

  const { data: myAssignments = [], isLoading: assignmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/teacher/my-assignments"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/my-assignments", { headers: teacherAuthHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: homeworkList = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/teacher/homework"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/homework", { headers: teacherAuthHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: submissions = [], isLoading: subsLoading } = useQuery<any[]>({
    queryKey: ["/api/teacher/homework", detailId, "submissions"],
    enabled: !!detailId,
    queryFn: async () => {
      const res = await fetch(`/api/teacher/homework/${detailId}/submissions`, { headers: teacherAuthHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const selectedHw = detailId ? homeworkList.find((h: any) => h.id === detailId) : null;

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/teacher/homework", { method: "POST", headers: { ...teacherAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      return json;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/teacher/homework"] }); setCreateOpen(false); setForm(emptyForm()); toast({ title: "Assignment Created", description: "Students in the class will see it immediately." }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/teacher/homework/${id}`, { method: "PATCH", headers: { ...teacherAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      return json;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/teacher/homework"] }); setEditTarget(null); toast({ title: "Updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/teacher/homework/${id}`, { method: "DELETE", headers: teacherAuthHeaders() });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/teacher/homework"] }); setDeleteId(null); toast({ title: "Deleted" }); },
    onError: () => toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }),
  });

  const gradeMutation = useMutation({
    mutationFn: async ({ id, marks, feedback }: { id: number; marks: string; feedback: string }) => {
      const res = await fetch(`/api/homework/submissions/${id}/grade`, { method: "PATCH", headers: { ...teacherAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ marks, feedback }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/homework", detailId, "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/homework"] });
      setGradeTarget(null);
      setGradeForm({ marks: "", feedback: "" });
      toast({ title: "Graded", description: "Marks and feedback saved." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const assignmentOptions = myAssignments.map((a: any) => ({
    key: `${a.className}||${a.section}||${a.subject}`,
    label: `${a.className} — Section ${a.section} — ${a.subject}`,
    className: a.className,
    section: a.section,
    subject: a.subject,
  }));

  function openCreate() {
    setForm(emptyForm());
    setCreateOpen(true);
  }

  function openEdit(hw: any) {
    const key = `${hw.className}||${hw.sectionName || ""}||${hw.subjectName}`;
    setForm({ assignmentKey: key, title: hw.title, description: hw.description, attachmentUrl: hw.attachmentUrl || "", submissionType: hw.submissionType || "both", totalMarks: hw.totalMarks ? String(hw.totalMarks) : "", dueDate: hw.dueDate });
    setEditTarget(hw);
  }

  function buildPayload() {
    const opt = assignmentOptions.find(o => o.key === form.assignmentKey);
    return {
      title: form.title,
      description: form.description,
      subjectName: opt?.subject || "",
      className: opt?.className || "",
      sectionName: opt?.section || "",
      dueDate: form.dueDate,
      attachmentUrl: form.attachmentUrl || null,
      submissionType: form.submissionType,
      totalMarks: form.totalMarks ? Number(form.totalMarks) : null,
    };
  }

  function handleCreate() {
    if (!form.assignmentKey || !form.title || !form.description || !form.dueDate) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    createMutation.mutate(buildPayload());
  }

  function handleUpdate() {
    if (!editTarget) return;
    if (!form.title || !form.description || !form.dueDate) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: editTarget.id, data: buildPayload() });
  }

  const submittedCount = submissions.filter((s: any) => s.status !== "not_submitted").length;
  const gradedCount = submissions.filter((s: any) => s.status === "graded").length;
  const lateCount = submissions.filter((s: any) => s.isLate || s.status === "late").length;

  return (
    <ModuleLayout module="curriculum" navItems={teacherNavItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">My Assignments</h1>
            <p className="text-muted-foreground text-sm mt-1">Assignments you've created for your classes</p>
          </div>
          <Button onClick={openCreate} data-testid="button-create-assignment">
            <Plus className="w-4 h-4 mr-2" />Create Assignment
          </Button>
        </div>

        {isLoading || assignmentsLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="pt-4 space-y-2"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardContent></Card>)}</div>
        ) : myAssignments.length === 0 ? (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-12 text-center space-y-2">
              <BookOpen className="w-10 h-10 text-amber-500 mx-auto" />
              <p className="font-semibold text-amber-700 dark:text-amber-400">No classes assigned to you yet</p>
              <p className="text-sm text-muted-foreground">Ask the admin to assign you to a class from Teacher Assignments.</p>
            </CardContent>
          </Card>
        ) : homeworkList.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-muted p-4"><BookOpen className="w-8 h-8 text-muted-foreground" /></div>
              <p className="font-semibold">No assignments yet</p>
              <p className="text-sm text-muted-foreground">Create your first assignment for your students.</p>
              <Button size="sm" onClick={openCreate} data-testid="button-empty-create"><Plus className="w-4 h-4 mr-1" />Create Assignment</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {homeworkList.map((hw: any) => {
              const totalSubs = hw.submissionCount || 0;
              return (
                <Card key={hw.id} data-testid={`card-hw-${hw.id}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">{hw.title}</p>
                          {hwStatusBadge(hw)}
                          <Badge variant="outline" className="text-xs">{SUBMISSION_TYPE_LABELS[hw.submissionType || "both"]}</Badge>
                          {hw.totalMarks && <Badge variant="secondary" className="text-xs">Total: {hw.totalMarks} marks</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{hw.className}{hw.sectionName ? ` · Section ${hw.sectionName}` : ""} · {hw.subjectName}</p>
                        <p className={`text-xs font-medium ${new Date(hw.dueDate) < new Date() ? "text-red-600" : "text-green-600"}`}>
                          Deadline: {new Date(hw.dueDate).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <Badge variant="outline" className="text-xs">{totalSubs} submitted</Badge>
                        <Button size="sm" variant="outline" onClick={() => setDetailId(hw.id)} data-testid={`button-view-${hw.id}`}>
                          <Eye className="w-3 h-3 mr-1" />Submissions
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(hw)} data-testid={`button-edit-${hw.id}`}>
                          <Edit className="w-3 h-3 mr-1" />Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => setDeleteId(hw.id)} data-testid={`button-delete-${hw.id}`}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={v => { if (!v) { setCreateOpen(false); setForm(emptyForm()); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Class / Subject *</Label>
              <Select value={form.assignmentKey} onValueChange={v => setForm(f => ({ ...f, assignmentKey: v }))}>
                <SelectTrigger data-testid="select-assignment-class"><SelectValue placeholder="Select your class & subject" /></SelectTrigger>
                <SelectContent>
                  {assignmentOptions.map(o => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 5 Exercise" data-testid="input-hw-title" /></div>
            <div><Label>Instructions / Description *</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe what students need to do..." data-testid="input-hw-description" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Submission Type</Label>
                <Select value={form.submissionType} onValueChange={v => setForm(f => ({ ...f, submissionType: v }))}>
                  <SelectTrigger data-testid="select-submission-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Answer Only</SelectItem>
                    <SelectItem value="file">File Upload Only</SelectItem>
                    <SelectItem value="both">Text + File Upload</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Total Marks</Label><Input type="number" min="1" value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))} placeholder="e.g. 20" data-testid="input-total-marks" /></div>
            </div>
            <div><Label>Deadline (date & time) *</Label><Input type="datetime-local" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} data-testid="input-hw-deadline" /></div>
            <div><Label>Attachment URL <span className="text-muted-foreground text-xs">(optional)</span></Label><Input value={form.attachmentUrl} onChange={e => setForm(f => ({ ...f, attachmentUrl: e.target.value }))} placeholder="https://..." data-testid="input-hw-attachment" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setForm(emptyForm()); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-hw-submit">
              {createMutation.isPending ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={v => { if (!v) setEditTarget(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Assignment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} data-testid="input-edit-title" /></div>
            <div><Label>Instructions / Description *</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} data-testid="input-edit-description" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Submission Type</Label>
                <Select value={form.submissionType} onValueChange={v => setForm(f => ({ ...f, submissionType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Answer Only</SelectItem>
                    <SelectItem value="file">File Upload Only</SelectItem>
                    <SelectItem value="both">Text + File Upload</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Total Marks</Label><Input type="number" min="1" value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: e.target.value }))} data-testid="input-edit-total-marks" /></div>
            </div>
            <div><Label>Deadline (date & time) *</Label><Input type="datetime-local" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} data-testid="input-edit-deadline" /></div>
            <div><Label>Attachment URL</Label><Input value={form.attachmentUrl} onChange={e => setForm(f => ({ ...f, attachmentUrl: e.target.value }))} data-testid="input-edit-attachment" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending} data-testid="button-edit-submit">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>This will delete the assignment and all student submissions. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submissions Dialog */}
      <Dialog open={!!detailId} onOpenChange={v => { if (!v) { setDetailId(null); setGradeTarget(null); } }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedHw?.title} — Submissions</DialogTitle>
          </DialogHeader>
          {detailId && (
            <>
              <div className="flex gap-4 flex-wrap text-sm mb-2">
                <div className="flex items-center gap-1.5 text-muted-foreground"><CheckCircle2 className="w-4 h-4 text-green-500" />{submittedCount} submitted</div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><Star className="w-4 h-4 text-purple-500" />{gradedCount} graded</div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-4 h-4 text-orange-500" />{lateCount} late</div>
              </div>

              {subsLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Answer</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No submissions yet.</TableCell></TableRow>
                      ) : submissions.map((sub: any) => (
                        <TableRow key={sub.id} data-testid={`row-submission-${sub.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{sub.studentName || sub.studentId}</p>
                              <p className="text-xs text-muted-foreground">{sub.studentId}</p>
                            </div>
                          </TableCell>
                          <TableCell>{statusBadge(sub.status, sub.isLate)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "—"}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {sub.answerText && (
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setViewSubmission(sub)} data-testid={`button-view-answer-${sub.id}`}>
                                  <MessageSquare className="w-3 h-3 mr-1" />Text
                                </Button>
                              )}
                              {sub.submittedFileUrl && (
                                <a href={sub.submittedFileUrl} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" data-testid={`button-view-file-${sub.id}`}>
                                    <FileText className="w-3 h-3 mr-1" />File
                                  </Button>
                                </a>
                              )}
                              {!sub.answerText && !sub.submittedFileUrl && <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {sub.marks ? (
                              <span className="text-sm font-medium">{sub.marks}{selectedHw?.totalMarks ? `/${selectedHw.totalMarks}` : ""}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={sub.status === "graded" ? "outline" : "default"}
                              className="h-7 text-xs"
                              onClick={() => { setGradeTarget(sub); setGradeForm({ marks: sub.marks || "", feedback: sub.feedback || "" }); }}
                              data-testid={`button-grade-${sub.id}`}
                            >
                              <Star className="w-3 h-3 mr-1" />{sub.status === "graded" ? "Update" : "Grade"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View Submission Text Dialog */}
      <Dialog open={!!viewSubmission} onOpenChange={v => !v && setViewSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Student Answer — {viewSubmission?.studentName}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {viewSubmission?.answerText && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Text Answer</p>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">{viewSubmission.answerText}</div>
              </div>
            )}
            {viewSubmission?.feedback && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Your Feedback</p>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">{viewSubmission.feedback}</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSubmission(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={!!gradeTarget} onOpenChange={v => { if (!v) { setGradeTarget(null); setGradeForm({ marks: "", feedback: "" }); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">{gradeTarget?.studentName || gradeTarget?.studentId}</p>
              {gradeTarget?.answerText && <p className="text-xs text-muted-foreground mt-1 line-clamp-3 bg-muted p-2 rounded">{gradeTarget.answerText}</p>}
            </div>
            <div>
              <Label>Marks {selectedHw?.totalMarks ? `(out of ${selectedHw.totalMarks})` : ""}</Label>
              <Input
                type="number"
                min="0"
                max={selectedHw?.totalMarks || undefined}
                value={gradeForm.marks}
                onChange={e => setGradeForm(f => ({ ...f, marks: e.target.value }))}
                placeholder={selectedHw?.totalMarks ? `0–${selectedHw.totalMarks}` : "Enter marks"}
                data-testid="input-marks"
              />
            </div>
            <div>
              <Label>Feedback <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                value={gradeForm.feedback}
                onChange={e => setGradeForm(f => ({ ...f, feedback: e.target.value }))}
                rows={3}
                placeholder="Write feedback for the student..."
                data-testid="input-feedback"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setGradeTarget(null); setGradeForm({ marks: "", feedback: "" }); }}>Cancel</Button>
            <Button
              onClick={() => gradeTarget && gradeMutation.mutate({ id: gradeTarget.id, marks: gradeForm.marks, feedback: gradeForm.feedback })}
              disabled={gradeMutation.isPending}
              data-testid="button-save-grade"
            >
              {gradeMutation.isPending ? "Saving..." : "Save Grade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
