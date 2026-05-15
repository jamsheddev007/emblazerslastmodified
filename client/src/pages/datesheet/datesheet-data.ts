import { useQuery, useMutation } from "@tanstack/react-query";
import { type DateSheet, type InsertDateSheet } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  LayoutDashboard,
  Calendar,
  Plus,
} from "lucide-react";

export const datesheetNavItems = [
  { label: "Dashboard", path: "/curriculum/dashboard", icon: LayoutDashboard },
  { label: "Exam Schedule", path: "/curriculum/datesheet/list", icon: Calendar },
  { label: "Create Date Sheet", path: "/curriculum/datesheet/create", icon: Plus },
];

export function useDateSheetData() {
  const { data: dateSheets = [], isLoading, error } = useQuery<DateSheet[]>({
    queryKey: ['/api/date-sheets']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertDateSheet) => {
      const res = await apiRequest('POST', '/api/date-sheets', data);
      return res.json() as Promise<DateSheet>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/date-sheets'] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DateSheet> }) => {
      const res = await apiRequest('PATCH', `/api/date-sheets/${id}`, updates);
      return res.json() as Promise<DateSheet>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/date-sheets'] })
  });

  const addDateSheet = async (dateSheet: InsertDateSheet): Promise<DateSheet> => {
    return await createMutation.mutateAsync(dateSheet);
  };

  const updateDateSheet = async (id: string, updates: Partial<DateSheet>) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const getDateSheet = (id: string) => dateSheets.find((d) => d.id === id);

  return { 
    dateSheets, 
    addDateSheet, 
    updateDateSheet, 
    getDateSheet,
    isLoading,
    error,
    isPending: createMutation.isPending || updateMutation.isPending
  };
}

export const examTypes = ["Monthly", "Term", "Mid-Term", "Final", "Quiz", "Test", "Annual"] as const;
export const classes = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
export const subjects = ["Math", "English", "Science", "Urdu", "Islamiat", "Computer", "Art", "PT"];
