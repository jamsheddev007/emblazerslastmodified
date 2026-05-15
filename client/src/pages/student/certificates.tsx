import { useState, useEffect, useRef } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { studentNavItems } from "./student-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth";
import { Loader2, Eye, Printer, XCircle, Award } from "lucide-react";
import type { Student } from "@shared/schema";

interface Certificate {
  id: number;
  certificateType: string;
  studentId: number;
  studentName: string;
  issuedBy: string;
  issueDate: string;
  content: string;
  certificateNo: string;
  status: string;
  branchId: number;
  createdAt: string;
}

const authHeaders = () => ({ Authorization: `Bearer ${getAuthToken()}` });

const TYPE_BADGE: Record<string, string> = {
  bonafide: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  character: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  transfer: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  completion: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const TEMPLATES: Record<string, (s: any, purpose?: string) => string> = {
  bonafide: (s, purpose) =>
    `This is to certify that ${s.name} son/daughter of ${s.parentName} is a bonafide student of this institution. He/She is currently studying in Class ${s.class} Section ${s.section}. His/Her date of admission is ${s.admissionDate}. This certificate is issued on the request of the student for ${purpose || "official purposes"}.`,
  character: (s) =>
    `This is to certify that ${s.name} son/daughter of ${s.parentName} has been a student of this institution from ${s.admissionDate}. During his/her stay he/she has shown good character and conduct. He/She bears a good moral character. This certificate is issued on his/her request.`,
  transfer: (s) =>
    `This is to certify that ${s.name} son/daughter of ${s.parentName} was a bonafide student of this institution. He/She studied in Class ${s.class} Section ${s.section}. He/She is hereby granted Transfer Certificate on his/her own request. His/Her conduct and character was good during his/her stay.`,
  completion: (s) =>
    `This is to certify that ${s.name} son/daughter of ${s.parentName} has successfully completed his/her studies from this institution. He/She passed Class ${s.class} in the year ${new Date().getFullYear()}. We wish him/her success in future endeavors.`,
};

const CERT_TITLE: Record<string, string> = {
  bonafide: "Bonafide Certificate",
  character: "Character Certificate",
  transfer: "Transfer Certificate",
  completion: "Completion Certificate",
};

export default function StudentCertificates() {
  const { toast } = useToast();

  // Filters
  const [filterType, setFilterType] = useState("all");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Form state
  const [certType, setCertType] = useState("");
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState<Student[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [issuedBy, setIssuedBy] = useState("School Administration");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [purpose, setPurpose] = useState("");
  const [customContent, setCustomContent] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dialogs
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [cancelAlertOpen, setCancelAlertOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Saved certificate (after generation)
  const [savedCert, setSavedCert] = useState<Certificate | null>(null);

  const { data: certs = [], isLoading, refetch } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates", filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("certificateType", filterType);
      const res = await fetch(`/api/certificates?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load certificates");
      return res.json();
    },
  });

  // Auto-generate content when student + type selected
  useEffect(() => {
    if (selectedStudent && certType && TEMPLATES[certType]) {
      setCustomContent(TEMPLATES[certType](selectedStudent, purpose));
    }
  }, [selectedStudent, certType, purpose]);

  // Student search
  useEffect(() => {
    const q = studentQuery.trim();
    if (!q || q.length < 2) { setStudentResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/students?query=${encodeURIComponent(q)}`, { headers: authHeaders() });
        const data = await res.json();
        setStudentResults(Array.isArray(data) ? data.slice(0, 8) : data.data?.slice(0, 8) || []);
        setShowDropdown(true);
      } catch { setStudentResults([]); }
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [studentQuery]);

  // Filter certs by search + date
  const filtered = certs.filter(c => {
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      if (!c.studentName.toLowerCase().includes(q) && !c.certificateNo.toLowerCase().includes(q)) return false;
    }
    if (filterDateFrom && c.issueDate < filterDateFrom) return false;
    if (filterDateTo && c.issueDate > filterDateTo) return false;
    return true;
  });

  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    setStudentQuery(s.name);
    setShowDropdown(false);
    setStudentResults([]);
  };

  const handlePreview = () => {
    if (!certType || !selectedStudent || !issuedBy || !issueDate) {
      toast({ title: "Error", description: "Please fill all required fields and select a student", variant: "destructive" });
      return;
    }
    if (!customContent) {
      toast({ title: "Error", description: "Certificate content cannot be empty", variant: "destructive" });
      return;
    }
    setSavedCert(null);
    setPreviewOpen(true);
  };

  const handleGenerateAndPrint = async () => {
    if (!certType || !selectedStudent || !issuedBy || !issueDate || !customContent) return;
    setSaving(true);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateType: certType,
          studentId: selectedStudent.id,
          issuedBy,
          issueDate,
          purpose,
          customContent,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save");
      const cert: Certificate = await res.json();
      setSavedCert(cert);
      queryClient.invalidateQueries({ queryKey: ["/api/certificates", filterType] });
      toast({ title: "Certificate Saved", description: `${cert.certificateNo} generated successfully` });
      // Trigger print
      printCertificate(cert, selectedStudent);
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const printCertificate = (cert: Certificate, student: Student) => {
    const title = CERT_TITLE[cert.certificateType] || "Certificate";
    const html = `<!DOCTYPE html><html><head><title>${title}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Times New Roman', serif; background: white; padding: 40px; }
      .cert-wrap { max-width: 720px; margin: 0 auto; border: 8px double #1e3a8a; padding: 50px; min-height: 90vh; display: flex; flex-direction: column; align-items: center; text-align: center; }
      .school-name { font-size: 28px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px; margin-bottom: 4px; }
      .school-sub { font-size: 13px; color: #555; margin-bottom: 30px; }
      .divider { width: 80%; height: 2px; background: #1e3a8a; margin: 10px auto 30px; }
      .cert-title { font-size: 26px; font-weight: bold; color: #1e40af; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 40px; }
      .cert-body { font-size: 15px; line-height: 2; color: #222; text-align: justify; max-width: 580px; flex: 1; }
      .footer { margin-top: 60px; width: 100%; display: flex; justify-content: space-between; align-items: flex-end; }
      .sign-block { text-align: center; }
      .sign-line { border-top: 1px solid #333; width: 160px; margin: 0 auto 5px; padding-top: 6px; }
      .sign-name { font-weight: bold; font-size: 13px; }
      .cert-no { font-size: 11px; color: #888; margin-top: 20px; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <div class="cert-wrap">
      <div class="school-name">EMBLAZERS SCHOOL</div>
      <div class="school-sub">Excellence in Education</div>
      <div class="divider"></div>
      <div class="cert-title">${title}</div>
      <div class="cert-body">${cert.content}</div>
      <div class="footer">
        <div class="sign-block">
          <div class="sign-line"></div>
          <div class="sign-name">${cert.issuedBy}</div>
          <div style="font-size:12px;color:#666">Issuing Authority</div>
        </div>
        <div class="sign-block">
          <div style="font-size:13px;font-weight:bold">Date: ${cert.issueDate}</div>
        </div>
      </div>
      <div class="cert-no">Certificate No: ${cert.certificateNo}</div>
    </div>
    <script>window.onload = function(){ window.print(); window.close(); }</script>
    </body></html>`;
    const pw = window.open("", "_blank", "width=800,height=700");
    if (pw) { pw.document.write(html); pw.document.close(); }
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/certificates/${cancelId}/cancel`, { method: "PATCH", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to cancel");
      toast({ title: "Cancelled", description: "Certificate cancelled successfully" });
      refetch();
    } catch (err) {
      toast({ title: "Error", description: String(err), variant: "destructive" });
    } finally {
      setCancelLoading(false);
      setCancelAlertOpen(false);
      setCancelId(null);
    }
  };

  const previewCertTitle = CERT_TITLE[certType] || "Certificate";
  const previewContent = customContent;

  return (
    <ModuleLayout module="student" navItems={studentNavItems}>
      <PageHeader title="Certificates" description="Issue and manage student certificates" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT — Certificate List */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Issued Certificates</CardTitle>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger data-testid="filter-type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="bonafide">Bonafide</SelectItem>
                    <SelectItem value="character">Character</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="completion">Completion</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Search student or cert no..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} data-testid="filter-search" />
                <Input type="date" placeholder="Date from" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} data-testid="filter-date-from" />
                <Input type="date" placeholder="Date to" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} data-testid="filter-date-to" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[580px] overflow-y-auto">
              {isLoading && <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>}
              {!isLoading && filtered.length === 0 && (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <Award className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No certificates issued yet.</p>
                </div>
              )}
              {filtered.map(cert => (
                <div key={cert.id} className="border rounded-lg p-3 space-y-2" data-testid={`cert-card-${cert.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm" data-testid={`cert-no-${cert.id}`}>{cert.certificateNo}</p>
                      <p className="text-sm text-muted-foreground">{cert.studentName}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${TYPE_BADGE[cert.certificateType] || "bg-gray-100 text-gray-700"}`} data-testid={`cert-type-${cert.id}`}>
                        {cert.certificateType}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cert.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`} data-testid={`cert-status-${cert.id}`}>
                        {cert.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Issued: {cert.issueDate}</span>
                    <span>By: {cert.issuedBy}</span>
                  </div>
                  {cert.status === "active" && (
                    <Button size="sm" variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => { setCancelId(cert.id); setCancelAlertOpen(true); }}
                      data-testid={`btn-cancel-${cert.id}`}>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel Certificate
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Issue New Certificate Form */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Issue New Certificate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Certificate Type <span className="text-destructive">*</span></Label>
                <Select value={certType} onValueChange={setCertType}>
                  <SelectTrigger data-testid="select-cert-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bonafide">Bonafide Certificate</SelectItem>
                    <SelectItem value="character">Character Certificate</SelectItem>
                    <SelectItem value="transfer">Transfer Certificate</SelectItem>
                    <SelectItem value="completion">Completion Certificate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 relative">
                <Label>Student Search <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input
                    value={studentQuery}
                    onChange={e => { setStudentQuery(e.target.value); setSelectedStudent(null); setShowDropdown(true); }}
                    placeholder="Search by name or student ID..."
                    data-testid="input-student-search"
                    onFocus={() => studentResults.length > 0 && setShowDropdown(true)}
                  />
                  {searchLoading && <Loader2 className="w-4 h-4 absolute right-3 top-2.5 animate-spin text-muted-foreground" />}
                </div>
                {showDropdown && studentResults.length > 0 && (
                  <div ref={dropdownRef} className="absolute z-50 w-full bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {studentResults.map(s => (
                      <button key={s.id} type="button"
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center justify-between"
                        onClick={() => handleSelectStudent(s)}
                        data-testid={`student-result-${s.id}`}>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground text-xs">{s.studentId} · {s.class}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedStudent && (
                  <p className="text-xs text-muted-foreground">
                    Selected: <span className="font-medium text-foreground">{selectedStudent.name}</span> — {selectedStudent.class} {selectedStudent.section}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Issued By <span className="text-destructive">*</span></Label>
                  <Input value={issuedBy} onChange={e => setIssuedBy(e.target.value)} data-testid="input-issued-by" />
                </div>
                <div className="space-y-2">
                  <Label>Issue Date <span className="text-destructive">*</span></Label>
                  <Input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} data-testid="input-issue-date" />
                </div>
              </div>

              {certType === "bonafide" && (
                <div className="space-y-2">
                  <Label>Purpose</Label>
                  <Input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g., bank account opening, school admission" data-testid="input-purpose" />
                </div>
              )}

              <div className="space-y-2">
                <Label>Certificate Content</Label>
                <Textarea
                  value={customContent}
                  onChange={e => setCustomContent(e.target.value)}
                  rows={5}
                  placeholder="Select student and certificate type to auto-generate content…"
                  className="text-sm"
                  data-testid="textarea-content"
                />
                <p className="text-xs text-muted-foreground">Auto-generated from template. You can edit before generating.</p>
              </div>

              <Button onClick={handlePreview} className="w-full" data-testid="button-preview">
                <Eye className="w-4 h-4 mr-2" /> Preview Certificate
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Certificate Preview</DialogTitle>
          </DialogHeader>
          <div className="border-4 border-double border-blue-800 p-8 mx-2 text-center space-y-6 bg-white dark:bg-white" data-testid="cert-preview-panel">
            <div>
              <h2 className="text-2xl font-bold text-blue-900 tracking-widest">EMBLAZERS SCHOOL</h2>
              <p className="text-xs text-gray-500 mt-1">Excellence in Education</p>
              <div className="w-3/4 mx-auto h-0.5 bg-blue-800 mt-3" />
            </div>
            <h3 className="text-xl font-bold text-blue-700 uppercase tracking-widest" data-testid="preview-title">
              {previewCertTitle}
            </h3>
            <p className="text-sm text-gray-700 leading-8 text-justify" data-testid="preview-body">
              {previewContent}
            </p>
            <div className="flex justify-between items-end pt-6">
              <div className="text-center">
                <div className="border-t border-gray-600 w-40 mx-auto mb-1" />
                <p className="font-semibold text-sm text-gray-800">{issuedBy}</p>
                <p className="text-xs text-gray-500">Issuing Authority</p>
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800">Date: {issueDate}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              {savedCert ? `Certificate No: ${savedCert.certificateNo}` : "Certificate No: Will be assigned on generation"}
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            {savedCert ? (
              <Button onClick={() => printCertificate(savedCert, selectedStudent!)} data-testid="button-print-saved">
                <Printer className="w-4 h-4 mr-2" /> Print Certificate
              </Button>
            ) : (
              <Button onClick={handleGenerateAndPrint} disabled={saving} data-testid="button-generate-print">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
                Generate &amp; Print
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={cancelAlertOpen} onOpenChange={setCancelAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Certificate?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the certificate as cancelled. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>Keep</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={cancelLoading} className="bg-red-600 hover:bg-red-700">
              {cancelLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Cancel Certificate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
