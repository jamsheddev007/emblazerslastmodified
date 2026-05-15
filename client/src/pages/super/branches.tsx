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
import { Plus, Pencil, Loader2, GitBranch } from "lucide-react";

interface BranchRow {
  id: number;
  schoolId: number;
  name: string;
  address: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
}

interface SchoolOption {
  id: number;
  name: string;
}

export default function SuperBranches() {
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BranchRow | null>(null);
  const [form, setForm] = useState({ schoolId: "", name: "", address: "", phone: "", status: "active" });
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      superFetch("/api/super/branches").then((r) => r.json()),
      superFetch("/api/super/schools").then((r) => r.json()),
    ])
      .then(([b, s]) => { if (Array.isArray(b)) setBranches(b); if (Array.isArray(s)) setSchools(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const getSchoolName = (schoolId: number) => schools.find((s) => s.id === schoolId)?.name || "—";

  const openAdd = () => {
    setEditing(null);
    setForm({ schoolId: schools[0]?.id?.toString() || "", name: "", address: "", phone: "", status: "active" });
    setDialogOpen(true);
  };

  const openEdit = (b: BranchRow) => {
    setEditing(b);
    setForm({ schoolId: b.schoolId.toString(), name: b.name, address: b.address || "", phone: b.phone || "", status: b.status });
    setDialogOpen(true);
  };

  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const url = editing ? `/api/super/branches/${editing.id}` : "/api/super/branches";
      const method = editing ? "PUT" : "POST";
      const res = await superFetch(url, { method, body: JSON.stringify({ ...form, schoolId: parseInt(form.schoolId) }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Failed to save");
        setSaving(false);
        return;
      }
      setDialogOpen(false);
      fetchData();
    } catch {
      setSaveError("Network error");
    }
    setSaving(false);
  };

  return (
    <SuperLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">Branches</h1>
            <p className="text-muted-foreground mt-1">Manage all branches across schools</p>
          </div>
          <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-add-branch">
            <Plus className="w-4 h-4 mr-2" /> Add Branch
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : branches.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No branches found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch Name</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((b) => (
                    <TableRow key={b.id} data-testid={`row-branch-${b.id}`}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell>{getSchoolName(b.schoolId)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{b.address || "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{b.phone || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={b.status === "active" ? "default" : "destructive"} className="capitalize">{b.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)} data-testid={`button-edit-branch-${b.id}`}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Branch" : "Add Branch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {saveError && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">{saveError}</div>}
            <div className="space-y-2">
              <Label>School</Label>
              <Select value={form.schoolId} onValueChange={(v) => setForm({ ...form, schoolId: v })}>
                <SelectTrigger data-testid="select-school"><SelectValue placeholder="Select school" /></SelectTrigger>
                <SelectContent>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter branch name" data-testid="input-branch-name" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Enter address" data-testid="input-address" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Enter phone" data-testid="input-phone" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="select-branch-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.schoolId} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-save-branch">
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperLayout>
  );
}
