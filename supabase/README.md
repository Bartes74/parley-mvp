# Supabase Database Setup

## Uruchomienie migracji

### Opcja 1: Przez Supabase Dashboard (zalecane dla MVP)

1. Wejdź na https://supabase.com/dashboard/project/wlkkafpbuwwwvgqtifeo/sql/new
2. Przejdź do **SQL Editor**
3. Skopiuj zawartość pliku `migrations/20241021_initial_schema_safe.sql` (**WAŻNE: użyj wersji _safe!**)
4. Wklej i uruchom (kliknij "Run")
5. Poczekaj aż wszystko się wykona (może potrwać 10-30 sekund)

**UWAGA:** Jeśli widzisz błąd "relation already exists" - użyj wersji `20241021_initial_schema_safe.sql` która obsługuje istniejące tabele!

### Opcja 2: Przez Supabase CLI

```bash
# Zainstaluj Supabase CLI (jeśli jeszcze nie masz)
npm install -g supabase

# Zaloguj się
supabase login

# Link do projektu
supabase link --project-ref wlkkafpbuwwwvgqtifeo

# Uruchom migracje
supabase db push
```

## Seed pierwszego admina

Po rejestracji konta **bartek@dajer.pl** przez formularz `/register`, uruchom:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'bartek@dajer.pl';
```

Lub przez SQL Editor w Supabase Dashboard wykonaj plik `migrations/20241021_seed_admin.sql`.

## Struktura tabel

- **profiles** - profile użytkowników (extends auth.users)
- **agents** - agenci/scenariusze konwersacyjne
- **sessions** - rozmowy użytkowników
- **session_feedback** - feedback z ElevenLabs
- **session_transcripts** - transkrypcje rozmów
- **session_notes** - notatki użytkowników
- **settings** - ustawienia globalne (key-value)
- **webhook_events** - logi webhooków

## Storage

Bucket **agent-thumbnails** został utworzony automatycznie (public read).

## Row Level Security (RLS)

Wszystkie tabele mają włączone RLS:
- Użytkownicy widzą tylko swoje dane
- Admini widzą wszystko
- Webhooks mogą zapisywać dane (session_feedback, session_transcripts)
