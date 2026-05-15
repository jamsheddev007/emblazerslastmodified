import { useState, useEffect } from "react";
import SuperLayout from "./layout";
import { superFetch } from "./super-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Loader2, School } from "lucide-react";

interface SchoolRow {
  id: number;
  name: string;
  logoUrl: string | null;
  subscriptionPlan: string;
  status: string;
  createdAt: string;
}

export default function SuperSchools() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolRow | null>(null);
  const [form, setForm] = useState({ name: "", logoUrl: "", subscriptionPlan: "free", status: "active" });
  const [saving, setSaving] = useState(false);

  const fetchSchools = () => {
    setLoading(true);
    superFetch("/api/super/schools")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setSchools(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSchools(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", logoUrl: "", subscriptionPlan: "free", status: "active" });
    setDialogOpen(true);
  };

  const openEdit = (s: SchoolRow) => {
    setEditing(s);
    setForm({ name: s.name, logoUrl: s.logoUrl || "", subscriptionPlan: s.subscriptionPlan, status: s.status });
    setDialogOpen(true);
  };

  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const url = editing ? `/api/super/schools/${editing.id}` : "/api/super/schools";
      const method = editing ? "PUT" : "POST";
      const res = await superFetch(url, { method, body: JSON.stringify(form) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Failed to save");
        setSaving(false);
        return;
      }
      setDialogOpen(false);
      fetchSchools();
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
            <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">Schools</h1>
            <p className="text-muted-foreground mt-1">Manage all schools in the system</p>
          </div>
          <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-add-school">
            <Plus className="w-4 h-4 mr-2" /> Add School
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : schools.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <School className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No schools found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((s) => (
                    <TableRow key={s.id} data-testid={`row-school-${s.id}`}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{s.subscriptionPlan}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.status === "active" ? "default" : "destructive"} className="capitalize">{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)} data-testid={`button-edit-school-${s.id}`}>
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
            <DialogTitle>{editing ? "Edit School" : "Add School"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {saveError && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">{saveError}</div>}
            <div className="space-y-2">
              <Label>School Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter school name" data-testid="input-school-name" />
            </div>
            <div className="space-y-2">
              <Label>Logo URL</Label>
              <Input value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." data-testid="input-logo-url" />
            </div>
            <div className="space-y-2">
              <Label>Subscription Plan</Label>
              <Select value={form.subscriptionPlan} onValueChange={(v) => setForm({ ...form, subscriptionPlan: v })}>
                <SelectTrigger data-testid="select-plan"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-save-school">
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SuperLayout>
  );
}
