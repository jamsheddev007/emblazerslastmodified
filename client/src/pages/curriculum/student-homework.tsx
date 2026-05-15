import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { ModuleLayout } from "@/components/layout/module-layout";
import { studentNavItems } from "./student-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Clock, CheckCircle2, XCircle, Star, Paperclip, FileText, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("student_token") || localStorage.getItem("emblazers_token")}` });

const SUBMISSION_TYPE_LABELS: Record<string, string> = { text: "Text Answer", file: "File Upload", both: "Text + File" };

function isExpired(dueDate: string) {
  return new Date(dueDate) < new Date();
}

function AssignmentStatusBadge({ hw }: { hw: any }) {
  if (hw.submissionStatus === "graded") return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Graded</Badge>;
  if (hw.submissionStatus === "submitted") return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Submitted</Badge>;
  if (hw.submissionStatus === "late") return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Late Submitted</Badge>;
  if (hw.status === "closed" || isExpired(hw.dueDate)) return <Badge variant="destructive">Closed</Badge>;
  return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Pending</Badge>;
}

export default function StudentHomework() {
  const { toast } = useToast();
  const [submitTarget, setSubmitTarget] = useState<any>(null);
  const [detailTarget, setDetailTarget] = useState<any>(null);
  const [answerText, setAnswerText] = useState("");
  const [fileUrl, setFileUrl] = useState("");

  const { data: homeworkList = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/student-portal/homework"],
    queryFn: async () => {
      const res = await fetch("/api/student-portal/homework", { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const submitMutation = useMutation({
    mutationFn: async ({ id, answerText, submittedFileUrl }: { id: number; answerText: string; submittedFileUrl: string }) => {
      const res = await fetch(`/api/student-portal/homework/${id}/submit`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ answerText: answerText || undefined, submittedFileUrl: submittedFileUrl || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-portal/homework"] });
      setSubmitTarget(null);
      setAnswerText("");
      setFileUrl("");
      toast({ title: "Submitted!", description: "Your assignment has been submitted." });
    },
    onError: (e: any) => toast({ title: "Submission Failed", description: e.message || "Please try again.", variant: "destructive" }),
  });

  function openSubmit(hw: any) {
    setAnswerText("");
    setFileUrl("");
    setSubmitTarget(hw);
  }

  function handleSubmit() {
    if (!submitTarget) return;
    const type = submitTarget.submissionType || "both";
    if ((type === "text" || type === "both") && !answerText.trim()) {
      toast({ title: "Required", description: "Please write your text answer.", variant: "destructive" });
      return;
    }
    if ((type === "file" || type === "both") && !fileUrl.trim()) {
      toast({ title: "Required", description: "Please provide a file URL.", variant: "destructive" });
      return;
    }
    submitMutation.mutate({ id: submitTarget.id, answerText, submittedFileUrl: fileUrl });
  }

  const activeAssignments = homeworkList.filter(hw => hw.submissionStatus === "not_submitted" && !isExpired(hw.dueDate) && hw.status !== "closed");
  const closedAssignments = homeworkList.filter(hw => hw.submissionStatus === "not_submitted" && (isExpired(hw.dueDate) || hw.status === "closed"));
  const submittedAssignments = homeworkList.filter(hw => hw.submissionStatus !== "not_submitted");

  return (
    <ModuleLayout module="curriculum" navItems={studentNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">My Assignments</h1>
          <p className="text-muted-foreground text-sm mt-1">Your assigned work, submissions, and marks</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="pt-4 space-y-2"><Skeleton className="h-5 w-1/2" /><Skeleton className="h-4 w-1/3" /></CardContent></Card>)}</div>
        ) : homeworkList.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-muted p-4"><BookOpen className="w-8 h-8 text-muted-foreground" /></div>
              <p className="font-semibold">No assignments yet</p>
              <p className="text-sm text-muted-foreground">Your teacher hasn't assigned any work yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active / Pending */}
            {activeAssignments.length > 0 && (
              <div>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" />Pending ({activeAssignments.length})</h2>
                <div className="space-y-3">
                  {activeAssignments.map((hw: any) => (
                    <AssignmentCard key={hw.id} hw={hw} onSubmit={() => openSubmit(hw)} onView={() => setDetailTarget(hw)} />
                  ))}
                </div>
              </div>
            )}

            {/* Submitted & Graded */}
            {submittedAssignments.length > 0 && (
              <div>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Submitted ({submittedAssignments.length})</h2>
                <div className="space-y-3">
                  {submittedAssignments.map((hw: any) => (
                    <AssignmentCard key={hw.id} hw={hw} onView={() => setDetailTarget(hw)} />
                  ))}
                </div>
              </div>
            )}

            {/* Closed (missed) */}
            {closedAssignments.length > 0 && (
              <div>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" />Closed / Expired ({closedAssignments.length})</h2>
                <div className="space-y-3">
                  {closedAssignments.map((hw: any) => (
                    <AssignmentCard key={hw.id} hw={hw} onView={() => setDetailTarget(hw)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit Dialog */}
      <Dialog open={!!submitTarget} onOpenChange={v => { if (!v) { setSubmitTarget(null); setAnswerText(""); setFileUrl(""); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
          </DialogHeader>
          {submitTarget && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md space-y-1">
                <p className="font-medium">{submitTarget.title}</p>
                <p className="text-xs text-muted-foreground">{submitTarget.subjectName} · {submitTarget.className}</p>
                <p className="text-xs font-medium text-orange-600">Deadline: {new Date(submitTarget.dueDate).toLocaleString()}</p>
                {submitTarget.description && <p className="text-sm mt-2">{submitTarget.description}</p>}
                {submitTarget.attachmentUrl && (
                  <a href={submitTarget.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 underline mt-1">
                    <Paperclip className="w-3 h-3" />View Attachment
                  </a>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{SUBMISSION_TYPE_LABELS[submitTarget.submissionType || "both"]}</Badge>
                {submitTarget.totalMarks && <Badge variant="outline">Total Marks: {submitTarget.totalMarks}</Badge>}
              </div>

              {(submitTarget.submissionType === "text" || submitTarget.submissionType === "both" || !submitTarget.submissionType) && (
                <div>
                  <Label>Your Answer *</Label>
                  <Textarea
                    value={answerText}
                    onChange={e => setAnswerText(e.target.value)}
                    rows={5}
                    placeholder="Write your answer here..."
                    data-testid="input-answer-text"
                  />
                </div>
              )}

              {(submitTarget.submissionType === "file" || submitTarget.submissionType === "both") && (
                <div>
                  <Label>File URL {submitTarget.submissionType === "both" ? <span className="text-muted-foreground text-xs">(optional)</span> : "*"}</Label>
                  <Input
                    value={fileUrl}
                    onChange={e => setFileUrl(e.target.value)}
                    placeholder="https://drive.google.com/... or any file link"
                    data-testid="input-file-url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Upload your file to Google Drive, Dropbox, etc. and paste the link here.</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSubmitTarget(null); setAnswerText(""); setFileUrl(""); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitMutation.isPending} data-testid="button-confirm-submit">
              {submitMutation.isPending ? "Submitting..." : "Submit Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailTarget} onOpenChange={v => !v && setDetailTarget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailTarget?.title}</DialogTitle>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <AssignmentStatusBadge hw={detailTarget} />
                {detailTarget.totalMarks && <Badge variant="outline">Total: {detailTarget.totalMarks} marks</Badge>}
                <Badge variant="secondary">{SUBMISSION_TYPE_LABELS[detailTarget.submissionType || "both"]}</Badge>
              </div>

              <div className="text-sm space-y-1">
                <p className="text-muted-foreground">{detailTarget.subjectName} · {detailTarget.className}{detailTarget.sectionName ? ` · Section ${detailTarget.sectionName}` : ""}</p>
                <p className="text-muted-foreground">Teacher: {detailTarget.assignedByName || "—"}</p>
                <p className={isExpired(detailTarget.dueDate) ? "text-red-600 font-medium text-xs" : "text-green-600 font-medium text-xs"}>
                  Deadline: {new Date(detailTarget.dueDate).toLocaleString()}
                </p>
              </div>

              {detailTarget.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Instructions</p>
                  <p className="text-sm whitespace-pre-wrap">{detailTarget.description}</p>
                </div>
              )}

              {detailTarget.attachmentUrl && (
                <a href={detailTarget.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-blue-600 underline">
                  <Paperclip className="w-4 h-4" />View Attachment
                </a>
              )}

              {/* My submission */}
              {detailTarget.submissionStatus !== "not_submitted" && (
                <div className="border rounded-md p-3 space-y-2 bg-muted/40">
                  <p className="text-xs font-medium text-muted-foreground uppercase">My Submission</p>
                  {detailTarget.submissionAnswerText && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MessageSquare className="w-3 h-3" />Answer</p>
                      <p className="text-sm whitespace-pre-wrap">{detailTarget.submissionAnswerText}</p>
                    </div>
                  )}
                  {detailTarget.submissionFileUrl && (
                    <a href={detailTarget.submissionFileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 underline">
                      <FileText className="w-3 h-3" />My File
                    </a>
                  )}
                </div>
              )}

              {/* Marks / Feedback after grading */}
              {detailTarget.submissionStatus === "graded" && (
                <div className="border rounded-md p-3 space-y-2 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700">
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase flex items-center gap-1"><Star className="w-3 h-3" />Marks & Feedback</p>
                  {detailTarget.submissionMarks && (
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {detailTarget.submissionMarks}{detailTarget.totalMarks ? `/${detailTarget.totalMarks}` : ""}
                    </p>
                  )}
                  {detailTarget.submissionFeedback && (
                    <p className="text-sm">{detailTarget.submissionFeedback}</p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}

function AssignmentCard({ hw, onSubmit, onView }: { hw: any; onSubmit?: () => void; onView: () => void }) {
  const expired = isExpired(hw.dueDate);
  const canSubmit = hw.submissionStatus === "not_submitted" && !expired && hw.status !== "closed";

  return (
    <Card data-testid={`card-homework-${hw.id}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium">{hw.title}</p>
              <AssignmentStatusBadge hw={hw} />
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>{hw.subjectName}</span>
              <span>{hw.className}{hw.sectionName ? ` · ${hw.sectionName}` : ""}</span>
              <span>Teacher: {hw.assignedByName || "—"}</span>
            </div>
            <p className={`text-xs font-medium ${expired ? "text-red-600" : "text-green-600"}`}>
              Deadline: {new Date(hw.dueDate).toLocaleString()}
            </p>
            {hw.submissionStatus === "graded" && hw.submissionMarks && (
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                Marks: {hw.submissionMarks}{hw.totalMarks ? `/${hw.totalMarks}` : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={onView} data-testid={`button-detail-${hw.id}`}>View</Button>
            {canSubmit && onSubmit && (
              <Button size="sm" onClick={onSubmit} data-testid={`button-submit-hw-${hw.id}`}>Submit</Button>
            )}
          </div>
        </div>
        {hw.attachmentUrl && (
          <a href={hw.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 underline mt-2" data-testid={`link-attachment-${hw.id}`}>
            <Paperclip className="w-3 h-3" />Attachment
          </a>
        )}
      </CardContent>
    </Card>
  );
}
