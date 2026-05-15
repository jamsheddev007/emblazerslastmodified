import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  BookOpen,
  BarChart3,
  MessageSquare,
} from "lucide-react";

export const teacherNavItems = [
  { label: "Dashboard", path: "/curriculum/teacher-dashboard", icon: LayoutDashboard },
  { label: "My Assignments", path: "/curriculum/teacher-assignments-view", icon: BookOpen },
  { label: "Upload Content", path: "/curriculum/teacher-content", icon: FileText },
  { label: "My Quizzes", path: "/teacher/quizzes", icon: ClipboardList },
  { label: "Quiz Results", path: "/teacher/quiz-results", icon: BarChart3 },
  { label: "Result Entry", path: "/teacher/results", icon: BarChart3 },
  { label: "Homework", path: "/teacher/homework", icon: ClipboardList },
  { label: "Messages", path: "/teacher/messages", icon: MessageSquare },
];

const teacherAuthHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("teacher_token") || localStorage.getItem("emblazers_token")}` });

export function useTeacherAssignments(staffId?: string) {
  return useQuery<any[]>({
    queryKey: ['/api/teacher/my-assignments', staffId],
    queryFn: async () => {
      const res = await fetch('/api/teacher/my-assignments', { headers: teacherAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
    enabled: !!staffId,
  });
}

export function useTeacherContent(staffId?: string) {
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/teacher/content', staffId],
    queryFn: async () => {
      const res = await fetch('/api/teacher/content', { headers: teacherAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch content");
      return res.json();
    },
    enabled: !!staffId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/teacher/content', data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/teacher/content', staffId] }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('PATCH', `/api/teacher/content/${id}/toggle-publish`, {});
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/teacher/content', staffId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/teacher/content/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/teacher/content', staffId] }),
  });

  return {
    content: data,
    isLoading,
    createContent: (d: any) => createMutation.mutateAsync(d),
    togglePublish: (id: string) => togglePublishMutation.mutateAsync(id),
    deleteContent: (id: string) => deleteMutation.mutateAsync(id),
    isPending: createMutation.isPending || togglePublishMutation.isPending || deleteMutation.isPending,
  };
}

export function useTeacherQuizzes(staffId?: string) {
  const { data = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/teacher/quizzes', staffId],
    queryFn: async () => {
      const res = await fetch('/api/teacher/quizzes', { headers: teacherAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch quizzes");
      return res.json();
    },
    enabled: !!staffId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/teacher/quizzes', data);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/teacher/quizzes', staffId] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const res = await apiRequest('PUT', `/api/teacher/quizzes/${id}`, updates);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/teacher/quizzes', staffId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/teacher/quizzes/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/teacher/quizzes', staffId] }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('PATCH', `/api/teacher/quizzes/${id}/toggle-publish`, {});
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/teacher/quizzes', staffId] }),
  });

  return {
    quizzes: data,
    isLoading,
    createQuiz: (d: any) => createMutation.mutateAsync(d),
    updateQuiz: (id: string, updates: any) => updateMutation.mutateAsync({ id, updates }),
    deleteQuiz: (id: string) => deleteMutation.mutateAsync(id),
    togglePublish: (id: string) => togglePublishMutation.mutateAsync(id),
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || togglePublishMutation.isPending,
  };
}

export function useQuizAttempts(quizId: string) {
  return useQuery<any[]>({
    queryKey: ['/api/teacher/quizzes', quizId, 'attempts'],
    queryFn: async () => {
      const res = await fetch(`/api/teacher/quizzes/${quizId}/attempts`, { headers: teacherAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch attempts");
      return res.json();
    },
    enabled: !!quizId,
  });
}

export function useGradeShortAnswer(quizId: string) {
  return useMutation({
    mutationFn: async ({ attemptId, questionIndex, marksAwarded }: { attemptId: string; questionIndex: number; marksAwarded: number }) => {
      const res = await apiRequest('PATCH', `/api/teacher/quizzes/${quizId}/attempts/${attemptId}/grade-short`, { questionIndex, marksAwarded });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/teacher/quizzes', quizId, 'attempts'] }),
  });
}
