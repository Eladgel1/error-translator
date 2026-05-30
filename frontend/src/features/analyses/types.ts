import type { LanguageHint } from "../../types/ai";

export type PersistedAnalysis = {
  id: string;
  title: string;
  error_text: string;
  context: string | null;
  language_hint: string | null;
  language_detected: string;
  summary: string;
  likely_cause: string;
  fix_steps: string[];
  debug_steps: string[];
  assumptions: string[];
  followup_questions: string[];
  confidence: number;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type AnalyzePersistedPayload = {
  error_text: string;
  context?: string | null;
  language_hint?: LanguageHint; 
};