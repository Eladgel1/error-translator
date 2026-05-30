import {
  HISTORY_STORAGE_KEY,
  HISTROTY_MAX_ITEMS,
  type HistoryEntry,
} from "./types";

// Safely load history from LocalStorage.
export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    // Corrupted data - clear and start fresh
    try {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {
      // ignore
    }
    return [];
  }
}

// Safely persist history list to LocalStorage
export function saveHistory(entries: HistoryEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

// Append a new entry, trim to max length, and persist.
export function appendHistoryEntry(newEntry: HistoryEntry): HistoryEntry[] {
  const existing = loadHistory();
  const next = [newEntry, ...existing].slice(0, HISTROTY_MAX_ITEMS);

  saveHistory(next);
  return next;
}

// Clear all history entries from storage.
export function clearHistory(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
