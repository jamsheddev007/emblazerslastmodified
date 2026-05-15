import { useState, useEffect } from "react";
import SuperLayout from "./layout";
import { superFetch } from "./super-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, KeyRound, Loader2, Users, Shield, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MODULE_OPTIONS = [
  "student", "hr", "fee", "payroll", "finance", "attendance",
  "timetable", "datesheet", "curriculum", "pos", "library", "transport", "hostel",
];

const FEATURE_LABELS: Record<string, string> = {
  students: "Students",
  alumni: "Alumni",
  reports: "Reports",
  bulk_import: "Bulk Import",
  staff: "Staff Records",
  vacancies: "Vacancies",
  applicants: "Applicants",
  structures: "Fee Structures",
  challans: "Challans",
  payments: "Payments",
  generate: "Generate Payroll",
  mark_paid: "Mark as Paid",
  accounts: "Chart of Accounts",
  vouchers: "Journal Entries",
  expenses: "Expenses",
  vendors: "Vendors",
  mark: "Mark Attendance",
  edit: "Edit Records",
  delete: "Delete Records",
  books: "Books",
  issue_return: "Issue / Return",
  routes: "Routes",
  vehicles: "Vehicles",
  drivers: "Drivers",
  allocation: "Allocation",
  rooms: "Rooms",
  residents: "Residents",
  fees: "Hostel Fees",
  items: "POS Items",
  sales: "Sales",
  slots: "Time Slots",
  schedules: "Schedules",
  exams: "Exams",
  subjects: "Subjects",
  content: "Content",
  quizzes: "Quizzes",
  results: "Results",
};

const ACTION_LABELS: Record<string, string> = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete",
  export: "Export",
  bulk_import: "Bulk Import",
};

const PRESET_OPTIONS = [
  { value: "full_access", label: "Full Access" },
  { value: "view_only", label: "View Only" },
  { value: "no_delete", label: "No Delete" },
  { value: "data_entry", label: "Data Entry" },
];

interface AdminRow {
  id: number;
  module: string;
  email: string;
  name: string;
  role: string;
  branchId: number | null;
  branchName: string | null;
  schoolId: number | null;
  schoolName: string | null;
  lastLogin: string | null;
}

interface BranchOption {
  id: number;
  name: string;
  schoolId: number;
}

type PermMatrix = Record<string, Record<string, boolean>>;

function getActionsForFeature(feature: string): string[] {
  if (feature === "reports") return ["view", "export"];
  if (feature === "bulk_import") return ["view", "bulk_import"];
  return ["view", "create", "edit", "delete", "export"];
}

export default function SuperAdmins() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<AdminRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", module: "student", branchId: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [permOpen, setPermOpen] = useState(false);
  const [permTarget, setPermTarget] = useState<AdminRow | null>(null);
  const [permFeatures, setPermFeatures] = useState<string[]>([]);
  const [permActions, setPermActions] = useState<string[]>([]);
  const [permMatrix, setPermMatrix] = useState<PermMatrix>({});
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [hasCustomPerms, setHasCustomPerms] = useState(false);
  const [allPermsMap, setAllPermsMap] = useState<Record<number, boolean>>({});

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      superFetch("/api/super/admins").then((r) => r.json()),
      superFetch("/api/super/branches").then((r) => r.json()),
      superFetch("/api/super/permissions-all").then(r => r.json()).catch(() => []),
    ])
      .then(([a, b, perms]) => {
        if (Array.isArray(a)) setAdmins(a);
        if (Array.isArray(b)) setBranches(b);
        if (Array.isArray(perms)) {
          const map: Record<number, boolean> = {};
          perms.forEach((p: any) => { map[p.moduleUserId] = true; });
          setAllPermsMap(map);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setForm({ name: "", email: "", password: "", module: "student", branchId: branches[0]?.id?.toString() || "" });
    setCreateOpen(true);
  };

  const [createError, setCreateError] = useState("");

  const handleCreate = async () => {
    setSaving(true);
    setCreateError("");
    try {
      const res = await superFetch("/api/super/admins", {
        method: "POST",
        body: JSON.stringify({ ...form, branchId: form.branchId ? parseInt(form.branchId) : null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCreateError(data.error || "Failed to create admin");
        setSaving(false);
        return;
      }
      setCreateOpen(false);
      fetchData();
    } catch {
      setCreateError("Network error");
    }
    setSaving(false);
  };

  const openReset = (admin: AdminRow) => {
    setResetTarget(admin);
    setNewPassword("");
    setResetOpen(true);
  };

  const [resetError, setResetError] = useState("");

  const handleReset = async () => {
    if (!resetTarget) return;
    setSaving(true);
    setResetError("");
    try {
      const res = await superFetch(`/api/super/admins/${resetTarget.id}/reset-password`, {
        method: "PUT",
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setResetError(data.error || "Failed to reset password");
        setSaving(false);
        return;
      }
      setResetOpen(false);
    } catch {
      setResetError("Network error");
    }
    setSaving(false);
  };

  const openPermissions = async (admin: AdminRow) => {
    setPermTarget(admin);
    setPermOpen(true);
    setPermLoading(true);

    try {
      const res = await superFetch(`/api/super/permissions/${admin.id}`);
      const data = await res.json();

      setPermFeatures(data.features || []);
      setPermActions(data.actions || []);

      if (data.permissions) {
        setPermMatrix(data.permissions);
        setHasCustomPerms(true);
      } else {
        const presetRes = await superFetch(`/api/super/permission-presets/${admin.module}`);
        const presetData = await presetRes.json();
        setPermMatrix(presetData.presets.full_access || {});
        setHasCustomPerms(false);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load permissions", variant: "destructive" });
    }
    setPermLoading(false);
  };

  const togglePerm = (feature: string, action: string) => {
    setPermMatrix(prev => ({
      ...prev,
      [feature]: {
        ...prev[feature],
        [action]: !prev[feature]?.[action],
      },
    }));
  };

  const applyPreset = async (preset: string) => {
    if (!permTarget) return;
    try {
      const res = await superFetch(`/api/super/permission-presets/${permTarget.module}`);
      const data = await res.json();
      if (data.presets[preset]) {
        setPermMatrix(data.presets[preset]);
      }
    } catch {}
  };

  const savePermissions = async () => {
    if (!permTarget) return;
    setPermSaving(true);
    try {
      const res = await superFetch(`/api/super/permissions/${permTarget.id}`, {
        method: "PUT",
        body: JSON.stringify({ permissions: permMatrix }),
      });
      if (res.ok) {
        toast({ title: "Saved", description: `Permissions updated for ${permTarget.name}` });
        setPermOpen(false);
        setHasCustomPerms(true);
        setAllPermsMap(prev => ({ ...prev, [permTarget.id]: true }));
      } else {
        toast({ title: "Error", description: "Failed to save permissions", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
    setPermSaving(false);
  };

  const resetPermissions = async () => {
    if (!permTarget) return;
    setPermSaving(true);
    try {
      const res = await superFetch(`/api/super/permissions/${permTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "Reset", description: `Permissions reset to default (full access) for ${permTarget.name}` });
        setPermOpen(false);
        setHasCustomPerms(false);
        setAllPermsMap(prev => { const n = { ...prev }; delete n[permTarget.id]; return n; });
      }
    } catch {}
    setPermSaving(false);
  };

  return (
    <SuperLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">Module Admins</h1>
            <p className="text-muted-foreground mt-1">Manage admin accounts and permissions for all modules</p>
          </div>
          <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-create-admin">
            <Plus className="w-4 h-4 mr-2" /> Create Admin
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No admins found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((a) => (
                    <TableRow key={a.id} data-testid={`row-admin-${a.id}`}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{a.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{a.module}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{a.branchName || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground" data-testid={`text-last-login-${a.id}`}>
                        {a.lastLogin
                          ? new Date(a.lastLogin).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        {allPermsMap[a.id] ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">Custom</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-300">Full Access</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openPermissions(a)} data-testid={`button-permissions-${a.id}`}>
                            <Shield className="w-4 h-4 mr-1" /> Permissions
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openReset(a)} data-testid={`button-reset-${a.id}`}>
                            <KeyRound className="w-4 h-4 mr-1" /> Reset
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {createError && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">{createError}</div>}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Admin name" data-testid="input-admin-name" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@example.com" type="email" data-testid="input-admin-email" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password" type="password" data-testid="input-admin-password" />
            </div>
            <div className="space-y-2">
              <Label>Module</Label>
              <Select value={form.module} onValueChange={(v) => setForm({ ...form, module: v })}>
                <SelectTrigger data-testid="select-module"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                <SelectTrigger data-testid="select-branch"><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name || !form.email || !form.password} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-save-admin">
              {saving ? "Creating..." : "Create Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {resetError && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">{resetError}</div>}
            <p className="text-sm text-muted-foreground">
              Reset password for <span className="font-medium text-foreground">{resetTarget?.name}</span> ({resetTarget?.email})
            </p>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" type="password" data-testid="input-new-password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button onClick={handleReset} disabled={saving || !newPassword} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-confirm-reset">
              {saving ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Set Permissions
            </DialogTitle>
            {permTarget && (
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-medium text-foreground">{permTarget.email}</span> | Module: <Badge variant="secondary" className="capitalize ml-1">{permTarget.module}</Badge> | Branch: {permTarget.branchName || "—"}
              </p>
            )}
          </DialogHeader>

          {permLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Label className="text-sm font-medium">Quick Preset:</Label>
                {PRESET_OPTIONS.map(p => (
                  <Button key={p.value} variant="outline" size="sm" onClick={() => applyPreset(p.value)} data-testid={`button-preset-${p.value}`}>
                    {p.label}
                  </Button>
                ))}
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm" data-testid="table-permissions">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="p-3 text-left font-medium min-w-[160px]">Feature</th>
                      {["view", "create", "edit", "delete", "export", "bulk_import"].map(a => (
                        <th key={a} className="p-3 text-center font-medium min-w-[80px]">{ACTION_LABELS[a]}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permFeatures.map((feature, fi) => {
                      const validActions = getActionsForFeature(feature);
                      return (
                        <tr key={feature} className={fi % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <td className="p-3 font-medium">{FEATURE_LABELS[feature] || feature}</td>
                          {["view", "create", "edit", "delete", "export", "bulk_import"].map(action => (
                            <td key={action} className="p-3 text-center">
                              {validActions.includes(action) ? (
                                <div className="flex justify-center">
                                  <Switch
                                    checked={!!permMatrix[feature]?.[action]}
                                    onCheckedChange={() => togglePerm(feature, action)}
                                    data-testid={`switch-${feature}-${action}`}
                                  />
                                </div>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hasCustomPerms && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> This admin has custom permissions set
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between gap-2 pt-2">
            <div>
              {hasCustomPerms && (
                <Button variant="outline" onClick={resetPermissions} disabled={permSaving} className="text-red-600 border-red-200 hover:bg-red-50" data-testid="button-reset-permissions">
                  Reset to Default
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPermOpen(false)}>Cancel</Button>
              <Button onClick={savePermissions} disabled={permSaving} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-save-permissions">
                {permSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Save Permissions
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperLayout>
  );
}
