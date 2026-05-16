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

export function saveAuthUser(userJson: string): void {
  localStorage.setItem(AUTH_USER_KEY, userJson);
}

export function getAuthUser(): string | null {
  return localStorage.getItem(AUTH_USER_KEY);
}

export function clearAuthUser(): void {
  localStorage.removeItem(AUTH_USER_KEY);
}

export function clearAuthStorage(): void {
  clearAccessToken();
  clearAuthUser();
}