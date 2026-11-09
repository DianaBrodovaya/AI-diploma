export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_LENGTH = 100;

export function normalizeSearchQuery(query) {
  return (query ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
}

export function isSearchActive(query) {
  return normalizeSearchQuery(query).length >= MIN_SEARCH_LENGTH;
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function searchProducts(products, query) {
  if (!isSearchActive(query)) {
    return products;
  }

  const needle = normalizeSearchQuery(query).toLowerCase();
  return products.filter((product) =>
    String(product?.name ?? "")
      .toLowerCase()
      .includes(needle),
  );
}

/**
 * Разбивает текст на фрагменты для безопасной подсветки совпадений.
 * @returns {{ text: string, match: boolean, start: number }[]}
 */
export function getHighlightParts(text, query) {
  const source = text ?? "";
  if (!isSearchActive(query) || source.length === 0) {
    return [{ text: source, match: false, start: 0 }];
  }

  const normalized = normalizeSearchQuery(query);
  const regex = new RegExp(`(${escapeRegExp(normalized)})`, "gi");
  const parts = source.split(regex);

  let offset = 0;
  return parts
    .filter((part) => part !== "")
    .map((part) => {
      const segment = {
        text: part,
        match: part.toLowerCase() === normalized.toLowerCase(),
        start: offset,
      };
      offset += part.length;
      return segment;
    });
}
