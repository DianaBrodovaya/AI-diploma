import { describe, it, expect } from "vitest";
import {
  MIN_SEARCH_LENGTH,
  MAX_SEARCH_LENGTH,
  normalizeSearchQuery,
  isSearchActive,
  escapeRegExp,
  searchProducts,
  getHighlightParts,
} from "../search.js";

const products = [
  { id: 1, name: "Футболка с принтом", price: 2490, category: "Одежда" },
  { id: 2, name: "Кроссовки беговые", price: 8990, category: "Обувь" },
  { id: 3, name: "Рюкзак городской", price: 4590, category: "Аксессуары" },
  { id: 4, name: "Куртка демисезонная", price: 7490, category: "Одежда" },
];

describe("normalizeSearchQuery", () => {
  it("trims whitespace", () => {
    expect(normalizeSearchQuery("  Футболка  ")).toBe("Футболка");
  });

  it("treats nullish as empty string", () => {
    expect(normalizeSearchQuery(undefined)).toBe("");
    expect(normalizeSearchQuery(null)).toBe("");
  });

  it("truncates to MAX_SEARCH_LENGTH", () => {
    const longQuery = "а".repeat(MAX_SEARCH_LENGTH + 25);
    expect(normalizeSearchQuery(longQuery)).toHaveLength(MAX_SEARCH_LENGTH);
    expect(MAX_SEARCH_LENGTH).toBe(100);
  });
});

describe("isSearchActive", () => {
  it("requires at least MIN_SEARCH_LENGTH characters", () => {
    expect(isSearchActive("Ф")).toBe(false);
    expect(isSearchActive("Фу")).toBe(true);
    expect(MIN_SEARCH_LENGTH).toBe(2);
  });

  it("ignores surrounding whitespace when counting", () => {
    expect(isSearchActive("  Ф  ")).toBe(false);
    expect(isSearchActive("  Фу  ")).toBe(true);
  });
});


describe("escapeRegExp", () => {
  it("escapes regex metacharacters", () => {
    expect(escapeRegExp("a+b(c)")).toBe("a\\+b\\(c\\)");
  });
});

describe("searchProducts", () => {
  it("returns all products when query is shorter than 2 characters", () => {
    expect(searchProducts(products, "")).toHaveLength(4);
    expect(searchProducts(products, "Ф")).toHaveLength(4);
    expect(searchProducts(products, "  К  ")).toHaveLength(4);
  });


  it("finds Футболка с принтом by Футболка", () => {
    const result = searchProducts(products, "Футболка");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Футболка с принтом");
  });

  it("finds Кроссовки беговые by Кросс", () => {
    const result = searchProducts(products, "Кросс");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Кроссовки беговые");
  });

  it("returns empty array when nothing matches", () => {
    expect(searchProducts(products, "йцукен")).toHaveLength(0);
  });

  it("is case-insensitive", () => {
    const result = searchProducts(products, "футболка");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("does not mutate the input array", () => {
    const copy = [...products];
    searchProducts(products, "Кросс");
    expect(products).toEqual(copy);
  });

  it("handles empty products array", () => {
    expect(searchProducts([], "Футболка")).toHaveLength(0);
  });

  it("skips products without a usable name instead of throwing", () => {
    const broken = [
      { id: 1, name: "Футболка" },
      { id: 2 },
      { id: 3, name: null },
    ];
    expect(() => searchProducts(broken, "Фут")).not.toThrow();
    expect(searchProducts(broken, "Фут")).toEqual([{ id: 1, name: "Футболка" }]);
  });
});

describe("getHighlightParts", () => {
  it("returns plain text when search is inactive", () => {
    expect(getHighlightParts("Футболка с принтом", "Ф")).toEqual([
      { text: "Футболка с принтом", match: false, start: 0 },
    ]);
  });


  it("highlights matched substring", () => {
    expect(getHighlightParts("Футболка с принтом", "Футболка")).toEqual([
      { text: "Футболка", match: true, start: 0 },
      { text: " с принтом", match: false, start: 8 },
    ]);
  });

  it("highlights match case-insensitively without changing original casing", () => {
    expect(getHighlightParts("Кроссовки беговые", "кросс")).toEqual([
      { text: "Кросс", match: true, start: 0 },
      { text: "овки беговые", match: false, start: 5 },
    ]);
  });

  it("does not break on regex metacharacters in query", () => {
    expect(getHighlightParts("Товар (тест)", "(те")).toEqual([
      { text: "Товар ", match: false, start: 0 },
      { text: "(те", match: true, start: 6 },
      { text: "ст)", match: false, start: 9 },
    ]);
  });
});

