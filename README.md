# Скарбничка

Хто скільки відклав цього місяця — тудушка для грошей на двох.

- Логіка: [`docs/SPEC.md`](docs/SPEC.md) · рішення: [`docs/DECISIONS.md`](docs/DECISIONS.md)
- `npm i && npm run dev` — локально з in-memory базою (без env).
- Прод: Vercel + Supabase. Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_PASSCODE`.
- Схема БД: `supabase/migrations/`.
