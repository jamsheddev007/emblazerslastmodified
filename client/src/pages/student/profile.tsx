import { useParams, useLocation } from "wouter";
import { ModuleLayout } from "@/components/layout/module-layout";
import { studentNavItems, useStudentData } from "./student-data";
import { StatusBadge } from "@/components/shared/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, User, Users, BookOpen, DollarSign, FileText } from "lucide-react";
import { ReportCardDialog } from "@/components/report-card-dialog";
import { apiRequest } from "@/lib/queryClient";

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getStudent } = useStudentData();

  const student = getStudent(id || "");

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

  const initials = student.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <ModuleLayout module="student" navItems={studentNavItems}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/student/list")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Student Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 text-2xl">
                  <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-semibold">{student.name}</h2>
                <p className="text-muted-foreground">{student.studentId}</p>
                <div className="mt-2">
                  <StatusBadge status={student.status} />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="secondary">{student.class}</Badge>
                  <Badge variant="outline">Section {student.section}</Badge>
                </div>
                <Button className="mt-6 w-full" variant="outline" onClick={() => setLocation(`/student/edit/${id}`)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <div className="mt-2 w-full">
                  <ReportCardDialog
                    studentId={student.studentId}
                    studentName={student.name}
                    fetchFn={(url) => apiRequest("GET", url).then(r => r)}
                    trigger={
                      <Button variant="default" className="w-full bg-[#0D7377] hover:bg-[#0a5c5f]" data-testid="button-generate-report-card">
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Report Card
                      </Button>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <Tabs defaultValue="profile">
                <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-1 h-auto p-1">
                  <TabsTrigger value="profile" className="text-xs"><User className="w-3 h-3 mr-1" />Profile</TabsTrigger>
                  <TabsTrigger value="family" className="text-xs"><Users className="w-3 h-3 mr-1" />Family</TabsTrigger>
                  <TabsTrigger value="academics" className="text-xs"><BookOpen className="w-3 h-3 mr-1" />Academics</TabsTrigger>
                  <TabsTrigger value="fees" className="text-xs"><DollarSign className="w-3 h-3 mr-1" />Fees</TabsTrigger>
                  <TabsTrigger value="notes" className="text-xs"><FileText className="w-3 h-3 mr-1" />Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6 space-y-4">
                  <InfoRow label="Student ID" value={student.studentId} />
                  <InfoRow label="Full Name" value={student.name} />
                  <InfoRow label="Gender" value={student.gender} />
                  <InfoRow label="Date of Birth" value={student.dob} />
                  <InfoRow label="B-Form" value={student.bform} />
                  <InfoRow label="Admission Date" value={student.admissionDate} />
                  <InfoRow label="Status" value={student.status} />
                </TabsContent>

                <TabsContent value="family" className="mt-6 space-y-4">
                  <InfoRow label="Parent/Guardian" value={student.parentName} />
                  <InfoRow label="Contact Number" value={student.parentContact} />
                  <InfoRow label="Email" value={student.parentEmail?.trim() || "Not provided"} />
                  <InfoRow label="Father's CNIC" value={student.fatherCnic?.trim() || "Not provided"} />
                  <InfoRow label="Mother's CNIC" value={student.motherCnic?.trim() || "Not provided"} />
                  <InfoRow label="Address" value={student.address} />
                </TabsContent>

                <TabsContent value="academics" className="mt-6 space-y-4">
                  <InfoRow label="Current Class" value={student.class} />
                  <InfoRow label="Current Section" value={student.section} />
                  <InfoRow label="Previous School" value={student.previousSchool?.trim() || "Not provided"} />
                  <InfoRow label="Previous Class" value={student.previousClass?.trim() || "Not provided"} />
                  <p className="text-muted-foreground mt-4">Academic records will be shown here when available in the Curriculum module.</p>
                </TabsContent>


                <TabsContent value="fees" className="mt-6">
                  <p className="text-muted-foreground">Fee records will be shown here when available in the Fee module.</p>
                </TabsContent>

                <TabsContent value="notes" className="mt-6">
                  <p className="text-muted-foreground">{student.notes || "No notes available for this student."}</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </ModuleLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b last:border-0">
      <span className="text-sm font-medium text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
