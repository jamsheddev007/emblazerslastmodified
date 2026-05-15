import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { studentNavItems, useStudentData, classes, sections, statuses } from "./student-data";
import { insertStudentSchema, type InsertStudent } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function AddStudent() {
  const [, setLocation] = useLocation();
  const { addStudent, students } = useStudentData();
  const { toast } = useToast();

  const form = useForm<InsertStudent>({
    resolver: zodResolver(insertStudentSchema),
    defaultValues: {
      name: "",
      gender: "Male",
      dob: "",
      parentName: "",
      parentContact: "",
      parentEmail: "",
      fatherCnic: "",
      motherCnic: "",
      address: "",
      class: "Class 1",
      section: "A",
      previousSchool: "",
      previousClass: "",
      admissionDate: new Date().toISOString().split("T")[0],
      status: "Active",
      notes: "",
      bform: "",
    },
  });

  const onSubmit = async (data: InsertStudent) => {
    try {
      // Clean up optional fields - convert empty strings to undefined
      const cleanedData = {
        ...data,
        parentEmail: data.parentEmail?.trim() || undefined,
        fatherCnic: data.fatherCnic?.trim() || undefined,
        motherCnic: data.motherCnic?.trim() || undefined,
        previousSchool: data.previousSchool?.trim() || undefined,
        previousClass: data.previousClass?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
      };

      await addStudent(cleanedData);
      toast({ title: "Student added", description: "New student has been enrolled successfully." });
      setLocation("/student/list");
    } catch (error: any) {
      console.error("Failed to add student:", error);
      const msg = error?.message || "";
      if (msg.includes("already exists") || msg.includes("409")) {
        toast({ title: "Duplicate Student", description: "A student with this information already exists.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Failed to add student. Please try again.", variant: "destructive" });
      }
    }
  };

  return (
    <ModuleLayout module="student" navItems={studentNavItems}>
      <PageHeader title="Add New Student" description="Enroll a new student in the system" />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter full name" data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-gender">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-dob" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>B-Form *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="xxxxx-xxxxxxx-x" data-testid="input-bform" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Family Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="parentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent/Guardian Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter parent name" data-testid="input-parent-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+92 3XX XXXXXXX" data-testid="input-parent-contact" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="email@example.com" data-testid="input-parent-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatherCnic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Father's CNIC {!form.watch("motherCnic") && "*"}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="XXXXX-XXXXXXX-X" data-testid="input-father-cnic" maxLength={15} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      At least one parent's CNIC is required
                    </p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="motherCnic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mother's CNIC {!form.watch("fatherCnic") && "*"}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="XXXXX-XXXXXXX-X" data-testid="input-mother-cnic" maxLength={15} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      At least one parent's CNIC is required
                    </p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter full address" className="resize-none" data-testid="input-address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-class">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-section">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sections.map((s) => (
                          <SelectItem key={s} value={s}>Section {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="admissionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-admission-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="previousSchool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous School</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter previous school name (if any)" data-testid="input-previous-school" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      If joining from another school
                    </p>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="previousClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Class</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter previous class (if any)" data-testid="input-previous-class" />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Class studied at previous school
                    </p>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/student/list")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save">
              Save Student
            </Button>
          </div>
        </form>
      </Form>
    </ModuleLayout>
  );
}
