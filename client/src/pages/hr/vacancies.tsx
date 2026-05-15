import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge, type Column } from "@/components/shared/data-table";
import { hrNavItems, useHRData, departments, designations } from "./hr-data";
import { type Vacancy, type InsertVacancy } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Link2, ExternalLink, Copy } from "lucide-react";
import { logAction } from "@/lib/activity-logger";

const employmentTypes = ["Permanent", "Contract", "Visiting"] as const;
const vacancyStatuses = ["Open", "Closed", "On Hold"] as const;

export default function Vacancies() {
  const { vacancies, addVacancy, updateVacancy, deleteVacancy, isPending } = useHRData();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [formData, setFormData] = useState<InsertVacancy>({
    title: "",
    department: "",
    designation: "",
    positions: 1,
    employmentType: "Permanent",
    salaryRange: "",
    qualifications: "",
    experience: "",
    description: "",
    lastDate: "",
    status: "Open",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      department: "",
      designation: "",
      positions: 1,
      employmentType: "Permanent",
      salaryRange: "",
      qualifications: "",
      experience: "",
      description: "",
      lastDate: "",
      status: "Open",
    });
    setEditingVacancy(null);
  };

  const handleAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleEdit = (vacancy: Vacancy) => {
    setEditingVacancy(vacancy);
    setFormData({
      title: vacancy.title,
      department: vacancy.department,
      designation: vacancy.designation,
      positions: vacancy.positions,
      employmentType: vacancy.employmentType,
      salaryRange: vacancy.salaryRange || "",
      qualifications: vacancy.qualifications,
      experience: vacancy.experience,
      description: vacancy.description,
      lastDate: vacancy.lastDate,
      status: vacancy.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (vacancy: Vacancy) => {
    if (!confirm(`Are you sure you want to delete the vacancy "${vacancy.title}"?`)) return;
    try {
      await deleteVacancy(vacancy.id);
      await logAction({
        module: "hr",
        action: "delete",
        entityType: "Vacancy",
        entityId: vacancy.id,
        entityName: vacancy.title,
        description: `Deleted vacancy: ${vacancy.title} (${vacancy.department})`,
        link: "/hr/vacancies",
        notificationTitle: "Vacancy Deleted",
        metadata: { department: vacancy.department, designation: vacancy.designation },
      });
      toast({ title: "Success", description: "Vacancy deleted successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete vacancy", variant: "destructive" });
    }
  };

  const handleShowLink = (vacancy: Vacancy) => {
    setSelectedVacancy(vacancy);
    setLinkDialogOpen(true);
  };

  const copyLink = () => {
    if (selectedVacancy) {
      const link = `${window.location.origin}/careers/${selectedVacancy.id}`;
      navigator.clipboard.writeText(link);
      toast({ title: "Link Copied", description: "Public vacancy link copied to clipboard" });
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.department || !formData.designation || !formData.qualifications || !formData.experience || !formData.description || !formData.lastDate) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    try {
      if (editingVacancy) {
        await updateVacancy(editingVacancy.id, formData);
        await logAction({
          module: "hr",
          action: "update",
          entityType: "Vacancy",
          entityId: editingVacancy.id,
          entityName: formData.title,
          description: `Updated vacancy: ${formData.title} (${formData.department} - ${formData.positions} positions)`,
          link: "/hr/vacancies",
          notificationTitle: "Vacancy Updated",
          metadata: { department: formData.department, designation: formData.designation, positions: formData.positions },
        });
        toast({ title: "Success", description: "Vacancy updated successfully" });
      } else {
        await addVacancy(formData);
        await logAction({
          module: "hr",
          action: "create",
          entityType: "Vacancy",
          entityName: formData.title,
          description: `Posted new vacancy: ${formData.title} (${formData.department} - ${formData.positions} positions)`,
          link: "/hr/vacancies",
          notificationTitle: "New Vacancy Posted",
          metadata: { department: formData.department, designation: formData.designation, positions: formData.positions },
        });
        toast({ title: "Success", description: "Vacancy created successfully" });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save vacancy", variant: "destructive" });
    }
  };

  const columns: Column<Vacancy>[] = [
    { key: "title", label: "Position" },
    { key: "department", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "positions", label: "Positions" },
    { key: "employmentType", label: "Type" },
    { key: "lastDate", label: "Last Date" },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions" as keyof Vacancy,
      label: "Actions",
      render: (item) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); handleShowLink(item); }}
            title="Get Public Link"
            data-testid={`button-link-${item.id}`}
          >
            <Link2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
            title="Edit"
            data-testid={`button-edit-${item.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
            title="Delete"
            data-testid={`button-delete-${item.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ModuleLayout module="hr" navItems={hrNavItems}>
      <PageHeader
        title="Vacancies"
        description="Manage job openings and generate public application links"
        actions={
          <Button onClick={handleAdd} data-testid="button-add-vacancy">
            <Plus className="h-4 w-4 mr-2" />
            Add Vacancy
          </Button>
        }
      />

      <DataTable
        data={vacancies}
        columns={columns}
        searchPlaceholder="Search vacancies..."
        searchKeys={["title", "department", "designation"]}
        getRowKey={(item) => item.id}
        emptyMessage="No vacancies found. Click 'Add Vacancy' to create one."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVacancy ? "Edit Vacancy" : "Add New Vacancy"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Position Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Teacher"
                  data-testid="input-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger data-testid="select-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="designation">Designation *</Label>
                <Select
                  value={formData.designation}
                  onValueChange={(value) => setFormData({ ...formData, designation: value })}
                >
                  <SelectTrigger data-testid="select-designation">
                    <SelectValue placeholder="Select designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map((des) => (
                      <SelectItem key={des} value={des}>{des}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="positions">Number of Positions *</Label>
                <Input
                  id="positions"
                  type="number"
                  min={1}
                  value={formData.positions}
                  onChange={(e) => setFormData({ ...formData, positions: parseInt(e.target.value) || 1 })}
                  data-testid="input-positions"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value: typeof employmentTypes[number]) => setFormData({ ...formData, employmentType: value })}
                >
                  <SelectTrigger data-testid="select-employment-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryRange">Salary Range</Label>
                <Input
                  id="salaryRange"
                  value={formData.salaryRange}
                  onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                  placeholder="e.g. PKR 50,000 - 80,000"
                  data-testid="input-salary-range"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qualifications">Qualifications *</Label>
                <Input
                  id="qualifications"
                  value={formData.qualifications}
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                  placeholder="e.g. M.Ed or B.Ed with 5 years experience"
                  data-testid="input-qualifications"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience *</Label>
                <Input
                  id="experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  placeholder="e.g. 3-5 years"
                  data-testid="input-experience"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastDate">Last Date to Apply *</Label>
                <Input
                  id="lastDate"
                  type="date"
                  value={formData.lastDate}
                  onChange={(e) => setFormData({ ...formData, lastDate: e.target.value })}
                  data-testid="input-last-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: typeof vacancyStatuses[number]) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {vacancyStatuses.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter detailed job description, responsibilities, etc."
                rows={4}
                data-testid="input-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save">
              {isPending ? "Saving..." : (editingVacancy ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Public Vacancy Link</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Share this link with candidates to view the vacancy and apply:
            </p>
            {selectedVacancy && (
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/careers/${selectedVacancy.id}`}
                  data-testid="input-public-link"
                />
                <Button onClick={copyLink} variant="outline" data-testid="button-copy-link">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            )}
            <div className="mt-4 flex justify-between">
              <a
                href={selectedVacancy ? `/careers/${selectedVacancy.id}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary flex items-center gap-1 hover:underline"
                data-testid="link-open-public"
              >
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </a>
              <a
                href="/careers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary flex items-center gap-1 hover:underline"
                data-testid="link-all-vacancies"
              >
                <ExternalLink className="h-4 w-4" />
                View all vacancies
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
