import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { studentNavItems, useStudentData, classes, sections, statuses } from "./student-data";
import { type Student } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function EditStudent() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getStudent, isLoading } = useStudentData();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const student = getStudent(id || "");

  const [fields, setFields] = useState({
    name: "",
    gender: "Male",
    dob: "",
    bform: "",
    parentName: "",
    parentContact: "",
    parentEmail: "",
    fatherCnic: "",
    motherCnic: "",
    address: "",
    class: "Class 1",
    section: "A",
    admissionDate: "",
    status: "Active",
    previousSchool: "",
    previousClass: "",
    notes: "",
  });

  useEffect(() => {
    if (student) {
      setFields({
        name: student.name ?? "",
        gender: student.gender ?? "Male",
        dob: student.dob ?? "",
        bform: student.bform ?? "",
        parentName: student.parentName ?? "",
        parentContact: student.parentContact ?? "",
        parentEmail: student.parentEmail ?? "",
        fatherCnic: student.fatherCnic ?? "",
        motherCnic: student.motherCnic ?? "",
        address: student.address ?? "",
        class: student.class ?? "Class 1",
        section: student.section ?? "A",
        admissionDate: student.admissionDate ?? "",
        status: student.status ?? "Active",
        previousSchool: student.previousSchool ?? "",
        previousClass: student.previousClass ?? "",
        notes: student.notes ?? "",
      });
    }
  }, [student?.id]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const setSelect = (key: string) => (value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fields.name.trim()) {
      toast({ title: "Required", description: "Full name is required.", variant: "destructive" });
      return;
    }
    if (!fields.dob.trim()) {
      toast({ title: "Required", description: "Date of birth is required.", variant: "destructive" });
      return;
    }
    if (!fields.bform.trim()) {
      toast({ title: "Required", description: "B-Form number is required.", variant: "destructive" });
      return;
    }
    if (!fields.parentName.trim()) {
      toast({ title: "Required", description: "Parent/guardian name is required.", variant: "destructive" });
      return;
    }
    if (!fields.parentContact.trim()) {
      toast({ title: "Required", description: "Contact number is required.", variant: "destructive" });
      return;
    }
    if (!fields.address.trim()) {
      toast({ title: "Required", description: "Address is required.", variant: "destructive" });
      return;
    }
    if (!fields.admissionDate.trim()) {
      toast({ title: "Required", description: "Admission date is required.", variant: "destructive" });
      return;
    }

    const payload: Partial<Student> = {
      name: fields.name.trim(),
      gender: fields.gender as Student["gender"],
      dob: fields.dob,
      bform: fields.bform.trim(),
      parentName: fields.parentName.trim(),
      parentContact: fields.parentContact.trim(),
      parentEmail: fields.parentEmail.trim() || undefined,
      fatherCnic: fields.fatherCnic.trim() || undefined,
      motherCnic: fields.motherCnic.trim() || undefined,
      address: fields.address.trim(),
      class: fields.class,
      section: fields.section,
      admissionDate: fields.admissionDate,
      status: fields.status as Student["status"],
      previousSchool: fields.previousSchool.trim() || undefined,
      previousClass: fields.previousClass.trim() || undefined,
      notes: fields.notes.trim() || undefined,
    };

    try {
      setSaving(true);
      const res = await apiRequest("PATCH", `/api/students/${id}`, payload);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({
          title: "Save failed",
          description: body.error || `Server returned ${res.status}`,
          variant: "destructive",
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Student updated", description: "Changes saved successfully." });
      setLocation(`/student/profile/${id}`);
    } catch (err: any) {
      console.error("Update student error:", err);
      toast({ title: "Error", description: err.message || "Failed to save. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !student) {
    return (
      <ModuleLayout module="student" navItems={studentNavItems}>
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading student data…</p>
        </div>
      </ModuleLayout>
    );
  }

  if (!student) {
    return (
      <ModuleLayout module="student" navItems={studentNavItems}>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Student not found</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/student/list")}>
            Back to List
          </Button>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="student" navItems={studentNavItems}>
      <PageHeader title="Edit Student" description={`Editing ${student.name}`} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={fields.name} onChange={set("name")} data-testid="input-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={fields.gender} onValueChange={setSelect("gender")}>
                <SelectTrigger data-testid="select-gender">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input id="dob" type="date" value={fields.dob} onChange={set("dob")} data-testid="input-dob" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bform">B-Form *</Label>
              <Input id="bform" value={fields.bform} onChange={set("bform")} placeholder="xxxxx-xxxxxxx-x" data-testid="input-bform" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Family Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent/Guardian Name *</Label>
              <Input id="parentName" value={fields.parentName} onChange={set("parentName")} data-testid="input-parent-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentContact">Contact Number *</Label>
              <Input id="parentContact" value={fields.parentContact} onChange={set("parentContact")} data-testid="input-parent-contact" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentEmail">Email Address</Label>
              <Input id="parentEmail" type="email" value={fields.parentEmail} onChange={set("parentEmail")} data-testid="input-parent-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fatherCnic">Father's CNIC</Label>
              <Input id="fatherCnic" value={fields.fatherCnic} onChange={set("fatherCnic")} placeholder="XXXXX-XXXXXXX-X" maxLength={15} data-testid="input-father-cnic" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motherCnic">Mother's CNIC</Label>
              <Input id="motherCnic" value={fields.motherCnic} onChange={set("motherCnic")} placeholder="XXXXX-XXXXXXX-X" maxLength={15} data-testid="input-mother-cnic" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea id="address" value={fields.address} onChange={set("address")} className="resize-none" data-testid="input-address" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={fields.class} onValueChange={setSelect("class")}>
                <SelectTrigger data-testid="select-class">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section *</Label>
              <Select value={fields.section} onValueChange={setSelect("section")}>
                <SelectTrigger data-testid="select-section">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admissionDate">Admission Date *</Label>
              <Input id="admissionDate" type="date" value={fields.admissionDate} onChange={set("admissionDate")} data-testid="input-admission-date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={fields.status} onValueChange={setSelect("status")}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="previousSchool">Previous School</Label>
              <Input id="previousSchool" value={fields.previousSchool} onChange={set("previousSchool")} placeholder="Enter previous school name (if any)" data-testid="input-previous-school" />
              <p className="text-xs text-muted-foreground">If joining from another school</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="previousClass">Previous Class</Label>
              <Input id="previousClass" value={fields.previousClass} onChange={set("previousClass")} placeholder="Enter previous class (if any)" data-testid="input-previous-class" />
              <p className="text-xs text-muted-foreground">Class studied at previous school</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={fields.notes} onChange={set("notes")} className="resize-none" data-testid="input-notes" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => setLocation(`/student/profile/${id}`)} data-testid="button-cancel" disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" data-testid="button-save" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </ModuleLayout>
  );
}
