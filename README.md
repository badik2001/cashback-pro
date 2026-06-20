# CashBack Pro

Семейное приложение для управления кешбеком и банковскими картами.
React + TypeScript + Vite + Supabase, дизайн в стиле iOS 26 "Liquid Glass".

## Стек

- React 19 + TypeScript + Vite
- Supabase (Auth + Postgres + RLS)
- TanStack Query
- Tailwind CSS v4
- lucide-react
- tesseract.js (OCR в браузере)

## Брендовые цвета

| Основной (магента) | | Дополнительный (лайм) | |
|---|---|---|---|
| `#86177D` | `#652660` | `#A0BE21` | `#7E8F36` |
| `#570851` | `#C34AB8` | `#667C0B` | `#C4DF55` |
| `#C36ABB` | | `#CBDF79` | |

Цвета прописаны как HSL-переменные в `src/index.css` (`--primary*`, `--secondary*`) и подключены к Tailwind через `@theme`, плюс используются напрямую в ambient-блобах фона.

Шрифт — системный стек iOS: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", ...` — на iPhone/iPad/Mac рендерится как настоящий San Francisco, на других платформах — корректный системный fallback (лицензированный шрифт SF Pro нельзя распространять как веб-файл).

## Локальный запуск

```bash
npm install
cp .env.example .env.local   # уже заполнен вашими ключами Supabase
npm run dev
```

`npm run build` — production-сборка (`tsc -b && vite build`).

## Исправление RLS в Supabase

Если возникает ошибка `infinite recursion detected in policy for relation "profiles"` или `new row violates row-level security policy for table "families"` — откройте **SQL Editor** в Supabase и выполните файл:

```
supabase/fix_rls_recursion.sql
```

**Причина бага:** политика `"Users can view family member profiles"` на таблице `profiles` искала `family_id` пользователя через подзапрос `select family_id from profiles where id = auth.uid()` — то есть запрос к `profiles` внутри политики, определённой на самой `profiles`. Postgres обязан применить RLS и к этому внутреннему запросу, что и порождает бесконечную рекурсию. Почти все остальные политики (`families`, `family_members`, `cards`, `cashback_categories`) резолвили "мою семью" через такой же подзапрос — поэтому рекурсия "протекала" и туда, в том числе мешая вернуть только что вставленную строку `families` (отсюда и ошибка при создании семьи).

**Решение:** вынесли резолв `family_id` в функцию `public.current_family_id()` с `security definer` — она выполняется с правами владельца функции и не проходит через RLS таблицы `profiles`, разрывая рекурсию. Скрипт идемпотентен — можно выполнять повторно.

`supabase/schema.sql` обновлён той же логикой — на новых проектах баг не появится изначально.

## Распознавание категорий со скриншота (OCR)

В исходном техзадании предполагалась библиотека **sharp** для предобработки изображения. Sharp — это Node.js-библиотека с нативными бинарными зависимостями, она физически не может работать в браузере, а это приложение — чистый SPA без своего сервера. Поэтому тот же пайплайн (увеличение/изменение размера → ч/б → контраст → резкость) реализован через Canvas API прямо на клиенте (`src/shared/lib/ocr.ts`), а распознавание текста выполняет **tesseract.js** (WebAssembly-сборка Tesseract OCR, языки rus+eng) — тоже полностью в браузере, без сервера.

Раньше загрузка скриншота была полностью замокана (`setTimeout` + три фиксированные категории независимо от картинки) — поэтому распознавание "не работало". Теперь это настоящий OCR: текст разбивается на строки, в каждой ищется процент (`\d+%`), а оставшаяся часть строки становится названием категории; строки без `%` (заголовки, подсказки вида "для зарплатных клиентов") отфильтровываются автоматически.

OCR-модуль подключается отдельным чанком (`import()` по требованию) — он не увеличивает размер основного бандла, пока пользователь не нажмёт «Выбрать скриншоты».

## Структура

```
src/
  features/        # auth, dashboard, cards, family, settings, layout
  shared/
    components/     # GlassSelect, SegmentedControl, SwipeToDelete, BankAvatar
    lib/             # supabase client, banks, categoryIcons, ocr, utils
    hooks/           # useAuth, useApp (язык, тема)
    types/
supabase/
  schema.sql               # полная схема + RLS (для новых проектов)
  fix_rls_recursion.sql     # точечный фикс для уже существующей базы
```

## Известные ограничения / что можно добавить дальше

- Загрузка фото карты (`cards.image_url` в схеме уже есть) — нужен Storage bucket в Supabase, в этой версии не подключали.
- Автосоздание 4 стартовых карт ("Зелёный/Красный/Жёлтый/Синий банк") при регистрации — пресеты для них уже есть в `src/shared/lib/banks.ts`, но автосидинг при signup не реализован.
- Полноценный desktop drag (мышью) для свайп-удаления — на десктопе используется hover-кнопка корзины вместо свайпа (свайп — тач-жест).
