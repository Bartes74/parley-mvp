**Parley**

**Cel produktu**

Platforma do treningu rozmów (symulacje z agentami głosowymi ElevenLabs) obejmująca pełną pętlę: **rejestracja/logowanie** **→** **katalog scenariuszy** **→** **karta scenariusza** **→** **rozmowa w widżecie** **→** **feedback + transkrypcja (webhook)** **→** **historia rozmów**. Dodatkowo **Admin Panel**: zarządzanie agentami, użytkownikami, retencją, brandingiem, landingiem, e-mailami i webhookiem.

**Zakres ról i uprawnień**

- **User**: rejestracja/logowanie (email+hasło), podgląd katalogu agentów, uruchomienie rozmowy, przegląd własnych rozmów, zmiana tytułu rozmowy, notatki, pobranie PDF, usunięcie rozmowy.
- **Admin**: wszystko jak User + Panel Admina: CRUD agentów, przegląd wszystkich rozmów i użytkowników (filtrowanie po użytkowniku/agencie), zmiana ról, konfiguracja retencji, branding, landing, powiadomienia e-mail, podgląd stanu webhooka. Admin **nie może usunąć swojego konta**.

**Brand & UI (light/dark)**

- **Nazwa i logo serwisu:** konfigurowane w panelu admina (`Settings > Landing` + `Settings > Branding`). Domyślnie nazwa „Parley” bez logo; upload grafiki zapisuje ją w Supabase Storage (`logos`) i renderuje w headerze/public headerze.
- **Primary color:** ustawiany jako hex w panelu (`Settings > Branding`). Na backendzie nadpisujemy zmienne CSS (`--primary`, `--primary-hover`, `--primary-soft`, `--primary-foreground`, `--ring`), z których korzystają wszystkie komponenty (CTA, linki, badge).
- **Fallback paleta** (gdy brak ustawień brandingu):
  - Light – `--background: #F4F6F8`, `--surface: #FFFFFF`, `--text: #0F1115`, `--muted: #6A7280`, `--border: #E6E8EE`, `--primary: #0BA37F`.
  - Dark – `--background: #0F1115`, `--surface: #161A20`, `--text: #F2F4F7`, `--muted: #9AA3B2`, `--border: #263041`, `--primary: #0BA37F`.
- **Typografia:** Manrope (nagłówki 600/700), Inter (treści 400/500), JetBrains Mono (timestampy, tekst mono).
- **Ikony:** Lucide.
- **Tryby:** przełącznik **PL/EN** (next-intl) oraz **Light/Dark** (next-themes).
- **Docelowe urządzenia:** desktop (Chrome / Edge / Safari).



**Kluczowe przepływy**

**1) Rejestracja/Logowanie (Supabase Auth: email+hasło)**

- Rejestracja: e-mail, hasło, checkbox (opcjonalne polityki – na MVP wyłączone), natychmiastowy login (weryfikacja e-mail opcjonalna).
- Reset hasła: link wysyłany przez Supabase.
- Po zalogowaniu: **Landing/Katalog agentów**.

**2) Katalog agentów**

- Siatka 3-kolumnowa kart (miniatura 16:9, tytuł, opis, chip „poziom”, ikonka flagi języka, tagi).
- Brak filtrów/sortowania na MVP.
- Kliknięcie → **Karta scenariusza**.

**3) Karta scenariusza**

- Krótka instrukcja (co i jak), przycisk **START**.
- Po START: render **widżetu ElevenLabs** z przypiętym agentem (elevenAgentId) i przekazaniem **dynamic variables**:
  - user_id (UUID z Supabase)
  - session_id (nasz UUID rozpoczętej rozmowy)
  - agent_db_id (ID agenta w naszej DB)

**4) Rozmowa (widżet)**

- Rozmowa toczy się w osadzonym widżecie (nie budujemy własnego WebRTC).
- Po zakończeniu: informacja, że **feedback i transkrypcja zostaną dostarczone później** (Webhook).
- Na liście „Moje rozmowy” status rozmowy: **Pending**.

**5) Webhook post-call (ElevenLabs** **→** **Parley)**

- Jeden globalny endpoint (Vercel) z **weryfikacją HMAC**.
- Payload zawiera: metadane (nasze dynamic variables), transcript (z podziałem ról + timestampy), analysis/feedback (oceny/wnioski).
- Po zapisaniu do DB:
  - Aktualizacja statusu rozmowy na **Completed**.
  - Wysłanie **e-maila** (Resend) do użytkownika z CTA „Zobacz feedback”.
  - W UI użytkownika **auto-odświeżenie** listy (SSE/polling co 10–15 s na MVP).

**6) „Moje rozmowy” i Szczegóły rozmowy**

- **Lista**: tytuł (edytowalny inline), agent, data, status (Pending/Completed), akcje (Usuń, Otwórz).
- **Szczegóły**:
  - A) Nagłówek (tytuł + data)
  - B) **Feedback** (ocena + wnioski – sekcja z kartą)
  - C) **Transkrypcja** w „dymkach” (ja/agent) z timestampami
  - D) **Notatki własne** (auto-save)
  - E) Akcje: Zmień tytuł, **Pobierz PDF**, Usuń rozmowę



**Admin Panel (MVP sekcje)**

1. **Agenci (CRUD)**
   - Pola: title, shortDescription, difficulty (Beginner/Intermediate/Advanced), language (ISO: pl/en), tags (lista), thumbnail (upload do Supabase Storage), elevenAgentId, isActive, displayOrder.
   - Lista + formularz dodawania/edycji + włącz/wyłącz.

1. **Użytkownicy**

- Lista z rolą (user/admin), akcje: zmiana roli, dezaktywacja, **(brak) usunięcia własnego konta admina**.
- Podgląd liczby rozmów, ostatnia aktywność.

1. **Rozmowy (przegląd)**

- Widok wszystkich rozmów (filtrowanie po użytkowniku/agencie/statusie), tylko do odczytu treści (transkrypcja/feedback).

1. **Ustawienia retencji**

- Dwa pola (dni): **Transkrypcje** i **Feedback**. Na MVP domyślnie **bezterminowo** (0 = brak kasowania).
- Zadanie okresowe (cron) do czyszczenia po przekroczeniu retencji.

1. **Branding**

- Konfiguracja logo (upload PNG/JPG/WebP do Supabase Storage `logos` z automatycznym resize do 80px).  
- Pole `primary_color` (hex) aktualizuje zmienne CSS (`--primary`, `--primary-hover`, `--primary-soft`, `--primary-foreground`, `--ring`) wykorzystywane w całym UI.

1. **Landing**

- Edycja nazwy serwisu, nagłówka, sub-claim, leadu oraz tekstów CTA (login/register).  
- Zmiany są renderowane server-side – landing i header od razu pobierają aktualne wartości i kolor.

1. **Powiadomienia e-mail**

- Włącz/wyłącz globalnie; nazwa nadawcy; test e-mail.

1. **ElevenLabs**

- Wklejenie aktualnego secretu webhooka (panel admina → Settings → ElevenLabs).  
- Secret jest przechowywany w tabeli `settings` i wykorzystywany przez endpoint `/api/webhooks/elevenlabs`; opcjonalny fallback to zmienna środowiskowa `ELEVENLABS_WEBHOOK_SECRET`.

1. **Webhook**

- HMAC secret (read-only), podgląd ostatnich zdarzeń (status 2xx/4xx/5xx, data), debug payload (ostatnie 5).



**Model danych (Supabase / Postgres)**

**Tabele**

- **profiles**
  - id (UUID, = auth.user.id), email, display_name, role (user|admin, domyślnie user), created_at
- **agents**
  - id (UUID), title (text), short_description (text), difficulty (beginner|intermediate|advanced), language (pl|en), tags (text[]), thumbnail_path (text), eleven_agent_id (text), is_active (bool), display_order (int), created_at, updated_at
- **sessions** (rozmowy)
  - id (UUID), user_id (UUID → profiles.id), agent_id (UUID → agents.id), status (pending|completed|error), started_at (timestamptz), ended_at (timestamptz, nullable), title_override (text, nullable)
- **session_feedback**
  - id (UUID), session_id (UUID → sessions.id, unique), raw_feedback (jsonb), score_overall (numeric, nullable), score_breakdown (jsonb, nullable), created_at
- **session_transcripts**
  - id (UUID), session_id (UUID → sessions.id, unique), transcript (jsonb) *// struktura: lista tur {speaker: "user"|"agent", text, ts_ms}* , created_at
- **session_notes**
  - id (UUID), session_id (UUID → sessions.id, unique), notes_md (text), updated_at
- **settings**
  - key (pk text), value (jsonb)
     *(np.* *retention_days_transcripts**,* *retention_days_feedback**,* *branding**,* *landing**,* *emails* *etc.)*
- **webhook_events**
  - id (UUID), provider (text = "elevenlabs"), event_type (text), payload (jsonb), status (received|processed|failed), error (text, nullable), created_at

**Indeksy i bezpieczeństwo**

- RLS: sessions, session_* — **user** widzi własne; **admin** widzi wszystko.
- Indeksy po user_id, agent_id, status, created_at.
- Storage: bucket thumbnails/agents (kontrola dostępu: public read).



**API (Next.js API routes / edge functions)**

**Public (po zalogowaniu)**

- POST /api/sessions/start
  - Body: { agentId }
  - Tworzy rekord sessions (status pending), generuje session_id i zwraca konfigurację do widżetu (w tym dynamic variables).
- GET /api/sessions/my — lista własnych rozmów.
- GET /api/sessions/:id — szczegóły (feedback + transcript + notes).
- PATCH /api/sessions/:id — zmiana tytułu.
- PATCH /api/sessions/:id/notes — zapis notatek.
- GET /api/sessions/:id/pdf — generuje i zwraca PDF (React-PDF).
- DELETE /api/sessions/:id — usuwa rozmowę (soft-delete na MVP opcjonalnie: twarde kasowanie ok).

**Admin**

- GET/POST/PATCH/DELETE /api/admin/agents — CRUD agentów, upload miniatur (signed URL → Supabase Storage).
- GET/PATCH /api/admin/users — lista, zmiana roli (user/admin), dezaktywacja.
- GET /api/admin/sessions — lista wszystkich (filtrowanie query: userId, agentId, status).
- GET/PATCH /api/admin/settings — retencja, branding, landing, e-mail.

**Webhook**

- POST /api/webhooks/elevenlabs
  - Oczekuje nagłówka X-Signature (HMAC).
  - Weryfikuje sygnaturę, zapisuje do webhook_events, mapuje user_id/session_id/agent_db_id z conversation_initiation_client_data.dynamic_variables, upsert do session_transcripts i session_feedback, aktualizuje sessions.status=completed, ustawia ended_at.
  - Na błąd: sessions.status=error, webhook_events.status=failed + error.

**Przykładowe dynamic variables (inicjacja)**



{

 "dynamic_variables": {

  "user_id": "<uuid>",

  "session_id": "<uuid>",

  "agent_db_id": "<uuid>"

 }

}

**Minimalny kształt payloadu webhooka (oczekiwany)**



{

 "event": "post_call_analysis_ready",

 "conversation_initiation_client_data": {

  "dynamic_variables": { "user_id":"...", "session_id":"...", "agent_db_id":"..." }

 },

 "transcript": [

  { "speaker": "user", "text": "Dzień dobry...", "ts_ms": 0 },

  { "speaker": "agent", "text": "Dzień dobry, w czym mogę pomóc?", "ts_ms": 1200 }

 ],

 "analysis": {

  "score_overall": 78,

  "criteria": { "clarity": 80, "empathy": 75, "structure": 78 },

  "summary": "Mocne otwarcie, zabrakło domknięcia prośby...",

  "tips": ["Użyj parafrazy...", "Zadbaj o puentę..."]

 }

}



**i18n (PL/EN)**

- Domyślny język: **PL**. Przełącznik **PL/EN** w nagłówku.
- Klucze (przykłady):



{

 "nav": { "agents": "Agenci", "mySessions": "Moje rozmowy", "admin": "Admin" },

 "landing": { "title": "Trenuj rozmowy, które liczą się naprawdę", "cta": "Zaloguj się" },

 "agent": { "start": "START", "instructions": "Przeczytaj krótką instrukcję i rozpocznij trening." },

 "session": {

  "pending": "Przetwarzanie… Feedback pojawi się wkrótce.",

  "feedback": "Feedback",

  "transcript": "Transkrypcja",

  "notes": "Notatki",

  "downloadPdf": "Pobierz PDF",

  "delete": "Usuń rozmowę",

  "rename": "Zmień tytuł"

 }

}

- Wersje EN analogiczne. Teksty agentów (tytuł/opis/tagi) — **jedna wersja** na MVP.



**PDF (@react-pdf/renderer)**

- Nagłówek: logo Parley, tytuł rozmowy, data, agent.
- Sekcja **Feedback** (wynik + wnioski).
- Sekcja **Transkrypcja** (role + timestampy).
- Sekcja **Notatki** użytkownika.
- Styl zgodny z paletą (primary akcenty, czytelna typografia).



**E-maile (Resend)**

- Wymagane zmienne: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (zweryfikowana domena w Resend).
- Panel admina → Powiadomienia e-mail: przełącznik Enabled, nazwa nadawcy, pole na adres testowy + przycisk „Wyślij testowy e-mail” (wywołuje `/api/admin/email/test`).
- Szablony: testowe (HTML inline) oraz docelowe „Feedback gotowy” z CTA „Zobacz rozmowę”.



**Retencja danych**

- Domyślnie **bezterminowo** (MVP).
- Admin może ustawić **dni** niezależnie dla transkrypcji i feedbacku.
- Job czyszczący (cron/edge schedule) usuwa dane po terminie.



**Bezpieczeństwo i zgodność (MVP)**

- Supabase RLS: użytkownik widzi tylko swoje rozmowy/notatki/feedback.
- HMAC w webhooku, odrzucanie gdy podpis nieprawidłowy.
- Brak nagrań audio w MVP (tylko tekst).
- Logi webhooków w webhook_events do debugowania.



**User Stories (skrót + kryteria akceptacji)**

**Jako Użytkownik**

1. **Rejestracja/logowanie**
   - *Kiedy* podam e-mail i hasło, *to* zostanę zalogowany bez wymogu weryfikacji e-mail.
   - **AC:** natychmiastowy dostęp do katalogu.

1. **Przegląd agentów**

- *Kiedy* otwieram katalog, *to* widzę karty 6 (lub 0+) agentów z miniaturą, tytułem, opisem, poziomem, flagą języka, tagami.
- **AC:** kliknięcie przenosi do karty scenariusza.

1. **Start rozmowy**

- *Kiedy* kliknę START na karcie, *to* pojawia się widżet agenta, a moja rozmowa jest zapisana w DB jako pending z session_id.
- **AC:** w dynamic variables są user_id, session_id, agent_db_id.

1. **Oczekiwanie na feedback**

- *Kiedy* zakończę rozmowę, *to* na liście „Moje rozmowy” pozycja ma status pending.
- **AC:** po przyjściu webhooka status zmienia się na completed, pojawia się toast i e-mail.

1. **Szczegóły rozmowy**

- *Kiedy* otworzę rozmowę, *to* widzę Feedback, Transkrypcję (dymki z czasem), Notatki (auto-save), akcje (Zmień tytuł/PDF/Usuń).
- **AC:** PDF generuje się poprawnie.

1. **Zarządzanie rozmowami**

- *Kiedy* zmienię tytuł lub notatki, *to* zapis pozostaje po odświeżeniu.
- *Kiedy* usunę rozmowę, *to* znika z listy i nie jest dostępna.

**Jako Admin**

1. **Zarządzanie agentami**

- *Kiedy* dodam agenta (z uploadem miniatury), *to* pojawia się w katalogu (jeśli isActive=true).
- **AC:** mogę edytować pola i zmieniać kolejność (displayOrder).

1. **Użytkownicy i role**

- *Kiedy* otworzę listę użytkowników, *to* mogę zmienić rolę na admin/user.
- **AC:** nie mogę usunąć własnego konta.

1. **Przegląd rozmów**

- *Kiedy* otworzę rozmowy, *to* widzę wszystkie i mogę filtrować po użytkowniku/agencie/statusie.
- **AC:** podgląd treści tylko do odczytu.

1. **Ustawienia**

- Retencja: ustawienie dni → po czasie cron usuwa dane.
- Branding: upload logo, aktywacja palety.
- Landing: edycja tytułu/lead/CTA.
- E-mail: włącz/wyłącz + test.
- Webhook: podgląd 5 ostatnich zdarzeń.



**Architektura i stack**

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui, i18n (next-intl lub next-i18next), dark mode (class).
- **Backend**: Supabase (Auth + Postgres + Storage), Next.js API routes na Vercel.
- **E-mail**: Resend.
- **PDF**: @react-pdf/renderer.
- **Osadzanie ElevenLabs**: widget + dynamic variables.



**Edge cases**

- Webhook przychodzi 2×: idempotencja po session_id (UPSERT do session_feedback/session_transcripts; webhook_events z unikalnym event_id jeśli dostępny).
- Brak dopasowania session_id: oznacz jako failed w webhook_events (alert w panelu Webhook).
- Użytkownik zamknął kartę przed końcem: session nadal pending do czasu webhooka; brak webhooka > X godzin → opcjonalnie auto-zmiana na error.
- Upload miniatur: walidacja MIME/rozmiaru, generowanie signed URL, publiczny odczyt.



**Seed/admin**

- Pierwszy admin: **bartek@dajer.pl** — wpis w profiles.role = 'admin' po rejestracji lub seed migracją.



**Minimalny backlog techniczny (MVP)**

1. Projekt bazy (Supabase) + RLS.
2. Auth + profile + seed admina.
3. Landing (logowanie/rejestracja/reset).
4. Katalog agentów (lista + karta scenariusza).
5. Start rozmowy (API start → zapis session → render widżetu z dynamic variables).
6. Webhook endpoint (HMAC, mapowanie, zapis feedback/transcript, e-mail, status).
7. „Moje rozmowy” + Szczegóły (notatki, tytuł, PDF, usuń).
8. Admin: Agenci (CRUD + upload), Użytkownicy/Role, Rozmowy (lista), Ustawienia (retencja/branding/landing/emails), Webhook monitor.
9. i18n + theme (light/dark, paleta A z „złamaną bielą”).
10. Cron retencji.
