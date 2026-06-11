# ClearBook — System Rezerwacji Wizyt Lekarskich

> Platforma umożliwiająca pacjentom wyszukiwanie lekarzy i rezerwację wizyt, a lekarzom zarządzanie terminarzem w wielu placówkach.

**Stack:** Next.js · Spring Boot · PostgreSQL · Docker

---

## Autorzy

- Piotr Wróbel
- Bartosz Kozyra

Poniedziałek, 16:45, tygodnie parzyste
Gr. 21

Dostępne pod adresem: https://clearbook.wrobeldev.cloud/

> Szcze©óły dotyczące testowania aplikacji można znaleźć w dalszej część dokumentu

---

## Cel projektu

Celem projektu jest stworzenie aplikacji bazodanowej umożliwiającej pacjentom wyszukiwanie lekarzy, rezerwację wizyt oraz wystawianie opinii. Aplikacja demonstruje zaawansowane operacje bazodanowe, w tym kontrolę współbieżności, zarządzanie transakcjami oraz złożone zapytania raportujące.

## Wykorzystane technologie

- **Baza danych:** PostgreSQL
- **Backend:** Java (np. Spring Boot, Hibernate/JPA)
- **Frontend:** Next.js (React)

---

## Uruchomienie lokalne

### Wymagania

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.x
- Git

### Linux / macOS

```bash
git clone <url-repozytorium>
cd clear-book-app
chmod +x setup.sh && ./setup.sh
```

Skrypt automatycznie:

1. Tworzy `.env` z szablonu `.env.example`
2. Generuje losowy `JWT_SECRET`
3. Buduje i uruchamia kontenery

### Windows (PowerShell)

```powershell
git clone <url-repozytorium>
cd clear-book-app
cp .env.example .env
# Otwórz .env i ustaw JWT_SECRET (np. wynik: openssl rand -hex 64)
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up --build
```

### Dostęp po uruchomieniu

| Serwis      | URL                   | Opis                                                      |
| ----------- | --------------------- | --------------------------------------------------------- |
| Aplikacja   | http://localhost:3000 | Next.js frontend                                          |
| Backend API | http://localhost:8080 | Spring Boot REST                                          |
| MailHog     | http://localhost:8025 | Przechwytuje wszystkie e-maile (weryfikacja, reset hasła) |

> **Email lokalnie:** Nie potrzebujesz konta Gmail. Wszystkie e-maile wysyłane przez backend trafiają do MailHog — otwórz http://localhost:8025, żeby je zobaczyć.

### Skróty Makefile

```bash
make dev          # uruchom w tle (--build)
make down         # zatrzymaj kontenery
make logs         # śledź logi wszystkich serwisów
make logs-backend # tylko backend
make db           # psql shell w PostgreSQL
make clean        # pełny reset (kontenery + obrazy + wolumeny)
make help         # lista wszystkich komend
```

### Konta testowe

| Rola          | Email                  | Hasło       |
| :------------ | :--------------------- | :---------- |
| Admin systemu | admin@clearbook.com    | Admin123!   |
| Pacjent       | patient@clearbook.com  | Patient123! |
| Lekarz        | doctor@clearbook.com   | Doctor123!  |
| Admin systemu | bkozyra@clearbook.com  | Demo1234!   |
| Pacjent       | rmarcjan@clearbook.com | Demo1234!   |
| Lekarz        | pwrobel@clearbook.com  | Demo1234!   |

---

## Zasilenie bazy danych (seed)

Po uruchomieniu kontenerów baza danych zawiera tylko konta testowe z tabeli powyżej. Skrypt Python generuje realistyczne dane demo: lekarzy, pacjentów, wizyty, opinie i terminarze.

### Wymagania

Python 3.8+ oraz zależności:

```bash
pip install -r requirements.txt
```

### Uruchomienie

```bash
# Domyślne (80 lekarzy, 200 pacjentów, 7–10 wizyt/pacjent)
python seed_database.py

# lub przez Makefile
make seed
```

Skrypt automatycznie wczytuje `.env` z katalogu projektu — nie musisz nic konfigurować. Port `5432` jest eksponowany lokalnie w `docker-compose.dev.yaml`, więc skrypt łączy się bezpośrednio z kontenerem PostgreSQL przez `localhost:5432`.

### Przydatne warianty

```bash
# Wyczyść poprzednie dane demo i wgraj od nowa
python seed_database.py --reset
make seed-reset

# Mały zestaw — szybki test lokalny
python seed_database.py --patients 30 --doctors 20

# Duży zestaw — demo / prezentacja
python seed_database.py --patients 500 --doctors 120 --future-weeks 10

# Dłuższe okno kalendarza (sloty widoczne dalej w przyszłość)
python seed_database.py --future-weeks 12

# Tylko sprawdź połączenie (bez zapisu do bazy)
python seed_database.py --dry-run
```

### Wszystkie parametry

| Parametr           | Domyślna | Opis                                                 |
| ------------------ | -------- | ---------------------------------------------------- |
| `--doctors N`      | 80       | Liczba lekarzy                                       |
| `--patients N`     | 200      | Liczba pacjentów                                     |
| `--min-appts N`    | 7        | Min. wizyt na pacjenta                               |
| `--max-appts N`    | 10       | Max. wizyt na pacjenta                               |
| `--past-weeks N`   | 4        | Tygodnie wstecz (historia)                           |
| `--future-weeks N` | 8        | Tygodnie do przodu (kalendarz)                       |
| `--reset`          | —        | Usuń poprzednie dane demo przed wstawieniem          |
| `--full-reset`     | —        | Usuń WSZYSTKIE dane (poza stałymi kontami testowymi) |
| `--dry-run`        | —        | Tylko test połączenia, bez zapisu                    |

---

## Aktorzy w systemie i ich funkcjonalności

System zakłada istnienie trzech ról z różnymi poziomami uprawnień:

1. **Pacjent (User):**
   - Logowanie i rejestracja.
   - Wyszukiwanie lekarzy (np. po specjalizacji) i przeglądanie ich **dedykowanych podstron profilowych** (gdzie wyświetlają się dane lekarza, wystawione mu opinie oraz jego kalendarz).
   - Rezerwacja dostępnego terminu wizyty z poziomu kalendarza lekarza.
   - Przegląd zaplanowanych oraz odbytych wizyt.
   - Anulowanie zaplanowanej wizyty.
   - Wystawianie ocen i opinii po odbytej wizycie.

2. **Lekarz (Doctor):**
   - Rejestracja poprzez dedykowany formularz zgłoszeniowy (wymaga weryfikacji – nowo utworzone konto ma status nieaktywny/oczekujący).
   - Logowanie do profilu (po zatwierdzeniu przez administratora).
   - Zarządzanie własnym kalendarzem (definiowanie przedziałów czasowych, w których przyjmuje pacjentów).
   - Podgląd zaplanowanych wizyt.

3. **Administrator (Admin):**
   - **Weryfikacja i aktywacja kont lekarzy** zgłoszonych przez formularz rejestracyjny.
   - Zarządzanie słownikami w systemie (np. dodawanie nowych specjalizacji lekarskich).
   - Moderacja opinii i zarządzanie użytkownikami.

## Realizacja wymagań projektowych

### 1. Proste operacje CRUD

Aplikacja w wielu miejscach wykorzystuje standardowe operacje:

- **Create/Read/Update:** Formularz zgłoszeniowy lekarza (Create), wyświetlenie listy oczekujących przez Admina (Read), zmiana statusu konta na "Aktywne" (Update).
- **Create/Delete:** Dodawanie i anulowanie slotów w kalendarzu przez lekarza.
- **Create/Update/Delete:** Zarządzanie opiniami przez pacjentów i administratora.

### 2. Przetwarzanie transakcyjne i kontrola współbieżności (Kluczowy element)

Najbardziej krytycznym punktem systemu jest **rezerwacja wizyty przez pacjenta**.

- **Problem:** Możliwość wystąpienia zjawiska _race condition_ (wyścigu) – dwóch pacjentów próbuje zarezerwować ten sam termin wizyty u tego samego lekarza w ułamku sekundy z poziomu podstrony lekarza.
- **Rozwiązanie:** Operacja rezerwacji zostanie zamknięta w transakcji bazodanowej. Wykorzystany zostanie mechanizm blokowania (np. _Optimistic Locking_ z wykorzystaniem wersjonowania rekordów lub _Pessimistic Locking_ na poziomie bazy danych w PostgreSQL za pomocą zapytania `SELECT ... FOR UPDATE`). Zapewni to spójność danych i uniemożliwi podwójną rezerwację tego samego slotu czasowego.

### 3. Operacje o charakterze raportującym i złożone zapytania

System udostępni końcówki API realizujące złożone zapytania (wykorzystujące instrukcje `JOIN`, `GROUP BY`, funkcje agregujące):

- **Profil Lekarza:** Zapytanie złączające tabele (Lekarz, Specjalizacje, Opinie, Kalendarz) w celu zaserwowania wszystkich niezbędnych danych dla frontendu na dedykowanej podstronie lekarza.
- **Ranking lekarzy:** Zapytanie wyliczające średnią ocenę (`AVG`) oraz liczbę odbytych wizyt (`COUNT`), z możliwością filtrowania po specjalizacji.
- **Statystyki dla Admina:** Raport pokazujący obciążenie poszczególnych specjalizacji (np. liczba wizyt w danym miesiącu w rozbiciu na specjalizacje).

---
