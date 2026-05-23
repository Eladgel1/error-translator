import type { User } from "./types";

const ACCESS_TOKEN_KEY = "error-translator.accessToken";
const AUTH_USER_KEY = "error-translator.user";

export function saveAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function saveAuthUser(user: User): void {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getAuthUser(): User | null {
  const rawUser = localStorage.getItem(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    clearAuthUser();
    return null;
  }
}

export function clearAuthUser(): void {
  localStorage.removeItem(AUTH_USER_KEY);
}

export function clearAuthStorage(): void {
  clearAccessToken();
  clearAuthUser();
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}