import { useQuery, useMutation } from "@tanstack/react-query";
import { type Staff, type Vacancy, type Applicant, type InsertStaff, type InsertVacancy } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  UserCheck,
  FileText,
  CalendarClock,
  CreditCard,
  FilePlus,
  BarChart2,
} from "lucide-react";

export const hrNavItems = [
  { label: "Dashboard", path: "/hr/dashboard", icon: LayoutDashboard },
  { label: "Staff List", path: "/hr/list", icon: Users },
  { label: "Add Staff", path: "/hr/add", icon: UserPlus },
  { label: "Vacancies", path: "/hr/vacancies", icon: Briefcase },
  { label: "Applicants", path: "/hr/applicants", icon: UserCheck },
  { label: "Leave Management", path: "/hr/leaves", icon: CalendarClock },
  { label: "HR Reports", path: "/hr/reports", icon: FileText },
  { label: "Payroll List", path: "/hr/payroll/list", icon: CreditCard, sectionLabel: "Payroll" },
  { label: "Generate Payroll", path: "/hr/payroll/generate", icon: FilePlus },
  { label: "Payroll Reports", path: "/hr/payroll/reports", icon: BarChart2 },
];

export function useHRData() {
  const { data: staff = [], isLoading: staffLoading, error: staffError } = useQuery<Staff[]>({
    queryKey: ['/api/staff']
  });
  
  const { data: vacancies = [], isLoading: vacanciesLoading, error: vacanciesError } = useQuery<Vacancy[]>({
    queryKey: ['/api/vacancies']
  });
  
  const { data: applicants = [], isLoading: applicantsLoading, error: applicantsError } = useQuery<Applicant[]>({
    queryKey: ['/api/applicants']
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: InsertStaff) => {
      const res = await apiRequest('POST', '/api/staff', data);
      return res.json() as Promise<Staff>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/staff'] })
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Staff> }) => {
      const res = await apiRequest('PATCH', `/api/staff/${id}`, updates);
      return res.json() as Promise<Staff>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/staff'] })
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/staff/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/staff'] })
  });

  const createVacancyMutation = useMutation({
    mutationFn: async (data: InsertVacancy) => {
      const res = await apiRequest('POST', '/api/vacancies', data);
      return res.json() as Promise<Vacancy>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/vacancies'] })
  });

  const updateVacancyMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Vacancy> }) => {
      const res = await apiRequest('PATCH', `/api/vacancies/${id}`, updates);
      return res.json() as Promise<Vacancy>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/vacancies'] })
  });

  const deleteVacancyMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/vacancies/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/vacancies'] })
  });

  const updateApplicantMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Applicant["status"] }) => {
      const res = await apiRequest('PATCH', `/api/applicants/${id}`, { status });
      return res.json() as Promise<Applicant>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/applicants'] })
  });

  const addStaff = async (s: InsertStaff): Promise<Staff> => {
    return await createStaffMutation.mutateAsync(s);
  };

  const updateStaff = async (id: string, updates: Partial<Staff>) => {
    await updateStaffMutation.mutateAsync({ id, updates });
  };

  const deleteStaff = async (id: string) => {
    await deleteStaffMutation.mutateAsync(id);
  };

  const getStaff = (id: string) => staff.find((s) => s.id === id);

  const addVacancy = async (v: InsertVacancy): Promise<Vacancy> => {
    return await createVacancyMutation.mutateAsync(v);
  };

  const updateVacancy = async (id: string, updates: Partial<Vacancy>) => {
    await updateVacancyMutation.mutateAsync({ id, updates });
  };

  const deleteVacancy = async (id: string) => {
    await deleteVacancyMutation.mutateAsync(id);
  };

  const updateApplicantStatus = async (id: string, status: Applicant["status"]) => {
    await updateApplicantMutation.mutateAsync({ id, status });
  };

  return {
    staff, addStaff, updateStaff, deleteStaff, getStaff,
    vacancies, addVacancy, updateVacancy, deleteVacancy,
    applicants, updateApplicantStatus,
    isLoading: staffLoading || vacanciesLoading || applicantsLoading,
    error: staffError ?? vacanciesError ?? applicantsError,
    isPending: createStaffMutation.isPending || updateStaffMutation.isPending || deleteStaffMutation.isPending || createVacancyMutation.isPending || updateVacancyMutation.isPending || deleteVacancyMutation.isPending || updateApplicantMutation.isPending
  };
}

export const departments = ["Administration", "Mathematics", "English", "Science", "IT", "Finance", "Library", "Sports"];
export const designations = ["Principal", "Vice Principal", "Senior Teacher", "Teacher", "Lab Assistant", "Accountant", "Librarian", "Sports Coach", "Clerk"];
export const employmentTypes = ["Full-time", "Part-time", "Contract"] as const;
export const staffStatuses = ["Active", "Probation", "On Leave", "Terminated"] as const;
