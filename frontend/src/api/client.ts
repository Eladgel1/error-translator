import type {
  AnalyzeRequest,
  AIResponse,
  ApiError,
  ApiResult,
  BackendErrorEnvelope,
  FollowupRequest,
} from "../types/ai";


// Base URL - driven by Vite end, with a sane fallback for local development
const API_BASE_URL = 
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";

function buildUrl(path: string): string {
  const trimmedBase = API_BASE_URL.replace(/\/+$/, "");
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
    
  return `${trimmedBase}${trimmedPath}`;
}


// Normalize backend error envelope into ApiError.
function normalizeError(response: Response, body: unknown): ApiError {
  const status = response.status;

  if (body && typeof body === "object" && "error" in body){
    const envelope = body as BackendErrorEnvelope;

    return {
      code: envelope.error?.code ?? "http_error",
      message: envelope.error?.message ?? "Request failed",
      details: envelope.error?.details,
      requestId: envelope.request_id,
      status,
    };
  }

  return {
    code: "http_error",
    message: `Request failed with status ${status}`,
    status,
  };
}


// Generic helper for calling JSON APIs.
async function apiPost<TResponse, TPayload extends object>(
  path: string,
  payload: TPayload,
): Promise<ApiResult<TResponse>> {
  const url = buildUrl(path);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    const json = text ? (JSON.parse(text) as unknown) : null;

    if(response.ok) {
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


// ----- Public API client functions -----


// Call POST /api/analyze with a typed payload and response.

export async function analyzeError(
  payload: AnalyzeRequest,
): Promise<ApiResult<AIResponse>> {
  return apiPost<AIResponse, AnalyzeRequest>("/api/analyze", payload);
}


// Call POST /api/followup with a typed payload and response.

export async function sendFollowupQuestion(
  payload: FollowupRequest,
): Promise<ApiResult<AIResponse>> {
  return apiPost<AIResponse, FollowupRequest>("/api/followup", payload);
}