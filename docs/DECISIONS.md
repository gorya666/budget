# Decisions log

Taken autonomously; veto any by leaving a comment or editing here.

| # | Date | Decision | Why |
|---|------|----------|-----|
| 1 | 2026-11-10 | Product = monthly **todo list for money**: plan items per person (savings goals, jars, zone expenses), closed by one or more contributions. Remainder/"free money" not tracked. | Owner's framing; the sheet's «Факт» ritual was never filled in. |
| 2 | 2026-11-10 | Logic reproduced 1:1 from the sheet, verified by golden tests. Sheet findings (cushion target excludes personal costs, etc.) left as-is in docs/SPEC.md §6. | Don't silently change family agreements. |
| 3 | 2026-11-10 | Jar plan per person = jar × (person's top-up / all jars). | Sheet only defines totals per person; this keeps both totals exact. |
| 4 | 2026-11-10 | Olena's Oct/Nov savings target computed from the sheet's transition block (tax debt). | Otherwise November shows red while on plan. |
| 5 | 2026-11-10 | Exchange rate: manual per month, default 44.70 (sheet). NBU API not used yet. | MVP; sandbox can't reach bank.gov.ua either. |
| 6 | 2026-11-10 | Auth: single shared passcode, no accounts. Supabase accessed only server-side with service-role key; RLS on, no policies. | Two users; no email setup needed; anon key can't read anything. |
| 7 | 2026-11-10 | Next.js 16 with cacheComponents OFF. | Fully dynamic two-user app; avoids Suspense/caching complexity. |
| 8 | 2026-11-10 | shadcn on base-ui, NumberFlow, motion, Sonner, recharts. | Picked via `pick-ui-library` skill at owner's request. |
| 9 | 2026-11-10 | Display name «Лєна», initials О / Л. | Both names start with «О». Change in `src/lib/budget/config.ts`. |
| 10 | 2026-11-10 | Settle-up («хто кому компенсує») shown live from current entries, ±500 ₴ = even. | Same rule as sheet's «Факт» tab. |
| 11 | 2026-11-10 | Supabase tables need explicit `grant ... to service_role` (new projects no longer auto-grant). Migration 0002. | Prod crashed with permission denied on first open. |
| 12 | 2026-11-10 | Simplified screen after owner feedback: one shared goal + one card per person; jars and zone expenses collapsed to one row each; removed chart, center column, monthly tasks, entry chips. | Same numbers were shown 3–4 times. Tasks/chart can return as month history later. |
| 13 | 2026-11-10 | Raised controls use a real semi-transparent border + padding-box clip; `pressable` utility for press feedback; strong ease-out curve; viewport-fit/safe areas. | Transparent border showed a white ring around the ink button; Emil Kowalski skills (emil-design-eng, review-animations, mobile-native) installed at owner's request. |
