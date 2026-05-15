import { useState } from "react";
import { ModuleLayout } from "@/components/layout/module-layout";
import { PageHeader } from "@/components/shared/page-header";
import { financeNavItems, useChartOfAccounts, accountTypes } from "./finance-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Search, BookOpen, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { type ChartOfAccounts, type InsertChartOfAccounts } from "@shared/schema";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FinanceAccounts() {
  const { accounts, createAccount, updateAccount, deleteAccount, isPending } = useChartOfAccounts();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartOfAccounts | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    accountCode: "",
    accountName: "",
    accountType: "Asset" as typeof accountTypes[number],
    parentAccountId: "",
    description: "",
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      accountCode: "",
      accountName: "",
      accountType: "Asset",
      parentAccountId: "",
      description: "",
      isActive: true,
    });
    setEditingAccount(null);
  };

  const handleOpenDialog = (account?: ChartOfAccounts) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        accountCode: account.accountCode,
        accountName: account.accountName,
        accountType: account.accountType,
        parentAccountId: account.parentAccountId || "",
        description: account.description || "",
        isActive: account.isActive,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSaveAccount = async () => {
    if (!formData.accountCode || !formData.accountName) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      const accountData: InsertChartOfAccounts = {
        accountCode: formData.accountCode,
        accountName: formData.accountName,
        accountType: formData.accountType,
        parentAccountId: formData.parentAccountId || undefined,
        description: formData.description || undefined,
        isActive: formData.isActive,
        level: 1,
        openingBalance: 0,
        currentBalance: 0,
        isSystemAccount: false,
      };

      if (editingAccount) {
        await updateAccount(editingAccount.id, accountData);
        toast({ title: "Success", description: "Account updated successfully" });
      } else {
        await createAccount(accountData);
        toast({ title: "Success", description: "Account created successfully" });
      }
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await deleteAccount(id);
      toast({ title: "Success", description: "Account deleted" });
    } catch (error) {
      toast({ title: "Error", description: String(error), variant: "destructive" });
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "Asset": "default",
      "Liability": "outline",
      "Income": "secondary",
      "Expense": "destructive",
      "Equity": "outline",
    };
    return <Badge variant={variants[type] || "secondary"}>{type}</Badge>;
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.accountCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || account.accountType === typeFilter;
    return matchesSearch && matchesType;
  });

  const groupedByType = accountTypes.reduce((acc, type) => {
    acc[type] = filteredAccounts.filter(a => a.accountType === type);
    return acc;
  }, {} as Record<string, ChartOfAccounts[]>);

  const totalAssets = accounts.filter(a => a.accountType === "Asset").reduce((sum, a) => sum + a.currentBalance, 0);
  const totalLiabilities = accounts.filter(a => a.accountType === "Liability").reduce((sum, a) => sum + a.currentBalance, 0);
  const totalIncome = accounts.filter(a => a.accountType === "Income").reduce((sum, a) => sum + a.currentBalance, 0);
  const totalExpense = accounts.filter(a => a.accountType === "Expense").reduce((sum, a) => sum + a.currentBalance, 0);

  return (
    <ModuleLayout module="finance" navItems={financeNavItems}>
      <PageHeader
        title="Chart of Accounts"
        description="Manage financial accounts for double-entry accounting"
      />

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Assets</CardTitle>
            <ArrowUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Rs. {totalAssets.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Liabilities</CardTitle>
            <ArrowDown className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Rs. {totalLiabilities.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Income</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalIncome.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Expenses</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {totalExpense.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-account"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40" data-testid="select-type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {accountTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => handleOpenDialog()} data-testid="button-add-account">
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        </div>

        <Accordion type="multiple" defaultValue={["Asset", "Liability", "Income", "Expense"]} className="space-y-2">
          {accountTypes.map((type) => (
            groupedByType[type]?.length > 0 && (
              <AccordionItem key={type} value={type} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(type)}
                    <span className="font-medium">{type} ({groupedByType[type].length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedByType[type].map((account) => (
                        <TableRow key={account.id} data-testid={`row-account-${account.id}`}>
                          <TableCell className="font-mono font-medium">{account.accountCode}</TableCell>
                          <TableCell>{account.accountName}</TableCell>
                          <TableCell className="text-muted-foreground">{account.description || "-"}</TableCell>
                          <TableCell className="text-right font-medium">
                            Rs. {account.currentBalance.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={account.isActive ? "default" : "secondary"}>
                              {account.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleOpenDialog(account)} data-testid={`button-edit-account-${account.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteAccount(account.id)} data-testid={`button-delete-account-${account.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            )
          ))}
        </Accordion>

        {filteredAccounts.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No accounts found. Click "Add Account" to create one.
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle>
            <DialogDescription>Manage chart of accounts for financial tracking</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Code *</Label>
                <Input
                  placeholder="e.g., 1001"
                  value={formData.accountCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountCode: e.target.value }))}
                  data-testid="input-account-code"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select 
                  value={formData.accountType} 
                  onValueChange={(v: typeof accountTypes[number]) => setFormData(prev => ({ ...prev, accountType: v }))}
                >
                  <SelectTrigger data-testid="select-account-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Account Name *</Label>
              <Input
                placeholder="Enter account name"
                value={formData.accountName}
                onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                data-testid="input-account-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Parent Account (Optional)</Label>
              <Select value={formData.parentAccountId} onValueChange={(v) => setFormData(prev => ({ ...prev, parentAccountId: v }))}>
                <SelectTrigger data-testid="select-parent-account">
                  <SelectValue placeholder="No parent account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No parent</SelectItem>
                  {accounts.filter(a => a.accountType === formData.accountType && a.id !== editingAccount?.id).map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountCode} - {account.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Brief description of the account"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                data-testid="input-account-description"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveAccount} disabled={isPending} data-testid="button-save-account">
                {isPending ? "Saving..." : editingAccount ? "Update Account" : "Add Account"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
