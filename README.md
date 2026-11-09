# HTML Academy Shop

Учебный интернет-магазин курса «[Разработка с AI-агентами: инженерный подход](https://up.htmlacademy.ru/ai/2)». Релиз 0.1.0: каталог с поиском, корзина с промокодом, оформление заказа, интеграция с API поставщика, сквозные тесты через Playwright MCP, релизный пакет.

## Что делает проект

Магазин показывает каталог товаров, позволяет фильтровать и искать по названию, добавлять товары в корзину, применять промокод и оформлять заказ.

### Поиск по каталогу

Строка поиска над списком товаров:

- фильтрация по подстроке в названии (от 2 символов, максимум 100);
- debounce 500 мс — запрос не уходит в URL на каждый символ;
- синхронизация с адресом через `?q=`;
- подсветка совпадений в названии карточки;
- история последних запросов в `localStorage` (до 8 записей, запись при Submit или выборе из списка);
- клавиатурная навигация по истории (ARIA combobox);
- пустое состояние «Товары не найдены» и сброс фильтров/поиска.

Код: `src/features/catalog/CatalogSearch.jsx`, утилиты `src/utils/search.js` и `src/utils/search-history.js`.

## Запуск

```bash
npm install
npm run dev
```

Сервер разработки: `http://localhost:5173`. По умолчанию используются встроенные данные (`VITE_USE_MOCK_DATA=true`) — внешний API не обязателен.

## Переменные окружения

Скопировать `.env.example` в `.env`:

| Переменная | Описание | По умолчанию |
|---|---|---|
| `VITE_USE_MOCK_DATA` | Встроенные данные вместо API поставщика | `true` |
| `VITE_API_KEY` | Ключ API поставщика (`X-Api-Key`) | (пусто) |

В режиме разработки API поставщика не нужен. Для реального API: `VITE_USE_MOCK_DATA=false` и заполненный `VITE_API_KEY`.

Ключи `localStorage` (настраивать не нужно):

| Ключ | Назначение |
|---|---|
| `products_cache` | Кеш ответа каталога |
| `catalog_search_history` | История поисковых запросов |

## API

Нужен только при `VITE_USE_MOCK_DATA=false`.

| Параметр | Значение |
|---|---|
| Метод и путь | `GET /api/v2/products` |
| Заголовок | `X-Api-Key: ${VITE_API_KEY}` |
| Таймаут | 5000 мс |
| Повторы | до 3, задержка 1s / 2s / 3s |
| Адаптер | `adaptProduct`: `item_id` → `id`, `item_name` → `name`, `item_price` → `price`, `in_stock` → `inStock` |

Состояния загрузки в UI: `loading` → `retrying` → `fallback` (кеш) → `failed`. Полный контракт — `docs/specs/api-catalog/contract.md`.

Поиск работает поверх уже загруженного каталога (мок, API или кеш) и отдельного API не вызывает.

## Скрипты

| Команда | Описание |
|---|---|
| `npm run dev` | Сервер разработки |
| `npm run build` | Сборка для продакшена |
| `npm test` | Модульные тесты (Vitest) |
| `npm run lint` | ESLint |
| `npm run quality` | `test` + `lint` + `build` |
| `npm run test:e2e` | Сквозные тесты (Playwright) |

## Архитектура

```
src/
  api/                 # HTTP-клиент, адаптер, ошибки
  components/          # Переиспользуемые компоненты интерфейса
  data/                # Статические данные (товары, промокоды)
  features/            # Функциональные модули
    catalog/           # Каталог, фильтры, поиск (CatalogSearch)
    cart/
    checkout/          # Оформление заказа
  hooks/               # Хуки React (в т.ч. useDebouncedValue)
  utils/               # Чистые утилиты (search, search-history, …)
docs/
  specs/api-catalog/   # Комплект спецификаций для API (критическая зона)
  decisions.md         # Журнал решений
  pr-description.md     # Описание PR: что, зачем, как проверить, риски
  release-notes.md      # Заметки к релизу для пользователей
  risk-checklist.md     # Чек-лист релизных рисков
  mcp-inventory.md     # Подключённые MCP-серверы и их инструменты
  mcp-risk-log.md      # Риски подключения MCP
tests/e2e/             # Сквозные тесты Playwright
.cursor/
  mcp.json             # Конфигурация Playwright MCP
  rules/               # Правила Cursor: project.mdc, components.mdc
CHANGELOG.md           # История версий (формат Keep a Changelog)
```

## MCP

Подключён [Playwright MCP](https://github.com/microsoft/playwright-mcp) — агент в редакторе сам открывает страницы, нажимает на элементы, заполняет формы, делает снимки экрана и читает консоль, запуская тесты прямо из диалога. Конфигурация — `.cursor/mcp.json`. Политика подтверждений — `docs/mcp-inventory.md`, `docs/mcp-risk-log.md`. Первый запуск скачает Chromium (~300 МБ).

## Сквозные тесты

Лежат в `tests/e2e/`, конфигурация — `playwright.config.js`.

```bash
npm run test:e2e
```

Тесты идут против локального сервера разработки. Их может запустить и агент через Playwright MCP.

## Релиз

- `CHANGELOG.md` — история версий в формате Keep a Changelog.
- `docs/release-notes.md` — заметки к релизу для пользователей.
- `docs/risk-checklist.md` — чек-лист релизных рисков.
- `docs/pr-description.md` — описание релизного PR.

## Известные ограничения

- Кеш в localStorage (~5 МБ лимит).
- Встроенный набор данных статичен.
- Изображения товаров — заглушки.
- Поиск не схлопывает внутренние пробелы и не нормализует ё/е.
- История поиска не фильтруется по текущему вводу (полный список до 8 записей).
