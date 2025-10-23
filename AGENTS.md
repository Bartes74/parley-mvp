# Repository Guidelines

## Project Structure & Module Organization
Parley runs on the Next.js App Router with localized routes in `app/[locale]/`. Feature areas get their own subroutes (`agents`, `sessions`, `admin`) and optional layouts; auth flows live under `app/[locale]/(auth)/`. API handlers stay in `app/api`. Shared UI primitives are in `components/ui`, while feature composites live alongside their domain folders. Supabase clients sit in `lib/supabase`, general helpers in `lib/utils.ts` and `utils/`, reusable hooks in `hooks/`, and locale strings in `messages/{en,pl}.json`. Database migrations and environment docs reside in `supabase/`.

## Build, Test, and Development Commands
`npm run dev` launches the app at http://localhost:3000. `npm run build` compiles the production bundle; run it before releasing schema changes. `npm run start` serves the compiled app. `npm run lint` runs ESLint via `eslint.config.mjs`. After authenticating with `supabase login`, push schema updates with `supabase db push` or run the SQL files in `supabase/migrations/` from the dashboard.

## Coding Style & Naming Conventions
Use TypeScript with strict typings and keep components functional. Match the established two-space indentation and semicolon-free style; rely on the ESLint extension for formatting and import order. Name components and their files in `PascalCase`, hooks as `useCamelCase`, and general utilities in camel- or kebab-case. Keep Tailwind class lists readable and colocate UI logic with its component. Scope translation keys by feature, e.g. `agents.startButton`.

## Testing Guidelines
A formal test suite is not yet in place. Validate every change by running `npm run lint`, executing `npm run build`, and smoke-testing the impacted pages. When adding tests, prefer React Testing Library with Vitest and colocate files as `*.test.tsx`. For Supabase features, seed data through migrations under `supabase/migrations/` and document any manual SQL in `supabase/README.md`.

## Commit & Pull Request Guidelines
Follow the Conventional Commit style seen in history (`feat: improve landing page`, `fix: align login form`). Keep commits focused and imperative. Pull requests should summarise the change, call out Supabase migrations or i18n updates, link any issues, and include before/after screenshots for UI work. List verification steps such as `npm run lint` and `npm run build` in the PR body.

## Supabase & Environment Notes
Store secrets in `.env.local` and keep that file untracked. Whenever schema or RLS rules change, update the matching migration and refresh `supabase/README.md`. For local admin access, seed the user `bartek@dajer.pl` or hit `/api/create-test-admin` while `npm run dev` is running.

## Branding & Landing Configuration
Branding data is stored in the `settings` table (`branding`, `landing`, `email`). The shared parser in `lib/settings.ts` normalises these records and feeds them to the App Router layout. `app/[locale]/layout.tsx` injects CSS variables (`--primary`, `--primary-hover`, `--primary-soft`, `--primary-foreground`, `--ring`) so shadcn/ui components automatically adopt the configured colour. Headers (`components/header.tsx`, `components/public-header.tsx`) render the uploaded logo from the `logos` bucket or fall back to an initial. The landing page (`app/[locale]/page.tsx`) reuses the same settings to colour the headline and populate the CTA texts. After adjusting values in the admin panel (`Settings > Branding / Landing`), refresh the page to see the new theme.

The ElevenLabs webhook secret jest przechowywany w `settings` pod kluczem `elevenlabs`. Administrator może go zaktualizować w panelu (`Settings > ElevenLabs`), a endpoint `/api/webhooks/elevenlabs` pobiera wartość bez potrzeby redeployu (opcjonalny fallback do `ELEVENLABS_WEBHOOK_SECRET` pozostaje aktywny).
