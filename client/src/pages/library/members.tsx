import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { libraryNavItems } from "./library-data";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import type { LibraryMember } from "@shared/schema";

export default function LibraryMembers() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<LibraryMember | null>(null);

  const [name, setName] = useState("");
  const [type, setType] = useState<"Student" | "Staff">("Student");
  const [contact, setContact] = useState("");
  const [referenceId, setReferenceId] = useState("");

  const { data: members = [], isLoading, error } = useQuery<LibraryMember[]>({
    queryKey: ["/api/library-members"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; contact: string; referenceId: string }) => {
      const res = await apiRequest("POST", "/api/library-members", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library-members"] });
      toast({ title: "Success", description: "Member added successfully" });
      resetForm();
      setIsOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add member", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LibraryMember> }) => {
      const res = await apiRequest("PATCH", `/api/library-members/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library-members"] });
      toast({ title: "Success", description: "Member updated successfully" });
      resetForm();
      setIsOpen(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update member", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/library-members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/library-members"] });
      toast({ title: "Success", description: "Member deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete member", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setType("Student");
    setContact("");
    setReferenceId("");
    setEditingMember(null);
  };

  const handleSubmit = async () => {
    if (!name || !contact || !referenceId) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (editingMember) {
      await updateMutation.mutateAsync({ id: editingMember.id, data: { name, type, contact, referenceId } });
    } else {
      await createMutation.mutateAsync({ name, type, contact, referenceId });
    }
  };

  const handleEdit = (member: LibraryMember) => {
    setEditingMember(member);
    setName(member.name);
    setType(member.type as "Student" | "Staff");
    setContact(member.contact);
    setReferenceId(member.referenceId);
    setIsOpen(true);
  };

  const columns = [
    { key: "memberId" as const, label: "Member ID" },
    { key: "name" as const, label: "Name", sortable: true },
    {
      key: "type" as const,
      label: "Type",
      render: (m: LibraryMember) => (
        <Badge variant={m.type === "Student" ? "default" : "secondary"} data-testid={`badge-type-${m.id}`}>
          {m.type}
        </Badge>
      ),
    },
    { key: "contact" as const, label: "Contact" },
    { key: "referenceId" as const, label: "Reference ID" },
  ];

  const actions = (member: LibraryMember) => (
    <div className="flex gap-2">
      <Button variant="ghost" size="icon" onClick={() => handleEdit(member)} data-testid={`button-edit-${member.id}`}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-red-500 hover:text-red-700"
        onClick={() => deleteMutation.mutate(member.id)}
        data-testid={`button-delete-${member.id}`}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <ModuleLayout module="library" navItems={libraryNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Library Members"
          description="Manage students and staff registered as library members"
          actions={
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-member">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingMember ? "Edit Member" : "Add New Member"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Member Type *</Label>
                    <Select value={type} onValueChange={(v) => setType(v as "Student" | "Staff")}>
                      <SelectTrigger data-testid="select-member-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      data-testid="input-member-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact (Phone / Email) *</Label>
                    <Input
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="Enter phone number or email"
                      data-testid="input-member-contact"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{type === "Student" ? "Admission Number" : "Employee ID"} *</Label>
                    <Input
                      value={referenceId}
                      onChange={(e) => setReferenceId(e.target.value)}
                      placeholder={type === "Student" ? "e.g. STU001" : "e.g. STF001"}
                      data-testid="input-reference-id"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-member">
                      {isPending ? "Saving..." : editingMember ? "Update Member" : "Add Member"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        {isLoading ? (
          <Card>
            <CardContent className="py-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-500 font-medium" data-testid="text-error">Failed to load library members. Please try refreshing the page.</p>
            </CardContent>
          </Card>
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground" data-testid="text-no-members">
                No library members yet. Click "Add Member" to register students or staff.
              </p>
            </CardContent>
          </Card>
        ) : (
          <DataTable
            data={members}
            columns={columns}
            searchKey="name"
            searchPlaceholder="Search members..."
            actions={actions}
            getRowKey={(m) => m.id}
          />
        )}
      </div>
    </ModuleLayout>
  );
}
