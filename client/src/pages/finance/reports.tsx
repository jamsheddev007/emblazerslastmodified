import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { financeNavItems, useChartOfAccounts, useLedgerEntries } from "./finance-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleLayout } from "@/components/layout/module-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/export-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export default function FinanceReports() {
  const { accounts } = useChartOfAccounts();

  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const { data: trialBalanceResponse } = useQuery<{ accounts: any[]; totalDebit: number; totalCredit: number }>({
    queryKey: ['/api/finance/reports/trial-balance'],
  });

  const trialBalanceData: TrialBalanceRow[] = (trialBalanceResponse?.accounts || []).map((a: any) => ({
    accountCode: a.accountCode,
    accountName: a.accountName,
    debit: a.totalDebit || 0,
    credit: a.totalCredit || 0,
  }));

  const { entries: ledgerEntries } = useLedgerEntries(undefined, dateRange.from, dateRange.to);

  const tbGrandDebit = trialBalanceResponse?.totalDebit ?? trialBalanceData.reduce((s, r) => s + r.debit, 0);
  const tbGrandCredit = trialBalanceResponse?.totalCredit ?? trialBalanceData.reduce((s, r) => s + r.credit, 0);
  const tbBalanced = Math.abs(tbGrandDebit - tbGrandCredit) < 0.01;

  const accountTotals = ledgerEntries.reduce((acc, entry) => {
    const key = entry.accountId;
    if (!acc[key]) {
      const chartAccount = accounts.find(a => a.id === entry.accountId);
      acc[key] = {
        accountId: entry.accountId,
        accountCode: entry.accountCode,
        accountName: entry.accountName,
        accountType: chartAccount?.accountType || "Expense",
        totalDebit: 0,
        totalCredit: 0,
      };
    }
    acc[key].totalDebit += entry.debit;
    acc[key].totalCredit += entry.credit;
    return acc;
  }, {} as Record<string, { accountId: string; accountCode: string; accountName: string; accountType: string; totalDebit: number; totalCredit: number }>);

  const accountTotalsList = Object.values(accountTotals);

  const incomeAccounts = accountTotalsList.filter(a => a.accountType === "Income");
  const expenseAccounts = accountTotalsList.filter(a => a.accountType === "Expense");
  const assetAccounts = accountTotalsList.filter(a => a.accountType === "Asset");
  const liabilityAccounts = accountTotalsList.filter(a => a.accountType === "Liability");
  const equityAccounts = accountTotalsList.filter(a => a.accountType === "Equity");

  const totalRevenue = incomeAccounts.reduce((s, a) => s + (a.totalCredit - a.totalDebit), 0);
  const totalExpenseAmt = expenseAccounts.reduce((s, a) => s + (a.totalDebit - a.totalCredit), 0);
  const netIncome = totalRevenue - totalExpenseAmt;

  const totalAssets = assetAccounts.reduce((s, a) => s + (a.totalDebit - a.totalCredit), 0);
  const totalLiabilities = liabilityAccounts.reduce((s, a) => s + (a.totalCredit - a.totalDebit), 0);
  const totalEquity = equityAccounts.reduce((s, a) => s + (a.totalCredit - a.totalDebit), 0);

  const handleExportTrialBalancePDF = () => {
    exportToPDF({
      title: "Trial Balance",
      filename: "trial-balance",
      data: trialBalanceData as any[],
      columns: [
        { key: "accountCode" as const, label: "Account Code" },
        { key: "accountName" as const, label: "Account Name" },
        { key: "debit" as const, label: "Debit" },
        { key: "credit" as const, label: "Credit" },
      ],
      summaryRows: [
        { label: "Grand Total Debit", value: `Rs. ${tbGrandDebit.toLocaleString()}` },
        { label: "Grand Total Credit", value: `Rs. ${tbGrandCredit.toLocaleString()}` },
      ],
    });
  };

  const handleExportTrialBalanceExcel = () => {
    exportToExcel({
      title: "Trial Balance",
      filename: "trial-balance",
      data: trialBalanceData as any[],
      columns: [
        { key: "accountCode" as const, label: "Account Code" },
        { key: "accountName" as const, label: "Account Name" },
        { key: "debit" as const, label: "Debit" },
        { key: "credit" as const, label: "Credit" },
      ],
      summaryRows: [
        { label: "Grand Total Debit", value: `Rs. ${tbGrandDebit.toLocaleString()}` },
        { label: "Grand Total Credit", value: `Rs. ${tbGrandCredit.toLocaleString()}` },
      ],
    });
  };

  const incomeStatementData = [
    ...incomeAccounts.map(a => ({ item: a.accountName, amount: a.totalCredit - a.totalDebit, section: "Revenue" })),
    ...expenseAccounts.map(a => ({ item: a.accountName, amount: a.totalDebit - a.totalCredit, section: "Expense" })),
  ];

  const handleExportIncomeStatementPDF = () => {
    exportToPDF({
      title: `Income Statement (${dateRange.from} to ${dateRange.to})`,
      filename: "income-statement",
      data: incomeStatementData as any[],
      columns: [
        { key: "section" as const, label: "Section" },
        { key: "item" as const, label: "Account" },
        { key: "amount" as const, label: "Amount" },
      ],
      summaryRows: [
        { label: "Total Revenue", value: `Rs. ${totalRevenue.toLocaleString()}` },
        { label: "Total Expenses", value: `Rs. ${totalExpenseAmt.toLocaleString()}` },
        { label: "Net Income", value: `Rs. ${netIncome.toLocaleString()}` },
      ],
    });
  };

  const handleExportIncomeStatementExcel = () => {
    exportToExcel({
      title: "Income Statement",
      filename: "income-statement",
      data: incomeStatementData as any[],
      columns: [
        { key: "section" as const, label: "Section" },
        { key: "item" as const, label: "Account" },
        { key: "amount" as const, label: "Amount" },
      ],
      summaryRows: [
        { label: "Total Revenue", value: `Rs. ${totalRevenue.toLocaleString()}` },
        { label: "Total Expenses", value: `Rs. ${totalExpenseAmt.toLocaleString()}` },
        { label: "Net Income", value: `Rs. ${netIncome.toLocaleString()}` },
      ],
    });
  };

  const balanceSheetData = [
    ...assetAccounts.map(a => ({ item: a.accountName, amount: a.totalDebit - a.totalCredit, section: "Assets" })),
    ...liabilityAccounts.map(a => ({ item: a.accountName, amount: a.totalCredit - a.totalDebit, section: "Liabilities" })),
    ...equityAccounts.map(a => ({ item: a.accountName, amount: a.totalCredit - a.totalDebit, section: "Equity" })),
  ];

  const handleExportBalanceSheetPDF = () => {
    exportToPDF({
      title: `Balance Sheet (as of ${dateRange.to})`,
      filename: "balance-sheet",
      data: balanceSheetData as any[],
      columns: [
        { key: "section" as const, label: "Section" },
        { key: "item" as const, label: "Account" },
        { key: "amount" as const, label: "Amount" },
      ],
      summaryRows: [
        { label: "Total Assets", value: `Rs. ${totalAssets.toLocaleString()}` },
        { label: "Total Liabilities", value: `Rs. ${totalLiabilities.toLocaleString()}` },
        { label: "Total Equity", value: `Rs. ${totalEquity.toLocaleString()}` },
      ],
    });
  };

  const handleExportBalanceSheetExcel = () => {
    exportToExcel({
      title: "Balance Sheet",
      filename: "balance-sheet",
      data: balanceSheetData as any[],
      columns: [
        { key: "section" as const, label: "Section" },
        { key: "item" as const, label: "Account" },
        { key: "amount" as const, label: "Amount" },
      ],
      summaryRows: [
        { label: "Total Assets", value: `Rs. ${totalAssets.toLocaleString()}` },
        { label: "Total Liabilities", value: `Rs. ${totalLiabilities.toLocaleString()}` },
        { label: "Total Equity", value: `Rs. ${totalEquity.toLocaleString()}` },
      ],
    });
  };

  return (
    <ModuleLayout module="finance" navItems={financeNavItems}>
      <PageHeader
        title="Financial Reports"
        description="Trial Balance, Income Statement, and Balance Sheet"
      />

      <div className="space-y-6">
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  data-testid="input-date-from"
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  data-testid="input-date-to"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="trial-balance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trial-balance" data-testid="tab-trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="income-statement" data-testid="tab-income-statement">Income Statement</TabsTrigger>
            <TabsTrigger value="balance-sheet" data-testid="tab-balance-sheet">Balance Sheet</TabsTrigger>
          </TabsList>

          <TabsContent value="trial-balance" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>Trial Balance</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportTrialBalancePDF} data-testid="button-export-tb-pdf">
                    <FileDown className="w-4 h-4 mr-2" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportTrialBalanceExcel} data-testid="button-export-tb-excel">
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Code</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead className="text-right">Debit Total</TableHead>
                      <TableHead className="text-right">Credit Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialBalanceData.map((row, idx) => (
                      <TableRow key={idx} data-testid={`row-tb-${idx}`}>
                        <TableCell className="font-medium">{row.accountCode}</TableCell>
                        <TableCell>{row.accountName}</TableCell>
                        <TableCell className="text-right">{row.debit > 0 ? `Rs. ${row.debit.toLocaleString()}` : "-"}</TableCell>
                        <TableCell className="text-right">{row.credit > 0 ? `Rs. ${row.credit.toLocaleString()}` : "-"}</TableCell>
                      </TableRow>
                    ))}
                    {trialBalanceData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No trial balance data available.
                        </TableCell>
                      </TableRow>
                    )}
                    {trialBalanceData.length > 0 && (
                      <TableRow className="font-bold border-t-2">
                        <TableCell colSpan={2}>Grand Total</TableCell>
                        <TableCell className="text-right">Rs. {tbGrandDebit.toLocaleString()}</TableCell>
                        <TableCell className="text-right">Rs. {tbGrandCredit.toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {trialBalanceData.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <Badge variant={tbBalanced ? "default" : "destructive"}>
                      {tbBalanced ? "Balanced" : "Unbalanced"}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="income-statement" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>Income Statement ({dateRange.from} to {dateRange.to})</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportIncomeStatementPDF} data-testid="button-export-is-pdf">
                    <FileDown className="w-4 h-4 mr-2" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportIncomeStatementExcel} data-testid="button-export-is-excel">
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-w-lg mx-auto space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">Revenue</h4>
                    {incomeAccounts.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">No income accounts found</p>
                    )}
                    {incomeAccounts.map((a) => (
                      <div key={a.accountId} className="flex justify-between py-2 border-b">
                        <span>{a.accountName}</span>
                        <span className="font-medium text-green-600 dark:text-green-400">Rs. {(a.totalCredit - a.totalDebit).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 bg-muted/50 px-2 rounded">
                      <span className="font-semibold">Total Revenue</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">Rs. {totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">Expenses</h4>
                    {expenseAccounts.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">No expense accounts found</p>
                    )}
                    {expenseAccounts.map((a) => (
                      <div key={a.accountId} className="flex justify-between py-2 border-b">
                        <span>{a.accountName}</span>
                        <span className="font-medium text-red-600 dark:text-red-400">Rs. {(a.totalDebit - a.totalCredit).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 bg-muted/50 px-2 rounded">
                      <span className="font-semibold">Total Expenses</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">Rs. {totalExpenseAmt.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className={`flex justify-between py-3 px-2 rounded ${netIncome >= 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"}`}>
                    <span className="font-bold text-lg">Net Income</span>
                    <span className={`font-bold text-lg ${netIncome >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      Rs. {netIncome.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance-sheet" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>Balance Sheet (as of {dateRange.to})</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportBalanceSheetPDF} data-testid="button-export-bs-pdf">
                    <FileDown className="w-4 h-4 mr-2" /> PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportBalanceSheetExcel} data-testid="button-export-bs-excel">
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="max-w-lg mx-auto space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">Assets</h4>
                    {assetAccounts.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">No asset accounts found</p>
                    )}
                    {assetAccounts.map((a) => (
                      <div key={a.accountId} className="flex justify-between py-2 border-b">
                        <span>{a.accountName}</span>
                        <span className="font-medium">Rs. {(a.totalDebit - a.totalCredit).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 bg-muted/50 px-2 rounded">
                      <span className="font-semibold">Total Assets</span>
                      <span className="font-semibold">Rs. {totalAssets.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">Liabilities</h4>
                    {liabilityAccounts.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">No liability accounts found</p>
                    )}
                    {liabilityAccounts.map((a) => (
                      <div key={a.accountId} className="flex justify-between py-2 border-b">
                        <span>{a.accountName}</span>
                        <span className="font-medium">Rs. {(a.totalCredit - a.totalDebit).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 bg-muted/50 px-2 rounded">
                      <span className="font-semibold">Total Liabilities</span>
                      <span className="font-semibold">Rs. {totalLiabilities.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">Equity</h4>
                    {equityAccounts.length === 0 && (
                      <p className="text-sm text-muted-foreground py-2">No equity accounts found</p>
                    )}
                    {equityAccounts.map((a) => (
                      <div key={a.accountId} className="flex justify-between py-2 border-b">
                        <span>{a.accountName}</span>
                        <span className="font-medium">Rs. {(a.totalCredit - a.totalDebit).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 bg-muted/50 px-2 rounded">
                      <span className="font-semibold">Total Equity</span>
                      <span className="font-semibold">Rs. {totalEquity.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2">
                    <div className="flex justify-between py-2">
                      <span className="font-bold">Total Assets</span>
                      <span className="font-bold">Rs. {totalAssets.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="font-bold">Liabilities + Equity</span>
                      <span className="font-bold">Rs. {(totalLiabilities + totalEquity).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-end mt-2">
                      <Badge variant={Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? "default" : "destructive"}>
                        {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? "Balanced" : "Unbalanced"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
}
