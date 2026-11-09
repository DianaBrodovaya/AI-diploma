import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import styles from "./CatalogSearch.module.css";

export const SEARCH_DEBOUNCE_MS = 300;

function CatalogSearch({ value, onChange }) {
  const [inputValue, setInputValue] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const debouncedValue = useDebouncedValue(inputValue, SEARCH_DEBOUNCE_MS);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  onChangeRef.current = onChange;
  valueRef.current = value;

  if (value !== prevValue) {
    setPrevValue(value);
    setInputValue(value);
  }

  useEffect(() => {
    if (debouncedValue === valueRef.current) {
      return;
    }
    onChangeRef.current(debouncedValue);
  }, [debouncedValue]);

  function submitSearch() {
    if (inputValue === value) {
      return;
    }
    onChange(inputValue);
  }

  function handleSubmit(e) {
    e.preventDefault();
    submitSearch();
  }

  function handleClear() {
    setInputValue("");
    onChange("");
  }

  return (
    <form className={styles.search} onSubmit={handleSubmit} role="search">
      <label className={styles.label} htmlFor="catalog-search">
        Поиск
      </label>
      <div className={styles.row}>
        <div className={styles.field}>
          <input
            id="catalog-search"
            className={styles.input}
            type="search"
            placeholder="Поиск по названию"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            autoComplete="off"
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
