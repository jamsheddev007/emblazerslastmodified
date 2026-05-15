import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge, type Column, type Filter } from "@/components/shared/data-table";
import { hrNavItems, useHRData } from "./hr-data";
import { type Applicant } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Eye, User, Mail, Phone, MapPin, GraduationCap, Briefcase, DollarSign, Calendar, FileText, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Applicants() {
  const { applicants, vacancies, updateApplicantStatus } = useHRData();
  const { toast } = useToast();
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  const handleStatusChange = async (id: string, status: Applicant["status"]) => {
    try {
      await updateApplicantStatus(id, status);
      toast({ title: "Status updated", description: `Applicant status changed to ${status}` });
    } catch (error) {
      console.error("Failed to update applicant status:", error);
      toast({ title: "Error", description: "Failed to update applicant status", variant: "destructive" });
    }
  };

  const columns: Column<Applicant>[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    {
      key: "vacancyId",
      label: "Position",
      render: (item) => vacancies.find((v) => v.id === item.vacancyId)?.title || "Unknown",
    },
    { key: "appliedDate", label: "Applied Date" },
    {
      key: "status",
      label: "Status",
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedApplicant(item)}
            data-testid={`button-view-${item.id}`}
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid={`button-actions-${item.id}`}>
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange(item.id, "New")}>
                Mark as New
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(item.id, "Shortlisted")}>
                Mark as Shortlisted
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(item.id, "Interviewed")}>
                Mark as Interviewed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(item.id, "Offered")}>
                Mark as Offered
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(item.id, "Hired")}>
                Mark as Hired
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange(item.id, "Rejected")}>
                Mark as Rejected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const filters: Filter[] = [
    {
      key: "status",
      label: "Status",
      options: [
        { value: "New", label: "New" },
        { value: "Shortlisted", label: "Shortlisted" },
        { value: "Interviewed", label: "Interviewed" },
        { value: "Offered", label: "Offered" },
        { value: "Hired", label: "Hired" },
        { value: "Rejected", label: "Rejected" },
      ],
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Shortlisted": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Interviewed": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "Offered": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "Hired": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <ModuleLayout module="hr" navItems={hrNavItems}>
      <PageHeader
        title="Applicants"
        description="Manage job applicants"
      />

      <DataTable
        data={applicants}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search applicants..."
        searchKeys={["name", "email"]}
        getRowKey={(item) => item.id}
        emptyMessage="No applicants found"
      />

      <Dialog open={!!selectedApplicant} onOpenChange={(open) => !open && setSelectedApplicant(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="w-5 h-5" />
              Applicant Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedApplicant && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold">{selectedApplicant.name}</h3>
                  <p className="text-muted-foreground">
                    Applied for: {vacancies.find((v) => v.id === selectedApplicant.vacancyId)?.title || selectedApplicant.vacancyTitle}
                  </p>
                </div>
                <Badge className={`${getStatusColor(selectedApplicant.status)} px-3 py-1`}>
                  {selectedApplicant.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Contact Information</h4>
                  
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedApplicant.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{selectedApplicant.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">CNIC</p>
                      <p className="font-medium">{selectedApplicant.cnic}</p>
                    </div>
                  </div>
                  
                  {selectedApplicant.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{selectedApplicant.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-lg border-b pb-2">Professional Information</h4>
                  
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Qualification</p>
                      <p className="font-medium">{selectedApplicant.qualification}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <p className="font-medium">{selectedApplicant.experience}</p>
                    </div>
                  </div>
                  
                  {selectedApplicant.expectedSalary && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Expected Salary</p>
                        <p className="font-medium">PKR {selectedApplicant.expectedSalary.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Applied Date</p>
                      <p className="font-medium">{selectedApplicant.appliedDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium text-lg mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Application For
                </h4>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium">{selectedApplicant.vacancyTitle}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vacancy ID: {selectedApplicant.vacancyId}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedApplicant(null)}
                  data-testid="button-close-details"
                >
                  Close
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button data-testid="button-change-status">
                      Change Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={async () => { await handleStatusChange(selectedApplicant.id, "New"); setSelectedApplicant(null); }}>
                      Mark as New
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => { await handleStatusChange(selectedApplicant.id, "Shortlisted"); setSelectedApplicant(null); }}>
                      Mark as Shortlisted
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => { await handleStatusChange(selectedApplicant.id, "Interviewed"); setSelectedApplicant(null); }}>
                      Mark as Interviewed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => { await handleStatusChange(selectedApplicant.id, "Offered"); setSelectedApplicant(null); }}>
                      Mark as Offered
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => { await handleStatusChange(selectedApplicant.id, "Hired"); setSelectedApplicant(null); }}>
                      Mark as Hired
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={async () => { await handleStatusChange(selectedApplicant.id, "Rejected"); setSelectedApplicant(null); }}>
                      Mark as Rejected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
