Фронтенд сервиса психологической помощи Московского Политеха на React, TypeScript и Vite.

## Архитектура проекта

Проект организован по подходу Feature‑Sliced Design (FSD) с разделением на слои `app`, `pages`, `widgets`, `features`, `entities`, `shared`.

- `src/app` — инициализация приложения: корневой компонент `App.tsx`, маршрутизация, провайдеры (например, React Router, QueryClient, тема), глобальные стили `App.module.scss`.
- `src/pages` — страницы приложения ; каждая страница собирает виджеты и фичи и отвечает за конкретный URL‑маршрут.
- `src/widgets` — крупные самостоятельные блоки интерфейса, которые могут переиспользоваться на разных страницах (например, общий layout, блок навигации, панель фильтров).
- `src/features` — функциональность с бизнес‑ценностью и пользовательскими сценариями (формы, фильтры, модальные окна, операции подтверждения/отмены, авторизация и т.п.).
- `src/entities` — бизнес‑сущности домена (пользователь, консультация, и т.п.): типы, запросы к API, хранилище состояния и базовая логика работы с ними.
- `src/shared` — переиспользуемые, не завязанные на конкретную бизнес‑область модули: UI‑кит, утилиты, хелперы, константы, общие стили, базовая работа с HTTP и т.п.
- `src/tests` — конфигурация и вспомогательные утилиты для unit‑ и component‑тестов (например, `setup.ts`).

## Ветки

- `main` — продакшен. Здесь находится код, который выкатывается в прод.
- `develop` — стенд с самыми последними правками. Сюда попадают все свежие изменения до релиза.

Остальные ветки смотреть не нужно: они рабочие и не отражают актуального состояния проекта.

## Быстрый старт

Нужен Node.js 24.15+ (ветка 24 LTS, версия в `.nvmrc`). С nvm: `nvm install && nvm use`.

```bash
npm ci
npm run start
```

Откройте `http://localhost:3000`. По умолчанию запросы `/api/` идут на стенд из `DEVEL_BACKEND_URL` в `.env.development`.

## Скрипты

| Команда                                       | Назначение                                      |
| --------------------------------------------- | ----------------------------------------------- |
| `npm run start` / `npm run dev`               | Запустить Vite                                  |
| `npm run format` / `npm run format:write`     | Проверить / исправить форматирование            |
| `npm run lint` / `npm run lint:fix`           | Проверить / исправить код через ESLint          |
| `npm run stylelint` / `npm run stylelint:fix` | Проверить / исправить CSS и SCSS                |
| `npm run test` / `npm run test:run`           | Запустить тесты в режиме наблюдения / разово    |
| `npm run typecheck`                           | Проверить типы TypeScript                       |
| `npm run build`                               | Проверить типы и собрать в `build`              |
| `npm run preview`                             | Посмотреть сборку локально                      |
| `npm run prepare`                             | Настроить Git-хуки (автоматически при `npm ci`) |
| `npm run db:backup` / `npm run db:restore`    | Создать / восстановить копию БД и изображений   |

ESLint проверяет порядок JSX-атрибутов: `className` первым, остальные по алфавиту,
обработчики событий `onClick`, `onChange` и другие `on*` — в конце по алфавиту.
`npm run lint:fix` исправляет порядок автоматически. Атрибуты сортируются отдельно
по обе стороны от `{...props}`, сохраняя приоритет переданных значений.

## Локальный бэкенд через Docker

Нужны GNU/Linux ([установка Debian](https://www.debian.org/releases/stable/amd64/index.en.html)), Docker с Docker Compose и Git.
Проверьте `docker info`. Если Docker выключен, с systemd: `sudo systemctl start docker`.

Команды Docker ниже выполняются в каталоге бэкенда.

### 1. Первая настройка — один раз

```bash
git clone --branch develop https://github.com/Reuzer/mospoly-psychological-support.git
cd mospoly-psychological-support
cp .env.example .env
mkdir -p srv/images
printf '/srv/images/\n' >> .git/info/exclude
docker compose up -d db
docker compose exec db pg_isready -h 127.0.0.1 -U postgres -d postgres
```

Дождитесь `accepting connections` (при необходимости повторите последнюю команду), затем:

```bash
docker compose run --rm --build app uv run alembic upgrade head
docker compose up -d
```

Настройки `.env.example` подходят для Docker. Оставьте `RESET_DB_ON_START=false`, чтобы БД не очищалась при запуске. Изображения `srv/images` исключены из Git локально.

В корне фронтенда создайте `.env.development.local`:

```dotenv
DEVEL_BACKEND_URL=http://localhost:8000/
```

Файл не попадает в Git и переопределяет `.env.development`. Без него используется стенд. После изменения или удаления файла перезапустите фронтенд.

### 2. Последующие запуски

```bash
docker compose up -d
```

Бэкенд: `http://localhost:8000/`, документация: `http://localhost:8000/docs`.
В каталоге фронтенда: `npm run start`.

### 3. Остановка с сохранением данных

```bash
docker compose down
```

БД и изображения сохраняются. Не добавляйте `-v`: он удаляет том БД.

### 4. Применение миграций

После обновления кода, при запущенной БД:

```bash
docker compose stop app
docker compose run --rm --build app uv run alembic upgrade head
docker compose up -d --build app
```

Последнюю команду выполняйте только после успешной миграции.

### 5. Копия локальной БД

Из корня фронтенда при запущенном локальном бэкенде:

```bash
npm run db:backup
npm run db:restore -- /путь/к/архиву.tar.gz
```

Копия БД и изображений сохраняется в `.local-data/` (вне Git). Восстановление перезаписывает объекты БД из копии и восстанавливает изображения.
