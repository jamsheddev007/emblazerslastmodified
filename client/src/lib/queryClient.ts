import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAuthToken, forceLogout } from "./auth";

let logoutDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedForceLogout() {
  if (logoutDebounceTimer) return;
  logoutDebounceTimer = setTimeout(() => {
    logoutDebounceTimer = null;
    forceLogout();
  }, 300);
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (token) {
    return { "Authorization": `Bearer ${token}` };
  }
  return {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (res.status === 401) {
    debouncedForceLogout();
    throw new Error("Session expired. Please log in again.");
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = getAuthToken();
    if (!token && unauthorizedBehavior === "returnNull") {
      return null;
    }

    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
      debouncedForceLogout();
      throw new Error("Session expired. Please log in again.");
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
