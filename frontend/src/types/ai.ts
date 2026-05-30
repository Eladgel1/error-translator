// Core language types - mirrors backend SupportedLanguage + LanguageHint

export type SupportedLanguage = "python" | "javascript" | "java" | "unknown";

export type LanguageHint = "auto" | "python" | "javascript" | "java";

// AIResponse = mirrors backend schemas/ai_reponse.py

export interface AIResponse {
  language_detected: SupportedLanguage;
  summary: string;
  likely_cause: string;
  fix_steps: string[];
  debug_steps: string[];
  assumptions: string[];
  followup_questions: string[];
  confidence: number;
}

// Analyze endpoint payload - mirrors AnalyzeRequest

export interface AnalyzeRequest {
  error_text: string;
  context?: string | null;
  language_hint?: LanguageHint; // defaults to "auto" on backend if omitted
}

// Follow-up endpoint payload - mirrors FollowupContext + FollowupRequest

export interface FollowupContext {
  error_text: string;
  context?: string | null;
  language_hint?: LanguageHint; // "auto" by default on backend
  previous_response: AIResponse;
}

export interface FollowupRequest {
  question: string;
  analysis_id?: string | null;
  full_context: FollowupContext;
}

// Backend error envelope - mirrors core/errors.py

export interface BackendErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface BackendErrorEnvelope {
  error: BackendErrorBody;
  request_id?: string;
}

// Normalized API error shape for the frontend

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
  status?: number;
}

// Standart API result wrapper - used by all client functions

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };
