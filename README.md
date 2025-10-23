## Parley – trening rozmów z głosowymi agentami AI

Parley to aplikacja SaaS zbudowana na Next.js (App Router + RSC, TypeScript), która umożliwia użytkownikom trenowanie rozmów z agentami głosowymi ElevenLabs. System obejmuje pełny cykl: rejestracja ➜ wybór scenariusza ➜ rozmowa we wbudowanym widżecie ➜ feedback i transkrypcja z webhooka ➜ historia sesji. Panel administratora dostarcza narzędzia do zarządzania agentami, użytkownikami, brandingiem, landing page, webhookami i (w przyszłości) powiadomieniami e-mail.

> ### Najnowsze zmiany (2025-02-06)
> - Landing page i header wczytują dynamiczny branding: logo z Supabase Storage, nazwa serwisu oraz kolor przewodni (primary) pobierane są z panelu admina.
> - Dodano centralny parser ustawień (`lib/settings.ts`) oraz wstrzykiwanie zmiennych CSS (`--primary`, `--primary-hover`, `--primary-soft`, `--primary-foreground`, `--ring`) w `app/[locale]/layout.tsx`.
> - Landing page posiada poprawioną siatkę 2/3 + 1/3, luźniejszą typografię oraz CTA dopasowane kolorystycznie do konfiguracji.

---

## Spis treści

1. [Szybki start](#szybki-start)  
2. [Technologie](#technologie)  
3. [Struktura repozytorium](#struktura-repozytorium)  
4. [Konfiguracja środowiska](#konfiguracja-środowiska)  
5. [Komendy developerskie](#komendy-developerskie)  
6. [Funkcjonalności aplikacji](#funkcjonalności-aplikacji)  
7. [Branding i landing page](#branding-i-landing-page)  
8. [Model danych Supabase](#model-danych-supabase)  
9. [API i integracje](#api-i-integracje)  
10. [Proces deploymentu (Vercel)](#proces-deploymentu-vercel)  
11. [Troubleshooting](#troubleshooting)  
12. [Źródła i dodatkowe dokumenty](#źródła-i-dodatkowe-dokumenty)

---

## Szybki start

```bash
# 1. Instalacja zależności
npm install

# 2. Konfiguracja środowiska
cp .env.example .env.local
# uzupełnij wartości (patrz sekcja Konfiguracja środowiska)

# 3. Start środowiska developerskiego
npm run dev

# 4. (Opcjonalnie) Migracje Supabase
supabase db push
```

Aplikacja uruchomi się pod adresem `http://localhost:3000`. Jeśli port jest zajęty, zobacz [Troubleshooting](#troubleshooting).

---

## Technologie

- **Framework:** Next.js 15 (App Router, RSC, TypeScript)  
- **UI:** Tailwind CSS 4, shadcn/ui, Radix UI, Lucide  
- **Stan / formularze:** React 19, React Hook Form, Zod  
- **Tłumaczenia:** next-intl (PL/EN)  
- **Backend jako usługa:** Supabase (Postgres z RLS, Auth, Storage)  
- **Rozmowy i feedback:** ElevenLabs (WebRTC + webhook)  
- **Pozostałe:** Sharp (obróbka grafik), Sonner (toast), date-fns  
- **Deployment:** Vercel + Supabase + GitHub Actions (trigger przez push)

---

## Struktura repozytorium

```
app/
  [locale]/             # Strony w trybie i18n (PL/EN)
    (auth)/             # Logowanie, rejestracja, reset hasła
    admin/              # Panel administratora (dashboard, agenci, itd.)
    agents/             # Katalog agentów i szczegóły scenariuszy
    sessions/           # Historia rozmów i szczegóły sesji
  api/                  # API routes (sessions, admin, upload, webhook, debug)
components/
  admin/                # Widoki panelu admina
  session-detail/       # Sekcje szczegółów rozmowy
  providers/            # ThemeProvider (next-themes)
  ui/                   # Baza komponentów shadcn/ui
lib/
  supabase/             # Klienci Supabase (server/browser)
  settings.ts           # Parser ustawień brandingu / landing page
messages/
  pl.json, en.json      # Słowniki tłumaczeń
supabase/
  migrations/           # Migracje SQL + storage
  README.md             # Instrukcja uruchomienia bazy
```

Kluczowe pliki z ostatnich zmian:
- `lib/settings.ts` – odczyt i ujednolicenie formatu ustawień.
- `app/[locale]/layout.tsx` – pobranie ustawień w RSC i ustawienie zmiennych CSS.
- `components/header.tsx`, `components/public-header.tsx` – render logo + nazwy serwisu zgodnie z brandingiem.
- `app/[locale]/page.tsx` – landing korzystający z ustawień (`landing`) oraz kolorów.

---

## Konfiguracja środowiska

### Zmienne środowiskowe (`.env.local`)

| Klucz | Opis |
|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projektu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publiczne anon key (używane w SSR i kliencie) |
| `ELEVENLABS_WEBHOOK_SECRET` | Shared secret do weryfikacji podpisu webhooka ElevenLabs |
| `RESEND_API_KEY` | Klucz API Resend używany do wysyłki e-maili |
| `RESEND_FROM_EMAIL` | Adres nadawcy (musi być zweryfikowany w Resend) |

> Jeśli dodasz integrację e-mail (np. Resend), dodaj odpowiednie zmienne – na razie endpoint wysyłanie testowego maila jest oznaczony jako TODO.

### Supabase

1. Zainstaluj CLI: `npm install -g supabase`.  
2. Zaloguj się: `supabase login`.  
3. Połącz repo z projektem: `supabase link --project-ref <project-ref>` (ref znajdziesz w `supabase/.temp`).  
4. Uruchom migracje: `supabase db push`.  
5. Sprawdź, czy istnieją publiczne buckety w Supabase Storage:
   - `agent-thumbnails` (miniatury agentów, tworzone migracjami).  
   - `logos` (logotypy brandingu, tworzy się automatycznie przy pierwszym uploadzie).

### Vercel

- Projekt Vercel obserwuje repo `https://github.com/Bartes74/parley-mvp` (gałąź `main`).  
- W Vercel ustaw te same zmienne środowiskowe co lokalnie.  
- API routes (w tym webhook) działają jako funkcje serverless na platformie Vercel.

---

## Komendy developerskie

| Komenda | Opis |
|---------|------|
| `npm run dev` | Tryb developerski (`http://localhost:3000`) |
| `npm run build` | Kompilacja produkcyjna |
| `npm run start` | Serwowanie skompilowanej aplikacji |
| `npm run lint` | ESLint (konfiguracja flat, Next.js + TS) |
| `supabase db push` | Wdrożenie zmian schematu bazy |

> W projekcie brak testów automatycznych – przed pushowaniem uruchom `npm run lint` i `npm run build`, a następnie wykonaj ręczne smoke testy.

---

## Funkcjonalności aplikacji

### Użytkownik (`role = user`)
- Rejestracja/logowanie Supabase Auth (email + hasło).  
- Reset hasła z obsługą Supabase PKCE (backup code-verifier w localStorage).  
- Katalog agentów (`/agents`): karty 16:9, badge trudności i języka, tagi, miniatury.  
- Strona agenta (`/agents/[id]`): instrukcje, tagi, przycisk START.  
- Rozmowa (`/sessions/[id]/conversation`): komponent `ConversationWidget` łączy się z ElevenLabs poprzez WebRTC, przekazując dynamic variables.  
- Historia sesji (`/sessions`): lista z ikonami statusów, szybki podgląd, usuwanie sesji.  
- Szczegóły sesji (`/sessions/[id]`): edycja tytułu, feedback (ocena + kryteria + wskazówki), transkrypcja (dymki), notatki z autosave, status pending/completed.

### Administrator (`role = admin`)
- Dashboard: szybkie metryki (użytkownicy, agenci, sesje, aktywne sesje).  
- Agenci: lista + formularz CRUD, upload miniatur (Sharp + storage `agent-thumbnails`).  
- Użytkownicy: lista profili, role, liczba sesji, zmiana roli (blokada zmiany własnej roli).  
- Sesje: tabela wszystkich rozmów z filtrami (user/agent/status), link do widoku użytkownika.  
- Ustawienia (`settings`):
  - **Branding** – kolor primary, upload/logo URL (storage `logos`).  
  - **Landing** – nazwa serwisu, headline, subclaim, lead, CTA.  
  - **Email** – flaga enable + nazwa nadawcy (UI gotowe, backend w przygotowaniu).  
- Webhooki: loguje ostatnie zdarzenia w tabeli `webhook_events` (status processed/failed).

### Middleware i zabezpieczenia
- `middleware.ts` łączy obsługę lokalizacji (next-intl) i Supabase auth.  
- Publiczne: landing (`/`, `/pl`, `/en`), logowanie, rejestracja, reset/update hasła.  
- Zalogowanych przekierowujemy z landing/login/register na `/agents`.  
- Niezalogowani odwiedzający chronione ścieżki otrzymują redirect do `/login?redirect=...`.

---

## Branding i landing page

1. **Parser ustawień** (`lib/settings.ts`):  
   - Zwraca struktury `branding` (logo, primary_color) oraz `landing` (headline, treści CTA) z wartościami domyślnymi.

2. **Wstrzyknięcie zmiennych** (`app/[locale]/layout.tsx`):  
   - RSC pobiera ustawienia z Supabase, oblicza kolor kontrastowy (`getContrastColor`) i ustawia zmienne CSS (`--primary`, `--primary-hover`, `--primary-soft`, `--primary-foreground`, `--ring`).
   - Dzięki temu wszystkie komponenty shadcn/ui oparte na klasach Tailwind (`bg-primary`, `text-primary`) automatycznie adoptują brandowy kolor.

3. **Header** (`components/header.tsx`, `components/public-header.tsx`):  
   - Renderuje logo z Supabase Storage (`logos/<filename>`) lub fallback w postaci inicjału.  
   - Nazwa serwisu (serviceName) i CTA w headerze mają kolor `primary`.  
   - Wersja publiczna (landing) i zalogowana korzystają z tego samego API danych.

4. **Landing page** (`app/[locale]/page.tsx`):  
   - Używa ustawień `landing` (headline, subclaim, lead, CTA).  
   - Nagłówek ma kolor `primary`, teksty otrzymały większy rozstrzał linii (`leading-relaxed`) i spacing.  
   - CTA (przycisk) dziedziczy nowe zmienne CSS. Formularz logowania znajduje się po prawej stronie (1/3 szerokości) w siatce `lg:grid-cols-3`.
> Zmiana ustawień w panelu admina od razu wpływa na layout – wystarczy odświeżyć stronę (logika renderowana server-side).

---

## Model danych Supabase

| Tabela | Kolumny kluczowe | Uwagi / RLS |
|--------|------------------|-------------|
| `profiles` | `id`, `email`, `role`, `created_at` | RLS: użytkownik widzi siebie; admin widzi wszystkich. |
| `agents` | `title`, `short_description`, `difficulty`, `language`, `tags`, `thumbnail_path`, `eleven_agent_id`, `is_active`, `display_order` | Publiczny katalog filtruje `is_active = true`. |
| `sessions` | `user_id`, `agent_id`, `status`, `started_at`, `ended_at`, `title_override` | Użytkownik widzi tylko własne sesje. Cascade usuwa powiązane rekordy. |
| `session_feedback` | `session_id`, `score_overall`, `score_breakdown`, `raw_feedback` | Upsert w webhooku; przechowuje analizę ElevenLabs. |
| `session_transcripts` | `session_id`, `transcript` | Lista wiadomości `{ role, message, timestamp }`. |
| `session_notes` | `session_id`, `notes_md`, `updated_at` | Autosave co 2 sekundy (debounce). |
| `settings` | `key`, `value`, `updated_at` | Klucze: `branding`, `landing`, `email`, `retention_days_*`, itd. |
| `webhook_events` | `provider`, `event_type`, `payload`, `status`, `error`, `created_at` | Loguje udane i nieudane webhooki. |

Pełna definicja (DDL, indeksy, polityki) znajduje się w `supabase/migrations/20241021_clean_and_create.sql` i kolejnych plikach migracyjnych.

---

## API i integracje

### Endpoints użytkownika
- `POST /api/sessions/start` – tworzy sesję (`status: pending`), zwraca `sessionId`, `elevenAgentId`, dynamic variables (`user_id`, `session_id`, `agent_db_id`).  
- `GET /api/sessions/my` – lista własnych sesji (join z agentem).  
- `GET /api/sessions/:id` – szczegóły sesji, feedback, transkrypt, notatki.  
- `PATCH /api/sessions/:id` – zmiana tytułu sesji (autoryzacja po `user_id`).  
- `PATCH /api/sessions/:id/notes` – upsert notatek (autoryzacja po `user_id`).  
- `DELETE /api/sessions/:id` – usuwa sesję (cascade usuwa feedback/transkrypt/notes).  
- (TODO) `GET /api/sessions/:id/pdf` – generowanie raportu PDF (React-PDF).

### Endpoints administracyjne
- `GET|POST /api/admin/agents` – lista/tworzenie agentów (wymaga roli admin).  
- `GET|PATCH|DELETE /api/admin/agents/:id` – pobieranie/aktualizacja/usuwanie agenta.  
- `GET /api/admin/sessions` – pełna lista sesji, filtry (`userId`, `agentId`, `status`).  
- `GET|PATCH /api/admin/settings` – odczyt i zapis dowolnego klucza w tabeli `settings`.  
- `GET|PATCH /api/admin/users` – lista profili + zmiana roli użytkownika.  
- `POST /api/upload/agent-thumbnail` – upload miniatury (Sharp -> JPEG 800×450, max 4 MB).  
- `POST /api/upload/logo` – upload logo (PNG, wysokość 80px, max 2 MB, zachowanie proporcji).

### Webhook ElevenLabs
- `POST /api/webhooks/elevenlabs`  
  - Weryfikuje podpis HMAC (`x-signature`, secret `ELEVENLABS_WEBHOOK_SECRET`).  
  - Upsertuje transkrypt (`session_transcripts`) i feedback (`session_feedback`).  
  - Aktualizuje status sesji (`completed` + `ended_at`), loguje zdarzenie w `webhook_events`.  
  - W przypadku błędów wpisuje rekord status `failed` i zwraca odpowiedź 4xx/5xx.

### Debug / development
- `POST /api/debug/make-admin` – nadaje bieżącemu użytkownikowi rolę admin (do użycia lokalnie).  
- `GET /api/debug/profile` – podgląd danych profilu / sesji Supabase.  
- `GET /api/debug/add-test-agent` – upsert testowego agenta (wymaga admina).  
- `GET /api/test-admin`, `POST /api/test-post` – proste endpointy diagnostyczne.

---

## Proces deploymentu (Vercel)

1. **Commit + push** na `main` (`git push origin main`).  
2. Vercel automatycznie buduje projekt (Next.js + serverExternalPackages `sharp`).  
3. Po udanym buildzie Vercel publikuje nową wersję (`https://parley.vercel.app`).  
4. Webhook ElevenLabs powinien wskazywać na `https://parley.vercel.app/api/webhooks/elevenlabs`.  
5. Supabase działa niezależnie – upewnij się, że migracje zostały wdrożone przed wypuszczeniem builda (lokalnie `supabase db push` lub SQL w dashboardzie).

---

## Troubleshooting

- **`listen EPERM: operation not permitted 0.0.0.0:3000`**  
  - Inny proces blokuje port. `lsof -i :3000`, następnie `kill -9 <PID>` (czasem wymagane podniesienie uprawnień).  
  - Alternatywnie: `npm run dev -- --hostname 127.0.0.1`.
- **Brak dostępu do panelu admina**  
  - Sprawdź, czy profil w tabeli `profiles` ma `role = 'admin'`.  
  - Lokalnie można użyć `POST /api/debug/make-admin`.
- **Logo / miniatury się nie wyświetlają**  
  - Upewnij się, że pliki znajdują się w Supabase Storage (`logos`, `agent-thumbnails`) i projekt posiada prawidłowy `NEXT_PUBLIC_SUPABASE_URL`.
- **Webhook ElevenLabs zwraca 401**  
  - Sprawdź `ELEVENLABS_WEBHOOK_SECRET` oraz logi w `webhook_events`.
- **ESLint ostrzega o brakujących zależnościach hooków**  
  - Ostrzeżenia w `components/admin/sessions-list.tsx`, `components/conversation-widget.tsx`, `app/[locale]/(auth)/update-password/page.tsx`, `components/locale-toggle.tsx`, `components/start-session-button.tsx`, `middleware.ts` są śledzone – przed refaktoryzacją upewnij się, że zmiana nie złamie istniejącej logiki (np. re-renderów mających wpływ na UX).

---

## Źródła i dodatkowe dokumenty

- `parley.md` – rozbudowany opis produktu, ról, przepływów UX.  
- `AGENTS.md` – przewodnik kontrybutora (struktura modułów, polecenia, proces PR).  
- `supabase/README.md` – instrukcja konfiguracji bazy, migracji i RLS.  
- Kod źródłowy:  
  - Branding: `lib/settings.ts`, `app/[locale]/layout.tsx`, `components/header.tsx`, `components/public-header.tsx`, `app/[locale]/page.tsx`.  
  - Webhook: `app/api/webhooks/elevenlabs/route.ts`.  
  - Sesje: `app/api/sessions/*`, `components/session-detail/*`.

---

Przed wypchnięciem zmian pamiętaj o:

```bash
npm run lint
npm run build
git status
```

Powodzenia! 💬🧠
