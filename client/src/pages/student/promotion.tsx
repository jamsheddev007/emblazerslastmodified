import { useState, useEffect } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { studentNavItems } from "./student-data";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { type Student } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth";
import { Loader2, GraduationCap, ArrowUpCircle, CheckCircle2, XCircle } from "lucide-react";

interface PreviewStudent {
  id: string;
  name: string;
  studentId: string;
  class: string;
  section: string;
  examPercentage: number | null;
}

type Decision = "promote" | "stay" | "alumni";

const ALL_CLASSES = [
  "Nursery", "KG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
];

const SECTIONS = ["A", "B", "C", "D", "E"];

export default function StudentPromotion() {
  const { toast } = useToast();
  const { data: allStudents = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });

  const [currentClass, setCurrentClass] = useState("");
  const [currentSection, setCurrentSection] = useState("all");
  const [students, setStudents] = useState<PreviewStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [newClass, setNewClass] = useState("");
  const [newSection, setNewSection] = useState("");

  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [applying, setApplying] = useState(false);

  const distinctClasses = [...new Set(allStudents.map(s => s.class))].sort();
  const classOptions = distinctClasses.length > 0 ? distinctClasses : ALL_CLASSES;

  const loadStudents = async (cls: string, sec: string) => {
    if (!cls) return;
    setLoading(true);
    setStudents([]);
    setDecisions({});
    setLoaded(false);
    try {
      const params = new URLSearchParams({ currentClass: cls });
      if (sec && sec !== "all") params.set("currentSection", sec);
      const token = getAuthToken();
      const res = await fetch(`/api/students/promotion-preview?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data: PreviewStudent[] = await res.json();
      setStudents(data);
      const initialDecisions: Record<string, Decision> = {};
      data.forEach(s => {
        initialDecisions[s.id] = s.examPercentage !== null && s.examPercentage >= 40
          ? "promote"
          : "stay";
      });
      setDecisions(initialDecisions);
      setLoaded(true);
    } catch (err: any) {
      toast({ title: "Failed to load students", description: String(err?.message || err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentClass) {
      loadStudents(currentClass, currentSection);
    }
  }, [currentClass, currentSection]);

  const setDecision = (id: string, value: Decision) =>
    setDecisions(prev => ({ ...prev, [id]: value }));

  const setAllDecisions = (value: Decision) => {
    const next: Record<string, Decision> = {};
    students.forEach(s => { next[s.id] = value; });
    setDecisions(next);
  };

  const promoteCount = students.filter(s => decisions[s.id] === "promote").length;
  const stayCount = students.filter(s => decisions[s.id] === "stay").length;
  const alumniCount = students.filter(s => decisions[s.id] === "alumni").length;

  const canApply = students.length > 0 &&
    (promoteCount === 0 || (promoteCount > 0 && !!newClass));

  const handleApply = async () => {
    setApplying(true);
    try {
      const toPromote = students.filter(s => decisions[s.id] === "promote");
      const toAlumni = students.filter(s => decisions[s.id] === "alumni");

      if (toPromote.length > 0) {
        if (!newClass) {
          toast({ title: "Select Target Class", description: "Please choose the class to promote students to.", variant: "destructive" });
          setApplying(false);
          return;
        }
        const promotionList = toPromote.map(s => ({
          studentId: s.studentId,
          newClass,
          newSection: newSection || s.section,
        }));
        const res = await apiRequest("POST", "/api/students/promote", { promotionList });
        const data = await res.json();
        toast({ title: "Promoted", description: `${data.promoted} student(s) moved to ${newClass}` });
      }

      if (toAlumni.length > 0) {
        const studentIds = toAlumni.map(s => s.studentId);
        const res = await apiRequest("POST", "/api/students/graduate", { studentIds });
        const data = await res.json();
        toast({ title: "Graduated", description: `${data.graduated} student(s) marked as Alumni` });
      }

      if (stayCount > 0) {
        toast({ title: "Kept", description: `${stayCount} student(s) remain in ${currentClass}` });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      setConfirmOpen(false);
      await loadStudents(currentClass, currentSection);
    } catch (err: any) {
      toast({ title: "Error", description: String(err?.message || err), variant: "destructive" });
    } finally {
      setApplying(false);
    }
  };

  const getExamBadge = (pct: number | null) => {
    if (pct === null) return <Badge variant="secondary">No Result</Badge>;
    if (pct >= 40) return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{pct}% Pass</Badge>;
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{pct}% Fail</Badge>;
  };

  const getDecisionBadge = (d: Decision) => {
    if (d === "promote") return <span className="text-green-600 font-medium flex items-center gap-1"><ArrowUpCircle className="w-3 h-3" />Promote</span>;
    if (d === "alumni") return <span className="text-amber-600 font-medium flex items-center gap-1"><GraduationCap className="w-3 h-3" />Alumni</span>;
    return <span className="text-muted-foreground flex items-center gap-1"><XCircle className="w-3 h-3" />Stay</span>;
  };

  return (
    <ModuleLayout module="student" navItems={studentNavItems}>
      <PageHeader
        title="Class Promotion"
        description="Select a class to load students, set a decision for each, then apply"
      />

      <div className="space-y-6">
        {/* Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filter Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2 min-w-[200px]">
                <Label>Current Class <span className="text-destructive">*</span></Label>
                <Select value={currentClass} onValueChange={setCurrentClass}>
                  <SelectTrigger data-testid="select-current-class">
                    <SelectValue placeholder="Select class to load…" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 min-w-[160px]">
                <Label>Section</Label>
                <Select value={currentSection} onValueChange={setCurrentSection}>
                  <SelectTrigger data-testid="select-current-section">
                    <SelectValue placeholder="All sections" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {SECTIONS.map(s => (
                      <SelectItem key={s} value={s}>Section {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {loading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mt-6" />}
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        {loaded && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-base">
                  Students in {currentClass}{currentSection !== "all" ? ` — Section ${currentSection}` : ""}
                  <span className="ml-2 text-muted-foreground font-normal text-sm">({students.length} students)</span>
                </CardTitle>
                {students.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setAllDecisions("promote")} data-testid="button-all-promote">
                      <ArrowUpCircle className="w-3 h-3 mr-1" /> All Promote
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAllDecisions("stay")} data-testid="button-all-stay">
                      <XCircle className="w-3 h-3 mr-1" /> All Stay
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setAllDecisions("alumni")} data-testid="button-all-alumni">
                      <GraduationCap className="w-3 h-3 mr-1" /> All Alumni
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Last Exam</TableHead>
                    <TableHead className="w-44">Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        No active students found in {currentClass}{currentSection !== "all" ? ` — Section ${currentSection}` : ""}.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map(s => (
                      <TableRow key={s.id} data-testid={`row-student-${s.id}`}
                        className={
                          decisions[s.id] === "promote" ? "bg-green-50/50 dark:bg-green-900/10" :
                          decisions[s.id] === "alumni" ? "bg-amber-50/50 dark:bg-amber-900/10" : ""
                        }
                      >
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{s.studentId}</TableCell>
                        <TableCell>{s.class}</TableCell>
                        <TableCell>{s.section}</TableCell>
                        <TableCell>{getExamBadge(s.examPercentage)}</TableCell>
                        <TableCell>
                          <Select
                            value={decisions[s.id] || "stay"}
                            onValueChange={(v) => setDecision(s.id, v as Decision)}
                          >
                            <SelectTrigger className="h-8 text-sm" data-testid={`select-decision-${s.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="promote">
                                <span className="flex items-center gap-1 text-green-700"><ArrowUpCircle className="w-3 h-3" />Promote</span>
                              </SelectItem>
                              <SelectItem value="stay">
                                <span className="flex items-center gap-1"><XCircle className="w-3 h-3" />Fail / Stay</span>
                              </SelectItem>
                              <SelectItem value="alumni">
                                <span className="flex items-center gap-1 text-amber-700"><GraduationCap className="w-3 h-3" />Graduate (Alumni)</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Action Panel */}
        {loaded && students.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Apply Decisions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                  <ArrowUpCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">{promoteCount} to Promote</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-muted border rounded-lg px-3 py-2">
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{stayCount} to Stay / Fail</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                  <span className="font-medium text-amber-700 dark:text-amber-400">{alumniCount} to Graduate</span>
                </div>
              </div>

              {/* Target class for promotions */}
              {promoteCount > 0 && (
                <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium">Target class for {promoteCount} promoted student(s):</p>
                  <div className="flex flex-wrap gap-3">
                    <div className="space-y-1.5 min-w-[180px]">
                      <Label className="text-xs">New Class <span className="text-destructive">*</span></Label>
                      <Select value={newClass} onValueChange={setNewClass}>
                        <SelectTrigger data-testid="select-new-class">
                          <SelectValue placeholder="Select new class…" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_CLASSES.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 min-w-[150px]">
                      <Label className="text-xs">New Section</Label>
                      <Select value={newSection || "keep"} onValueChange={v => setNewSection(v === "keep" ? "" : v)}>
                        <SelectTrigger data-testid="select-new-section">
                          <SelectValue placeholder="Keep same" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keep">Keep same section</SelectItem>
                          {SECTIONS.map(s => (
                            <SelectItem key={s} value={s}>Section {s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full sm:w-auto"
                onClick={() => setConfirmOpen(true)}
                disabled={!canApply || (promoteCount > 0 && !newClass)}
                data-testid="button-apply-decisions"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Apply All Decisions
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Promotion Decisions</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                {promoteCount > 0 && (
                  <p><ArrowUpCircle className="inline w-4 h-4 text-green-600 mr-1" /><strong>{promoteCount} students</strong> will be promoted to <strong>{newClass}{newSection ? ` — Section ${newSection}` : ""}</strong>.</p>
                )}
                {stayCount > 0 && (
                  <p><XCircle className="inline w-4 h-4 mr-1" /><strong>{stayCount} students</strong> will remain in {currentClass} (no change).</p>
                )}
                {alumniCount > 0 && (
                  <p><GraduationCap className="inline w-4 h-4 text-amber-600 mr-1" /><strong>{alumniCount} students</strong> will be marked as Alumni.</p>
                )}
                <p className="text-muted-foreground pt-1">This action cannot be undone. Proceed?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applying} data-testid="button-confirm-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApply} disabled={applying} data-testid="button-confirm-apply">
              {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Yes, Apply
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
