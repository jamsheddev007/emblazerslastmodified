import { useQuery, useMutation } from "@tanstack/react-query";
import { type Book, type BookIssue, type InsertBook, type InsertBookIssue, type Student, type Staff, type BookCategory, type InsertBookCategory } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth";
import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  FileText,
  Users,
} from "lucide-react";

export const libraryNavItems = [
  { label: "Dashboard", path: "/library/dashboard", icon: LayoutDashboard },
  { label: "Books", path: "/library/books", icon: BookOpen },
  { label: "Members", path: "/library/members", icon: Users },
  { label: "Issue / Return", path: "/library/issue", icon: BookMarked },
  { label: "Reports", path: "/library/reports", icon: FileText },
];

export function useLibraryData() {
  // Use staleTime: 0 to always fetch fresh data for library operations
  const { data: books = [], isLoading: booksLoading, error: booksError } = useQuery<Book[]>({
    queryKey: ['/api/books'],
    staleTime: 0,
    refetchOnMount: true
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<BookCategory[]>({
    queryKey: ['/api/book-categories'],
    staleTime: 0,
    refetchOnMount: true
  });

  const { data: issues = [], isLoading: issuesLoading, error: issuesError } = useQuery<BookIssue[]>({
    queryKey: ['/api/book-issues'],
    staleTime: 0,
    refetchOnMount: true
  });

  const { data: statistics } = useQuery<{
    totalBooks: number;
    issuedBooks: number;
    availableBooks: number;
    overdueBooks: number;
    totalFines: number;
    pendingFines: number;
    categoryCounts: { category: string; count: number }[];
  }>({
    queryKey: ['/api/library/statistics'],
    staleTime: 0,
    refetchOnMount: true
  });

  const createBookMutation = useMutation({
    mutationFn: async (data: InsertBook) => {
      const res = await apiRequest('POST', '/api/books', data);
      return res.json() as Promise<Book>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ['/api/library/statistics'] });
    }
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Book> }) => {
      const res = await apiRequest('PATCH', `/api/books/${id}`, updates);
      return res.json() as Promise<Book>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ['/api/library/statistics'] });
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertBookCategory) => {
      const res = await apiRequest('POST', '/api/book-categories', data);
      return res.json() as Promise<BookCategory>;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/book-categories'] })
  });

  const createIssueMutation = useMutation({
    mutationFn: async (data: InsertBookIssue) => {
      const res = await apiRequest('POST', '/api/book-issues', data);
      return res.json() as Promise<BookIssue>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/book-issues'] });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ['/api/library/statistics'] });
    }
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BookIssue> }) => {
      const res = await apiRequest('PATCH', `/api/book-issues/${id}`, updates);
      return res.json() as Promise<BookIssue>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/book-issues'] });
      queryClient.invalidateQueries({ queryKey: ['/api/books'] });
      queryClient.invalidateQueries({ queryKey: ['/api/library/statistics'] });
    }
  });

  const addBook = async (book: InsertBook): Promise<Book> => {
    return await createBookMutation.mutateAsync(book);
  };

  const updateBook = async (id: string, updates: Partial<Book>) => {
    await updateBookMutation.mutateAsync({ id, updates });
  };

  const addCategory = async (category: InsertBookCategory): Promise<BookCategory> => {
    return await createCategoryMutation.mutateAsync(category);
  };

  const issueBook = async (issue: InsertBookIssue): Promise<BookIssue> => {
    return await createIssueMutation.mutateAsync(issue);
  };

  const returnBook = async (issueId: string, returnDate: string) => {
    await updateIssueMutation.mutateAsync({
      id: issueId,
      updates: { returnDate }
    });
  };

  const getBook = (id: string) => books.find((b) => b.id === id);

  return {
    books,
    categories,
    issues,
    statistics,
    addBook,
    updateBook,
    addCategory,
    issueBook,
    returnBook,
    getBook,
    isLoading: booksLoading || issuesLoading || categoriesLoading,
    error: booksError ?? issuesError,
    isPending: createBookMutation.isPending || updateBookMutation.isPending || createIssueMutation.isPending || updateIssueMutation.isPending || createCategoryMutation.isPending
  };
}

// Search functions for students and staff
export async function searchStudents(query: string): Promise<Student[]> {
  const token = getAuthToken();

  if (!token) {
    console.error("[Library] No auth token found for student search");
    return [];
  }

  try {
    const res = await fetch(`/api/library/search-students?query=${encodeURIComponent(query)}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      credentials: "include"
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(`[Library] Student search failed: ${res.status} ${res.statusText}`, errorText);
      return [];
    }

    const data = await res.json();
    console.log(`[Library] Student search returned ${data?.length || 0} results for query: "${query}"`);
    return data || [];
  } catch (error) {
    console.error("[Library] Student search error:", error);
    return [];
  }
}

export async function searchStaff(query: string): Promise<Staff[]> {
  const token = getAuthToken();

  if (!token) {
    console.error("[Library] No auth token found for staff search");
    return [];
  }

  try {
    const res = await fetch(`/api/library/search-staff?query=${encodeURIComponent(query)}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      credentials: "include"
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(`[Library] Staff search failed: ${res.status} ${res.statusText}`, errorText);
      return [];
    }

    const data = await res.json();
    console.log(`[Library] Staff search returned ${data?.length || 0} results for query: "${query}"`);
    return data || [];
  } catch (error) {
    console.error("[Library] Staff search error:", error);
    return [];
  }
}

export const memberTypes = ["Student", "Staff"] as const;
export const issueStatuses = ["Issued", "Returned", "Overdue"] as const;
