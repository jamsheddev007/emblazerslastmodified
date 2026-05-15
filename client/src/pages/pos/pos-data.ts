import { useQuery, useMutation } from "@tanstack/react-query";
import { type PosItem, type Sale, type InsertPosItem, type InsertSale } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  LayoutDashboard,
  List,
  Plus,
  Package,
  FileText,
} from "lucide-react";

export const posNavItems = [
  { label: "Dashboard", path: "/pos/dashboard", icon: LayoutDashboard },
  { label: "Sales", path: "/pos/sales", icon: List },
  { label: "New Sale", path: "/pos/new", icon: Plus },
  { label: "Items", path: "/pos/items", icon: Package },
  { label: "Reports", path: "/pos/reports", icon: FileText },
];

export function usePosData() {
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useQuery<PosItem[]>({
    queryKey: ['/api/pos-items']
  });
  
  const { data: sales = [], isLoading: salesLoading, error: salesError } = useQuery<Sale[]>({
    queryKey: ['/api/sales']
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: InsertPosItem) => {
      const res = await apiRequest('POST', '/api/pos-items', data);
      return res.json() as Promise<PosItem>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/pos-items'] })
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PosItem> }) => {
      const res = await apiRequest('PATCH', `/api/pos-items/${id}`, updates);
      return res.json() as Promise<PosItem>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/pos-items'] })
  });

  const createSaleMutation = useMutation({
    mutationFn: async (data: InsertSale) => {
      const res = await apiRequest('POST', '/api/sales', data);
      return res.json() as Promise<Sale>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      queryClient.invalidateQueries({ queryKey: ['/api/pos-items'] });
    }
  });

  const addItem = async (item: InsertPosItem): Promise<PosItem> => {
    return await createItemMutation.mutateAsync(item);
  };

  const updateItem = async (id: string, updates: Partial<PosItem>) => {
    await updateItemMutation.mutateAsync({ id, updates });
  };

  const addSale = async (sale: InsertSale): Promise<Sale> => {
    return await createSaleMutation.mutateAsync(sale);
  };

  const getItem = (id: string) => items.find((i) => i.id === id);

  return { 
    items, 
    sales, 
    addItem, 
    updateItem, 
    addSale, 
    getItem,
    isLoading: itemsLoading || salesLoading,
    error: itemsError ?? salesError,
    isPending: createItemMutation.isPending || updateItemMutation.isPending || createSaleMutation.isPending
  };
}

export const categories = ["Uniforms", "Books", "Stationery", "Other"] as const;
