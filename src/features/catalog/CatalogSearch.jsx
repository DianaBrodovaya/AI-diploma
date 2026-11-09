import { useEffect, useId, useRef, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import {
  isSearchActive,
  MAX_SEARCH_LENGTH,
  normalizeSearchQuery,
} from "../../utils/search.js";
import {
  addSearchHistory,
  readSearchHistory,
  removeSearchHistory,
} from "../../utils/search-history.js";
import styles from "./CatalogSearch.module.css";

export const SEARCH_DEBOUNCE_MS = 500;

function toUrlQuery(query) {
  return isSearchActive(query) ? normalizeSearchQuery(query) : "";
}

function CatalogSearch({ value, onChange }) {
  const listboxId = useId();
  const inputId = useId();
  const [inputValue, setInputValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [history, setHistory] = useState(() => readSearchHistory());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedValue = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const lastEmittedRef = useRef(value);
  const blurTimerRef = useRef(null);

  onChangeRef.current = onChange;
  valueRef.current = value;

  if (value !== prevValue) {
    setPrevValue(value);
    if (value !== lastEmittedRef.current) {
      setInputValue(value);
      lastEmittedRef.current = value;
      setActiveIndex(-1);
    }
  }

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  function emitQuery(query) {
    const next = toUrlQuery(query);
    lastEmittedRef.current = next;
    if (next !== valueRef.current) {
      onChangeRef.current(next);
    }
  }

  function rememberQuery(query) {
    if (!isSearchActive(query)) {
      return;
    }
    setHistory(addSearchHistory(query));
  }

  useEffect(() => {
    const next = toUrlQuery(debouncedValue);
    if (next === valueRef.current) {
      return;
    }
    lastEmittedRef.current = next;
    onChangeRef.current(next);
  }, [debouncedValue]);

  function closeHistory() {
    setIsHistoryOpen(false);
    setActiveIndex(-1);
  }

  function openHistory() {
    if (history.length === 0) {
      return;
    }
    setIsHistoryOpen(true);
  }

  function submitSearch() {
    emitQuery(inputValue);
    rememberQuery(inputValue);
    closeHistory();
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (isHistoryOpen && activeIndex >= 0 && history[activeIndex]) {
      handleSelectHistory(history[activeIndex]);
      return;
    }
    submitSearch();
  }

  function handleClear() {
    setInputValue("");
    lastEmittedRef.current = "";
    onChange("");
    closeHistory();
  }

  function handleSelectHistory(query) {
    setInputValue(query);
    lastEmittedRef.current = toUrlQuery(query);
    onChange(toUrlQuery(query));
    rememberQuery(query);
    closeHistory();
  }

  function handleRemoveHistory(query) {
    const next = removeSearchHistory(query);
    setHistory(next);
    setActiveIndex(-1);
    setIsHistoryOpen(next.length > 0);
  }

  function handleFocus() {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    openHistory();
  }

  function handleBlur() {
    blurTimerRef.current = setTimeout(() => {
      closeHistory();
      blurTimerRef.current = null;
    }, 120);
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      if (isHistoryOpen) {
        e.preventDefault();
        closeHistory();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      if (history.length === 0) {
        return;
      }
      e.preventDefault();
      setIsHistoryOpen(true);
      setActiveIndex((index) =>
        index < history.length - 1 ? index + 1 : 0,
      );
      return;
    }

    if (e.key === "ArrowUp") {
      if (history.length === 0) {
        return;
      }
      e.preventDefault();
      setIsHistoryOpen(true);
      setActiveIndex((index) =>
        index <= 0 ? history.length - 1 : index - 1,
      );
      return;
    }

    if (e.key === "Home" && isHistoryOpen && history.length > 0) {
      e.preventDefault();
      setActiveIndex(0);
      return;
    }

    if (e.key === "End" && isHistoryOpen && history.length > 0) {
      e.preventDefault();
      setActiveIndex(history.length - 1);
    }
  }

  const showHistory = isHistoryOpen && history.length > 0;
  const activeOptionId =
    showHistory && activeIndex >= 0
      ? `${listboxId}-option-${activeIndex}`
      : undefined;

  return (
    <form className={styles.search} onSubmit={handleSubmit} role="search">
      <label className={styles.label} htmlFor={inputId}>
        Поиск
      </label>
      <div className={styles.row}>
        <div className={styles.fieldWrap}>
          <div className={styles.field}>
            <input
              id={inputId}
              className={styles.input}
              type="search"
              placeholder="Поиск по названию"
              value={inputValue}
              maxLength={MAX_SEARCH_LENGTH}
              onChange={(e) => {
                setInputValue(e.target.value.slice(0, MAX_SEARCH_LENGTH));
                setActiveIndex(-1);
                if (history.length > 0) {
                  setIsHistoryOpen(true);
                }
              }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              role="combobox"
              aria-expanded={showHistory}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={activeOptionId}
              aria-haspopup="listbox"
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
              {history.map((item, index) => {
                const optionId = `${listboxId}-option-${index}`;
                const isActive = index === activeIndex;

                return (
                  <li
                    key={item.toLowerCase()}
                    id={optionId}
                    className={`${styles.historyRow}${isActive ? ` ${styles.historyRowActive}` : ""}`}
                    role="option"
                    aria-selected={isActive}
                  >
                    <button
                      type="button"
                      className={styles.historyItem}
                      tabIndex={-1}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSelectHistory(item)}
                      onMouseEnter={() => setActiveIndex(index)}
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
                );
              })}
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
