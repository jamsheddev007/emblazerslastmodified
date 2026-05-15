import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { hrNavItems, useHRData, departments, designations, employmentTypes, staffStatuses } from "./hr-data";
import { type Staff } from "@shared/schema";
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

export default function EditStaff() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getStaff, isLoading } = useHRData();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const staff = getStaff(id || "");

  const [fields, setFields] = useState({
    name: "",
    gender: "Male",
    dob: "",
    email: "",
    phone: "",
    address: "",
    designation: "Teacher",
    department: "Mathematics",
    campus: "Main Campus",
    employmentType: "Full-time",
    status: "Active",
    joiningDate: "",
    basicSalary: 50000,
    paymentMode: "Bank Transfer" as "Bank Transfer" | "Cash" | "Cheque",
    portalEmail: "",
    portalPassword: "",
  });

  useEffect(() => {
    if (staff) {
      setFields({
        name: staff.name ?? "",
        gender: staff.gender ?? "Male",
        dob: staff.dob ?? "",
        email: staff.email ?? "",
        phone: staff.phone ?? "",
        address: staff.address ?? "",
        designation: staff.designation ?? "Teacher",
        department: staff.department ?? "Mathematics",
        campus: staff.campus ?? "Main Campus",
        employmentType: staff.employmentType ?? "Full-time",
        status: staff.status ?? "Active",
        joiningDate: staff.joiningDate ?? "",
        basicSalary: staff.basicSalary ?? 50000,
        paymentMode: (staff.paymentMode ?? "Bank Transfer") as "Bank Transfer" | "Cash" | "Cheque",
        portalEmail: staff.portalEmail ?? "",
        portalPassword: "",
      });
    }
  }, [staff?.id]);

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
    if (!fields.email.trim()) {
      toast({ title: "Required", description: "Email is required.", variant: "destructive" });
      return;
    }
    if (!fields.phone.trim()) {
      toast({ title: "Required", description: "Phone number is required.", variant: "destructive" });
      return;
    }
    if (!fields.address.trim()) {
      toast({ title: "Required", description: "Address is required.", variant: "destructive" });
      return;
    }

    const payload: Partial<Staff> = {
      name: fields.name.trim(),
      gender: fields.gender as Staff["gender"],
      dob: fields.dob,
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      address: fields.address.trim(),
      designation: fields.designation,
      department: fields.department,
      campus: fields.campus.trim(),
      employmentType: fields.employmentType as Staff["employmentType"],
      status: fields.status as Staff["status"],
      joiningDate: fields.joiningDate,
      basicSalary: Number(fields.basicSalary),
      paymentMode: fields.paymentMode as Staff["paymentMode"],
      portalEmail: fields.portalEmail.trim() || undefined,
      ...(fields.portalPassword.trim() ? { portalPassword: fields.portalPassword.trim() } : {}),
    };

    try {
      setSaving(true);
      const res = await apiRequest("PATCH", `/api/staff/${id}`, payload);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast({
          title: "Save failed",
          description: body.error || `Server returned ${res.status}`,
          variant: "destructive",
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({ title: "Staff updated", description: "Changes saved successfully." });
      setLocation(`/hr/profile/${id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !staff) {
    return (
      <ModuleLayout module="hr" navItems={hrNavItems}>
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading staff data…</p>
        </div>
      </ModuleLayout>
    );
  }

  if (!staff) {
    return (
      <ModuleLayout module="hr" navItems={hrNavItems}>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Staff member not found</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/hr/list")}>
            Back to List
          </Button>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="hr" navItems={hrNavItems}>
      <PageHeader title="Edit Staff" description={`Editing ${staff.name}`} />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
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
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={fields.email} onChange={set("email")} data-testid="input-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" value={fields.phone} onChange={set("phone")} data-testid="input-phone" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea id="address" value={fields.address} onChange={set("address")} className="resize-none" data-testid="input-address" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="designation">Designation *</Label>
              <Select value={fields.designation} onValueChange={setSelect("designation")}>
                <SelectTrigger data-testid="select-designation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={fields.department} onValueChange={setSelect("department")}>
                <SelectTrigger data-testid="select-department">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campus">Campus *</Label>
              <Input id="campus" value={fields.campus} onChange={set("campus")} data-testid="input-campus" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type *</Label>
              <Select value={fields.employmentType} onValueChange={setSelect("employmentType")}>
                <SelectTrigger data-testid="select-employment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="joiningDate">Joining Date *</Label>
              <Input id="joiningDate" type="date" value={fields.joiningDate} onChange={set("joiningDate")} data-testid="input-joining-date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={fields.status} onValueChange={setSelect("status")}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staffStatuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="basicSalary">Basic Salary (Rs.) *</Label>
              <Input
                id="basicSalary"
                type="number"
                value={fields.basicSalary}
                onChange={(e) => setFields((prev) => ({ ...prev, basicSalary: Number(e.target.value) }))}
                data-testid="input-salary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode *</Label>
              <Select value={fields.paymentMode} onValueChange={setSelect("paymentMode")}>
                <SelectTrigger data-testid="select-payment-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Portal Access</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="portalEmail">Portal Email</Label>
              <Input id="portalEmail" type="email" value={fields.portalEmail} onChange={set("portalEmail")} placeholder="e.g. john@school.edu.pk" data-testid="input-portal-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portalPassword">New Portal Password</Label>
              <Input id="portalPassword" type="password" value={fields.portalPassword} onChange={set("portalPassword")} placeholder="Leave blank to keep current" data-testid="input-portal-password" />
              <p className="text-xs text-muted-foreground">Leave blank to keep the existing password unchanged</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => setLocation(`/hr/profile/${id}`)} data-testid="button-cancel" disabled={saving}>
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
