import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  type Account, 
  type FinanceVoucher, 
  type InsertFinanceVoucher,
  type Vendor,
  type InsertVendor,
  type Expense,
  type InsertExpense,
  type ChartOfAccounts,
  type InsertChartOfAccounts,
  type LedgerEntry,
  type InsertLedgerEntry,
  type JournalEntry,
  type InsertJournalEntry,
} from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  LayoutDashboard,
  BookOpen,
  Receipt,
  FileText,
  Users,
  TrendingDown,
  Wallet,
  Package,
} from "lucide-react";

export const financeNavItems = [
  { label: "Dashboard", path: "/finance/dashboard", icon: LayoutDashboard },
  { label: "Chart of Accounts", path: "/finance/accounts", icon: BookOpen },
  { label: "Ledger", path: "/finance/ledger", icon: Wallet },
  { label: "Expenses", path: "/finance/expenses", icon: TrendingDown },
  { label: "Vendors", path: "/finance/vendors", icon: Users },
  { label: "Vouchers", path: "/finance/vouchers", icon: Receipt },
  { label: "Assets", path: "/finance/assets", icon: Package },
  { label: "Reports", path: "/finance/reports", icon: FileText },
];

interface RecentFeePayment {
  id: string;
  receiptNo: string;
  studentName: string;
  amount: number;
  paymentMode: string;
  paymentDate: string;
}

interface RecentPayrollPayment {
  id: string;
  payrollId: string;
  staffName: string;
  netSalary: number;
  month: string;
  paidDate: string;
}

interface DashboardData {
  totalAssets: number;
  totalLiabilities: number;
  totalIncome: number;
  totalExpenses: number;
  recentVouchers: FinanceVoucher[];
  totalFeeCollected: number;
  totalPayrollPaid: number;
  recentFeePayments: RecentFeePayment[];
  recentPayrollPayments: RecentPayrollPayment[];
}

export function useFinanceData() {
  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError } = useQuery<DashboardData>({
    queryKey: ['/api/finance/dashboard']
  });
  
  const { data: vouchers = [], isLoading: vouchersLoading, error: vouchersError } = useQuery<FinanceVoucher[]>({
    queryKey: ['/api/finance-vouchers']
  });

  return { 
    dashboard: dashboard || { totalAssets: 0, totalLiabilities: 0, totalIncome: 0, totalExpenses: 0, recentVouchers: [], totalFeeCollected: 0, totalPayrollPaid: 0, recentFeePayments: [], recentPayrollPayments: [] },
    vouchers, 
    isLoading: dashboardLoading || vouchersLoading,
    error: dashboardError ?? vouchersError,
  };
}

interface ExtendedDashboardData {
  unpostedVouchers: number;
  thisMonthFeeIncome: number;
  thisMonthSalaryExpense: number;
  thisMonthSalesIncome: number;
  thisMonthHostelIncome: number;
  totalReceivable: number;
}

export function useFinanceDashboardExtended() {
  const { data, isLoading } = useQuery<ExtendedDashboardData>({
    queryKey: ['/api/finance/dashboard/extended'],
    refetchInterval: 30000,
  });
  return {
    extended: data || { unpostedVouchers: 0, thisMonthFeeIncome: 0, thisMonthSalaryExpense: 0, thisMonthSalesIncome: 0, thisMonthHostelIncome: 0, totalReceivable: 0 },
    isExtendedLoading: isLoading,
  };
}

const invalidateFinanceQueries = () => {
  queryClient.invalidateQueries({ queryKey: ['/api/finance-vouchers'] });
  queryClient.invalidateQueries({ queryKey: ['/api/finance/dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['/api/ledger-entries'] });
};

export function useFinanceVouchers() {
  const { data: vouchers = [], isLoading, error } = useQuery<FinanceVoucher[]>({
    queryKey: ['/api/finance-vouchers']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFinanceVoucher) => {
      const res = await apiRequest('POST', '/api/finance-vouchers', data);
      return res.json() as Promise<FinanceVoucher>;
    },
    onSuccess: invalidateFinanceQueries
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<InsertFinanceVoucher> }) => {
      const res = await apiRequest('PATCH', `/api/finance-vouchers/${id}`, updates);
      return res.json() as Promise<FinanceVoucher>;
    },
    onSuccess: invalidateFinanceQueries
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/finance-vouchers/${id}`);
    },
    onSuccess: invalidateFinanceQueries
  });

  const postMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('POST', `/api/finance-vouchers/${id}/post`);
      return res.json() as Promise<FinanceVoucher>;
    },
    onSuccess: invalidateFinanceQueries
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('POST', `/api/finance-vouchers/${id}/cancel`);
      return res.json() as Promise<FinanceVoucher>;
    },
    onSuccess: invalidateFinanceQueries
  });

  return {
    vouchers,
    isLoading,
    error,
    createVoucher: createMutation.mutateAsync,
    updateVoucher: (id: string, updates: Partial<InsertFinanceVoucher>) => updateMutation.mutateAsync({ id, updates }),
    deleteVoucher: deleteMutation.mutateAsync,
    postVoucher: postMutation.mutateAsync,
    cancelVoucher: cancelMutation.mutateAsync,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || postMutation.isPending || cancelMutation.isPending,
  };
}

export function useVendors() {
  const { data: vendors = [], isLoading, error } = useQuery<Vendor[]>({
    queryKey: ['/api/vendors']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertVendor) => {
      const res = await apiRequest('POST', '/api/vendors', data);
      return res.json() as Promise<Vendor>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/vendors'] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Vendor> }) => {
      const res = await apiRequest('PATCH', `/api/vendors/${id}`, updates);
      return res.json() as Promise<Vendor>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/vendors'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/vendors/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/vendors'] })
  });

  return {
    vendors,
    isLoading,
    error,
    createVendor: createMutation.mutateAsync,
    updateVendor: (id: string, updates: Partial<Vendor>) => updateMutation.mutateAsync({ id, updates }),
    deleteVendor: deleteMutation.mutateAsync,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
}

export function useExpenses() {
  const { data: expenses = [], isLoading, error } = useQuery<Expense[]>({
    queryKey: ['/api/expenses']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertExpense) => {
      const res = await apiRequest('POST', '/api/expenses', data);
      return res.json() as Promise<Expense>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      invalidateFinanceQueries();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Expense> }) => {
      const res = await apiRequest('PATCH', `/api/expenses/${id}`, updates);
      return res.json() as Promise<Expense>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      invalidateFinanceQueries();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
      invalidateFinanceQueries();
    }
  });

  return {
    expenses,
    isLoading,
    error,
    createExpense: createMutation.mutateAsync,
    updateExpense: (id: string, updates: Partial<Expense>) => updateMutation.mutateAsync({ id, updates }),
    deleteExpense: deleteMutation.mutateAsync,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
}

export function useChartOfAccounts() {
  const { data: accounts = [], isLoading, error } = useQuery<ChartOfAccounts[]>({
    queryKey: ['/api/chart-of-accounts']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertChartOfAccounts) => {
      const res = await apiRequest('POST', '/api/chart-of-accounts', data);
      return res.json() as Promise<ChartOfAccounts>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/chart-of-accounts'] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ChartOfAccounts> }) => {
      const res = await apiRequest('PATCH', `/api/chart-of-accounts/${id}`, updates);
      return res.json() as Promise<ChartOfAccounts>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/chart-of-accounts'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/chart-of-accounts/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/chart-of-accounts'] })
  });

  return {
    accounts,
    isLoading,
    error,
    createAccount: createMutation.mutateAsync,
    updateAccount: (id: string, updates: Partial<ChartOfAccounts>) => updateMutation.mutateAsync({ id, updates }),
    deleteAccount: deleteMutation.mutateAsync,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
}

export function useLedgerEntries(accountId?: string, fromDate?: string, toDate?: string) {
  const params = new URLSearchParams();
  if (accountId && accountId !== "all") params.append("accountId", accountId);
  if (fromDate) params.append("fromDate", fromDate);
  if (toDate) params.append("toDate", toDate);
  const queryString = params.toString();
  const url = queryString ? `/api/ledger-entries?${queryString}` : '/api/ledger-entries';

  const { data: entries = [], isLoading, error } = useQuery<LedgerEntry[]>({
    queryKey: [url],
  });

  return {
    entries,
    isLoading,
    error,
  };
}

export function useJournalEntries() {
  const { data: entries = [], isLoading, error } = useQuery<JournalEntry[]>({
    queryKey: ['/api/journal-entries']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertJournalEntry) => {
      const res = await apiRequest('POST', '/api/journal-entries', data);
      return res.json() as Promise<JournalEntry>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ledger-entries'] });
    }
  });

  return {
    entries,
    isLoading,
    error,
    createEntry: createMutation.mutateAsync,
    isPending: createMutation.isPending
  };
}

export const accountTypes = ["Asset", "Liability", "Equity", "Income", "Expense"] as const;
export const voucherTypes = ["Receipt", "Payment", "Journal", "Contra"] as const;
export const vendorCategories = ["Supplier", "Contractor", "Service Provider", "Utility", "Other"] as const;
export const expenseCategories = ["Utilities", "Supplies", "Maintenance", "Salary", "Transport", "Events", "Marketing", "IT", "Other"] as const;
export const paymentStatuses = ["Pending", "Approved", "Paid", "Cancelled"] as const;
