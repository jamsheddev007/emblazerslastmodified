import { useQuery, useMutation } from "@tanstack/react-query";
import { type HostelRoom, type HostelResident, type HostelFee, type InsertHostelRoom, type InsertHostelResident, type InsertHostelFee } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  LayoutDashboard,
  Bed,
  Users,
  CreditCard,
  FileText,
} from "lucide-react";

export const hostelNavItems = [
  { label: "Dashboard", path: "/hostel/dashboard", icon: LayoutDashboard },
  { label: "Rooms", path: "/hostel/rooms", icon: Bed },
  { label: "Residents", path: "/hostel/residents", icon: Users },
  { label: "Hostel Fee", path: "/hostel/fees", icon: CreditCard },
  { label: "Reports", path: "/hostel/reports", icon: FileText },
];

export function useHostelData() {
  const { data: rooms = [], isLoading: roomsLoading, error: roomsError } = useQuery<HostelRoom[]>({
    queryKey: ['/api/hostel-rooms']
  });
  
  const { data: residents = [], isLoading: residentsLoading, error: residentsError } = useQuery<HostelResident[]>({
    queryKey: ['/api/hostel-residents']
  });
  
  const { data: fees = [], isLoading: feesLoading, error: feesError } = useQuery<HostelFee[]>({
    queryKey: ['/api/hostel-fees']
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: InsertHostelRoom) => {
      const res = await apiRequest('POST', '/api/hostel-rooms', data);
      return res.json() as Promise<HostelRoom>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/hostel-rooms'] })
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HostelRoom> }) => {
      const res = await apiRequest('PATCH', `/api/hostel-rooms/${id}`, updates);
      return res.json() as Promise<HostelRoom>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/hostel-rooms'] })
  });

  const createResidentMutation = useMutation({
    mutationFn: async (data: InsertHostelResident) => {
      const res = await apiRequest('POST', '/api/hostel-residents', data);
      return res.json() as Promise<HostelResident>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hostel-residents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hostel-rooms'] });
    }
  });

  const updateResidentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HostelResident> }) => {
      const res = await apiRequest('PATCH', `/api/hostel-residents/${id}`, updates);
      return res.json() as Promise<HostelResident>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/hostel-residents'] })
  });

  const createFeeMutation = useMutation({
    mutationFn: async (data: InsertHostelFee) => {
      const res = await apiRequest('POST', '/api/hostel-fees', data);
      return res.json() as Promise<HostelFee>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/hostel-fees'] })
  });

  const updateFeeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HostelFee> }) => {
      const res = await apiRequest('PATCH', `/api/hostel-fees/${id}`, updates);
      return res.json() as Promise<HostelFee>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/hostel-fees'] })
  });

  const addRoom = async (room: InsertHostelRoom): Promise<HostelRoom> => {
    return await createRoomMutation.mutateAsync(room);
  };

  const updateRoom = async (id: string, updates: Partial<HostelRoom>) => {
    await updateRoomMutation.mutateAsync({ id, updates });
  };

  const addResident = async (resident: InsertHostelResident): Promise<HostelResident> => {
    return await createResidentMutation.mutateAsync(resident);
  };

  const updateResident = async (id: string, updates: Partial<HostelResident>) => {
    await updateResidentMutation.mutateAsync({ id, updates });
  };

  const addFee = async (fee: InsertHostelFee): Promise<HostelFee> => {
    return await createFeeMutation.mutateAsync(fee);
  };

  const updateFee = async (id: string, updates: Partial<HostelFee>) => {
    await updateFeeMutation.mutateAsync({ id, updates });
  };

  const getRoom = (id: string) => rooms.find((r) => r.id === id);
  const getResident = (id: string) => residents.find((r) => r.id === id);

  return { 
    rooms, 
    residents, 
    fees, 
    addRoom, 
    updateRoom, 
    addResident, 
    updateResident, 
    addFee, 
    updateFee, 
    getRoom, 
    getResident,
    isLoading: roomsLoading || residentsLoading || feesLoading,
    error: roomsError ?? residentsError ?? feesError,
    isPending: createRoomMutation.isPending || updateRoomMutation.isPending || createResidentMutation.isPending || updateResidentMutation.isPending || createFeeMutation.isPending || updateFeeMutation.isPending
  };
}

export const hostelNames = ["Boys Hostel A", "Boys Hostel B", "Girls Hostel", "Staff Quarters"];
export const roomStatuses = ["Available", "Full", "Maintenance"] as const;
export const residentStatuses = ["Active", "Left"] as const;
export const feeStatuses = ["Paid", "Unpaid"] as const;
