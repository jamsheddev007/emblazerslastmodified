import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { financeNavItems, useChartOfAccounts, useLedgerEntries } from "./finance-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Search, Filter, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

export default function FinanceLedger() {
  const { accounts } = useChartOfAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const { entries: ledgerEntries, isLoading } = useLedgerEntries(
    selectedAccountId !== "all" ? selectedAccountId : undefined,
    fromDate || undefined,
    toDate || undefined
  );

  const filteredEntries = ledgerEntries.filter(entry => {
    if (!searchTerm) return true;
    return entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.referenceNo || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => a.date.localeCompare(b.date));

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const accountType = selectedAccount?.accountType;

  const calculateRunningBalance = () => {
    let balance = 0;
    return sortedEntries.map(entry => {
      if (accountType === "Asset" || accountType === "Expense") {
        balance += entry.debit - entry.credit;
      } else if (accountType === "Liability" || accountType === "Income" || accountType === "Equity") {
        balance += entry.credit - entry.debit;
      } else {
        balance += entry.debit - entry.credit;
      }
      return { ...entry, runningBalance: balance };
    });
  };

  const entriesWithBalance = calculateRunningBalance();

  return (
    <ModuleLayout module="finance" navItems={financeNavItems}>
      <PageHeader
        title="General Ledger"
        description="View ledger entries with running balance"
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-2">
            <Label>Account</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-64" data-testid="select-account-filter">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.accountCode} - {account.accountName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>From Date</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              data-testid="input-from-date"
            />
          </div>
          <div className="space-y-2">
            <Label>To Date</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              data-testid="input-to-date"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-ledger"
            />
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Ref #</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Running Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entriesWithBalance.map((entry) => {
                const sourceLabel: Record<string, string> = {
                  Voucher: "Voucher",
                  FeeCollection: "Fee Collection",
                  SalaryPayment: "Salary Payment",
                  Expense: "Expense",
                  Payroll: "Payroll",
                  Payment: "Payment",
                  Journal: "Journal",
                  Opening: "Opening",
                  Challan: "Challan",
                };
                const sourceVariant = entry.referenceType === "FeeCollection" ? "default" as const
                  : entry.referenceType === "SalaryPayment" ? "secondary" as const
                  : "outline" as const;
                return (
                <TableRow key={entry.id} data-testid={`row-ledger-${entry.id}`}>
                  <TableCell>{entry.date}</TableCell>
                  <TableCell className="font-medium">{entry.referenceNo || entry.entryNo}</TableCell>
                  <TableCell>
                    <Badge variant={sourceVariant}>
                      {sourceLabel[entry.referenceType] || entry.referenceType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.accountName}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell className="text-right">
                    {entry.debit > 0 && (
                      <span className="flex items-center justify-end text-green-600 dark:text-green-400">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        Rs. {entry.debit.toLocaleString()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.credit > 0 && (
                      <span className="flex items-center justify-end text-red-600 dark:text-red-400">
                        <ArrowDownLeft className="w-3 h-3 mr-1" />
                        Rs. {entry.credit.toLocaleString()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    Rs. {entry.runningBalance.toLocaleString()}
                  </TableCell>
                </TableRow>
                );
              })}
              {entriesWithBalance.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {isLoading ? "Loading ledger entries..." : "No ledger entries found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </ModuleLayout>
  );
}
