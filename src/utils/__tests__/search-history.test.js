import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  SEARCH_HISTORY_KEY,
  SEARCH_HISTORY_LIMIT,
  readSearchHistory,
  writeSearchHistory,
  addSearchHistory,
  removeSearchHistory,
} from "../search-history.js";

describe("search history", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty list when storage is empty", () => {
    expect(readSearchHistory()).toEqual([]);
  });

  it("reads and sanitizes stored history", () => {
    localStorage.getItem.mockReturnValue(
      JSON.stringify(["  Футболка  ", "", "К", "Кроссовки", 42, "футболка"]),
    );

    expect(readSearchHistory()).toEqual(["Футболка", "Кроссовки"]);
  });

  it("returns empty list when storage throws or contains invalid JSON", () => {
    localStorage.getItem.mockImplementation(() => {
      throw new Error("denied");
    });
    expect(readSearchHistory()).toEqual([]);

    localStorage.getItem.mockReturnValue("{not-json");
    expect(readSearchHistory()).toEqual([]);

    localStorage.getItem.mockReturnValue(JSON.stringify({ items: ["a"] }));
    expect(readSearchHistory()).toEqual([]);
  });

  it("writes sanitized history under SEARCH_HISTORY_KEY", () => {
    const saved = writeSearchHistory(["  Рюкзак  ", "Рюкзак", "Куртка"]);

    expect(saved).toEqual(["Рюкзак", "Куртка"]);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      SEARCH_HISTORY_KEY,
      JSON.stringify(["Рюкзак", "Куртка"]),
    );
  });

  it("adds query to the top, deduplicates case-insensitively and respects limit", () => {
    const existing = Array.from({ length: SEARCH_HISTORY_LIMIT }, (_, i) => `q${i}`);

    const next = addSearchHistory("  Новый  ", existing);

    expect(next[0]).toBe("Новый");
    expect(next).toHaveLength(SEARCH_HISTORY_LIMIT);
    expect(next).not.toContain(`q${SEARCH_HISTORY_LIMIT - 1}`);

    const bumped = addSearchHistory("новый", next);
    expect(bumped[0]).toBe("новый");
    expect(bumped.filter((item) => item.toLowerCase() === "новый")).toHaveLength(1);
  });

  it("ignores empty and short queries and survives write failures", () => {
    localStorage.setItem.mockImplementation(() => {
      throw new Error("quota");
    });

    expect(addSearchHistory("   ", ["Кроссовки"])).toEqual(["Кроссовки"]);
    expect(addSearchHistory("Ф", ["Кроссовки"])).toEqual(["Кроссовки"]);
    expect(addSearchHistory("  Ф  ", ["Кроссовки"])).toEqual(["Кроссовки"]);
    expect(addSearchHistory("Футболка", ["Кроссовки"])).toEqual([
      "Футболка",
      "Кроссовки",
    ]);
  });

  it("removes query case-insensitively and persists the rest", () => {
    const next = removeSearchHistory("футболка", ["Футболка", "Кроссовки"]);

    expect(next).toEqual(["Кроссовки"]);
    expect(localStorage.setItem).toHaveBeenCalledWith(
      SEARCH_HISTORY_KEY,
      JSON.stringify(["Кроссовки"]),
    );
  });
});
