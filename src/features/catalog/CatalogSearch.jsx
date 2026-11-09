import { useEffect, useId, useRef, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import { isSearchActive } from "../../utils/search.js";
import {
  addSearchHistory,
  readSearchHistory,
  removeSearchHistory,
} from "../../utils/search-history.js";
import styles from "./CatalogSearch.module.css";

export const SEARCH_DEBOUNCE_MS = 500;

function CatalogSearch({ value, onChange }) {
  const listboxId = useId();
  const [inputValue, setInputValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [history, setHistory] = useState(() => readSearchHistory());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const debouncedValue = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const blurTimerRef = useRef(null);

  onChangeRef.current = onChange;
  valueRef.current = value;

  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value);
  }

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  function rememberQuery(query) {
    if (!isSearchActive(query)) {
      return;
    }
    setHistory(addSearchHistory(query));
  }

  useEffect(() => {
    if (debouncedValue === valueRef.current) {
      return;
    }
    onChangeRef.current(debouncedValue);
    rememberQuery(debouncedValue);
  }, [debouncedValue]);

  function submitSearch() {
    if (inputValue !== value) {
      onChange(inputValue);
    }
    rememberQuery(inputValue);
    setIsHistoryOpen(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    submitSearch();
  }

  function handleClear() {
    setInputValue("");
    onChange("");
    setIsHistoryOpen(false);
  }

  function handleSelectHistory(query) {
    setInputValue(query);
    onChange(query);
    rememberQuery(query);
    setIsHistoryOpen(false);
  }

  function handleRemoveHistory(query) {
    const next = removeSearchHistory(query);
    setHistory(next);
    setIsHistoryOpen(next.length > 0);
  }

  function handleFocus() {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    setIsHistoryOpen(history.length > 0);
  }

  function handleBlur() {
    blurTimerRef.current = setTimeout(() => {
      setIsHistoryOpen(false);
      blurTimerRef.current = null;
    }, 120);
  }

  const showHistory = isHistoryOpen && history.length > 0;

  return (
    <form className={styles.search} onSubmit={handleSubmit} role="search">
      <label className={styles.label} htmlFor="catalog-search">
        Поиск
      </label>
      <div className={styles.row}>
        <div className={styles.fieldWrap}>
          <div className={styles.field}>
            <input
              id="catalog-search"
              className={styles.input}
              type="search"
              placeholder="Поиск по названию"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (history.length > 0) {
                  setIsHistoryOpen(true);
                }
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoComplete="off"
              role="combobox"
              aria-expanded={showHistory}
              aria-controls={listboxId}
              aria-autocomplete="list"
            />
            <button
              type="submit"
              className={styles.submit}
              aria-label="Искать"
            >
              <svg
                className={styles.icon}
                viewBox="0 0 24 24"
                width="18"
                height="18"
                aria-hidden="true"
                focusable="false"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M16.5 16.5L21 21"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          {showHistory && (
            <ul
              id={listboxId}
              className={styles.history}
              role="listbox"
              aria-label="История поиска"
            >
              {history.map((item) => (
                <li key={item.toLowerCase()} className={styles.historyRow} role="option">
                  <button
                    type="button"
                    className={styles.historyItem}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectHistory(item)}
                  >
                    {item}
                  </button>
                  <button
                    type="button"
                    className={styles.historyRemove}
                    aria-label={`Удалить запрос «${item}» из истории`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleRemoveHistory(item)}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {inputValue && (
          <button
            type="button"
            className={styles.clear}
            onClick={handleClear}
            aria-label="Очистить поиск"
          >
            Очистить
          </button>
        )}
      </div>
    </form>
  );
}

export default CatalogSearch;
