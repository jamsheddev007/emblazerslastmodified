import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { feeNavItems, useChallans, useFeeStructures, useDiscountRules, sessionOptions } from "./fee-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Eye, Trash2, Search, Filter, Users, CheckCircle, AlertCircle, Receipt, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { type Student, type Challan, type InsertChallan } from "@shared/schema";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function downloadChallanPDF(challan: Challan, schoolName = "Emblazers School") {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const copies = [
    { label: "SCHOOL COPY", x: 8 },
    { label: "BANK COPY",   x: pageW / 3 + 4 },
    { label: "STUDENT COPY", x: (pageW / 3) * 2 },
  ];
  const colW = pageW / 3 - 8;

  copies.forEach(({ label, x }) => {
    let y = 10;

    // Outer border
    doc.setDrawColor(30, 30, 120);
    doc.setLineWidth(0.6);
    doc.rect(x, y, colW, pageH - 14);

    // Header band
    doc.setFillColor(30, 30, 120);
    doc.rect(x, y, colW, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(label, x + colW / 2, y + 7, { align: "center" });
    y += 12;

    // School name
    doc.setTextColor(30, 30, 120);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(schoolName.toUpperCase(), x + colW / 2, y, { align: "center" });
    y += 5;

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text("FEE PAYMENT CHALLAN", x + colW / 2, y, { align: "center" });
    y += 2;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(x + 2, y, x + colW - 2, y);
    y += 4;

    // Challan No + Status row
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 120);
    doc.text(`Challan No:`, x + 3, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(challan.challanNo, x + 22, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 120);
    doc.text(`Status:`, x + colW - 30, y);
    doc.setFont("helvetica", "normal");
    const statusColors: Record<string, [number, number, number]> = {
      Paid: [0, 140, 0], Pending: [200, 100, 0], Overdue: [180, 0, 0], Partial: [100, 100, 0],
    };
    const sc = statusColors[challan.status] || [0, 0, 0];
    doc.setTextColor(...sc);
    doc.text(challan.status, x + colW - 17, y);
    y += 5;

    // Student info table
    const infoRows: [string, string][] = [
      ["Student Name", challan.studentName],
      ["Student ID",   challan.studentId],
      ["Class / Section", `${challan.class} — ${challan.section}`],
      ["Academic Session", challan.academicSession || "—"],
      ["Period", challan.period],
      ["Issue Date", challan.issueDate],
      ["Due Date", challan.dueDate],
    ];

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);

    infoRows.forEach(([key, val]) => {
      doc.setFillColor(245, 246, 250);
      doc.rect(x + 2, y - 3, colW - 4, 5, "F");
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(6.5);
      doc.text(key, x + 4, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(String(val), x + colW - 4, y, { align: "right", maxWidth: colW / 2 });
      y += 5.5;
    });

    y += 1;
    doc.setDrawColor(200, 200, 200);
    doc.line(x + 2, y, x + colW - 2, y);
    y += 4;

    // Fee breakdown heading
    doc.setFillColor(230, 234, 245);
    doc.rect(x + 2, y - 3, colW - 4, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(30, 30, 120);
    doc.text("FEE BREAKDOWN", x + 4, y);
    doc.text("AMOUNT (Rs.)", x + colW - 4, y, { align: "right" });
    y += 5;

    // Fee heads
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(6.5);
    (challan.feeHeads as { name: string; amount: number }[]).forEach((fh, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(x + 2, y - 3, colW - 4, 5, "F");
      }
      doc.text(fh.name, x + 4, y);
      doc.text(`${fh.amount.toLocaleString()}`, x + colW - 4, y, { align: "right" });
      y += 5;
    });

    // Totals
    y += 1;
    doc.setDrawColor(180, 180, 180);
    doc.line(x + 2, y, x + colW - 2, y);
    y += 3;

    const totals: [string, number, boolean, [number,number,number]][] = [
      ["Total Amount",    challan.totalAmount,    false, [40,40,40]],
      ...(challan.discountAmount > 0 ? [["Discount", -challan.discountAmount, false, [0,140,0]] as [string,number,boolean,[number,number,number]]] : []),
      ...(challan.lateFee > 0 ? [["Late Fee", challan.lateFee, false, [180,0,0]] as [string,number,boolean,[number,number,number]]] : []),
      ["NET PAYABLE",     challan.netAmount,      true,  [30,30,120]],
      ["Amount Paid",     challan.paidAmount,     false, [0,140,0]],
      ["Balance Due",     challan.balanceAmount,  true,  challan.balanceAmount > 0 ? [180,0,0] : [0,140,0]],
    ];

    totals.forEach(([label, amount, bold, color]) => {
      if (bold) {
        doc.setFillColor(235, 237, 250);
        doc.rect(x + 2, y - 3, colW - 4, 5.5, "F");
      }
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(bold ? 7.5 : 6.5);
      doc.setTextColor(...color);
      doc.text(String(label), x + 4, y);
      const prefix = amount < 0 ? "- Rs. " : "Rs. ";
      doc.text(`${prefix}${Math.abs(amount).toLocaleString()}`, x + colW - 4, y, { align: "right" });
      y += bold ? 6 : 5;
    });

    y += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(x + 2, y, x + colW - 2, y);
    y += 5;

    // Payment instructions
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    const instructions = [
      "• Please pay by the due date to avoid late fee charges.",
      "• Keep this challan as proof of payment.",
      "• This is a computer-generated document.",
    ];
    instructions.forEach(line => {
      doc.text(line, x + 3, y);
      y += 4;
    });

    y += 2;
    // Bank stamp / signature area
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(x + 2, y, colW - 4, 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(150, 150, 150);
    doc.text("Bank Stamp / Cashier Signature", x + colW / 2, y + 14, { align: "center" });
  });

  // Vertical dividers between copies
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.4);
  doc.line(pageW / 3, 5, pageW / 3, pageH - 5);
  doc.line((pageW / 3) * 2, 5, (pageW / 3) * 2, pageH - 5);

  doc.save(`Challan-${challan.challanNo}-${challan.studentId}.pdf`);
}

interface BulkPreviewResult {
  totalStudents: number;
  willBeCreated: number;
  alreadyExist: number;
  studentsList: Array<{
    id: string;
    name: string;
    class: string;
    section: string;
    studentId: string;
    challanStatus: "exists" | "will_create";
  }>;
}

export default function FeeChallans() {
  const { challans, createChallan, deleteChallan, isPending, isLoading: challansLoading } = useChallans();
  const { structures } = useFeeStructures();
  const { rules: discountRules } = useDiscountRules();
  const { data: students = [] } = useQuery<Student[]>({ queryKey: ["/api/students"] });
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    studentId: "",
    feeStructureId: "",
    period: "",
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    discountId: "",
    lateFee: 0,
    notes: "",
  });

  const currentYear = new Date().getFullYear();
  const [bulkForm, setBulkForm] = useState({
    feeStructureId: "",
    month: MONTHS[new Date().getMonth()],
    year: String(currentYear),
    classFilter: "",
    sectionFilter: "",
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });
  const [bulkPreview, setBulkPreview] = useState<BulkPreviewResult | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  const distinctClasses = [...new Set(students.map(s => s.class))].sort();

  const selectedStudent = students.find(s => String(s.id) === formData.studentId);
  const selectedStructure = structures.find(s => s.id === formData.feeStructureId);
  const selectedDiscount = discountRules.find(r => r.id === formData.discountId);

  const calculateAmounts = () => {
    const totalAmount = selectedStructure?.totalAmount || 0;
    let discountAmount = 0;
    if (selectedDiscount) {
      discountAmount = selectedDiscount.type === "Percentage"
        ? (totalAmount * selectedDiscount.value / 100)
        : selectedDiscount.value;
    }
    const netAmount = totalAmount - discountAmount + (formData.lateFee || 0);
    return { totalAmount, discountAmount, netAmount };
  };

  const { totalAmount, discountAmount, netAmount } = calculateAmounts();

  const handleCreateChallan = async () => {
    if (!formData.studentId || !formData.feeStructureId || !formData.period || !formData.dueDate) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    try {
      const challan: InsertChallan = {
        studentId: formData.studentId,
        studentName: selectedStudent?.name || "",
        class: selectedStudent?.class || "",
        section: selectedStudent?.section || "",
        academicSession: selectedStructure?.academicSession || sessionOptions[1],
        period: formData.period,
        feeStructureId: formData.feeStructureId,
        feeHeads: selectedStructure?.feeHeads.map(fh => ({ name: fh.name, amount: fh.amount })) || [],
        totalAmount,
        discountId: formData.discountId || undefined,
        discountName: selectedDiscount?.name,
        discountAmount,
        lateFee: formData.lateFee,
        adjustments: 0,
        netAmount,
        paidAmount: 0,
        balanceAmount: netAmount,
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: formData.dueDate,
        status: "Pending",
      };
      await createChallan(challan);
      toast({ title: "Success", description: "Challan created successfully" });
      setDialogOpen(false);
      setFormData({
        studentId: "",
        feeStructureId: "",
        period: "",
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        discountId: "",
        lateFee: 0,
        notes: "",
      });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handleBulkPreview = async () => {
    if (!bulkForm.feeStructureId || !bulkForm.month || !bulkForm.year) {
      toast({ title: "Error", description: "Fee Structure, Month and Year are required", variant: "destructive" });
      return;
    }
    setBulkLoading(true);
    setBulkPreview(null);
    try {
      const params = new URLSearchParams({
        feeStructureId: bulkForm.feeStructureId,
        month: bulkForm.month,
        year: bulkForm.year,
        ...(bulkForm.classFilter ? { classFilter: bulkForm.classFilter } : {}),
        ...(bulkForm.sectionFilter ? { sectionFilter: bulkForm.sectionFilter } : {}),
      });
      const res = await fetch(`/api/challans/bulk-preview?${params}`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setBulkPreview(data);
    } catch (err) {
      toast({ title: "Preview Failed", description: String(err), variant: "destructive" });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!bulkPreview || bulkPreview.willBeCreated === 0) {
      toast({ title: "Nothing to generate", description: "All students already have challans for this period." });
      return;
    }
    setBulkGenerating(true);
    try {
      const result = await apiRequest("POST", "/api/challans/bulk", {
        feeStructureId: bulkForm.feeStructureId,
        month: bulkForm.month,
        year: bulkForm.year,
        classFilter: bulkForm.classFilter || undefined,
        sectionFilter: bulkForm.sectionFilter || undefined,
        dueDate: bulkForm.dueDate,
      });
      const data = await result.json();
      toast({
        title: "Bulk Generation Complete",
        description: `${data.created} challans created, ${data.skipped} skipped (already existed).`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/challans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      setBulkDialogOpen(false);
      setBulkPreview(null);
      setBulkForm({
        feeStructureId: "",
        month: MONTHS[new Date().getMonth()],
        year: String(currentYear),
        classFilter: "",
        sectionFilter: "",
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
    } catch (err) {
      toast({ title: "Generation Failed", description: String(err), variant: "destructive" });
    } finally {
      setBulkGenerating(false);
    }
  };

  const handleViewChallan = (challan: Challan) => {
    setSelectedChallan(challan);
    setViewDialogOpen(true);
  };

  const handleDeleteChallan = async (id: string) => {
    try {
      await deleteChallan(id);
      toast({ title: "Success", description: "Challan deleted" });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Pending": "secondary",
      "Partial": "outline",
      "Paid": "default",
      "Overdue": "destructive",
      "Cancelled": "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const filteredChallans = challans.filter(challan => {
    const matchesSearch = challan.challanNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || challan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const periodOptions = [
    "January 2025", "February 2025", "March 2025", "April 2025", "May 2025", "June 2025",
    "July 2025", "August 2025", "September 2025", "October 2025", "November 2025", "December 2025",
    "January 2026", "February 2026", "March 2026", "April 2026", "May 2026", "June 2026",
  ];

  return (
    <ModuleLayout module="fee" navItems={feeNavItems}>
      <PageHeader
        title="Challan Management"
        description="Generate and manage fee challans for students"
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by challan number..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-challan"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36" data-testid="select-status-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Partial">Partial</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setBulkDialogOpen(true)} data-testid="button-generate-bulk-challans">
              <Users className="w-4 h-4 mr-2" />
              Generate Bulk Challans
            </Button>
            <Button onClick={() => setDialogOpen(true)} data-testid="button-generate-challan">
              <Plus className="w-4 h-4 mr-2" />
              Generate Challan
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Challan #</TableHead>
                  <TableHead className="whitespace-nowrap">Student</TableHead>
                  <TableHead className="whitespace-nowrap">Period</TableHead>
                  <TableHead className="whitespace-nowrap">Due Date</TableHead>
                  <TableHead className="whitespace-nowrap">Net Amount</TableHead>
                  <TableHead className="whitespace-nowrap">Paid</TableHead>
                  <TableHead className="whitespace-nowrap">Balance</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challansLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredChallans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-16">
                      <div className="flex flex-col items-center justify-center text-center gap-3" data-testid="challans-empty-state">
                        <div className="rounded-full bg-muted p-4">
                          <Receipt className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-base font-semibold">No challans found</p>
                          <p className="text-sm text-muted-foreground mt-1">Generate a challan to get started.</p>
                        </div>
                        <Button size="sm" onClick={() => setDialogOpen(true)} data-testid="button-empty-generate">
                          <Plus className="w-4 h-4 mr-1" /> Generate Challan
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChallans.map((challan) => (
                    <TableRow key={challan.id} data-testid={`row-challan-${challan.id}`}>
                      <TableCell className="font-medium whitespace-nowrap">{challan.challanNo}</TableCell>
                      <TableCell className="whitespace-nowrap">{challan.studentName}</TableCell>
                      <TableCell className="whitespace-nowrap">{challan.period}</TableCell>
                      <TableCell className="whitespace-nowrap">{challan.dueDate}</TableCell>
                      <TableCell className="whitespace-nowrap">Rs. {challan.netAmount.toLocaleString()}</TableCell>
                      <TableCell className="whitespace-nowrap">Rs. {challan.paidAmount.toLocaleString()}</TableCell>
                      <TableCell className="whitespace-nowrap">Rs. {challan.balanceAmount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(challan.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleViewChallan(challan)} data-testid={`button-view-challan-${challan.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => downloadChallanPDF(challan)} title="Download PDF" data-testid={`button-download-challan-${challan.id}`}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteChallan(challan.id)} data-testid={`button-delete-challan-${challan.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Single Challan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Fee Challan</DialogTitle>
            <DialogDescription>Create a new fee challan for a student</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select value={formData.studentId} onValueChange={(v) => setFormData(prev => ({ ...prev, studentId: v }))}>
                  <SelectTrigger data-testid="select-student">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={String(student.id)} value={String(student.id)}>
                        {student.name} - {student.studentId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fee Structure</Label>
                <Select value={formData.feeStructureId} onValueChange={(v) => setFormData(prev => ({ ...prev, feeStructureId: v }))}>
                  <SelectTrigger data-testid="select-fee-structure">
                    <SelectValue placeholder="Select fee structure" />
                  </SelectTrigger>
                  <SelectContent>
                    {structures.filter(s => s.isActive).map((structure) => (
                      <SelectItem key={structure.id} value={structure.id}>
                        {structure.name} (Rs. {structure.totalAmount.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={formData.period} onValueChange={(v) => setFormData(prev => ({ ...prev, period: v }))}>
                  <SelectTrigger data-testid="select-period">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((period) => (
                      <SelectItem key={period} value={period}>{period}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  data-testid="input-due-date"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Apply Discount (Optional)</Label>
                <Select value={formData.discountId} onValueChange={(v) => setFormData(prev => ({ ...prev, discountId: v }))}>
                  <SelectTrigger data-testid="select-discount">
                    <SelectValue placeholder="No discount" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No discount</SelectItem>
                    {discountRules.filter(r => r.isActive).map((rule) => (
                      <SelectItem key={rule.id} value={rule.id}>
                        {rule.name} ({rule.type === "Percentage" ? `${rule.value}%` : `Rs. ${rule.value}`})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Late Fee</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.lateFee || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, lateFee: Number(e.target.value) }))}
                  data-testid="input-late-fee"
                />
              </div>
            </div>

            {selectedStructure && (
              <Card className="bg-muted/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm">Fee Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="py-2 space-y-1 text-sm">
                  {selectedStructure.feeHeads.map((fh, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{fh.name}</span>
                      <span>Rs. {fh.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-1 flex justify-between">
                    <span>Total Amount</span>
                    <span>Rs. {totalAmount.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>- Rs. {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {formData.lateFee > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Late Fee</span>
                      <span>+ Rs. {formData.lateFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t pt-1 flex justify-between font-semibold">
                    <span>Net Amount</span>
                    <span>Rs. {netAmount.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateChallan} disabled={isPending} data-testid="button-create-challan">
                {isPending ? "Creating..." : "Create Challan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Challan Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={(open) => { setBulkDialogOpen(open); if (!open) { setBulkPreview(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Bulk Challans</DialogTitle>
            <DialogDescription>Generate challans for all active students at once. Students who already have a challan for the selected period will be skipped.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fee Structure <span className="text-destructive">*</span></Label>
                <Select value={bulkForm.feeStructureId} onValueChange={(v) => { setBulkForm(p => ({ ...p, feeStructureId: v })); setBulkPreview(null); }}>
                  <SelectTrigger data-testid="select-bulk-fee-structure">
                    <SelectValue placeholder="Select fee structure" />
                  </SelectTrigger>
                  <SelectContent>
                    {structures.filter(s => s.isActive).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — Rs. {s.totalAmount.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={bulkForm.dueDate}
                  onChange={(e) => setBulkForm(p => ({ ...p, dueDate: e.target.value }))}
                  data-testid="input-bulk-due-date"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Month <span className="text-destructive">*</span></Label>
                <Select value={bulkForm.month} onValueChange={(v) => { setBulkForm(p => ({ ...p, month: v })); setBulkPreview(null); }}>
                  <SelectTrigger data-testid="select-bulk-month">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  placeholder="e.g. 2026"
                  value={bulkForm.year}
                  onChange={(e) => { setBulkForm(p => ({ ...p, year: e.target.value })); setBulkPreview(null); }}
                  data-testid="input-bulk-year"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class Filter <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Select value={bulkForm.classFilter || "_all"} onValueChange={(v) => { setBulkForm(p => ({ ...p, classFilter: v === "_all" ? "" : v })); setBulkPreview(null); }}>
                  <SelectTrigger data-testid="select-bulk-class">
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Classes</SelectItem>
                    {distinctClasses.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Section Filter <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                <Input
                  placeholder="e.g. A"
                  value={bulkForm.sectionFilter}
                  onChange={(e) => { setBulkForm(p => ({ ...p, sectionFilter: e.target.value })); setBulkPreview(null); }}
                  data-testid="input-bulk-section"
                />
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleBulkPreview}
              disabled={bulkLoading || !bulkForm.feeStructureId}
              data-testid="button-bulk-preview"
            >
              {bulkLoading ? "Loading Preview..." : "Preview Students"}
            </Button>

            {bulkPreview && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-muted/40">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-2xl font-bold" data-testid="text-preview-total">{bulkPreview.totalStudents}</p>
                      <p className="text-xs text-muted-foreground">Total Students</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400" data-testid="text-preview-will-create">{bulkPreview.willBeCreated}</p>
                      <p className="text-xs text-muted-foreground">Will Be Created</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                    <CardContent className="pt-4 pb-3 text-center">
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400" data-testid="text-preview-already-exist">{bulkPreview.alreadyExist}</p>
                      <p className="text-xs text-muted-foreground">Already Exist</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="border rounded-md overflow-hidden max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkPreview.studentsList.map((s) => (
                        <TableRow key={s.id} data-testid={`row-preview-student-${s.id}`}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{s.studentId}</TableCell>
                          <TableCell>{s.class}</TableCell>
                          <TableCell>{s.section}</TableCell>
                          <TableCell>
                            {s.challanStatus === "will_create" ? (
                              <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                <CheckCircle className="w-3 h-3" /> Will Create
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-yellow-600 text-xs font-medium">
                                <AlertCircle className="w-3 h-3" /> Already Exists
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {bulkPreview.studentsList.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-sm">
                            No active students found with the selected filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setBulkDialogOpen(false); setBulkPreview(null); }}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkGenerate}
                disabled={bulkGenerating || !bulkPreview || bulkPreview.willBeCreated === 0}
                data-testid="button-bulk-generate"
              >
                {bulkGenerating
                  ? "Generating..."
                  : bulkPreview
                    ? `Generate ${bulkPreview.willBeCreated} Challans`
                    : "Generate Challans"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Challan Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Challan Details</DialogTitle>
            <DialogDescription>Challan #{selectedChallan?.challanNo}</DialogDescription>
          </DialogHeader>
          {selectedChallan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Student:</span>
                  <p className="font-medium">{selectedChallan.studentName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Period:</span>
                  <p className="font-medium">{selectedChallan.period}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Issue Date:</span>
                  <p className="font-medium">{selectedChallan.issueDate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Due Date:</span>
                  <p className="font-medium">{selectedChallan.dueDate}</p>
                </div>
              </div>

              <Card>
                <CardContent className="py-3 space-y-2 text-sm">
                  {selectedChallan.feeHeads.map((fh, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{fh.name}</span>
                      <span>Rs. {fh.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 space-y-1">
                    <div className="flex justify-between">
                      <span>Total Amount</span>
                      <span>Rs. {selectedChallan.totalAmount.toLocaleString()}</span>
                    </div>
                    {selectedChallan.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>- Rs. {selectedChallan.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedChallan.lateFee > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Late Fee</span>
                        <span>+ Rs. {selectedChallan.lateFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t pt-1 flex justify-between font-semibold">
                      <span>Net Amount</span>
                      <span>Rs. {selectedChallan.netAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid Amount</span>
                      <span>Rs. {selectedChallan.paidAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-primary">
                      <span>Balance Due</span>
                      <span>Rs. {selectedChallan.balanceAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between items-center">
                <div>Status: {getStatusBadge(selectedChallan.status)}</div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => downloadChallanPDF(selectedChallan)}
                    data-testid="button-download-challan-dialog"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="ghost" onClick={() => setViewDialogOpen(false)}>Close</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
