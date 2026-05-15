import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { feeNavItems, useFeeData, feeHeadOptions, months } from "./fee-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Search, User, Settings, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Student } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
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

export default function GenerateVoucher() {
  const { addVoucher, vouchers } = useFeeData();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [section, setSection] = useState("");
  const [month, setMonth] = useState("");
  const [discount, setDiscount] = useState(0);
  const [fine, setFine] = useState(0);
  const [feeHeads, setFeeHeads] = useState<{ name: string; amount: number }[]>([
    { name: "Tuition Fee", amount: 5000 },
  ]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students']
  });

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students.filter(s => s.status === "Active").slice(0, 20);
    const query = searchQuery.toLowerCase();
    return students.filter(s => 
      s.status === "Active" && (
        s.studentId.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query) ||
        s.class.toLowerCase().includes(query)
      )
    ).slice(0, 20);
  }, [students, searchQuery]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentId(student.studentId);
    setStudentName(student.name);
    setStudentClass(student.class);
    setSection(student.section);
    setSearchOpen(false);
    setSearchQuery("");
  };

  const clearStudentSelection = () => {
    setSelectedStudent(null);
    setStudentId("");
    setStudentName("");
    setStudentClass("");
    setSection("");
  };

  const addFeeHead = () => {
    setFeeHeads([...feeHeads, { name: "", amount: 0 }]);
  };

  const removeFeeHead = (index: number) => {
    setFeeHeads(feeHeads.filter((_, i) => i !== index));
  };

  const updateFeeHead = (index: number, field: "name" | "amount", value: string | number) => {
    const updated = [...feeHeads];
    if (field === "name") {
      updated[index].name = value as string;
    } else {
      updated[index].amount = Number(value);
    }
    setFeeHeads(updated);
  };

  const totalAmount = feeHeads.reduce((sum, h) => sum + h.amount, 0);
  const netAmount = totalAmount - discount + fine;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId || !studentName || !studentClass || !section || !month) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const existingVoucher = vouchers.find(v => 
      v.studentId === studentId && v.month === month
    );
    if (existingVoucher) {
      toast({ 
        title: "Error", 
        description: `A voucher already exists for ${studentName} for ${month}`, 
        variant: "destructive" 
      });
      return;
    }

    try {
      await addVoucher({
        studentId,
        studentName,
        class: studentClass,
        section,
        month,
        feeHeads,
        totalAmount,
        discount,
        fine,
        netAmount,
        paidAmount: 0,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split("T")[0],
        status: "Unpaid",
        paymentHistory: [],
      });

      await logAction({
        module: "fee",
        action: "generate",
        entityType: "Fee Voucher",
        entityId: studentId,
        entityName: studentName,
        description: `Generated fee voucher for ${studentName} (${studentClass}-${section}) for ${month}. Net amount: Rs. ${netAmount.toLocaleString()}`,
        link: "/fee/vouchers",
        notificationTitle: "Fee Voucher Generated",
        metadata: { month, netAmount, studentClass, section },
      });

      toast({ title: "Success", description: "Fee voucher generated successfully" });
      setLocation("/fee/vouchers");
    } catch (error) {
      console.error("Failed to generate voucher:", error);
      toast({ title: "Error", description: "Failed to generate fee voucher. Please try again.", variant: "destructive" });
    }
  };

  const getCurrentMonth = () => {
    const date = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  useEffect(() => {
    if (!month) {
      setMonth(getCurrentMonth());
    }
  }, []);

  return (
    <ModuleLayout module="fee" navItems={feeNavItems}>
      <div className="space-y-6">
        <PageHeader
          title="Generate Fee Voucher"
          description="Create a new fee voucher for a student"
        />

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Student Information
                </CardTitle>
                <CardDescription>Search by Student ID or Name to auto-fill</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Search Student</Label>
                  <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={searchOpen}
                        className="w-full justify-between"
                        data-testid="button-search-student"
                      >
                        {selectedStudent ? (
                          <span className="flex items-center gap-2">
                            <span className="font-medium">{selectedStudent.studentId}</span>
                            <span className="text-muted-foreground">-</span>
                            <span>{selectedStudent.name}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            Search by ID or Name...
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput 
                          placeholder="Type student ID or name..." 
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                          data-testid="input-search-student"
                        />
                        <CommandList>
                          <CommandEmpty>No student found.</CommandEmpty>
                          <CommandGroup heading="Students">
                            {filteredStudents.map((student) => (
                              <CommandItem
                                key={student.id}
                                value={`${student.studentId} ${student.name}`}
                                onSelect={() => handleSelectStudent(student)}
                                className="cursor-pointer"
                                data-testid={`student-option-${student.studentId}`}
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{student.studentId}</span>
                                    <span className="text-muted-foreground">-</span>
                                    <span>{student.name}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {student.class} - Section {student.section}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedStudent && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearStudentSelection}
                      className="text-muted-foreground"
                    >
                      Clear selection
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Student ID</Label>
                    <Input
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="STU001"
                      data-testid="input-student-id"
                      readOnly={!!selectedStudent}
                      className={selectedStudent ? "bg-muted" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Student Name</Label>
                    <Input
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Enter name"
                      data-testid="input-student-name"
                      readOnly={!!selectedStudent}
                      className={selectedStudent ? "bg-muted" : ""}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={studentClass} onValueChange={setStudentClass} disabled={!!selectedStudent}>
                      <SelectTrigger data-testid="select-class" className={selectedStudent ? "bg-muted" : ""}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Select value={section} onValueChange={setSection} disabled={!!selectedStudent}>
                      <SelectTrigger data-testid="select-section" className={selectedStudent ? "bg-muted" : ""}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A", "B", "C"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Select value={month} onValueChange={setMonth}>
                      <SelectTrigger data-testid="select-month">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Fee Heads</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addFeeHead} data-testid="button-add-fee-head">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {feeHeads.map((head, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select value={head.name} onValueChange={(v) => updateFeeHead(index, "name", v)}>
                      <SelectTrigger className="flex-1" data-testid={`select-fee-head-${index}`}>
                        <SelectValue placeholder="Select fee head" />
                      </SelectTrigger>
                      <SelectContent>
                        {feeHeadOptions.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={head.amount}
                      onChange={(e) => updateFeeHead(index, "amount", e.target.value)}
                      className="w-28"
                      data-testid={`input-fee-amount-${index}`}
                    />
                    {feeHeads.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeFeeHead(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <div className="text-lg font-semibold">Rs. {totalAmount.toLocaleString()}</div>
                </div>
                <div className="space-y-2">
                  <Label>Discount</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    data-testid="input-discount"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fine</Label>
                  <Input
                    type="number"
                    value={fine}
                    onChange={(e) => setFine(Number(e.target.value))}
                    data-testid="input-fine"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Net Amount</Label>
                  <div className="text-lg font-semibold text-green-600 dark:text-green-400">Rs. {netAmount.toLocaleString()}</div>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full" data-testid="button-generate-voucher">
                    Generate Voucher
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Automatic Fee Generation
            </CardTitle>
            <CardDescription>Configure automatic fee voucher generation for all students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Auto-generate on 28th of each month</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically generate fee vouchers for all active students on the 28th of every month
                </p>
              </div>
              <Switch 
                id="auto-generate"
                defaultChecked={true}
                data-testid="switch-auto-generate"
              />
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Default Fee Structure</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tuition Fee:</span>
                  <span>Rs. 5,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lab Fee:</span>
                  <span>Rs. 500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sports Fee:</span>
                  <span>Rs. 300</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                These defaults will be used when auto-generating vouchers. You can customize individual vouchers after generation.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                const activeStudents = students.filter(s => s.status === "Active");
                const currentMonth = getCurrentMonth();
                
                let generated = 0;
                let skipped = 0;
                
                for (const student of activeStudents) {
                  const existingVoucher = vouchers.find(v => 
                    v.studentId === student.studentId && v.month === currentMonth
                  );
                  
                  if (existingVoucher) {
                    skipped++;
                    continue;
                  }
                  
                  try {
                    await addVoucher({
                      studentId: student.studentId,
                      studentName: student.name,
                      class: student.class,
                      section: student.section,
                      month: currentMonth,
                      feeHeads: [
                        { name: "Tuition Fee", amount: 5000 },
                        { name: "Lab Fee", amount: 500 },
                        { name: "Sports Fee", amount: 300 },
                      ],
                      totalAmount: 5800,
                      discount: 0,
                      fine: 0,
                      netAmount: 5800,
                      paidAmount: 0,
                      dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split("T")[0],
                      status: "Unpaid",
                      paymentHistory: [],
                    });
                    generated++;
                  } catch (error) {
                    console.error(`Failed to generate voucher for ${student.name}:`, error);
                  }
                }
                
                if (generated > 0) {
                  toast({ 
                    title: "Vouchers Generated", 
                    description: `Generated ${generated} voucher(s) for ${currentMonth}. ${skipped > 0 ? `${skipped} already existed.` : ''}` 
                  });
                } else if (skipped > 0) {
                  toast({ 
                    title: "No New Vouchers", 
                    description: `All ${skipped} students already have vouchers for ${currentMonth}` 
                  });
                } else {
                  toast({ 
                    title: "No Active Students", 
                    description: "No active students found to generate vouchers for", 
                    variant: "destructive" 
                  });
                }
              }}
              data-testid="button-generate-all"
            >
              Generate for All Active Students ({getCurrentMonth()})
            </Button>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
