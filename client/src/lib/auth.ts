const STORAGE_KEY = "ft_auth_b64";
const USERNAME = "reader";
const PASSWORD = "the-f1rst-teaching-2025!";

export function getAuthToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
}

export function isAuthed(): boolean {
  return !!getAuthToken();
}

export function login(username: string, password: string): boolean {
  const ok = username === USERNAME && password === PASSWORD;
  if (ok && typeof window !== "undefined") {
    const token = btoa(`${username}:${password}`);
    localStorage.setItem(STORAGE_KEY, token);
  }
  return ok;
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function authHeader(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Basic ${token}` } : {};
}

export const Credentials = { USERNAME, PASSWORD } as const;

