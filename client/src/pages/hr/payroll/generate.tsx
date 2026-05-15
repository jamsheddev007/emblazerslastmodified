import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { hrNavItems } from "../hr-data";
import { usePayrollData, departments, allowanceTypes, deductionTypes, months } from "@/pages/payroll/payroll-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Plus, Trash2, Search, User, Check, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Staff } from "@shared/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logAction } from "@/lib/activity-logger";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function HRGeneratePayroll() {
  const { addPayroll, payrolls } = usePayrollData();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [staffId, setStaffId] = useState("");
  const [staffName, setStaffName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [basicSalary, setBasicSalary] = useState(50000);
  const [allowances, setAllowances] = useState<{ name: string; amount: number }[]>([
    { name: "House Rent", amount: 10000 },
  ]);
  const [deductions, setDeductions] = useState<{ name: string; amount: number }[]>([
    { name: "Provident Fund", amount: 5000 },
  ]);
  const [staffSearchOpen, setStaffSearchOpen] = useState(false);
  const [attendancePreview, setAttendancePreview] = useState<{
    absentDays: number;
    dailyRate: number;
    absentDeduction: number;
    workingDaysConvention: number;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data: staffList = [] } = useQuery<Staff[]>({ queryKey: ["/api/staff"] });

  useEffect(() => {
    if (!staffId || !month) { setAttendancePreview(null); return; }
    let cancelled = false;
    setPreviewLoading(true);
    fetch(`/api/payrolls/attendance-preview?staffId=${encodeURIComponent(staffId)}&month=${encodeURIComponent(month)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("emblazers_token")}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled) { setAttendancePreview(data); setPreviewLoading(false); } })
      .catch(() => { if (!cancelled) { setAttendancePreview(null); setPreviewLoading(false); } });
    return () => { cancelled = true; };
  }, [staffId, month]);

  const activeStaff = staffList.filter((s) => s.status === "Active" || s.status === "Probation");

  const handleSelectStaff = (staff: Staff) => {
    setStaffId(staff.staffId);
    setStaffName(staff.name);
    setDesignation(staff.designation);
    setDepartment(staff.department);
    if (staff.basicSalary) setBasicSalary(staff.basicSalary);
    setStaffSearchOpen(false);
    toast({ title: "Staff Selected", description: `${staff.name} - ${staff.designation}` });
  };

  const addAllowance = () => setAllowances([...allowances, { name: "", amount: 0 }]);
  const addDeduction = () => setDeductions([...deductions, { name: "", amount: 0 }]);
  const removeAllowance = (i: number) => setAllowances(allowances.filter((_, idx) => idx !== i));
  const removeDeduction = (i: number) => setDeductions(deductions.filter((_, idx) => idx !== i));

  const updateAllowance = (i: number, field: "name" | "amount", value: string | number) => {
    const updated = [...allowances];
    if (field === "name") updated[i].name = value as string;
    else updated[i].amount = Number(value);
    setAllowances(updated);
  };

  const updateDeduction = (i: number, field: "name" | "amount", value: string | number) => {
    const updated = [...deductions];
    if (field === "name") updated[i].name = value as string;
    else updated[i].amount = Number(value);
    setDeductions(updated);
  };

  const totalAllowances = allowances.reduce((s, a) => s + a.amount, 0);
  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
  const grossSalary = basicSalary + totalAllowances;
  const netSalary = grossSalary - totalDeductions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId || !staffName || !designation || !department) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const existingPayroll = payrolls.find((p) => p.staffId === staffId && p.month === month);
    if (existingPayroll) {
      toast({ title: "Duplicate Entry", description: `Payroll already exists for ${staffName} for ${month}`, variant: "destructive" });
      return;
    }
    try {
      await addPayroll({ staffId, staffName, designation, department, month, basicSalary, allowances, deductions, grossSalary, netSalary, status: "Unpaid" });
      await logAction({
        module: "hr",
        action: "generate",
        entityType: "Payroll",
        entityId: staffId,
        entityName: staffName,
        description: `Generated payroll for ${staffName} (${designation}) for ${month}. Net salary: Rs. ${netSalary.toLocaleString()}`,
        link: "/hr/payroll/list",
        notificationTitle: "Payroll Generated",
        metadata: { month, netSalary, department, designation },
      });
      toast({ title: "Success", description: "Payroll generated successfully" });
      setLocation("/hr/payroll/list");
    } catch (error) {
      console.error("Failed to generate payroll:", error);
      toast({ title: "Error", description: "Failed to generate payroll. Please try again.", variant: "destructive" });
    }
  };

  return (
    <ModuleLayout module="hr" navItems={hrNavItems}>
      <div className="space-y-6">
        <PageHeader title="Generate Payroll" description="Create payroll for a staff member" />
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Staff Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Staff</Label>
                  <Popover open={staffSearchOpen} onOpenChange={setStaffSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-start text-left font-normal" data-testid="button-search-staff">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        {staffId ? (
                          <span className="flex items-center gap-2"><User className="h-4 w-4" />{staffId} - {staffName}</span>
                        ) : (
                          <span className="text-muted-foreground">Search by ID or Name...</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Type staff ID or name..." data-testid="input-search-staff" />
                        <CommandList>
                          <CommandEmpty>No staff found.</CommandEmpty>
                          <CommandGroup heading="Staff Members">
                            {activeStaff.map((staff) => (
                              <CommandItem key={staff.id} value={`${staff.staffId} ${staff.name}`} onSelect={() => handleSelectStaff(staff)} className="cursor-pointer" data-testid={`staff-option-${staff.staffId}`}>
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <span className="font-medium">{staff.staffId}</span>
                                      <span className="mx-2">-</span>
                                      <span>{staff.name}</span>
                                    </div>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{staff.designation}</span>
                                  {staffId === staff.staffId && <Check className="h-4 w-4 text-primary ml-2" />}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Staff ID</Label>
                    <Input value={staffId} onChange={(e) => setStaffId(e.target.value)} placeholder="EMP001" data-testid="input-staff-id" />
                  </div>
                  <div className="space-y-2">
                    <Label>Staff Name</Label>
                    <Input value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="Enter name" data-testid="input-staff-name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Teacher" data-testid="input-designation" />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger data-testid="select-department"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {department && !departments.includes(department) && (
                          <SelectItem key={department} value={department}>{department}</SelectItem>
                        )}
                        {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger data-testid="select-month"><SelectValue placeholder="Select Month" /></SelectTrigger>
                      <SelectContent>
                        {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Basic Salary</Label>
                    <Input type="number" value={basicSalary} onChange={(e) => setBasicSalary(Number(e.target.value))} data-testid="input-basic-salary" />
                  </div>
                </div>
                {staffId && month && (
                  <div data-testid="attendance-preview-callout">
                    {previewLoading ? (
                      <p className="text-xs text-muted-foreground">Checking attendance...</p>
                    ) : attendancePreview && attendancePreview.absentDays > 0 ? (
                      <Alert className="border-amber-400 bg-amber-50 dark:bg-amber-950/30">
                        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <AlertDescription className="text-amber-800 dark:text-amber-300">
                          <span className="font-semibold">{attendancePreview.absentDays} absent day(s)</span> found for this month.
                          An automatic deduction of <span className="font-semibold">PKR {attendancePreview.absentDeduction.toLocaleString()}</span> will be added (PKR {attendancePreview.dailyRate.toLocaleString()}/day × {attendancePreview.absentDays} days).
                        </AlertDescription>
                      </Alert>
                    ) : attendancePreview && attendancePreview.absentDays === 0 ? (
                      <p className="text-xs text-muted-foreground">No absences found for this month.</p>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle>Allowances</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addAllowance} data-testid="button-add-allowance">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {allowances.map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Select value={a.name} onValueChange={(v) => updateAllowance(i, "name", v)}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{allowanceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" value={a.amount} onChange={(e) => updateAllowance(i, "amount", e.target.value)} className="w-28" />
                      {allowances.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAllowance(i)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <CardTitle>Deductions</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addDeduction} data-testid="button-add-deduction">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {deductions.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Select value={d.name} onValueChange={(v) => updateDeduction(i, "name", v)}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{deductionTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input type="number" value={d.amount} onChange={(e) => updateDeduction(i, "amount", e.target.value)} className="w-28" />
                      {deductions.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeDeduction(i)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Basic</Label>
                  <div className="text-lg font-semibold">Rs. {basicSalary.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Allowances</Label>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">+ Rs. {totalAllowances.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Gross</Label>
                  <div className="text-lg font-semibold">Rs. {grossSalary.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Deductions</Label>
                  <div className="text-lg font-semibold text-red-600 dark:text-red-400">- Rs. {totalDeductions.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Net Salary</Label>
                  <div className="text-xl font-bold text-teal-600 dark:text-teal-400">Rs. {netSalary.toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-6">
                <Button type="submit" className="w-full md:w-auto" data-testid="button-generate-payroll">
                  Generate Payroll
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </ModuleLayout>
  );
}
