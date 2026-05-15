import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { curriculumNavItems, classes } from "./curriculum-data";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const sections = ["A", "B", "C", "D"];

export default function TeacherAssignmentsPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterClass, setFilterClass] = useState("all");

  const { data: staffTeachers = [], isLoading: staffLoading } = useQuery<any[]>({
    queryKey: ['/api/curriculum/staff-teachers'],
    queryFn: async () => {
      const res = await fetch('/api/curriculum/staff-teachers', { headers: { Authorization: `Bearer ${localStorage.getItem("emblazers_token")}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const { data: assignments = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/curriculum/teacher-assignments'],
    queryFn: async () => {
      const res = await fetch('/api/curriculum/teacher-assignments', { headers: { Authorization: `Bearer ${localStorage.getItem("emblazers_token")}` } });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/curriculum/teacher-assignments', data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/curriculum/teacher-assignments'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/curriculum/teacher-assignments/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/curriculum/teacher-assignments'] }),
  });

  const [form, setForm] = useState({ staffId: "", className: "", section: "", subject: "", dateAssigned: "" });

  const handleSubmit = async () => {
    const selectedStaff = staffTeachers.find(s => s.id === form.staffId);
    if (!selectedStaff || !form.className || !form.section || !form.subject) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    try {
      await createMutation.mutateAsync({
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        staffEmail: selectedStaff.email,
        className: form.className,
        section: form.section,
        subject: form.subject,
        assignedBy: session?.name || "Admin",
        dateAssigned: form.dateAssigned || new Date().toISOString().split('T')[0],
        isActive: true,
      });
      toast({ title: "Assignment created" });
      setDialogOpen(false);
      setForm({ staffId: "", className: "", section: "", subject: "", dateAssigned: "" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this assignment?")) return;
    await deleteMutation.mutateAsync(id);
    toast({ title: "Assignment removed" });
  };

  const filtered = filterClass === "all" ? assignments : assignments.filter((a: any) => a.className === filterClass);

  return (
    <ModuleLayout module="curriculum" navItems={curriculumNavItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Teacher Assignments</h1>
            <p className="text-muted-foreground">Assign staff members to classes and subjects</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-assignment"><Plus className="w-4 h-4 mr-2" /> Assign Teacher</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign Teacher to Class</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Staff Member</Label>
                  <Select value={form.staffId} onValueChange={v => setForm(f => ({ ...f, staffId: v }))}>
                    <SelectTrigger data-testid="select-staff"><SelectValue placeholder="Select staff" /></SelectTrigger>
                    <SelectContent>
                      {staffTeachers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.email})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={form.className} onValueChange={v => setForm(f => ({ ...f, className: v }))}>
                      <SelectTrigger data-testid="select-class"><SelectValue placeholder="Class" /></SelectTrigger>
                      <SelectContent>{classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v }))}>
                      <SelectTrigger data-testid="select-section"><SelectValue placeholder="Section" /></SelectTrigger>
                      <SelectContent>{sections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Enter subject"
                    data-testid="input-subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date Assigned</Label>
                  <Input
                    type="date"
                    value={form.dateAssigned}
                    onChange={e => setForm(f => ({ ...f, dateAssigned: e.target.value }))}
                    data-testid="input-date-assigned"
                  />
                </div>
                <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full" data-testid="button-submit-assignment">
                  {createMutation.isPending ? "Creating..." : "Create Assignment"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 items-center">
          <Label className="text-sm">Filter by class:</Label>
          <Select value={filterClass} onValueChange={setFilterClass}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No teacher assignments yet.</CardContent></Card>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Teacher</th>
                  <th className="text-left p-3 text-sm font-medium">Email</th>
                  <th className="text-left p-3 text-sm font-medium">Class</th>
                  <th className="text-left p-3 text-sm font-medium">Section</th>
                  <th className="text-left p-3 text-sm font-medium">Subject</th>
                  <th className="text-left p-3 text-sm font-medium">Date Assigned</th>
                  <th className="text-left p-3 text-sm font-medium">Status</th>
                  <th className="text-left p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: any) => (
                  <tr key={a.id} className="border-t" data-testid={`row-assignment-${a.id}`}>
                    <td className="p-3 text-sm font-medium">{a.staffName}</td>
                    <td className="p-3 text-sm text-muted-foreground">{a.staffEmail}</td>
                    <td className="p-3 text-sm">{a.className}</td>
                    <td className="p-3 text-sm">{a.section}</td>
                    <td className="p-3"><Badge variant="outline">{a.subject}</Badge></td>
                    <td className="p-3 text-sm">{a.dateAssigned ? new Date(a.dateAssigned).toLocaleDateString() : "-"}</td>
                    <td className="p-3"><Badge variant={a.isActive ? "default" : "secondary"}>{a.isActive ? "Active" : "Inactive"}</Badge></td>
                    <td className="p-3">
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(a.id)} data-testid={`button-delete-${a.id}`}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
