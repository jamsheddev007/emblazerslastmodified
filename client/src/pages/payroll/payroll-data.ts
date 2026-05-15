import { useQuery, useMutation } from "@tanstack/react-query";
import { type Payroll, type InsertPayroll } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

export function usePayrollData() {
  const { data: payrolls = [], isLoading, error } = useQuery<Payroll[]>({
    queryKey: ['/api/payrolls']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPayroll) => {
      const res = await apiRequest('POST', '/api/payrolls', data);
      return res.json() as Promise<Payroll>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/payrolls'] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Payroll> }) => {
      const res = await apiRequest('PATCH', `/api/payrolls/${id}`, updates);
      return res.json() as Promise<Payroll>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/payrolls'] })
  });

  const addPayroll = async (payroll: InsertPayroll): Promise<Payroll> => {
    return await createMutation.mutateAsync(payroll);
  };

  const updatePayroll = async (id: string, updates: Partial<Payroll>) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const getPayroll = (id: string) => payrolls.find((p) => p.id === id);

  return { 
    payrolls, 
    addPayroll, 
    updatePayroll, 
    getPayroll,
    isLoading,
    error,
    isPending: createMutation.isPending || updateMutation.isPending
  };
}

export const departments = ["Administration", "Mathematics", "English", "Science", "IT", "Computer", "Finance", "Library", "Sports", "Science Lab"];
export const allowanceTypes = ["House Rent", "Medical", "Transport", "Fuel", "Special Allowance"];
export const deductionTypes = ["Income Tax", "Provident Fund", "Loan", "Advance", "Other"];

export const months = [
  "January 2024", "February 2024", "March 2024", "April 2024", "May 2024", "June 2024",
  "July 2024", "August 2024", "September 2024", "October 2024", "November 2024", "December 2024",
  "January 2025", "February 2025", "March 2025", "April 2025", "May 2025", "June 2025",
  "July 2025", "August 2025", "September 2025", "October 2025", "November 2025", "December 2025",
  "January 2026", "February 2026", "March 2026", "April 2026", "May 2026", "June 2026",
  "July 2026", "August 2026", "September 2026", "October 2026", "November 2026", "December 2026",
];
