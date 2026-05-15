import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { curriculumNavItems, classes } from "./curriculum-data";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Student } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, RotateCcw, Users, InfoIcon, IdCard, Search, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const sections = ["A", "B", "C", "D"];

export default function StudentAccountsPage() {
  const { toast } = useToast();
  const [filterClass, setFilterClass] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [quickId, setQuickId] = useState("");
  const [quickResult, setQuickResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: students = [] } = useQuery<Student[]>({ queryKey: ['/api/students'] });
  const { data: accounts = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/curriculum/student-accounts'],
    queryFn: async () => {
      const res = await fetch('/api/curriculum/student-accounts', { headers: { Authorization: `Bearer ${localStorage.getItem("emblazers_token")}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const quickCreateMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await apiRequest('POST', '/api/curriculum/student-accounts/create', { studentId });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum/student-accounts'] });
      if (data.created > 0) {
        setQuickResult({ type: "success", msg: `Account created! Student can now login with ID: ${quickId} and password: 12345678` });
      } else if (data.skipped > 0) {
        setQuickResult({ type: "error", msg: "Account already exists for this Student ID." });
      } else {
        setQuickResult({ type: "error", msg: data.errors?.[0] || "Student ID not found. Make sure the student is registered." });
      }
      setQuickId("");
    },
    onError: (err: any) => {
      setQuickResult({ type: "error", msg: err.message || "Failed to create account." });
    }
  });

  const createAccountsMutation = useMutation({
    mutationFn: async (studentIds: string[]) => {
      const results = { created: 0, skipped: 0, errors: [] as string[] };
      for (const sid of studentIds) {
        const res = await apiRequest('POST', '/api/curriculum/student-accounts/create', { studentId: sid });
        const data = await res.json();
        results.created += data.created || 0;
        results.skipped += data.skipped || 0;
      }
      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum/student-accounts'] });
      toast({ title: `Created ${data.created} accounts, ${data.skipped} already existed` });
      setSelectedStudentIds([]);
    }
  });

  const bulkCreateByClassMutation = useMutation({
    mutationFn: async ({ className, section }: { className: string; section?: string }) => {
      const res = await apiRequest('POST', '/api/curriculum/student-accounts/create', { className, section });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum/student-accounts'] });
      toast({ title: `Created ${data.created} accounts, ${data.skipped} already existed` });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await apiRequest('POST', `/api/curriculum/student-accounts/reset-password/${studentId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/curriculum/student-accounts'] });
      toast({ title: "Password reset to 12345678" });
    }
  });

  const resetIdCardMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await fetch(`/api/curriculum/student-accounts/id-card-reset/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem("emblazers_token")}` },
      });
      if (!res.ok) throw new Error("Failed to reset ID card");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "ID card request reset successfully." });
    },
  });

  const accountStudentIds = new Set(accounts.map((a: any) => a.studentId));
  const unregistered = students.filter(s => !accountStudentIds.has(s.studentId));
  const filteredUnregistered = filterClass === "all"
    ? unregistered
    : unregistered.filter(s => s.class === filterClass && (filterSection === "all" || s.section === filterSection));
  const filteredAccounts = filterClass === "all"
    ? accounts
    : accounts.filter((a: any) => a.className === filterClass && (filterSection === "all" || a.section === filterSection));

  const toggleSelection = (sid: string) => {
    setSelectedStudentIds(prev => prev.includes(sid) ? prev.filter(x => x !== sid) : [...prev, sid]);
  };

  const selectAll = () => {
    if (selectedStudentIds.length === filteredUnregistered.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredUnregistered.map(s => s.studentId));
    }
  };

  return (
    <ModuleLayout module="curriculum" navItems={curriculumNavItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Student Portal Accounts</h1>
            <p className="text-muted-foreground">Create and manage student login accounts for the Student Portal</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            {accounts.length} accounts · {unregistered.length} without account
          </div>
        </div>

        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            Default password is <strong>12345678</strong>. Students must change it on their first login.
            They log in at <strong>Student Portal</strong> using their Student ID.
          </AlertDescription>
        </Alert>

        {/* ── Quick Create by Student ID ── */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Quick Create Account by Student ID
            </CardTitle>
            <CardDescription>
              Enter a student's ID to instantly create their portal login. The student can then sign in with that ID and password <strong>12345678</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[220px] space-y-1">
                <Label htmlFor="quick-student-id">Student ID</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="quick-student-id"
                    value={quickId}
                    onChange={(e) => { setQuickId(e.target.value); setQuickResult(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && quickId.trim()) quickCreateMutation.mutate(quickId.trim()); }}
                    placeholder="e.g. C5-A-2026-0001"
                    className="pl-9"
                    data-testid="input-quick-student-id"
                  />
                </div>
              </div>
              <Button
                onClick={() => { if (quickId.trim()) quickCreateMutation.mutate(quickId.trim()); }}
                disabled={!quickId.trim() || quickCreateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-quick-create"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                {quickCreateMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </div>
            {quickResult && (
              <div className={`mt-3 flex items-start gap-2 text-sm p-3 rounded-md ${
                quickResult.type === "success"
                  ? "bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
              }`} data-testid="text-quick-result">
                {quickResult.type === "success" && <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                {quickResult.msg}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Filters + Bulk Create ── */}
        <div className="flex gap-4 items-end flex-wrap">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Filter by class:</Label>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Filter by section:</Label>
            <Select value={filterSection} onValueChange={setFilterSection}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              if (filterClass !== "all") {
                bulkCreateByClassMutation.mutate({ className: filterClass, section: filterSection !== "all" ? filterSection : undefined });
              } else {
                toast({ title: "Please select a class first" });
              }
            }}
            disabled={bulkCreateByClassMutation.isPending}
            variant="outline"
            data-testid="button-bulk-create-class"
          >
            <Users className="w-4 h-4 mr-1" /> Bulk Create Accounts for This Class
          </Button>
        </div>

        {/* ── Unregistered Students ── */}
        {filteredUnregistered.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Students Without Accounts ({filteredUnregistered.length})</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={selectAll} data-testid="button-select-all">
                    {selectedStudentIds.length === filteredUnregistered.length ? "Deselect All" : "Select All"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => createAccountsMutation.mutate(selectedStudentIds)}
                    disabled={selectedStudentIds.length === 0 || createAccountsMutation.isPending}
                    data-testid="button-create-accounts"
                  >
                    <UserPlus className="w-4 h-4 mr-1" /> Create Accounts ({selectedStudentIds.length})
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-2 w-10"></th>
                      <th className="text-left p-2">Student ID</th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Class</th>
                      <th className="text-left p-2">Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnregistered.map(s => (
                      <tr key={s.studentId} className="border-t">
                        <td className="p-2">
                          <Checkbox
                            checked={selectedStudentIds.includes(s.studentId)}
                            onCheckedChange={() => toggleSelection(s.studentId)}
                            data-testid={`checkbox-${s.studentId}`}
                          />
                        </td>
                        <td className="p-2 font-mono">{s.studentId}</td>
                        <td className="p-2">{s.name}</td>
                        <td className="p-2">{s.class}</td>
                        <td className="p-2">{s.section}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Existing Accounts ── */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Registered Accounts ({filteredAccounts.length})</h3>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
          ) : filteredAccounts.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No accounts created yet. Use Quick Create above to get started.</CardContent></Card>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Student ID</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Class</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Last Login</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((a: any) => (
                    <tr key={a.id} className="border-t" data-testid={`row-account-${a.id}`}>
                      <td className="p-3 font-mono">{a.studentId}</td>
                      <td className="p-3">{a.studentName}</td>
                      <td className="p-3">{a.className} - {a.section}</td>
                      <td className="p-3">
                        <Badge variant={a.isActive ? "default" : "secondary"}>
                          {a.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {a.lastLogin ? new Date(a.lastLogin).toLocaleDateString() : "Never logged in"}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm("Reset password to 12345678?")) resetPasswordMutation.mutate(a.studentId);
                            }}
                            data-testid={`button-reset-${a.id}`}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" /> Reset Password
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-950"
                            onClick={() => {
                              if (confirm("Reset this student's ID card request for the current month?")) resetIdCardMutation.mutate(a.studentId);
                            }}
                            data-testid={`button-idcard-reset-${a.id}`}
                          >
                            <IdCard className="w-3 h-3 mr-1" /> Reset ID Card
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ModuleLayout>
  );
}
