import { useState, useMemo } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { curriculumNavItems, useCurriculumData } from "./curriculum-data";
import { ReportCardDialog } from "@/components/report-card-dialog";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Printer, Download, ShieldCheck, Search } from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:  { label: "Pending",  cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  saved:    { label: "Saved",    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  verified: { label: "Verified", cls: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  edited:   { label: "Edited",   cls: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
};

const GRADE_COLOR: Record<string, string> = {
  "A+": "text-green-600 dark:text-green-400",
  "A":  "text-green-600 dark:text-green-400",
  "B+": "text-blue-600 dark:text-blue-400",
  "B":  "text-blue-600 dark:text-blue-400",
  "C+": "text-amber-600 dark:text-amber-400",
  "C":  "text-amber-600 dark:text-amber-400",
  "D":  "text-orange-600 dark:text-orange-400",
  "F":  "text-red-600 dark:text-red-400",
};

function escHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function handlePrint(rows: any[], filterLabel: string) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Result Report — ${escHtml(filterLabel)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p { font-size: 12px; color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1A2B4A; color: white; padding: 8px 10px; text-align: left; font-size: 11px; }
    td { padding: 7px 10px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) td { background: #f7f8fa; }
    .grade { font-weight: bold; }
    .pass { color: #16a34a; font-weight: bold; }
    .fail { color: #dc2626; font-weight: bold; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Result Report</h1>
  <p>${escHtml(filterLabel)} &nbsp;|&nbsp; Total: ${rows.length} record(s)</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Student ID</th>
        <th>Name</th>
        <th>Class</th>
        <th>Subject</th>
        <th>Marks</th>
        <th>Grade</th>
        <th>Status</th>
        <th>Entered by</th>
      </tr>
    </thead>
    <tbody>
      ${rows.map((r, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${escHtml(r.studentId)}</td>
          <td>${escHtml(r.studentName)}</td>
          <td>${escHtml(r.class)}</td>
          <td>${escHtml(r.subject)}</td>
          <td>${escHtml(r.marksObtained)}/${escHtml(r.maxMarks)} (${Math.round((r.marksObtained / r.maxMarks) * 100)}%)</td>
          <td class="grade ${r.grade === 'F' ? 'fail' : 'pass'}">${escHtml(r.grade)}</td>
          <td>${escHtml(r.status || 'pending')}</td>
          <td>${escHtml(r.enteredBy || '-')}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</body>
</html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

function handleCSV(rows: any[], filename: string) {
  const headers = ["Student ID", "Name", "Class", "Subject", "Marks Obtained", "Max Marks", "Percentage", "Grade", "Status", "Entered By"];
  const csvRows = rows.map(r => [
    r.studentId,
    r.studentName,
    r.class,
    r.subject,
    r.marksObtained,
    r.maxMarks,
    Math.round((r.marksObtained / r.maxMarks) * 100),
    r.grade,
    r.status || "pending",
    r.enteredBy || "",
  ]);
  const csv = [headers, ...csvRows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultReports() {
  const { results, exams } = useCurriculumData();
  const [filterExam, setFilterExam] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const allClasses = useMemo(() => [...new Set(results.map(r => r.class))].sort(), [results]);
  const allSubjects = useMemo(() => [...new Set(results.map(r => r.subject))].sort(), [results]);

  const filtered = useMemo(() => results.filter(r => {
    if (filterExam !== "all" && r.examId !== filterExam) return false;
    if (filterClass !== "all" && r.class !== filterClass) return false;
    if (filterSubject !== "all" && r.subject !== filterSubject) return false;
    if (filterStatus !== "all" && ((r as any).status || "pending") !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.studentName?.toLowerCase().includes(q) && !r.studentId?.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [results, filterExam, filterClass, filterSubject, filterStatus, search]);

  const summary = useMemo(() => {
    if (filtered.length === 0) return null;
    const passing = filtered.filter(r => r.grade !== "F").length;
    const totalObtained = filtered.reduce((s, r) => s + r.marksObtained, 0);
    const totalMax = filtered.reduce((s, r) => s + r.maxMarks, 0);
    const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    return { passing, failing: filtered.length - passing, passRate: Math.round((passing / filtered.length) * 100), avgPct: pct };
  }, [filtered]);

  const filterLabel = [
    filterExam !== "all" ? `Exam: ${exams.find(e => e.id === filterExam)?.name}` : "",
    filterClass !== "all" ? `Class: ${filterClass}` : "",
    filterSubject !== "all" ? `Subject: ${filterSubject}` : "",
  ].filter(Boolean).join(", ") || "All Results";

  const csvFilename = `result-report-${filterLabel.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`;

  return (
    <ModuleLayout module="curriculum" navItems={curriculumNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Result Reports"
          description="View, filter, download, and print student exam results"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleCSV(filtered, csvFilename)}
                disabled={filtered.length === 0}
                data-testid="button-export-csv"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={() => handlePrint(filtered, filterLabel)}
                disabled={filtered.length === 0}
                data-testid="button-print-results"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Results
              </Button>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Exam</label>
            <Select value={filterExam} onValueChange={setFilterExam}>
              <SelectTrigger className="w-[200px]" data-testid="select-filter-exam">
                <SelectValue placeholder="All Exams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Class</label>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[160px]" data-testid="select-filter-class">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {allClasses.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Subject</label>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[160px]" data-testid="select-filter-subject">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {allSubjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]" data-testid="select-filter-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="saved">Saved</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="edited">Edited</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or ID..."
                className="pl-8"
                data-testid="input-search"
              />
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Records", value: filtered.length, cls: "" },
              { label: "Pass Rate", value: `${summary.passRate}%`, cls: "text-green-600 dark:text-green-400" },
              { label: "Avg Score", value: `${summary.avgPct}%`, cls: "" },
              { label: "Failing", value: summary.failing, cls: summary.failing > 0 ? "text-red-600 dark:text-red-400" : "" },
            ].map(stat => (
              <Card key={stat.label}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.cls}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results Table */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> result{filtered.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No results match the selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-results">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">#</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Student ID</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Class</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Subject</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Marks</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Grade</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Entered by</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, idx) => {
                      const status = (r as any).status || "pending";
                      const sb = STATUS_BADGE[status] || STATUS_BADGE.pending;
                      const pct = r.maxMarks > 0 ? Math.round((r.marksObtained / r.maxMarks) * 100) : 0;
                      return (
                        <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors" data-testid={`row-result-${r.id}`}>
                          <td className="p-3 text-muted-foreground">{idx + 1}</td>
                          <td className="p-3 font-mono text-xs">{r.studentId}</td>
                          <td className="p-3 font-medium">{r.studentName}</td>
                          <td className="p-3 text-muted-foreground">{r.class}</td>
                          <td className="p-3">{r.subject}</td>
                          <td className="p-3">
                            <span className="font-medium">{r.marksObtained}</span>
                            <span className="text-muted-foreground">/{r.maxMarks}</span>
                            <span className="text-muted-foreground ml-1 text-xs">({pct}%)</span>
                          </td>
                          <td className={`p-3 font-bold ${GRADE_COLOR[r.grade] || ""}`}>{r.grade}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sb.cls}`}>
                              {status === "verified" && <ShieldCheck className="w-3 h-3" />}
                              {sb.label}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">{(r as any).enteredBy || "-"}</td>
                          <td className="p-3">
                            <ReportCardDialog
                              studentId={r.studentId}
                              studentName={r.studentName}
                              fetchFn={(url) => apiRequest("GET", url).then(res => res)}
                              trigger={
                                <span className="inline-flex items-center gap-1 text-[#0D7377] hover:underline cursor-pointer text-xs font-medium" data-testid={`button-report-card-${r.studentId}`}>
                                  <FileText className="w-3.5 h-3.5" />
                                  Report Card
                                </span>
                              }
                            />
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
      </div>
    </ModuleLayout>
  );
}
