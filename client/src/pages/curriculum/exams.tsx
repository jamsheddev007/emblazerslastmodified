import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { curriculumNavItems, useCurriculumData, terms, classes } from "./curriculum-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit } from "lucide-react";

export default function Exams() {
  const { exams, addExam, updateExam, isPending } = useCurriculumData();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<typeof exams[0] | null>(null);
  
  const [name, setName] = useState("");
  const [term, setTerm] = useState<typeof terms[number]>("Term 1");
  const [classRange, setClassRange] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const resetForm = () => {
    setName("");
    setTerm("Term 1");
    setClassRange("");
    setStartDate("");
    setEndDate("");
    setEditingExam(null);
  };

  const handleSubmit = async () => {
    if (!name || !term || !classRange || !startDate || !endDate) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      if (editingExam) {
        await updateExam(editingExam.id, { name, term, classRange, startDate, endDate });
        toast({ title: "Success", description: "Exam updated successfully" });
      } else {
        await addExam({ name, term, classRange, startDate, endDate });
        toast({ title: "Success", description: "Exam added successfully" });
      }
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Failed to save exam:", error);
      toast({ title: "Error", description: "Failed to save exam. Please try again.", variant: "destructive" });
    }
  };

  const handleEdit = (exam: typeof exams[0]) => {
    setEditingExam(exam);
    setName(exam.name);
    setTerm(exam.term as typeof term);
    setClassRange(exam.classRange);
    setStartDate(exam.startDate);
    setEndDate(exam.endDate);
    setIsOpen(true);
  };

  const columns = [
    { key: "name" as const, label: "Exam Name", sortable: true },
    { key: "term" as const, label: "Term", render: (item: typeof exams[0]) => <Badge variant="outline">{item.term}</Badge> },
    { key: "classRange" as const, label: "Classes" },
    { key: "startDate" as const, label: "Start Date", sortable: true },
    { key: "endDate" as const, label: "End Date" },
  ];

  const actions = (item: typeof exams[0]) => (
    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} data-testid={`button-edit-${item.id}`}>
      <Edit className="w-4 h-4" />
    </Button>
  );

  return (
    <ModuleLayout module="curriculum" navItems={curriculumNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Exams"
          description="Manage exams and assessments"
          actions={
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-exam">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Exam
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingExam ? "Edit Exam" : "Add New Exam"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Exam Name *</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g., First Term Examination" 
                      data-testid="input-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Term *</Label>
                      <Select value={term} onValueChange={(v) => setTerm(v as typeof term)}>
                        <SelectTrigger data-testid="select-term">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {terms.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Class Range *</Label>
                      <Input 
                        value={classRange} 
                        onChange={(e) => setClassRange(e.target.value)} 
                        placeholder="e.g., Class 1 - Class 5" 
                        data-testid="input-class-range"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        data-testid="input-start-date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date *</Label>
                      <Input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        data-testid="input-end-date"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-exam">
                      {isPending ? "Saving..." : editingExam ? "Update Exam" : "Add Exam"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          }
        />

        <DataTable
          data={exams}
          columns={columns}
          searchKey="name"
          searchPlaceholder="Search exams..."
          actions={actions}
          getRowKey={(item) => item.id}
        />
      </div>
    </ModuleLayout>
  );
}
