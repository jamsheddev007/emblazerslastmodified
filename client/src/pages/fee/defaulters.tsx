import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { feeNavItems } from "./fee-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileDown, FileSpreadsheet, Search, AlertTriangle } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import type { Column } from "@/components/shared/data-table";

interface DefaulterSummary {
  total_defaulters: number;
  total_outstanding: number;
  bucket_0_30: { count: number; amount: number };
  bucket_31_60: { count: number; amount: number };
  bucket_61_90: { count: number; amount: number };
  bucket_90_plus: { count: number; amount: number };
}

interface Defaulter extends Record<string, unknown> {
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  challanNo: string;
  period: string;
  dueDate: string;
  daysOverdue: number;
  netAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  agingBucket: "0-30" | "31-60" | "61-90" | "90+";
  studentStatus: string;
  status: string;
}

interface DefaultersResponse {
  summary: DefaulterSummary;
  defaulters: Defaulter[];
}

const bucketFilter: Record<string, string> = {
  "all": "all",
  "0-30": "30",
  "31-60": "60",
  "61-90": "90",
  "90+": "90plus",
};

export default function FeeDefaulters() {
  const [agingBucket, setAgingBucket] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [search, setSearch] = useState("");

  const params = new URLSearchParams();
  if (agingBucket !== "all") params.set("agingBucket", bucketFilter[agingBucket] || agingBucket);

  const { data, isLoading } = useQuery<DefaultersResponse>({
    queryKey: ["/api/fee/defaulters"],
    refetchInterval: 30000,
  });

  const summary = data?.summary;
  const allDefaulters = data?.defaulters || [];

  const filteredDefaulters = useMemo(() => {
    let result = allDefaulters;
    if (agingBucket !== "all") {
      result = result.filter(d => d.agingBucket === agingBucket);
    }
    if (classFilter !== "all") {
      result = result.filter(d => d.class === classFilter);
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(d =>
        d.studentName.toLowerCase().includes(s) || d.studentId.toLowerCase().includes(s)
      );
    }
    return result;
  }, [allDefaulters, agingBucket, classFilter, search]);

  const uniqueClasses = useMemo(() => {
    const classes = [...new Set(allDefaulters.map(d => d.class))].filter(Boolean).sort();
    return classes;
  }, [allDefaulters]);

  const exportColumns: Column<Defaulter>[] = [
    { key: "studentId", label: "Student ID" },
    { key: "studentName", label: "Student Name" },
    { key: "class", label: "Class" },
    { key: "section", label: "Section" },
    { key: "challanNo", label: "Challan No" },
    { key: "period", label: "Period" },
    { key: "dueDate", label: "Due Date" },
    { key: "daysOverdue", label: "Days Overdue" },
    { key: "outstandingAmount", label: "Outstanding Amount" },
    { key: "agingBucket", label: "Aging Bucket" },
    { key: "status", label: "Status" },
  ];

  const handleExportPDF = () => {
    exportToPDF({
      title: "Fee Defaulters Report",
      filename: "fee-defaulters",
      data: filteredDefaulters,
      columns: exportColumns,
    });
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: "Fee Defaulters Report",
      filename: "fee-defaulters",
      data: filteredDefaulters,
      columns: exportColumns,
    });
  };

  const rowBg = (bucket: string) => {
    if (bucket === "90+") return "bg-red-50 dark:bg-red-950/20";
    if (bucket === "61-90") return "bg-orange-50 dark:bg-orange-950/20";
    if (bucket === "31-60") return "bg-amber-50 dark:bg-amber-950/20";
    return "";
  };

  const bucketBadge = (bucket: string) => {
    if (bucket === "90+") return <Badge variant="destructive" data-testid="badge-bucket">{bucket} days</Badge>;
    if (bucket === "61-90") return <Badge className="bg-orange-500 hover:bg-orange-600 text-white" data-testid="badge-bucket">{bucket} days</Badge>;
    if (bucket === "31-60") return <Badge className="bg-amber-500 hover:bg-amber-600 text-white" data-testid="badge-bucket">{bucket} days</Badge>;
    return <Badge variant="secondary" data-testid="badge-bucket">{bucket} days</Badge>;
  };

  return (
    <ModuleLayout
      module="fee"
      navItems={feeNavItems}
      badgeCounts={{ "/fee/defaulters": summary?.total_defaulters ?? 0 }}
    >
      <div className="space-y-6">
        <PageHeader
          title="Fee Defaulters Report"
          description="Students with outstanding fee challans past their due date"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel} data-testid="button-export-excel">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          }
        />

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card
              className="border-amber-200 dark:border-amber-800 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setAgingBucket(agingBucket === "0-30" ? "all" : "0-30")}
              data-testid="card-bucket-0-30"
            >
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  0–30 Days
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold" data-testid="text-count-0-30">{summary?.bucket_0_30.count ?? 0}</div>
                <p className="text-xs text-muted-foreground">Rs. {(summary?.bucket_0_30.amount ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card
              className="border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setAgingBucket(agingBucket === "31-60" ? "all" : "31-60")}
              data-testid="card-bucket-31-60"
            >
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  31–60 Days
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold" data-testid="text-count-31-60">{summary?.bucket_31_60.count ?? 0}</div>
                <p className="text-xs text-muted-foreground">Rs. {(summary?.bucket_31_60.amount ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card
              className="border-red-200 dark:border-red-800 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setAgingBucket(agingBucket === "61-90" ? "all" : "61-90")}
              data-testid="card-bucket-61-90"
            >
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-red-500 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  61–90 Days
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold" data-testid="text-count-61-90">{summary?.bucket_61_90.count ?? 0}</div>
                <p className="text-xs text-muted-foreground">Rs. {(summary?.bucket_61_90.amount ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card
              className="border-red-300 dark:border-red-700 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setAgingBucket(agingBucket === "90+" ? "all" : "90+")}
              data-testid="card-bucket-90-plus"
            >
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  90+ Days
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-count-90-plus">{summary?.bucket_90_plus.count ?? 0}</div>
                <p className="text-xs text-muted-foreground">Rs. {(summary?.bucket_90_plus.amount ?? 0).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <CardTitle className="text-base">
                Defaulters List
                {filteredDefaulters.length > 0 && (
                  <span className="text-muted-foreground font-normal text-sm ml-2">
                    ({filteredDefaulters.length} record{filteredDefaulters.length !== 1 ? "s" : ""})
                  </span>
                )}
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search student..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 w-full sm:w-48"
                    data-testid="input-search"
                  />
                </div>
                <Select value={classFilter} onValueChange={setClassFilter} data-testid="select-class">
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {uniqueClasses.map(cls => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={agingBucket} onValueChange={setAgingBucket} data-testid="select-aging-bucket">
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="All Buckets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Buckets</SelectItem>
                    <SelectItem value="0-30">0–30 Days</SelectItem>
                    <SelectItem value="31-60">31–60 Days</SelectItem>
                    <SelectItem value="61-90">61–90 Days</SelectItem>
                    <SelectItem value="90+">90+ Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : filteredDefaulters.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No defaulters found</p>
                <p className="text-sm mt-1">
                  {search || classFilter !== "all" || agingBucket !== "all"
                    ? "Try adjusting your filters"
                    : "All challans are within their due dates"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Class & Section</TableHead>
                      <TableHead>Challan No</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Days Overdue</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDefaulters.map((d, idx) => (
                      <TableRow
                        key={`${d.challanNo}-${idx}`}
                        className={rowBg(d.agingBucket)}
                        data-testid={`row-defaulter-${idx}`}
                      >
                        <TableCell className="font-mono text-xs" data-testid={`text-student-id-${idx}`}>{d.studentId}</TableCell>
                        <TableCell className="font-medium" data-testid={`text-student-name-${idx}`}>{d.studentName}</TableCell>
                        <TableCell data-testid={`text-class-${idx}`}>{d.class} {d.section}</TableCell>
                        <TableCell className="font-mono text-xs" data-testid={`text-challan-no-${idx}`}>{d.challanNo}</TableCell>
                        <TableCell className="text-sm" data-testid={`text-period-${idx}`}>{d.period}</TableCell>
                        <TableCell className="text-sm" data-testid={`text-due-date-${idx}`}>{d.dueDate}</TableCell>
                        <TableCell className="text-right">
                          {bucketBadge(d.agingBucket)}
                          <div className="text-xs text-muted-foreground mt-0.5" data-testid={`text-days-overdue-${idx}`}>{d.daysOverdue} days</div>
                        </TableCell>
                        <TableCell className="text-right font-semibold" data-testid={`text-outstanding-${idx}`}>
                          Rs. {d.outstandingAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={d.status === "Pending" ? "secondary" : "outline"}
                            data-testid={`badge-status-${idx}`}
                          >
                            {d.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {summary && (
          <Card className="bg-muted/30">
            <CardContent className="py-3 px-4">
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Defaulters: </span>
                  <span className="font-semibold" data-testid="text-total-defaulters">{summary.total_defaulters}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Outstanding: </span>
                  <span className="font-semibold text-red-600 dark:text-red-400" data-testid="text-total-outstanding">
                    Rs. {summary.total_outstanding.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ModuleLayout>
  );
}
