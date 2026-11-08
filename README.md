# MUSE

**Личная музыкальная библиотека: Telegram-бот → Supabase → красивый веб-плеер.**

MUSE — это не макет и не демонстрация. Это полноценная система из трёх частей:

1. **Telegram-бот** (Python 3.12, aiogram 3) принимает аудиофайлы и ссылки SoundCloud, читает метаданные, загружает разрешённое аудио в приватное хранилище Supabase и создаёт запись в базе.
2. **Supabase** хранит базу данных, файлы, обложки, пользователей и обеспечивает безопасность через Row Level Security.
3. **Веб-сайт** (React + TypeScript + Vite + Tailwind + Framer Motion) автоматически получает новые треки через Realtime (и опрашивает базу как резервный механизм), показывает премиальную библиотеку и играет музыку через собственный плеер или официальный SoundCloud Widget.

Сайт можно открыть на компьютере, iPhone, в Telegram Mini App. Frontend публикуется на GitHub Pages, бот работает отдельно на Render (или другом хостинге постоянного процесса).

---

## Содержание

- [Что уже готово](#что-уже-готово)
- [Архитектура](#архитектура)
- [Структура проекта](#структура-проекта)
- [Быстрый локальный запуск](#быстрый-локальный-запуск)
- [Пошаговая инструкция: 17 шагов](#пошаговая-инструкция-17-шагов)
- [Дополнительно: Telegram Mini App](#дополнительно-telegram-mini-app)
- [Список сервисов и стоимость](#список-сервисов-и-стоимость)
- [Финальная проверка](#финальная-проверка)
- [Частые проблемы](#частые-проблемы)
- [Безопасность](#безопасность)
- [Полезные команды](#полезные-команды)

---

## Что уже готово

В репозитории уже лежит рабочий код:

- **Frontend**: все страницы (Home, Library, Recently Added, Playlists, Search, Settings, Login, Reset password, Track detail), сайдбар, мобильная навигация, skeleton/empty/error-состояния, toast-уведомления, адаптивность, safe-area для iPhone и Telegram.
- **Плеер**: постоянный нижний плеер, очередь, shuffle, repeat, громкость, seek, сохранение позиции, `HTMLAudioElement` для сохранённых файлов и официальный SoundCloud Widget API для embed-треков.
- **Supabase**: SQL-миграции со схемой, индексами, триггерами, RPC, RLS-политиками, приватным bucket `audio` и публичным `covers`, Realtime.
- **Telegram-бот**: allowlist по Telegram ID, валидация размера/MIME/расширения, чтение ID3-тегов и обложек, загрузка в Storage, карточка трека с кнопкой «Открыть в MUSE», обработка SoundCloud только через официальный API/oEmbed.
- **Edge Function** `telegram-auth` для входа в Mini App через `initData` с проверкой HMAC-SHA256.
- **GitHub Actions** workflow для автоматического деплоя frontend на GitHub Pages.
- **Render Blueprint** и **Dockerfile** для бота.
- **Тесты** бота: 16 unit-тестов.

**Чего я не могу сделать за вас:** создать ваш Telegram-бот, аккаунт Supabase, GitHub-репозиторий, оплатить хостинг, вставить ваши секреты. Эти действия требуют ваших аккаунтов и описаны ниже пошагово. Код при этом полностью готов — вам останется только выполнить внешние шаги.

---

## Архитектура

```text
┌─────────────────────┐        официальный API/oEmbed        ┌──────────────────┐
│  Telegram (вы)      │ ───────────────────────────────────► │  SoundCloud      │
└──────────┬──────────┘                                      └──────────────────┘
           │ аудио / ссылка
           ▼
┌─────────────────────┐        service_role (только сервер)
│  MUSE Bot (Python)  │ ───────────────────────────────────► ┌──────────────────┐
│  aiogram 3          │                                      │  Supabase        │
│  Render / Docker    │ ── Storage: audio (private) ───────► │  PostgreSQL      │
└─────────────────────┘    Storage: covers (public)          │  Auth + RLS      │
                                                             │  Realtime        │
┌─────────────────────┐        anon key + RLS                │  Edge Functions  │
│  MUSE Web (React)   │ ◄──────────────────────────────────► │                  │
│  GitHub Pages       │        signed URLs для аудио         └──────────────────┘
└─────────────────────┘
```

**Ключевая идея:** бот и сайт используют **одну и ту же базу** и **один и тот же аккаунт владельца**. Поэтому:

- `MUSE_OWNER_ID` в боте = UUID пользователя Supabase Auth = `auth.uid()` на сайте.
- `TELEGRAM_OWNER_ID` — ваш числовой Telegram ID, которому разрешено добавлять музыку.
- Бот пишет `owner_id = MUSE_OWNER_ID`, сайт читает строки, где `owner_id = auth.uid()`.
- Если эти UUID не совпадут, сайт будет пустым. Это самая частая ошибка при настройке — ниже она разобрана отдельно.

---

## Структура проекта

```text
MUSE/
├── frontend/
│   ├── public/
│   │   ├── 404.html            # SPA fallback для GitHub Pages
│   │   ├── .nojekyll
│   │   ├── favicon.svg
│   │   └── apple-touch-icon.svg
│   ├── src/
│   │   ├── components/         # UI, layout, track, playlist
│   │   ├── hooks/              # auth, sync, media query, telegram
│   │   ├── lib/                # env, supabase, format, errors
│   │   ├── pages/              # Home, Library, Playlists, Search, ...
│   │   ├── player/             # PlayerProvider, PlayerBar, engines
│   │   ├── services/           # tracks, playlists, auth, storage
│   │   ├── stores/             # zustand: auth, library, player, toast
│   │   ├── styles/
│   │   └── types/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── bot/
│   ├── database/repository.py
│   ├── handlers/               # start.py, media.py
│   ├── keyboards/inline.py
│   ├── services/               # soundcloud, storage, metadata, validation
│   ├── tests/
│   ├── config.py
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init.sql
│   │   ├── 0002_storage.sql
│   │   └── 0003_realtime.sql
│   ├── functions/telegram-auth/index.ts
│   └── config.toml
├── .github/workflows/deploy.yml
├── render.yaml
├── .env.example                # общий справочник переменных
├── .gitignore
└── README.md
```

---

## Быстрый локальный запуск

Это сокращённая версия. Подробности — в 17 шагах ниже.

### Frontend

```powershell
cd frontend
Copy-Item .env.example .env
# откройте .env и заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Откройте `http://localhost:5173`.

### Bot

```powershell
cd bot
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# заполните bot/.env
python main.py
```

Если PowerShell блокирует активацию venv:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Или запускайте без активации:

```powershell
.\.venv\Scripts\python.exe main.py
```

### Проверка кода

```powershell
cd frontend
npm run typecheck
npm run lint
npm run build

cd ..\bot
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv\Scripts\python.exe -m pytest
```

Ожидаемо: typecheck без ошибок, lint без ошибок (один warning fast-refresh допустим), build успешен, 16 тестов бота проходят.

---

# Пошаговая инструкция: 17 шагов

> Ниже — действия, которые нужно выполнить **вам** в браузере и терминале. Секреты вставляйте только в локальные `.env` и в настройки GitHub/Render/Supabase. Никогда не коммитьте `.env`.

---

## Шаг 1. Создать Telegram-бота через BotFather

**Куда зайти:** Telegram → поиск → `@BotFather` (официальный аккаунт с галочкой).

**Что сделать:**

1. Откройте чат с `@BotFather`.
2. Отправьте `/newbot`.
3. Введите отображаемое имя, например `MUSE`.
4. Введите username, заканчивающийся на `bot`, например `muse_music_bot`. Если занято — придумайте другой.
5. BotFather пришлёт сообщение с токеном вида `123456789:AA...`.

**Что скопировать:** строку токена целиком.

**Куда вставить:** позже в `bot/.env` → `TELEGRAM_BOT_TOKEN=...` и в секреты Edge Function.

**Как проверить:** откройте `https://t.me/<ваш_username>` — бот должен открываться. Пока он не запущен, на `/start` не ответит.

> Не публикуйте токен. Если он утёк — BotFather → `/revoke` → выберите бота → получите новый токен и обновите `.env` и Render.

---

## Шаг 2. Получить Telegram Bot Token

Если вы уже создали бота, токен можно получить повторно:

1. `@BotFather` → `/mybots`.
2. Выберите бота.
3. **API Token** → скопируйте токен.

**Куда вставить:**

- `bot/.env` → `TELEGRAM_BOT_TOKEN=...`
- Render → Environment → `TELEGRAM_BOT_TOKEN`
- Supabase Edge Function secrets → `TELEGRAM_BOT_TOKEN`

**Проверка:** токен должен иметь вид `<цифры>:<буквы_и_цифры>`. Не добавляйте кавычки и пробелы.

---

## Шаг 3. Создать проект Supabase

**Куда зайти:** <https://supabase.com/dashboard> → войдите через GitHub (или email).

**Что сделать:**

1. Нажмите **New project**.
2. Выберите организацию (можно создать новую бесплатную).
3. **Name:** `muse`.
4. **Database Password:** придумайте надёжный пароль и сохраните его в менеджере паролей. Он нужен для прямого доступа к PostgreSQL, но не для сайта и бота.
5. **Region:** выберите ближайший к вам (например, `Frankfurt` для Европы).
6. Нажмите **Create new project** и подождите 1–2 минуты, пока проект инициализируется.

**Как проверить:** в левом меню появились **Table Editor**, **SQL Editor**, **Storage**, **Authentication**.

> Бесплатный тариф Supabase может «усыплять» проект после недели без активности. Если сайт перестал отвечать — зайдите в dashboard и нажмите **Restore**. Это нормально для бесплатного тарифа.

---

## Шаг 4. Получить Supabase URL и Anon Key

**Куда зайти:** Supabase dashboard → ваш проект → **Project Settings** (шестерёнка) → **API** (в новых проектах раздел может называться **API Keys**).

**Что скопировать:**

1. **Project URL** — вид `https://abcdefghijkl.supabase.co`.
2. **anon / public** key — длинная строка. В новых проектах она может называться **publishable key** (`sb_publishable_...`). Это ключ для браузера, он безопасен **только при включённом RLS** (RLS уже включён миграциями).
3. **service_role** key — **секретный** ключ. В новых проектах может называться **secret key** (`sb_secret_...`). Его нельзя давать frontend.

**Куда вставить:**

| Значение | Куда |
|---|---|
| Project URL | `frontend/.env` → `VITE_SUPABASE_URL` |
| Project URL | `bot/.env` → `SUPABASE_URL` |
| anon / publishable | `frontend/.env` → `VITE_SUPABASE_ANON_KEY` |
| anon / publishable | GitHub Actions variable `VITE_SUPABASE_ANON_KEY` |
| service_role / secret | `bot/.env` → `SUPABASE_SERVICE_ROLE_KEY` |
| service_role / secret | Render env `SUPABASE_SERVICE_ROLE_KEY` |

**Как проверить:** URL начинается с `https://` и заканчивается `.supabase.co`. Anon-ключ и service_role-ключ — разные строки. Не перепутайте их местами.

> `service_role` обходит RLS. Он должен быть только в боте и Edge Function. Если он попал в frontend-бандл — немедленно отзовите ключ в Supabase и создайте новый.

---

## Шаг 5. Настроить Supabase Storage

Buckets создаются автоматически SQL-миграцией `0002_storage.sql`, отдельно кликать в dashboard не обязательно. Но нужно понимать, что получится:

| Bucket | Доступ | Назначение |
|---|---|---|
| `audio` | **private** | MP3/FLAC/WAV/M4A. Читается только владельцем через signed URL. |
| `covers` | **public** | Обложки. Публичные, кэшируются CDN. |

**Что сделать после выполнения миграций (шаг 6):**

1. Откройте **Storage**.
2. Убедитесь, что видны оба bucket: `audio` и `covers`.
3. Откройте `audio` → вкладка **Policies** — должны быть политики `audio owner read/insert/update/delete`.
4. Откройте `covers` → **Policies** — должны быть `covers public read`, `covers owner insert/update/delete`.

**Если buckets не появились:**

- Проверьте, что `0002_storage.sql` выполнился без ошибок.
- Выполните его ещё раз — он написан идемпотентно (`on conflict do update`).
- Не создавайте bucket вручную с другими именами: код ожидает именно `audio` и `covers`.

**Проверка приватности:**

- `audio` должен иметь **Public: OFF**.
- `covers` должен иметь **Public: ON**.

---

## Шаг 6. Выполнить SQL-миграции

**Куда зайти:** Supabase dashboard → **SQL Editor** → **New query**.

**Что сделать по порядку:**

> Быстрый вариант: откройте файл `supabase/setup_all.sql` — это все три миграции, склеенные в один файл. Вставьте его целиком и нажмите **Run**. Тогда шаги 1–7 ниже можно пропустить.

1. Откройте файл `supabase/migrations/0001_init.sql` в репозитории.
2. Скопируйте **всё** содержимое.
3. Вставьте в SQL Editor.
4. Нажмите **Run** (или `Ctrl+Enter`).
5. Дождитесь `Success. No rows returned`.
6. Повторите для `0002_storage.sql`.
7. Повторите для `0003_realtime.sql`.

**Порядок важен:** `0001` → `0002` → `0003`.

**Что создастся:**

- enum `track_source` (`soundcloud`, `local`, `telegram_upload`);
- enum `playback_type` (`stored_audio`, `soundcloud_embed`, `unavailable`);
- таблицы `profiles`, `user_settings`, `tracks`, `playlists`, `playlist_tracks`;
- индексы, триггеры `updated_at`, триггер создания профиля при регистрации;
- RPC `search_tracks`, `record_track_play`, `reorder_playlist_tracks`;
- RLS-политики;
- buckets `audio` и `covers`;
- публикация Realtime для `tracks`, `playlists`, `playlist_tracks`.

**Как проверить:**

В SQL Editor выполните:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Ожидаемо: у `profiles`, `user_settings`, `tracks`, `playlists`, `playlist_tracks` стоит `rowsecurity = true`.

```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Ожидаемо: несколько политик для каждой таблицы.

> Если SQL Editor выдал ошибку `type already exists` — это значит, что миграция уже частично применялась. `0001` защищён проверками, но при сомнениях создайте новый пустой проект Supabase и выполните миграции с нуля.

---

## Шаг 7. Настроить RLS

RLS уже включён и настроен миграцией `0001_init.sql`. Вам нужно **проверить**, что он действительно работает, и не отключать его.

**Куда зайти:** **Authentication** → **Policies** (или **Table Editor** → таблица → **RLS**).

**Что проверить:**

1. Для каждой таблицы RLS **включён**.
2. Политики используют `auth.uid()`:
   - `tracks`: `owner_id = auth.uid()`;
   - `playlists`: `owner_id = auth.uid()`;
   - `playlist_tracks`: доступ через родительский playlist;
   - `profiles`, `user_settings`: только своя строка.
3. У роли `anon` нет доступа к таблицам (миграция делает `revoke all ... from anon`).

**Как проверить, что посторонний не прочитает данные:**

1. Откройте сайт в режиме инкогнито (без входа).
2. Вы должны увидеть экран входа, а не библиотеку.
3. В консоли браузера запрос к `tracks` без сессии должен вернуть пустой массив или ошибку — но не ваши треки.

**Важно:** не отключайте RLS ради «чтобы работало». Если данные не видны — почти всегда проблема в `MUSE_OWNER_ID`, а не в RLS.

---

## Шаг 8. Указать ваш Telegram ID

**Куда зайти:** Telegram → `@userinfobot` (или `@getmyid_bot`).

**Что сделать:**

1. Отправьте `/start`.
2. Бот пришлёт ваш числовой ID, например `123456789`.

**Куда вставить:**

- `bot/.env` → `TELEGRAM_OWNER_ID=123456789`
- Render → Environment → `TELEGRAM_OWNER_ID`
- Supabase Edge Function secrets → `TELEGRAM_OWNER_ID`

Дополнительные разрешённые ID (если нужно) — через запятую:

```env
TELEGRAM_ALLOWED_IDS=111111111,222222222
```

**Как проверить:** запустите бота и отправьте `/start` с вашего аккаунта — он ответит приветствием. С чужого аккаунта — сообщением «Доступ закрыт».

> Не указывайте здесь UUID Supabase. Это именно числовой Telegram ID.

---

## Шаг 9. Заполнить `.env`

В проекте два независимых env-файла. Общий справочник — `.env.example` в корне.

### 9.1. `frontend/.env`

```powershell
cd frontend
Copy-Item .env.example .env
```

Заполните:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_TELEGRAM_BOT_USERNAME=muse_music_bot
VITE_SITE_URL=
VITE_BASE_PATH=/
```

- `VITE_SITE_URL` локально можно оставить пустым — сайт возьмёт `window.location.origin`.
- `VITE_BASE_PATH=/` для локальной разработки и кастомного домена. Для GitHub Pages project page будет `/MUSE/` (workflow выставит автоматически).
- `VITE_TELEGRAM_BOT_USERNAME` — username бота **без `@`**.

### 9.2. `bot/.env`

```powershell
cd bot
Copy-Item .env.example .env
```

Заполните:

```env
TELEGRAM_BOT_TOKEN=123456789:AA...
TELEGRAM_OWNER_ID=123456789
TELEGRAM_ALLOWED_IDS=

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
MUSE_OWNER_ID=00000000-0000-0000-0000-000000000000

SITE_URL=http://localhost:5173

AUDIO_BUCKET=audio
COVERS_BUCKET=covers
MAX_UPLOAD_MB=20

SOUNDCLOUD_CLIENT_ID=
SOUNDCLOUD_CLIENT_SECRET=

LOG_LEVEL=INFO
```

- `MUSE_OWNER_ID` — **UUID пользователя Supabase Auth**, а не Telegram ID. Как его получить — шаг 9.3.
- `SITE_URL` локально `http://localhost:5173`; после деплоя — `https://your-name.github.io/MUSE` (без слэша в конце).
- `SOUNDCLOUD_CLIENT_ID/SECRET` можно оставить пустыми. Тогда бот использует официальный oEmbed и сохраняет SoundCloud-треки как `soundcloud_embed`.

### 9.3. Где взять `MUSE_OWNER_ID`

1. Supabase dashboard → **Authentication** → **Users**.
2. Нажмите **Add user** → **Create new user**.
3. Email: ваш email (например `you@example.com`).
4. Password: надёжный пароль.
5. Включите **Auto Confirm User** (чтобы не ждать письма).
6. Нажмите **Create user**.
7. В списке пользователей скопируйте **UUID** (длинная строка вида `a1b2c3d4-...`).

Этот UUID вставьте в `bot/.env` → `MUSE_OWNER_ID` и в секреты Edge Function.

> Этот же email и пароль вы будете использовать для входа на сайт. Регистрация на сайте отключена — аккаунт создаётся вручную в Supabase.

### 9.4. Настройки Auth в Supabase

**Куда зайти:** **Authentication** → **URL Configuration**.

- **Site URL:** `http://localhost:5173` для локальной работы; после деплоя — `https://your-name.github.io/MUSE`.
- **Redirect URLs:** добавьте:
  - `http://localhost:5173/**`
  - `https://your-name.github.io/MUSE/**`
  - если подключите домен — `https://music.example.com/**`

Ссылка восстановления пароля ведёт на `/reset-password`. Wildcard-правило `/**` уже покрывает этот путь. Если письмо открывается с ошибкой «ссылка истекла», проверьте, что redirect URL добавлен и совпадает с доменом сайта.

**Отключите публичную регистрацию:** **Authentication** → **Sign In / Providers** → **Email** → выключите **Allow new users to sign up** (название может отличаться в зависимости от версии dashboard). Либо **Authentication** → **Settings** → **Enable sign ups** → OFF.

**Проверка:** вы можете войти на сайт с созданным email/паролем, но не можете зарегистрировать новый аккаунт через интерфейс.

---

## Шаг 10. Запустить Telegram-бота локально

**Требования:** Python 3.12+ (подойдёт 3.11+), pip, интернет.

**Куда зайти:** терминал в папке проекта.

**Команды (Windows PowerShell):**

```powershell
cd bot
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

**Команды (macOS/Linux):**

```bash
cd bot
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

**Что должно появиться в логе:**

```text
MUSE Bot started. Owner allowlist: 123456789. SoundCloud API: oEmbed fallback.
```

**Как проверить:**

1. Откройте своего бота в Telegram.
2. Отправьте `/start` — придёт приветствие с кнопкой «Открыть MUSE».
3. Отправьте `/stats` — бот покажет количество треков и плейлистов.
4. Отправьте `/help` — инструкция.

**Если хотите запустить тесты бота:** установите dev-зависимости и выполните pytest:

```powershell
pip install -r requirements-dev.txt
python -m pytest
```

**Если бот пишет ошибку конфигурации:** проверьте, что `bot/.env` существует, лежит рядом с `config.py` и все обязательные переменные заполнены.

**Если `ModuleNotFoundError`:** активируйте venv или запускайте через `.\.venv\Scripts\python.exe main.py`.

**Остановка:** `Ctrl+C`.

---

## Шаг 11. Проверить синхронизацию

Это ключевая проверка всей системы.

**Что сделать:**

1. Бот запущен.
2. Frontend запущен (`npm run dev`) или открыт задеплоенный сайт.
3. Войдите на сайт под аккаунтом владельца.
4. Отправьте боту MP3-файл (или ссылку SoundCloud).

**Что должно произойти:**

1. Бот пришлёт статус «🎧 Обрабатываю аудио…».
2. Затем «☁️ Загружаю в MUSE…».
3. Затем карточку с обложкой, названием, исполнителем, длительностью и кнопкой **«Открыть в MUSE»**.
4. На сайте карточка появится **без перезагрузки страницы** (Realtime).
5. Нажмите на трек — он заиграет в нижнем плеере.

**Если Realtime не сработал:**

- Подождите до 60 секунд — включён polling.
- Переключите вкладку браузера и вернитесь — сработает refresh по фокусу.
- Обновите страницу.
- Проверьте в Supabase **Table Editor → tracks**, что строка появилась.
- Проверьте `0003_realtime.sql`: таблица `tracks` должна быть в публикации `supabase_realtime`.

**Проверка базы:**

```sql
select id, title, artist, source, playback_type, owner_id, created_at
from public.tracks
order by created_at desc
limit 5;
```

`owner_id` должен совпадать с `MUSE_OWNER_ID`.

**Проверка Storage:**

- **Storage → audio** → должна быть папка `<UUID владельца>/tracks/`.
- **Storage → covers** → обложка трека.

**Если карточка есть, но звука нет:**

- Для `stored_audio` проверьте, что файл реально лежит в `audio` и bucket приватный.
- Для `soundcloud_embed` проверьте, что у трека есть `source_url` и он играет на SoundCloud.
- Откройте консоль браузера: signed URL должен возвращаться без ошибки 403.

---

## Шаг 12. Создать GitHub-репозиторий

**Куда зайти:** <https://github.com/new>.

**Что сделать:**

1. **Repository name:** `MUSE` (или любое имя; от него зависит base path).
2. **Visibility:**
   - **Public** — если у вас бесплатный GitHub. GitHub Pages для private-репозиториев требует платный план (Pro/Team).
   - **Private** — если у вас GitHub Pro и вы хотите скрыть код. Сайт всё равно будет защищён Supabase Auth.
3. **Не** добавляйте README, `.gitignore` и license — они уже есть в проекте.
4. Нажмите **Create repository**.

**Почему public-репозиторий безопасен:** в коде нет секретов. Anon-ключ Supabase публичен по назначению, доступ к данным закрыт RLS. Bot token, service_role и `.env` в репозиторий не попадают (они в `.gitignore`).

**Как проверить:** репозиторий создан, отображается страница с командами для push.

---

## Шаг 13. Загрузить проект в GitHub

**Куда зайти:** терминал в корне проекта `MUSE/`.

**Команды:**

```powershell
git init
git add .
git commit -m "MUSE: initial working build"
git branch -M main
git remote add origin https://github.com/<ваш-username>/MUSE.git
git push -u origin main
```

Замените `<ваш-username>` и `MUSE` на свои.

**Перед push проверьте, что секреты не попали в индекс:**

```powershell
git status
git ls-files | Select-String -Pattern "\.env$|service_role|TELEGRAM_BOT_TOKEN"
```

Ожидаемо: в списке нет `.env`, нет `bot/.env`, нет `frontend/.env`. Если файл попал — удалите его из индекса:

```powershell
git rm --cached frontend/.env
git rm --cached bot/.env
```

и убедитесь, что `.gitignore` содержит `.env`.

**Как проверить:** откройте репозиторий на GitHub — файлы видны, `.env` отсутствует.

---

## Шаг 14. Включить GitHub Pages

**Куда зайти:** GitHub → ваш репозиторий → **Settings** → **Pages**.

**Что сделать:**

1. **Build and deployment** → **Source:** выберите **GitHub Actions** (не «Deploy from a branch»).
2. Ничего больше в этом разделе менять не нужно — workflow уже лежит в `.github/workflows/deploy.yml`.
3. Если GitHub предложит выбрать тему — пропустите.

**Как проверить:** после первого успешного workflow (шаг 15) в разделе Pages появится URL вида `https://<username>.github.io/MUSE/`.

> Не включайте «Deploy from a branch» одновременно с Actions — это создаст конфликтующий деплой.

---

## Шаг 15. Настроить автоматический deployment

**Куда зайти:** GitHub → репозиторий → **Settings** → **Secrets and variables** → **Actions**.

### 15.1. Добавить Variables (не Secrets)

Вкладка **Variables** → **New repository variable**:

| Name | Value | Обязательно |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://your-project-ref.supabase.co` | Да |
| `VITE_SUPABASE_ANON_KEY` | ваш anon / publishable key | Да |
| `VITE_TELEGRAM_BOT_USERNAME` | `muse_music_bot` (без `@`) | Да |
| `VITE_SITE_URL` | `https://<username>.github.io/MUSE` | Нет (workflow вычислит сам) |
| `VITE_BASE_PATH` | `/MUSE/` | Нет (workflow вычислит сам) |

### 15.2. Про anon-ключ

`VITE_SUPABASE_ANON_KEY` хранится как **Variable**, а не Secret. Это безопасно: publishable/anon ключ всё равно попадает в JS-бандл, а доступ к данным закрыт RLS. Секретом он быть не обязан.

### 15.3. Запустить деплой

Сделайте любой commit и push в `main`:

```powershell
git add .
git commit -m "Trigger Pages deployment"
git push
```

Или: **Actions** → **Deploy MUSE to GitHub Pages** → **Run workflow**.

**Что должно произойти:**

1. Workflow `Build frontend` установит зависимости, проверит типы и соберёт `frontend/dist`.
2. Workflow `Deploy` опубликует артефакт.
3. В логах будет `Base path: /MUSE/` и `Site URL: https://<username>.github.io/MUSE`.

**Как проверить:**

1. **Actions** → последний run → зелёные галочки.
2. Откройте `https://<username>.github.io/MUSE/`.
3. Должен открыться экран входа MUSE.
4. Войдите с email/паролем из шага 9.3.
5. Откройте трек по прямой ссылке `https://<username>.github.io/MUSE/track/<id>` — SPA fallback должен сработать без 404.

**Если build упал с ошибкой про `VITE_SUPABASE_URL`:** добавьте Variable (не Secret) с этим именем. Workflow специально проверяет обязательные переменные и падает с понятным сообщением.

**Если сайт открывается, но белый экран:**

- Откройте DevTools → Console.
- Проверьте, что `VITE_SUPABASE_URL` и anon key правильные.
- Проверьте, что base path совпадает: в `dist/index.html` ассеты должны начинаться с `/MUSE/`.

**Если прямой ссылкой открывается 404:**

- Убедитесь, что `public/404.html` попал в `dist` (он копируется автоматически).
- Убедитесь, что в `dist/404.html` строка `var base = '/MUSE/';` (плагин Vite подставляет base при сборке).
- GitHub Pages может кэшировать 404 — подождите пару минут.

---

## Шаг 16. Разместить Telegram-бота на Render

Бот — это long-running polling-процесс. GitHub Pages его не запускает. Нужен хостинг постоянного процесса.

### Вариант A. Render Blueprint (рекомендуется для простоты)

**Куда зайти:** <https://dashboard.render.com> → войдите через GitHub.

**Что сделать:**

1. **New** → **Blueprint**.
2. Подключите GitHub и выберите репозиторий `MUSE`.
3. Render прочитает `render.yaml` и предложит создать сервис `muse-bot` типа **Worker**.
4. Нажмите **Apply**.
5. Откройте созданный сервис → **Environment** и заполните переменные, помеченные `sync: false`:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_OWNER_ID`
   - `TELEGRAM_ALLOWED_IDS` (можно пустым)
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MUSE_OWNER_ID`
   - `SITE_URL` — **задеплоенный URL сайта**, например `https://<username>.github.io/MUSE`
   - `SOUNDCLOUD_CLIENT_ID` / `SOUNDCLOUD_CLIENT_SECRET` (можно пустыми)
6. Нажмите **Save changes** → **Manual Deploy** → **Deploy latest commit**.

**Важно про тариф:** Render background workers **не входят в бесплатный тариф**. `render.yaml` использует `plan: starter` (ориентировочно ~$7/мес, проверяйте актуальную цену). Бесплатные web services на Render засыпают после простоя, поэтому для polling-бота они не подходят.

**Как проверить:**

1. Render → ваш сервис → **Logs**.
2. Должно появиться `MUSE Bot started. Owner allowlist: ...`.
3. Отправьте боту `/start` — он ответит.
4. Отправьте трек — он появится на сайте.

**Если лог показывает `ConfigError`:** какая-то переменная не заполнена или `MUSE_OWNER_ID` не UUID.

### Вариант B. Docker на любом сервере

В репозитории есть `bot/Dockerfile`.

```bash
docker build -f bot/Dockerfile -t muse-bot ./bot
docker run -d --name muse-bot --restart unless-stopped --env-file bot/.env muse-bot
docker logs -f muse-bot
```

Подойдёт VPS (например, Hetzner, Timeweb, Oracle Cloud Free Tier), домашний сервер, NAS.

### Вариант C. Другие PaaS

- **Fly.io** — поддерживает `worker`-процессы; проверьте актуальные бесплатные лимиты.
- **Railway** — удобный деплой из GitHub, но бесплатный trial ограничен.
- **Oracle Cloud Always Free** — бесплатная VM, но требует ручной настройки Linux и systemd.
- **PythonAnywhere** — бесплатный тариф не подходит для постоянного polling; платный — подходит.

**Честно:** полностью бесплатного и надёжного «always-on» хостинга для Telegram-бота сейчас почти нет. Самый простой путь — Render Starter. Если бюджет критичен — Oracle Cloud Free VM или собственный сервер.

**После смены URL сайта** обновите `SITE_URL` в Render, иначе кнопка «Открыть в MUSE» будет вести на старый адрес.

---

## Шаг 17. Подключить собственный домен (опционально)

**Куда зайти:** у регистратора домена (Namecheap, Cloudflare Registrar, reg.ru и т.д.) и в GitHub → **Settings → Pages**.

**Что сделать:**

1. Купите домен, например `music.example.com`.
2. В DNS-панели домена создайте запись:

   | Type | Name | Value |
   |---|---|---|
   | CNAME | `music` | `<username>.github.io` |

   Для apex-домена (`example.com`) используйте A-записи GitHub Pages:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.

3. GitHub → **Settings → Pages → Custom domain** → введите `music.example.com` → **Save**.
4. Дождитесь проверки DNS (может занять до 24 часов).
5. Включите **Enforce HTTPS**.

6. Обновите переменные GitHub Actions:
   - `VITE_SITE_URL` = `https://music.example.com`
   - `VITE_BASE_PATH` = `/`

7. Перезапустите workflow (push в `main` или **Run workflow**).

8. Обновите `SITE_URL` в Render (или в `bot/.env`) на `https://music.example.com`.

9. Supabase → **Authentication → URL Configuration**:
   - **Site URL:** `https://music.example.com`
   - **Redirect URLs:** добавьте `https://music.example.com/**`

10. Если используете Telegram Mini App — обновите секрет `SITE_URL` Edge Function:

```bash
supabase secrets set SITE_URL=https://music.example.com
```

11. В BotFather настройте menu button (см. раздел Mini App) на новый домен.

**Как проверить:**

- `https://music.example.com` открывается без предупреждений HTTPS.
- Прямая ссылка `https://music.example.com/track/<id>` работает.
- Кнопка «Открыть в MUSE» из бота ведёт на новый домен.
- Вход и Realtime работают.

> После смены домена старый `https://<username>.github.io/MUSE` может продолжать работать. Это нормально. Если хотите — отключите его или оставьте как резервный.

---

# Дополнительно: Telegram Mini App

Это не обязательно для базовой работы, но даёт красивый вход в Telegram и открытие сайта внутри Telegram.

## 1. Настроить кнопку меню бота

**Куда зайти:** `@BotFather`.

**Что сделать:**

1. `/mybots` → выберите бота.
2. **Bot Settings** → **Menu Button** → **Configure menu button**.
3. Введите URL сайта: `https://<username>.github.io/MUSE` (или ваш домен).
4. Введите название кнопки, например `MUSE`.

Теперь у бота появится кнопка, открывающая сайт как Mini App.

## 2. Задеплоить Edge Function `telegram-auth`

**Требования:** Supabase CLI, Node.js.

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase functions deploy telegram-auth --no-verify-jwt
```

`<your-project-ref>` — часть URL Supabase до `.supabase.co`.

**Если CLI не установлен или не работает:** откройте Supabase dashboard → **Edge Functions** → **Create a new function** → имя `telegram-auth` → вставьте содержимое `supabase/functions/telegram-auth/index.ts` → **Deploy**. В настройках функции отключите **Verify JWT** (функция проверяет Telegram `initData` сама).

## 3. Задать секреты функции

```bash
supabase secrets set \
  TELEGRAM_BOT_TOKEN=123456789:AA... \
  TELEGRAM_OWNER_ID=123456789 \
  MUSE_OWNER_ID=00000000-0000-0000-0000-000000000000 \
  MUSE_OWNER_EMAIL=you@example.com \
  SITE_URL=https://<username>.github.io/MUSE
```

- `MUSE_OWNER_ID` **обязателен**: без него Mini App может создать отдельный аккаунт и показать пустую библиотеку.
- `MUSE_OWNER_EMAIL` — email аккаунта из шага 9.3.
- `SITE_URL` — для CORS allowlist.

**Как проверить:**

1. Откройте бота в Telegram.
2. Нажмите кнопку меню `MUSE`.
3. Сайт откроется внутри Telegram.
4. На экране входа появится кнопка **Continue with Telegram**.
5. Нажмите её — вы войдёте в тот же аккаунт, что и на сайте.

**Если кнопка не появляется:** `initData` пуст. Убедитесь, что сайт открыт именно как Mini App (через menu button), а не в обычном браузере.

**Если ошибка «This Telegram account is not allowed»:** `TELEGRAM_OWNER_ID` в секретах функции не совпадает с вашим ID.

**Если ошибка «resolved to a different account»:** `MUSE_OWNER_ID` / `MUSE_OWNER_EMAIL` указывают на разные аккаунты. Исправьте секреты и задеплойте функцию заново.

---

# Список сервисов и стоимость

| Сервис | Зачем | Бесплатно? | Ограничения / оплата |
|---|---|---|---|
| **Telegram Bot API** | Бот | Да | Лимит скачивания файлов ботом — 20 МБ. |
| **Supabase** | PostgreSQL, Auth, Storage, Realtime, Edge Functions | Да, Free tier | Обычно 500 МБ БД, 1 ГБ Storage, 5 ГБ трафика, 2 проекта; проект может «уснуть» после недели простоя. Проверьте актуальные лимиты. |
| **GitHub** | Репозиторий, Actions, Pages | Да | Pages для public-репозиториев бесплатно. Для private нужен Pro/Team. Actions: 2000 минут/мес для private, для public — бесплатно. |
| **Render** | Хостинг бота (Worker) | Нет для worker | Starter worker ~$7/мес. Бесплатные web services засыпают — для polling-бота не подходят. |
| **Домен** | Красивый адрес | Нет | ~$10–15/год у регистратора. Опционально. |
| **SoundCloud API** | Официальные метаданные | Да | Нужна регистрация приложения на <https://soundcloud.com/you/apps>. Без него — официальный oEmbed. |
| **Cloudflare** (опционально) | DNS, прокси, HTTPS | Да | Не обязателен. |
| **FFmpeg** | Обработка аудио | Да | **Не требуется** этим проектом: бот сохраняет оригинал без перекодирования. |

**Минимальный бесплатный сценарий:** Telegram + Supabase Free + GitHub Pages + локально запущенный бот (пока компьютер включён). Сайт будет работать, бот — только когда запущен.

**Рекомендуемый рабочий сценарий:** Telegram + Supabase Free/Pro + GitHub Pages + Render Starter (~$7/мес) + опционально домен.

---

# Финальная проверка

Пройдите по чек-листу после настройки:

- [ ] `bot/.env` заполнен, `frontend/.env` заполнен, секретов в git нет.
- [ ] SQL-миграции `0001`, `0002`, `0003` выполнены без ошибок.
- [ ] Buckets `audio` (private) и `covers` (public) существуют.
- [ ] В Supabase Auth создан владелец, `MUSE_OWNER_ID` совпадает с его UUID.
- [ ] Публичная регистрация отключена.
- [ ] Бот запускается локально и отвечает на `/start`.
- [ ] Бот принимает MP3 и создаёт строку в `tracks`.
- [ ] Сайт локально показывает трек и играет его.
- [ ] Realtime обновляет библиотеку без перезагрузки.
- [ ] GitHub Actions деплой зелёный.
- [ ] GitHub Pages открывается, вход работает, прямая ссылка `/track/<id>` работает.
- [ ] Бот на Render запущен и отвечает.
- [ ] Кнопка «Открыть в MUSE» ведёт на правильный трек.
- [ ] Mini App (если настроен) входит в тот же аккаунт.
- [ ] Мобильная версия: нет горизонтальной прокрутки, плеер не перекрывает контент, safe-area учтён.
- [ ] `npm run typecheck`, `npm run lint`, `npm run build` проходят.
- [ ] `pytest` в `bot/` — 16 тестов проходят.

---

# Частые проблемы

### Сайт пустой, хотя бот пишет «Трек добавлен»

**Причина:** `MUSE_OWNER_ID` в боте не совпадает с UUID аккаунта, под которым вы вошли.

**Решение:**

1. Supabase → Authentication → Users → скопируйте UUID владельца.
2. Сравните с `MUSE_OWNER_ID` в `bot/.env`.
3. Исправьте, перезапустите бота, добавьте трек заново.
4. Проверьте SQL:

```sql
select owner_id, count(*) from public.tracks group by owner_id;
```

Если `owner_id` отличается от UUID владельца — это и есть причина.

### `new row violates row-level security policy`

**Причина:** бот использует anon-ключ вместо service_role, либо `owner_id` не совпадает с `auth.uid()`.

**Решение:** в `bot/.env` должен быть именно `SUPABASE_SERVICE_ROLE_KEY`, а не anon. Бот пишет с `owner_id = MUSE_OWNER_ID`.

### Realtime не обновляет библиотеку

- Проверьте `0003_realtime.sql`.
- Проверьте, что таблица `tracks` есть в публикации:

```sql
select * from pg_publication_tables where pubname = 'supabase_realtime';
```

- Realtime в Supabase Free может быть ограничен по количеству concurrent connections — закройте лишние вкладки.
- Polling каждые 60 секунд и refresh по фокусу работают даже без Realtime.

### GitHub Pages отдаёт 404 на прямых ссылках

- **Settings → Pages → Source** должен быть **GitHub Actions**.
- Проверьте, что `frontend/public/404.html` попал в `dist`.
- Проверьте, что в собранном `dist/404.html` есть `var base = '/MUSE/';`.
- Подождите 1–2 минуты после деплоя.

### Сайт на GitHub Pages открывается, но ассеты 404

**Причина:** неверный base path.

**Решение:** для project page (`username.github.io/MUSE`) base должен быть `/MUSE/`; для user site (`username.github.io`) и кастомного домена — `/`. Workflow вычисляет это автоматически, но если вы задали `VITE_BASE_PATH` вручную — проверьте слэши.

### Бот не принимает файл больше 20 МБ

Это ограничение Telegram Bot API на скачивание файлов ботом. Увеличить `MAX_UPLOAD_MB` выше 20 бессмысленно. Пришлите файл меньшего размера или ссылку SoundCloud (если автор разрешил скачивание).

### SoundCloud-трек не играет

- Если `playback_type = soundcloud_embed`, плеер использует официальный виджет. Некоторые треки запрещены к встраиванию автором или недоступны в вашем регионе.
- Откройте `source_url` на SoundCloud и проверьте, играет ли трек там.
- Бот не обходит ограничения и не извлекает потоки — это осознанное решение.

### Бот не видит `SOUNDCLOUD_CLIENT_ID`

- Проверьте, что переменные в `bot/.env` без кавычек.
- Перезапустите бота.
- В логе будет `SoundCloud API: enabled` или `oEmbed fallback`.

### Ошибка `Invalid API key` в Supabase

- Перепутаны anon и service_role.
- Ключ скопирован с пробелом или обрезан.
- Проект Supabase пересоздан, а ключи остались старые.

### Mini App показывает пустую библиотеку

См. раздел Mini App: `MUSE_OWNER_ID` в секретах Edge Function должен совпадать с владельцем.

### PowerShell не даёт активировать venv

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

Или используйте `.\.venv\Scripts\python.exe main.py` без активации.

### `npm.ps1 cannot be loaded`

В Windows PowerShell политика выполнения может блокировать `npm.ps1`. Используйте `npm.cmd`:

```powershell
npm.cmd install
npm.cmd run dev
```

---

# Безопасность

- **Bot Token** — только в `bot/.env`, Render env и секретах Edge Function. Не в frontend, не в git.
- **service_role / secret key** — только в боте и Edge Function. Обходит RLS. Никогда не в frontend.
- **anon / publishable key** — можно в frontend, потому что RLS включён.
- **RLS** — не отключайте. Все таблицы и Storage-политики уже настроены.
- **Storage `audio`** — приватный. Плеер получает signed URL на 1 час; ссылка не вечная.
- **Storage `covers`** — публичный, потому что обложки не являются секретом.
- **Allowlist** — бот принимает файлы только от `TELEGRAM_OWNER_ID` и `TELEGRAM_ALLOWED_IDS`.
- **Валидация** — размер, MIME, расширение, пустые файлы. Бот не исполняет полученные файлы.
- **HTML-экранирование** — названия треков экранируются перед отправкой в Telegram, чтобы нельзя было внедрить HTML.
- **Edge Function** — проверяет HMAC-SHA256 подпись `initData`, срок жизни `auth_date`, allowlist по Telegram ID и совпадение аккаунта.
- **Секреты в git** — `.gitignore` исключает `.env`, venv, node_modules, dist.
- **Ротация** — если токен или service_role утёк: отзовите в BotFather / Supabase, создайте новые, обновите Render и локальный `.env`.

---

# Полезные команды

### Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

### Bot

```powershell
cd bot
.\.venv\Scripts\Activate.ps1
python main.py
python -m pytest
python -m compileall -q .
```

### Supabase CLI (опционально)

```bash
supabase login
supabase link --project-ref <ref>
supabase db push
supabase functions deploy telegram-auth --no-verify-jwt
supabase secrets set KEY=value
supabase functions logs telegram-auth
```

### Git

```powershell
git status
git add .
git commit -m "Update MUSE"
git push
```

---

# Лицензия и дисклеймер

Проект создан для личного использования. MUSE не обходит ограничения SoundCloud, не извлекает защищённые потоки и не использует чужие токены/cookies. SoundCloud-треки воспроизводятся только через официальный Widget API; аудио сохраняется только если автор явно разрешил скачивание или вы загрузили собственный файл.

Если вы используете чужие аудиофайлы, убедитесь, что у вас есть права на их хранение и воспроизведение.
