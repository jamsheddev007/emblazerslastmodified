import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModuleLayout } from "@/components/layout/module-layout";
import { teacherNavItems } from "@/pages/curriculum/teacher-data";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, ShieldCheck } from "lucide-react";
import type { Student } from "@shared/schema";

const teacherHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("teacher_token") || localStorage.getItem("emblazers_token")}` });

function calcGrade(marks: number, maxMarks: number): string {
  if (maxMarks <= 0) return "F";
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C+";
  if (pct >= 40) return "C";
  if (pct >= 33) return "D";
  return "F";
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Pending",  cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  saved:    { label: "Saved",    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  verified: { label: "Verified", cls: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  edited:   { label: "Edited",   cls: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
};

export default function TeacherResultEntry() {
  const { session } = useAuth();
  const { toast } = useToast();
  const staffId = (session as any)?.staffId;

  const [selectedExam, setSelectedExam] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [maxMarks, setMaxMarks] = useState(100);
  const [marksMap, setMarksMap] = useState<Record<string, number | "">>({});

  const { data: assignments = [] } = useQuery<any[]>({
    queryKey: ['/api/teacher/my-assignments', staffId],
    queryFn: async () => {
      const res = await fetch('/api/teacher/my-assignments', { headers: teacherHeaders() });
      return res.json();
    },
    enabled: !!staffId,
  });

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ['/api/exams'],
    queryFn: async () => {
      const res = await fetch('/api/exams', { headers: teacherHeaders() });
      return res.json();
    },
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  const { data: existingResults = [] } = useQuery<any[]>({
    queryKey: ['/api/teacher/exam-results', staffId],
    queryFn: async () => {
      const res = await fetch('/api/teacher/exam-results', { headers: teacherHeaders() });
      return res.json();
    },
    enabled: !!staffId,
  });

  const assignedClasses = [...new Set(assignments.map((a: any) => a.className))].sort();
  const assignedSubjectsForClass = selectedClass
    ? [...new Set(assignments.filter((a: any) => a.className === selectedClass).map((a: any) => a.subject))].sort()
    : [];

  const filteredStudents = students.filter(s =>
    s.class === selectedClass && s.status === "Active"
  );

  const currentResults = existingResults.filter((r: any) =>
    r.examId === selectedExam && r.class === selectedClass && r.subject === selectedSubject
  );

  useEffect(() => {
    if (!selectedExam || !selectedClass || !selectedSubject) return;
    const newMap: Record<string, number | ""> = {};
    filteredStudents.forEach(student => {
      const existing = currentResults.find((r: any) => r.studentId === student.studentId);
      newMap[student.studentId] = existing ? existing.marksObtained : "";
    });
    setMarksMap(newMap);
  }, [selectedExam, selectedClass, selectedSubject, filteredStudents.length, currentResults.length]);

  useEffect(() => {
    setSelectedSubject("");
  }, [selectedClass]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/teacher/exam-results", payload);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/exam-results', staffId] });
      toast({ title: `Saved: ${data.saved} new, ${data.updated} updated` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!selectedExam || !selectedClass || !selectedSubject) {
      toast({ title: "Select Exam, Class, and Subject first", variant: "destructive" });
      return;
    }
    const entries = filteredStudents
      .filter(s => marksMap[s.studentId] !== "" && marksMap[s.studentId] !== undefined)
      .map(s => ({
        studentId: s.studentId,
        studentName: s.name,
        marksObtained: Number(marksMap[s.studentId]),
        grade: calcGrade(Number(marksMap[s.studentId]), maxMarks),
      }));

    if (entries.length === 0) {
      toast({ title: "Enter marks for at least one student", variant: "destructive" });
      return;
    }

    const section = assignments.find((a: any) => a.className === selectedClass && a.subject === selectedSubject)?.section || null;
    saveMutation.mutate({ examId: selectedExam, className: selectedClass, section, subject: selectedSubject, maxMarks, entries });
  };

  const selectedExamObj = exams.find((e: any) => e.id === selectedExam);

  return (
    <ModuleLayout module="curriculum" navItems={teacherNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Result Entry</h1>
          <p className="text-muted-foreground">Enter exam marks for your assigned classes and subjects</p>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Exam</label>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger className="w-[220px]" data-testid="select-exam">
                <SelectValue placeholder="Select Exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((e: any) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]" data-testid="select-class">
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {assignedClasses.map(cls => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={!selectedClass}>
              <SelectTrigger className="w-[180px]" data-testid="select-subject">
                <SelectValue placeholder={selectedClass ? "Select Subject" : "Select Class first"} />
              </SelectTrigger>
              <SelectContent>
                {assignedSubjectsForClass.map(sub => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Max Marks</label>
            <Input
              type="number"
              value={maxMarks}
              onChange={e => setMaxMarks(Number(e.target.value) || 100)}
              min={1}
              className="w-[100px]"
              data-testid="input-max-marks"
            />
          </div>
        </div>

        {selectedExam && selectedClass && selectedSubject ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <CardTitle className="text-base">
                {selectedSubject} — {selectedClass}
                {selectedExamObj && <span className="text-sm font-normal text-muted-foreground ml-2">({selectedExamObj.name})</span>}
              </CardTitle>
              {currentResults.length > 0 && (
                <span className="text-sm text-muted-foreground">{currentResults.length} existing result{currentResults.length !== 1 ? "s" : ""} loaded</span>
              )}
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading students...
                </div>
              ) : filteredStudents.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">No active students found for {selectedClass}</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 text-muted-foreground font-medium">#</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Student ID</th>
                          <th className="text-left p-2 text-muted-foreground font-medium">Name</th>
                          <th className="text-left p-2 text-muted-foreground font-medium w-32">Marks /{maxMarks}</th>
                          <th className="text-left p-2 text-muted-foreground font-medium w-20">Grade</th>
                          <th className="text-left p-2 text-muted-foreground font-medium w-28">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student, idx) => {
                          const marks = marksMap[student.studentId];
                          const grade = marks !== "" && marks !== undefined ? calcGrade(Number(marks), maxMarks) : "-";
                          const gradeColor = grade === "A+" || grade === "A" ? "text-green-600 dark:text-green-400"
                            : grade === "B+" || grade === "B" ? "text-blue-600 dark:text-blue-400"
                            : grade === "C+" || grade === "C" ? "text-amber-600 dark:text-amber-400"
                            : grade === "F" ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground";
                          const existing = currentResults.find((r: any) => r.studentId === student.studentId);
                          const status = existing?.status || "pending";
                          const sb = STATUS_BADGE[status] || STATUS_BADGE.pending;
                          return (
                            <tr key={student.studentId} className="border-b last:border-b-0">
                              <td className="p-2 text-muted-foreground">{idx + 1}</td>
                              <td className="p-2 font-mono text-xs">{student.studentId}</td>
                              <td className="p-2">{student.name}</td>
                              <td className="p-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={maxMarks}
                                  value={marks ?? ""}
                                  onChange={e => {
                                    const v = e.target.value;
                                    const n = v === "" ? "" : Math.min(Math.max(0, Number(v)), maxMarks);
                                    setMarksMap(prev => ({ ...prev, [student.studentId]: n }));
                                  }}
                                  placeholder="0"
                                  className="w-24"
                                  data-testid={`input-marks-${student.studentId}`}
                                />
                              </td>
                              <td className={`p-2 font-semibold ${gradeColor}`}>{grade}</td>
                              <td className="p-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sb.cls}`}>
                                  {status === "verified" && <ShieldCheck className="w-3 h-3" />}
                                  {sb.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-results">
                      {saveMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                      ) : (
                        <><Save className="w-4 h-4 mr-2" />Save Results</>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {assignments.length === 0
                ? "No classes assigned to you yet. Contact admin."
                : "Select Exam, Class, and Subject to enter marks"}
            </CardContent>
          </Card>
        )}
      </div>
    </ModuleLayout>
  );
}
