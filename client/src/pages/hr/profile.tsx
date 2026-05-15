import { useParams, useLocation } from "wouter";
import { ModuleLayout } from "@/components/layout/module-layout";
import { hrNavItems, useHRData } from "./hr-data";
import { StatusBadge } from "@/components/shared/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, User, Briefcase, DollarSign, FileText, Star } from "lucide-react";

export default function StaffProfile() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { getStaff } = useHRData();

  const staffMember = getStaff(id || "");

  if (!staffMember) {
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

  const initials = staffMember.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <ModuleLayout module="hr" navItems={hrNavItems}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/hr/list")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-semibold">Staff Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 text-2xl">
                  <AvatarFallback className="bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-semibold">{staffMember.name}</h2>
                <p className="text-muted-foreground">{staffMember.staffId}</p>
                <p className="text-sm">{staffMember.designation}</p>
                <div className="mt-2">
                  <StatusBadge status={staffMember.status} />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant="secondary">{staffMember.department}</Badge>
                  <Badge variant="outline">{staffMember.employmentType}</Badge>
                </div>
                <Button className="mt-6 w-full" variant="outline" onClick={() => setLocation(`/hr/edit/${id}`)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <Tabs defaultValue="profile">
                <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-1 h-auto p-1">
                  <TabsTrigger value="profile" className="text-xs"><User className="w-3 h-3 mr-1" />Profile</TabsTrigger>
                  <TabsTrigger value="job" className="text-xs"><Briefcase className="w-3 h-3 mr-1" />Job</TabsTrigger>
                  <TabsTrigger value="payroll" className="text-xs"><DollarSign className="w-3 h-3 mr-1" />Payroll</TabsTrigger>
                  <TabsTrigger value="performance" className="text-xs"><Star className="w-3 h-3 mr-1" />Performance</TabsTrigger>
                  <TabsTrigger value="documents" className="text-xs"><FileText className="w-3 h-3 mr-1" />Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-6 space-y-4">
                  <InfoRow label="Full Name" value={staffMember.name} />
                  <InfoRow label="Gender" value={staffMember.gender} />
                  <InfoRow label="Date of Birth" value={staffMember.dob} />
                  <InfoRow label="Email" value={staffMember.email} />
                  <InfoRow label="Phone" value={staffMember.phone} />
                  <InfoRow label="Address" value={staffMember.address} />
                </TabsContent>

                <TabsContent value="job" className="mt-6 space-y-4">
                  <InfoRow label="Designation" value={staffMember.designation} />
                  <InfoRow label="Department" value={staffMember.department} />
                  <InfoRow label="Campus" value={staffMember.campus} />
                  <InfoRow label="Employment Type" value={staffMember.employmentType} />
                  <InfoRow label="Joining Date" value={staffMember.joiningDate} />
                  <InfoRow label="Status" value={staffMember.status} />
                </TabsContent>


                <TabsContent value="payroll" className="mt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card><CardContent className="p-4 text-center"><p className="text-xl font-bold">Rs. {staffMember.basicSalary.toLocaleString()}</p><p className="text-sm text-muted-foreground">Basic Salary</p></CardContent></Card>
                      <Card><CardContent className="p-4 text-center"><p className="text-sm">{staffMember.paymentMode}</p><p className="text-sm text-muted-foreground">Payment Mode</p></CardContent></Card>
                    </div>
                    <p className="text-muted-foreground text-sm">Detailed payroll history is available in the Payroll module.</p>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="mt-6">
                  <p className="text-muted-foreground">Performance reviews will be shown here when available.</p>
                </TabsContent>

                <TabsContent value="documents" className="mt-6">
                  <p className="text-muted-foreground">No documents uploaded for this staff member.</p>
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
