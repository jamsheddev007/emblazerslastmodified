import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ModuleLayout } from "@/components/layout/module-layout";
import { curriculumNavItems } from "./curriculum-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, RotateCcw, Pencil, Trash2, UsersRound, Search } from "lucide-react";
import type { Student } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function CurriculumParentAccounts() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formCnic, setFormCnic] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const { data: accounts = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/parent/accounts"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const createAccount = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/parent/accounts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent/accounts"] });
      resetForm();
      setIsCreateOpen(false);
      toast({ title: "Parent account created" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/parent/accounts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent/accounts"] });
      setEditingId(null);
      toast({ title: "Account updated" });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/parent/accounts/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parent/accounts"] });
      toast({ title: "Account deleted" });
    },
  });

  const resetForm = () => {
    setFormCnic("");
    setFormName("");
    setFormPhone("");
    setFormPassword("");
    setSelectedStudentIds([]);
    setStudentSearch("");
  };

  const handleCreate = () => {
    if (!formCnic) return;
    const pw = formPassword || formCnic.replace(/-/g, "").slice(-6);
    createAccount.mutate({
      cnic: formCnic,
      fullName: formName,
      phone: formPhone,
      password: pw,
      studentIds: selectedStudentIds,
    });
  };

  const handleCnicChange = (val: string) => {
    setFormCnic(val);
    if (!formPassword) {
      setFormPassword(val.replace(/-/g, "").slice(-6));
    }
  };

  const filteredAccounts = accounts.filter((a: any) =>
    !searchTerm ||
    a.cnic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students.filter((s: any) =>
    s.status === "Active" &&
    (studentSearch === "" ||
      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(studentSearch.toLowerCase()))
  ).slice(0, 10);

  return (
    <ModuleLayout module="curriculum" navItems={curriculumNavItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">Parent Accounts</h1>
            <p className="text-muted-foreground mt-1">Manage parent portal accounts and linked students</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => { setIsCreateOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-violet-500 hover:bg-violet-600" data-testid="button-create-account">
                <Plus className="w-4 h-4 mr-2" /> Create Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Parent Account</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>CNIC Number *</Label>
                  <Input value={formCnic} onChange={(e) => handleCnicChange(e.target.value)} placeholder="3520112345678" data-testid="input-create-cnic" />
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Parent name" data-testid="input-create-name" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="03001234567" data-testid="input-create-phone" />
                </div>
                <div className="space-y-2">
                  <Label>Default Password</Label>
                  <Input value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Last 6 digits of CNIC" data-testid="input-create-password" />
                  <p className="text-xs text-muted-foreground">Leave blank to use last 6 digits of CNIC</p>
                </div>
                <div className="space-y-2">
                  <Label>Link Students</Label>
                  <Input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search student name or ID..." data-testid="input-student-search" />
                  {studentSearch && filteredStudents.length > 0 && (
                    <div className="border rounded-md max-h-40 overflow-y-auto">
                      {filteredStudents.map((s: any) => (
                        <button
                          key={s.studentId}
                          onClick={() => {
                            if (!selectedStudentIds.includes(s.studentId)) {
                              setSelectedStudentIds([...selectedStudentIds, s.studentId]);
                            }
                            setStudentSearch("");
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex justify-between"
                          data-testid={`button-select-student-${s.studentId}`}
                        >
                          <span>{s.name}</span>
                          <span className="text-muted-foreground">{s.studentId} ({s.class}-{s.section})</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedStudentIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedStudentIds.map((sid) => {
                        const st = students.find((s: any) => s.studentId === sid);
                        return (
                          <Badge key={sid} variant="secondary" className="gap-1">
                            {st?.name || sid}
                            <button onClick={() => setSelectedStudentIds(selectedStudentIds.filter(id => id !== sid))} className="ml-1 text-xs hover:text-destructive">&times;</button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
                <Button onClick={handleCreate} className="w-full bg-violet-500 hover:bg-violet-600" disabled={!formCnic || createAccount.isPending} data-testid="button-save-account">
                  {createAccount.isPending ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by CNIC or name..."
            className="max-w-sm"
            data-testid="input-search-accounts"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAccounts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <UsersRound className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground" data-testid="text-no-accounts">No parent accounts found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAccounts.map((account: any) => (
              <Card key={account.id} data-testid={`card-account-${account.id}`}>
                <CardContent className="p-4">
                  {editingId === account.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Name</Label>
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} data-testid="input-edit-name" />
                        </div>
                        <div>
                          <Label className="text-xs">Phone</Label>
                          <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} data-testid="input-edit-phone" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateAccount.mutate({ id: account.id, data: { fullName: editName, phone: editPhone } })} className="bg-violet-500 hover:bg-violet-600" data-testid="button-save-edit">Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} data-testid="button-cancel-edit">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium" data-testid={`text-account-name-${account.id}`}>{account.fullName || "No Name"}</span>
                          <Badge variant={account.isActive ? "default" : "secondary"} data-testid={`badge-status-${account.id}`}>
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-account-cnic-${account.id}`}>CNIC: {account.cnic}</div>
                        {account.phone && <div className="text-sm text-muted-foreground">Phone: {account.phone}</div>}
                        {account.linkedStudents && account.linkedStudents.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {account.linkedStudents.map((sid: string) => (
                              <Badge key={sid} variant="outline" className="text-xs" data-testid={`badge-student-${sid}`}>{sid}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setEditingId(account.id); setEditName(account.fullName || ""); setEditPhone(account.phone || ""); }}
                          data-testid={`button-edit-${account.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { if (confirm("Reset password to last 6 digits of CNIC?")) updateAccount.mutate({ id: account.id, data: { resetPassword: true } }); }}
                          data-testid={`button-reset-${account.id}`}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => { if (confirm("Delete this parent account?")) deleteAccount.mutate(account.id); }}
                          data-testid={`button-delete-${account.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ModuleLayout>
  );
}
