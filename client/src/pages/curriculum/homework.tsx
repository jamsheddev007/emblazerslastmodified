import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ModuleLayout } from "@/components/layout/module-layout";
import { curriculumNavItems } from "./curriculum-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, BookOpen, GraduationCap, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { HomeworkAssignment, HomeworkSubmission } from "@shared/schema";

type HWWithMeta = HomeworkAssignment & { submissionCount: number };
type HWDetail = HomeworkAssignment & { submissions: HomeworkSubmission[]; submissionCount: number };

const CLASS_OPTIONS = ["Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"];

function statusBadge(status: string) {
  const map: Record<string, string> = { submitted: "bg-green-100 text-green-800", late: "bg-orange-100 text-orange-800", graded: "bg-purple-100 text-purple-800", not_submitted: "bg-gray-100 text-gray-600" };
  const label: Record<string, string> = { submitted: "Submitted", late: "Late", graded: "Graded", not_submitted: "Not Submitted" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || map.not_submitted}`}>{label[status] || status}</span>;
}

export default function CurriculumHomework() {
  const { toast } = useToast();
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<HWWithMeta | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailHw, setDetailHw] = useState<HWWithMeta | null>(null);
  const [gradeTarget, setGradeTarget] = useState<HomeworkSubmission | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");

  const [form, setForm] = useState({ title: "", description: "", subjectName: "", className: "", sectionName: "", assignedByStaffId: "", dueDate: "", attachmentUrl: "" });

  const { data: homeworkList = [], isLoading } = useQuery<HWWithMeta[]>({ queryKey: ["/api/homework"] });
  const { data: staffList = [] } = useQuery<any[]>({ queryKey: ["/api/staff"] });
  const { data: detail } = useQuery<HWDetail>({ queryKey: ["/api/homework", detailHw?.id], enabled: !!detailHw?.id });

  const teachers = (staffList as any[]).filter((s: any) => s.staffType === "Teacher" || s.designation?.toLowerCase().includes("teacher") || true);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/homework", data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/homework"] }); setCreateOpen(false); toast({ title: "Homework Created", description: "Homework assignment created successfully." }); },
    onError: () => toast({ title: "Error", description: "Failed to create homework.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiRequest("PATCH", `/api/homework/${id}`, data).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/homework"] }); setEditItem(null); toast({ title: "Updated", description: "Homework updated successfully." }); },
    onError: () => toast({ title: "Error", description: "Failed to update homework.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/homework/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/homework"] }); setDeleteId(null); toast({ title: "Deleted", description: "Homework deleted." }); },
    onError: () => toast({ title: "Error", description: "Failed to delete homework.", variant: "destructive" }),
  });

  const gradeMutation = useMutation({
    mutationFn: ({ id, grade, feedback }: { id: number; grade: string; feedback: string }) => apiRequest("PATCH", `/api/homework/submissions/${id}/grade`, { grade, feedback }).then(r => r.json()),
    onSuccess: () => { if (detailHw) queryClient.invalidateQueries({ queryKey: ["/api/homework", detailHw.id] }); setGradeTarget(null); setGradeValue(""); setFeedbackValue(""); toast({ title: "Graded", description: "Submission graded successfully." }); },
    onError: () => toast({ title: "Error", description: "Failed to grade submission.", variant: "destructive" }),
  });

  const filtered = homeworkList.filter(hw =>
    (!filterClass || hw.className === filterClass) &&
    (!filterSection || hw.sectionName?.toLowerCase().includes(filterSection.toLowerCase())) &&
    (!filterSubject || hw.subjectName?.toLowerCase().includes(filterSubject.toLowerCase()))
  );

  const isPastDue = (dueDate: string) => new Date(dueDate) < new Date();

  function openCreate() {
    setForm({ title: "", description: "", subjectName: "", className: "", sectionName: "", assignedByStaffId: "", dueDate: "", attachmentUrl: "" });
    setCreateOpen(true);
  }

  function openEdit(hw: HWWithMeta) {
    setForm({ title: hw.title, description: hw.description, subjectName: hw.subjectName, className: hw.className, sectionName: hw.sectionName || "", assignedByStaffId: String(hw.assignedByStaffId), dueDate: hw.dueDate, attachmentUrl: hw.attachmentUrl || "" });
    setEditItem(hw);
  }

  function handleSubmit() {
    const payload = { ...form, assignedByStaffId: Number(form.assignedByStaffId) };
    if (editItem) updateMutation.mutate({ id: editItem.id, data: payload });
    else createMutation.mutate(payload);
  }

  const isOpen = createOpen || !!editItem;
  const formTitle = editItem ? "Edit Homework" : "Create Homework";

  return (
    <ModuleLayout module="curriculum" navItems={curriculumNavItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Homework Assignments</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and track homework across all classes</p>
          </div>
          <Button onClick={openCreate} data-testid="button-create-homework"><Plus className="w-4 h-4 mr-2" />Create Homework</Button>
        </div>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="min-w-[140px]">
                <Label className="text-xs">Class</Label>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger data-testid="filter-class"><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Classes</SelectItem>
                    {CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[120px]">
                <Label className="text-xs">Section</Label>
                <Input placeholder="e.g. A" value={filterSection} onChange={e => setFilterSection(e.target.value)} data-testid="filter-section" />
              </div>
              <div className="min-w-[140px]">
                <Label className="text-xs">Subject</Label>
                <Input placeholder="e.g. Math" value={filterSubject} onChange={e => setFilterSubject(e.target.value)} data-testid="filter-subject" />
              </div>
              {(filterClass || filterSection || filterSubject) && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterClass(""); setFilterSection(""); setFilterSubject(""); }}>Clear</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardContent className="pt-4 space-y-2"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-full" /></CardContent></Card>)}
          </div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-muted p-4"><BookOpen className="w-8 h-8 text-muted-foreground" /></div>
            <p className="font-semibold">No homework found</p>
            <p className="text-sm text-muted-foreground">Create a homework assignment to get started.</p>
            <Button size="sm" onClick={openCreate} data-testid="button-empty-create"><Plus className="w-4 h-4 mr-1" />Create Homework</Button>
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(hw => (
              <Card key={hw.id} className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`card-homework-${hw.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">{hw.title}</CardTitle>
                    <Badge variant="secondary" className="shrink-0 text-xs">{hw.subjectName}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2" onClick={() => setDetailHw(hw)}>
                  <p className="text-xs text-muted-foreground">{hw.className}{hw.sectionName ? ` — Section ${hw.sectionName}` : ""}</p>
                  <p className="text-xs text-muted-foreground">By: {hw.assignedByName || "—"}</p>
                  <p className={`text-xs font-medium ${isPastDue(hw.dueDate) ? "text-red-600" : "text-green-600"}`}>Due: {hw.dueDate}</p>
                  <p className="text-xs text-muted-foreground">{hw.submissionCount} submitted</p>
                </CardContent>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); openEdit(hw); }} data-testid={`button-edit-homework-${hw.id}`}><Edit className="w-3 h-3 mr-1" />Edit</Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={e => { e.stopPropagation(); setDeleteId(hw.id); }} data-testid={`button-delete-homework-${hw.id}`}><Trash2 className="w-3 h-3 mr-1" />Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={v => { if (!v) { setCreateOpen(false); setEditItem(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{formTitle}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} data-testid="input-hw-title" /></div>
            <div><Label>Subject *</Label><Input value={form.subjectName} onChange={e => setForm(f => ({ ...f, subjectName: e.target.value }))} data-testid="input-hw-subject" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Class *</Label>
                <Select value={form.className} onValueChange={v => setForm(f => ({ ...f, className: v }))}>
                  <SelectTrigger data-testid="select-hw-class"><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Section</Label><Input value={form.sectionName} onChange={e => setForm(f => ({ ...f, sectionName: e.target.value }))} placeholder="e.g. A" data-testid="input-hw-section" /></div>
            </div>
            <div><Label>Assign To Teacher *</Label>
              <Select value={form.assignedByStaffId} onValueChange={v => setForm(f => ({ ...f, assignedByStaffId: v }))}>
                <SelectTrigger data-testid="select-hw-teacher"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>{teachers.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Due Date *</Label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} data-testid="input-hw-duedate" /></div>
            <div><Label>Description *</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} data-testid="input-hw-description" /></div>
            <div><Label>Attachment URL</Label><Input value={form.attachmentUrl} onChange={e => setForm(f => ({ ...f, attachmentUrl: e.target.value }))} placeholder="https://..." data-testid="input-hw-attachment" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditItem(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-hw-submit">
              {editItem ? "Save Changes" : "Create Homework"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Homework?</AlertDialogTitle><AlertDialogDescription>This will also delete all submissions. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail / Submissions View */}
      <Dialog open={!!detailHw} onOpenChange={v => !v && setDetailHw(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{detailHw?.title} — Submissions</DialogTitle></DialogHeader>
          {!detail ? <div className="py-8 text-center text-muted-foreground">Loading...</div> : (
            <div className="space-y-4">
              <div className="flex gap-3 flex-wrap text-sm">
                <Badge variant="secondary">{detail.subjectName}</Badge>
                <span className="text-muted-foreground">{detail.className}{detail.sectionName ? ` · ${detail.sectionName}` : ""}</span>
                <span className={isPastDue(detail.dueDate) ? "text-red-600 font-medium" : "text-green-600 font-medium"}>Due: {detail.dueDate}</span>
                <span className="text-muted-foreground">{detail.submissionCount} submitted</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.submissions.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No submissions yet.</TableCell></TableRow>
                    ) : detail.submissions.map(sub => (
                      <TableRow key={sub.id} data-testid={`row-submission-${sub.id}`}>
                        <TableCell>{sub.studentName || sub.studentId}</TableCell>
                        <TableCell className="text-xs">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "—"}</TableCell>
                        <TableCell>{statusBadge(sub.status)}</TableCell>
                        <TableCell>{sub.grade || "—"}</TableCell>
                        <TableCell>
                          {sub.status !== "not_submitted" && (
                            <Popover open={gradeTarget?.id === sub.id} onOpenChange={v => { if (!v) setGradeTarget(null); }}>
                              <PopoverTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => { setGradeTarget(sub); setGradeValue(sub.grade || ""); setFeedbackValue(sub.feedback || ""); }} data-testid={`button-grade-${sub.id}`}>
                                  <Star className="w-3 h-3 mr-1" />Grade
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-60 space-y-2">
                                <Label className="text-xs">Grade</Label>
                                <Input value={gradeValue} onChange={e => setGradeValue(e.target.value)} placeholder="A+, 95, etc." data-testid="input-grade" />
                                <Label className="text-xs">Feedback</Label>
                                <Textarea value={feedbackValue} onChange={e => setFeedbackValue(e.target.value)} rows={2} placeholder="Optional feedback" data-testid="input-feedback" />
                                <Button size="sm" className="w-full" onClick={() => gradeMutation.mutate({ id: sub.id, grade: gradeValue, feedback: feedbackValue })} disabled={gradeMutation.isPending} data-testid="button-save-grade">Save Grade</Button>
                              </PopoverContent>
                            </Popover>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
