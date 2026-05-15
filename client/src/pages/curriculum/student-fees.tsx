import { ModuleLayout } from "@/components/layout/module-layout";
import { studentNavItems, useStudentFees } from "./student-data";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, AlertCircle } from "lucide-react";

export default function StudentFeesPage() {
  const { session } = useAuth();
  const { data: fees = [], isLoading } = useStudentFees();

  const totalAmount = fees.reduce((sum: number, f: any) => sum + (f.totalAmount || 0), 0);
  const totalPaid = fees.reduce((sum: number, f: any) => sum + (f.paidAmount || 0), 0);
  const totalOutstanding = totalAmount - totalPaid;

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "partial":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "pending":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    }
  };

  const getStatusLabel = (status: string) => {
    return status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase() || "Pending";
  };

  return (
    <ModuleLayout module="curriculum" navItems={studentNavItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">My Fees</h1>
          <p className="text-sm text-muted-foreground mt-1">View your fee records and payment status</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover-elevate">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Total Outstanding</p>
              <p className="text-3xl font-bold">Rs. {totalOutstanding.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="hover-elevate">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Total Paid This Year</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Rs. {totalPaid.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            This is READ-ONLY. No payment processing — just shows fee records.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : fees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground">No fee records found.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 text-sm font-medium">Month</th>
                    <th className="text-left p-4 text-sm font-medium">Total Amount</th>
                    <th className="text-left p-4 text-sm font-medium">Paid</th>
                    <th className="text-left p-4 text-sm font-medium">Balance</th>
                    <th className="text-left p-4 text-sm font-medium">Due Date</th>
                    <th className="text-left p-4 text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f: any) => (
                    <tr
                      key={f.id}
                      className="border-t hover:bg-muted/50 transition-colors"
                      data-testid={`row-fee-${f.id}`}
                    >
                      <td className="p-4 text-sm font-medium">{f.month || "-"}</td>
                      <td className="p-4 text-sm">Rs. {(f.totalAmount || 0).toLocaleString()}</td>
                      <td className="p-4 text-sm">Rs. {(f.paidAmount || 0).toLocaleString()}</td>
                      <td className="p-4 text-sm">
                        Rs. {((f.totalAmount || 0) - (f.paidAmount || 0)).toLocaleString()}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4">
                        <Badge className={`no-default-hover-elevate no-default-active-elevate ${getStatusBadgeClass(f.status)}`}>
                          {getStatusLabel(f.status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </ModuleLayout>
  );
}
