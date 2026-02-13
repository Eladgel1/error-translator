import type { AIResponse, LanguageHint } from "../../types/ai";

export interface HistoryInput {
    errorText: string;
    contextText?: string;
    languageHint: LanguageHint;
}

export interface HistoryEntry {
    id: string;
    createdAt: string;  //ISO timestamp
    input: HistoryInput;
    response: AIResponse;
}


export const HISTORY_STORAGE_KEY = "error-translator.history.v1";

// Limit to keep LocalStorage small & fast
export const HISTROTY_MAX_ITEMS = 20;