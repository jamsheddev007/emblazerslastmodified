import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { ModuleLayout } from "@/components/layout/module-layout";
import { staffNavItems, useStaffProfile } from "./staff-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground w-40 shrink-0">{label}</span>
      <span className="text-sm font-medium" data-testid={`text-${label.toLowerCase().replace(/\s/g, '-')}`}>{value || "—"}</span>
    </div>
  );
}

export default function StaffProfile() {
  const [, setLocation] = useLocation();
  const { session } = useAuth();
  const { data: profile, isLoading } = useStaffProfile();

  useEffect(() => {
    if (!session || session.role !== "staff" || !session.loggedIn) {
      setLocation("/staff/login");
    }
  }, [session, setLocation]);

  if (!session || session.role !== "staff") return null;

  const personal = profile?.personal;
  const job = profile?.job;
  const salary = profile?.salary;

  return (
    <ModuleLayout module="hr" navItems={staffNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold" data-testid="text-page-title">My Profile</h1>
          <p className="text-muted-foreground mt-1">View your personal and employment details</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-personal-info">
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label="Name" value={personal?.name} />
                <InfoRow label="Staff ID" value={job?.staffId} />
                <InfoRow label="Gender" value={personal?.gender} />
                <InfoRow label="Date of Birth" value={personal?.dob} />
                <InfoRow label="Email" value={personal?.email} />
                <InfoRow label="Phone" value={personal?.phone} />
                <InfoRow label="Address" value={personal?.address} />
              </CardContent>
            </Card>

            <Card data-testid="card-employment-info">
              <CardHeader>
                <CardTitle className="text-lg">Employment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <InfoRow label="Designation" value={job?.designation} />
                <InfoRow label="Department" value={job?.department} />
                <InfoRow label="Campus" value={job?.campus} />
                <InfoRow label="Employment Type" value={job?.employmentType} />
                <InfoRow label="Joining Date" value={job?.joiningDate} />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2 border-b last:border-b-0">
                  <span className="text-sm text-muted-foreground w-40 shrink-0">Status</span>
                  <Badge variant={job?.status === "Active" ? "default" : "secondary"} data-testid="badge-status">
                    {job?.status || "—"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2" data-testid="card-salary-info">
              <CardHeader>
                <CardTitle className="text-lg">Salary Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow label="Basic Salary" value={salary?.basicSalary ? `Rs. ${Number(salary.basicSalary).toLocaleString()}` : null} />
                  <InfoRow label="Payment Mode" value={salary?.paymentMode} />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground" data-testid="text-no-profile">Could not load profile data.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ModuleLayout>
  );
}
