import { useQuery, useMutation } from "@tanstack/react-query";
import { type Student, type InsertStudent } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GraduationCap,
  FileText,
  ArrowUpCircle,
  Award,
} from "lucide-react";

export const studentNavItems = [
  { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
  { label: "Student List", path: "/student/list", icon: Users },
  { label: "Add Student", path: "/student/add", icon: UserPlus },
  { label: "Class Promotion", path: "/student/promotion", icon: ArrowUpCircle },
  { label: "Certificates", path: "/student/certificates", icon: Award },
  { label: "Alumni", path: "/student/alumni", icon: GraduationCap },
  { label: "Reports", path: "/student/reports", icon: FileText },
];

export function useStudentData() {
  const { data: students = [], isLoading, error } = useQuery<Student[]>({
    queryKey: ['/api/students']
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertStudent) => {
      const res = await apiRequest('POST', '/api/students', data);
      return res.json() as Promise<Student>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/students'] })
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Student> }) => {
      const res = await apiRequest('PATCH', `/api/students/${id}`, updates);
      return res.json() as Promise<Student>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/students'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/students/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/students'] })
  });

  const addStudent = async (student: InsertStudent): Promise<Student> => {
    return await createMutation.mutateAsync(student);
  };

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const deleteStudent = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const getStudent = (id: string) => students.find((s) => s.id === id);

  const refreshStudents = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/students'] });
  };

  return { 
    students, 
    addStudent, 
    updateStudent, 
    deleteStudent, 
    getStudent,
    refreshStudents,
    isLoading,
    error,
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  };
}

export const classes = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
export const sections = ["A", "B", "C"];
export const statuses = ["Active", "Inactive", "Alumni", "Left"] as const;
