const SUPER_TOKEN_KEY = "super_token";

export function getSuperToken(): string | null {
  return localStorage.getItem(SUPER_TOKEN_KEY);
}

export function setSuperToken(token: string): void {
  localStorage.setItem(SUPER_TOKEN_KEY, token);
}

export function clearSuperToken(): void {
  localStorage.removeItem(SUPER_TOKEN_KEY);
}

export async function superFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getSuperToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (options.body && typeof options.body === "string") {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 || res.status === 403) {
    clearSuperToken();
    window.location.href = "/super/login";
    throw new Error("Session expired");
  }
  return res;
}
