import { useQuery, useMutation } from "@tanstack/react-query";
import { type Timetable, type InsertTimetable } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const periods = [1, 2, 3, 4, 5, 6, 7, 8];

export function useTimetableData() {
  const { data: timetables = [], isLoading, error } = useQuery<Timetable[]>({
    queryKey: ['/api/timetables']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTimetable) => {
      const res = await apiRequest('POST', '/api/timetables', data);
      return res.json() as Promise<Timetable>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/timetables'] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Timetable> }) => {
      const res = await apiRequest('PATCH', `/api/timetables/${id}`, updates);
      return res.json() as Promise<Timetable>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/timetables'] })
  });

  const addTimetable = async (timetable: InsertTimetable): Promise<Timetable> => {
    return await createMutation.mutateAsync(timetable);
  };

  const updateTimetable = async (id: string, updates: Partial<Timetable>) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const getTimetable = (id: string) => timetables.find((t) => t.id === id);

  return { 
    timetables, 
    addTimetable, 
    updateTimetable, 
    getTimetable,
    isLoading,
    error,
    isPending: createMutation.isPending || updateMutation.isPending
  };
}

interface AssignedTeacher {
  id: string;
  name: string;
  subject: string;
}

export function useAssignedTeachers(className: string, section: string) {
  const params = new URLSearchParams();
  if (className) params.set("className", className);
  if (section) params.set("section", section);
  const queryKey = ["/api/timetable/assigned-teachers", className, section];
  const { data: teachers = [], isLoading } = useQuery<AssignedTeacher[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/timetable/assigned-teachers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("emblazers_token")}` }
      });
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
    enabled: !!(className && section),
  });
  return { teachers, isLoading };
}

export const subjects = ["Math", "English", "Science", "Urdu", "Islamiat", "Computer", "Art", "PT"];
export const classes = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
export const sections = ["A", "B", "C"];
export { days, periods };
