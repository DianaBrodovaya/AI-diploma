import { isSearchActive, normalizeSearchQuery } from "./search.js";

export const SEARCH_HISTORY_KEY = "catalog_search_history";
export const SEARCH_HISTORY_LIMIT = 8;

function sanitizeHistory(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const result = [];
  const seen = new Set();

  for (const item of items) {
    if (typeof item !== "string") {
      continue;
    }

    const normalized = normalizeSearchQuery(item);
    if (!isSearchActive(normalized)) {
      continue;
    }

    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);

    if (result.length >= SEARCH_HISTORY_LIMIT) {
      break;
    }
  }

  return result;
}

export function readSearchHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) {
      return [];
    }

    return sanitizeHistory(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeSearchHistory(items) {
  const next = sanitizeHistory(items);

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return next;
  }
}

export function addSearchHistory(query, existing = readSearchHistory()) {
  const normalized = normalizeSearchQuery(query);
  if (!isSearchActive(normalized)) {
    return sanitizeHistory(existing);
  }

  const next = sanitizeHistory([
    normalized,
    ...existing,
  ]);

  return writeSearchHistory(next);
}

export function removeSearchHistory(query, existing = readSearchHistory()) {
  const normalized = normalizeSearchQuery(query);
  if (!normalized) {
    return sanitizeHistory(existing);
  }

  const key = normalized.toLowerCase();
  const next = sanitizeHistory(existing).filter(
    (item) => item.toLowerCase() !== key,
  );

  return writeSearchHistory(next);
}
