import { useQuery, useMutation } from "@tanstack/react-query";
import { type FeeVoucher, type InsertFeeVoucher, type FeeStructure, type InsertFeeStructure, type DiscountRule, type InsertDiscountRule, type LateFeeRule, type InsertLateFeeRule, type InstallmentPlan, type InsertInstallmentPlan, type Challan, type InsertChallan, type Payment, type InsertPayment } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  LayoutDashboard,
  Receipt,
  FilePlus,
  FileText,
  Settings,
  CreditCard,
  Percent,
  Clock,
  Calendar,
  AlertTriangle,
  Megaphone,
} from "lucide-react";

export const feeNavItems = [
  { label: "Dashboard", path: "/fee/dashboard", icon: LayoutDashboard },
  { label: "Fee Structure", path: "/fee/structures", icon: Settings },
  { label: "Challans", path: "/fee/challans", icon: Receipt },
  { label: "Payments", path: "/fee/payments", icon: CreditCard },
  { label: "Generate Voucher", path: "/fee/generate", icon: FilePlus },
  { label: "Vouchers", path: "/fee/vouchers", icon: Calendar },
  { label: "Reports", path: "/fee/reports", icon: FileText },
  { label: "Defaulters", path: "/fee/defaulters", icon: AlertTriangle },
  { label: "Broadcast", path: "/fee/broadcast", icon: Megaphone },
];

export function useFeeData() {
  const { data: vouchers = [], isLoading, error } = useQuery<FeeVoucher[]>({
    queryKey: ['/api/fee-vouchers']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFeeVoucher) => {
      const res = await apiRequest('POST', '/api/fee-vouchers', data);
      return res.json() as Promise<FeeVoucher>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/fee-vouchers'] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FeeVoucher> }) => {
      const res = await apiRequest('PATCH', `/api/fee-vouchers/${id}`, updates);
      return res.json() as Promise<FeeVoucher>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/fee-vouchers'] })
  });

  const addVoucher = async (voucher: InsertFeeVoucher): Promise<FeeVoucher> => {
    return await createMutation.mutateAsync(voucher);
  };

  const updateVoucher = async (id: string, updates: Partial<FeeVoucher>) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const getVoucher = (id: string) => vouchers.find((v) => v.id === id);

  const refreshVouchers = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/fee-vouchers'] });
  };

  return { 
    vouchers, 
    addVoucher, 
    updateVoucher, 
    getVoucher,
    refreshVouchers,
    isLoading,
    error,
    isPending: createMutation.isPending || updateMutation.isPending
  };
}

export const feeHeadOptions = ["Tuition Fee", "Lab Fee", "Sports Fee", "Library Fee", "Transport Fee", "Hostel Fee", "Exam Fee", "Computer Fee", "Activity Fee"];

export const months = [
  "January 2024", "February 2024", "March 2024", "April 2024", "May 2024", "June 2024",
  "July 2024", "August 2024", "September 2024", "October 2024", "November 2024", "December 2024",
  "January 2025", "February 2025", "March 2025", "April 2025", "May 2025", "June 2025",
  "July 2025", "August 2025", "September 2025", "October 2025", "November 2025", "December 2025",
  "January 2026", "February 2026", "March 2026", "April 2026", "May 2026", "June 2026",
  "July 2026", "August 2026", "September 2026", "October 2026", "November 2026", "December 2026",
];

export const classOptions = ["Nursery", "KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
export const sessionOptions = ["2024-2025", "2025-2026", "2026-2027"];
export const discountTypes = ["Percentage", "Fixed"];
export const paymentMethods = ["Cash", "Bank Transfer", "Online", "Cheque", "Card"];

export function useFeeStructures() {
  const { data: structures = [], isLoading, error } = useQuery<FeeStructure[]>({
    queryKey: ['/api/fee-structures']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertFeeStructure) => {
      const res = await apiRequest('POST', '/api/fee-structures', data);
      return res.json() as Promise<FeeStructure>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/fee-structures'] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<FeeStructure> }) => {
      const res = await apiRequest('PATCH', `/api/fee-structures/${id}`, updates);
      return res.json() as Promise<FeeStructure>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/fee-structures'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/fee-structures/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/fee-structures'] })
  });

  return { 
    structures, 
    isLoading, 
    error,
    createStructure: createMutation.mutateAsync,
    updateStructure: (id: string, updates: Partial<FeeStructure>) => updateMutation.mutateAsync({ id, updates }),
    deleteStructure: deleteMutation.mutateAsync,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
}

export function useDiscountRules() {
  const { data: rules = [], isLoading } = useQuery<DiscountRule[]>({
    queryKey: ['/api/discount-rules']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertDiscountRule) => {
      const res = await apiRequest('POST', '/api/discount-rules', data);
      return res.json() as Promise<DiscountRule>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/discount-rules'] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DiscountRule> }) => {
      const res = await apiRequest('PATCH', `/api/discount-rules/${id}`, updates);
      return res.json() as Promise<DiscountRule>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/discount-rules'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/discount-rules/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/discount-rules'] })
  });

  return { 
    rules, 
    isLoading,
    createRule: createMutation.mutateAsync,
    updateRule: (id: string, updates: Partial<DiscountRule>) => updateMutation.mutateAsync({ id, updates }),
    deleteRule: deleteMutation.mutateAsync,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
}

export function useLateFeeRules() {
  const { data: rules = [], isLoading } = useQuery<LateFeeRule[]>({
    queryKey: ['/api/late-fee-rules']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertLateFeeRule) => {
      const res = await apiRequest('POST', '/api/late-fee-rules', data);
      return res.json() as Promise<LateFeeRule>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/late-fee-rules'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/late-fee-rules/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/late-fee-rules'] })
  });

  return { 
    rules, 
    isLoading,
    createRule: createMutation.mutateAsync,
    deleteRule: deleteMutation.mutateAsync,
    isPending: createMutation.isPending || deleteMutation.isPending
  };
}

export function useInstallmentPlans() {
  const { data: plans = [], isLoading } = useQuery<InstallmentPlan[]>({
    queryKey: ['/api/installment-plans']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertInstallmentPlan) => {
      const res = await apiRequest('POST', '/api/installment-plans', data);
      return res.json() as Promise<InstallmentPlan>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/installment-plans'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/installment-plans/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/installment-plans'] })
  });

  return { 
    plans, 
    isLoading,
    createPlan: createMutation.mutateAsync,
    deletePlan: deleteMutation.mutateAsync,
    isPending: createMutation.isPending || deleteMutation.isPending
  };
}

export function useChallans() {
  const { data: challans = [], isLoading, error } = useQuery<Challan[]>({
    queryKey: ['/api/challans']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertChallan) => {
      const res = await apiRequest('POST', '/api/challans', data);
      return res.json() as Promise<Challan>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/challans'] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Challan> }) => {
      const res = await apiRequest('PATCH', `/api/challans/${id}`, updates);
      return res.json() as Promise<Challan>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/challans'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/challans/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/challans'] })
  });

  return { 
    challans, 
    isLoading, 
    error,
    createChallan: createMutation.mutateAsync,
    updateChallan: (id: string, updates: Partial<Challan>) => updateMutation.mutateAsync({ id, updates }),
    deleteChallan: deleteMutation.mutateAsync,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
}

export function usePayments() {
  const { data: payments = [], isLoading, error } = useQuery<Payment[]>({
    queryKey: ['/api/payments']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPayment) => {
      const res = await apiRequest('POST', '/api/payments', data);
      return res.json() as Promise<Payment>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/challans'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Payment> }) => {
      const res = await apiRequest('PATCH', `/api/payments/${id}`, updates);
      return res.json() as Promise<Payment>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/payments'] })
  });

  return { 
    payments, 
    isLoading, 
    error,
    createPayment: createMutation.mutateAsync,
    updatePayment: (id: string, updates: Partial<Payment>) => updateMutation.mutateAsync({ id, updates }),
    isPending: createMutation.isPending || updateMutation.isPending
  };
}
