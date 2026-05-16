import { getAccessToken } from "../features/auth/authStorage";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from "../features/auth/types";
import type {
  AnalyzePersistedPayload,
  PersistedAnalysis,
} from "../features/analyses/types";
import type {
  AnalyzeRequest,
  AIResponse,
  ApiError,
  ApiResult,
  BackendErrorEnvelope,
  FollowupRequest,
} from "../types/ai";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000";

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
};

function buildUrl(path: string): string {
  const trimmedBase = API_BASE_URL.replace(/\/+$/, "");
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;

  return `${trimmedBase}${trimmedPath}`;
}

function normalizeError(response: Response, body: unknown): ApiError {
  const status = response.status;

  if (body && typeof body === "object" && "error" in body) {
    const envelope = body as BackendErrorEnvelope;

    return {
      code: envelope.error?.code ?? "http_error",
      message: envelope.error?.message ?? "Request failed",
      details: envelope.error?.details,
      requestId: envelope.request_id,
      status,
    };
  }

  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail?: unknown }).detail;

    return {
      code: "http_error",
      message: typeof detail === "string" ? detail : "Request failed",
      details: detail,
      status,
    };
  }

  return {
    code: "http_error",
    message: `Request failed with status ${status}`,
    status,
  };
}

async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<TResponse>> {
  const url = buildUrl(path);
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Accept", "application/json");

  const token = getAccessToken();

  if (options.auth !== false && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const text = await response.text();
    const json = text ? (JSON.parse(text) as unknown) : null;

    if (response.ok) {
      return { ok: true, data: json as TResponse };
    }

    return {
      ok: false,
      error: normalizeError(response, json),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown network error.";

    const apiError: ApiError = {
      code: "network_error",
      message: "Network request failed.",
      details: message,
    };

    return { ok: false, error: apiError };
  }
}

async function apiPost<TResponse, TPayload extends object>(
  path: string,
  payload: TPayload,
  options: ApiRequestOptions = {},
): Promise<ApiResult<TResponse>> {
  return apiRequest<TResponse>(path, {
    ...options,
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function apiGet<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<TResponse>> {
  return apiRequest<TResponse>(path, {
    ...options,
    method: "GET",
  });
}

async function apiDelete<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<TResponse>> {
  return apiRequest<TResponse>(path, {
    ...options,
    method: "DELETE",
  });
}

async function apiPatch<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiResult<TResponse>> {
  return apiRequest<TResponse>(path, {
    ...options,
    method: "PATCH",
  });
}

export async function analyzeError(
  payload: AnalyzeRequest,
): Promise<ApiResult<AIResponse>> {
  return apiPost<AIResponse, AnalyzeRequest>("/api/analyze", payload, {
    auth: false,
  });
}

export async function sendFollowupQuestion(
  payload: FollowupRequest,
): Promise<ApiResult<AIResponse>> {
  return apiPost<AIResponse, FollowupRequest>("/api/followup", payload, {
    auth: false,
  });
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<ApiResult<AuthResponse>> {
  return apiPost<AuthResponse, RegisterPayload>("/api/auth/register", payload, {
    auth: false,
  });
}

export async function loginUser(
  payload: LoginPayload,
): Promise<ApiResult<AuthResponse>> {
  return apiPost<AuthResponse, LoginPayload>("/api/auth/login", payload, {
    auth: false,
  });
}

export async function getMe(): Promise<ApiResult<User>> {
  return apiGet<User>("/api/auth/me");
}

export async function analyzePersisted(
  payload: AnalyzePersistedPayload,
): Promise<ApiResult<PersistedAnalysis>> {
  return apiPost<PersistedAnalysis, AnalyzePersistedPayload>(
    "/api/analyses/analyze",
    payload,
  );
}

export async function listAnalyses(): Promise<ApiResult<PersistedAnalysis[]>> {
  return apiGet<PersistedAnalysis[]>("/api/analyses");
}

export async function getAnalysis(
  id: string,
): Promise<ApiResult<PersistedAnalysis>> {
  return apiGet<PersistedAnalysis>(`/api/analyses/${id}`);
}

export async function deleteAnalysis(id: string): Promise<ApiResult<null>> {
  return apiDelete<null>(`/api/analyses/${id}`);
}

export async function toggleFavorite(
  id: string,
): Promise<ApiResult<PersistedAnalysis>> {
  return apiPatch<PersistedAnalysis>(`/api/analyses/${id}/favorite`);
}