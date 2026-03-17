# System Rezerwacji Wizyt Lekarskich
---
# 👷🏻 Autorzy

* Piotr Wróbel
* Bartosz Kozyra

---
## 📖 Cel projektu
Celem projektu jest stworzenie aplikacji bazodanowej umożliwiającej pacjentom wyszukiwanie lekarzy, rezerwację wizyt oraz wystawianie opinii. Aplikacja demonstruje zaawansowane operacje bazodanowe, w tym kontrolę współbieżności, zarządzanie transakcjami oraz złożone zapytania raportujące.

## 🛠 Wykorzystane technologie
* **Baza danych:** PostgreSQL
* **Backend:** Java (np. Spring Boot, Hibernate/JPA)
* **Frontend:** Next.js (React)

## 👥 Aktorzy w systemie i ich funkcjonalności
System zakłada istnienie trzech ról z różnymi poziomami uprawnień:

1. **Pacjent (User):**
   * Logowanie i rejestracja.
   * Wyszukiwanie lekarzy (np. po specjalizacji) i przeglądanie ich **dedykowanych podstron profilowych** (gdzie wyświetlają się dane lekarza, wystawione mu opinie oraz jego kalendarz).
   * Rezerwacja dostępnego terminu wizyty z poziomu kalendarza lekarza.
   * Przegląd zaplanowanych oraz odbytych wizyt.
   * Anulowanie zaplanowanej wizyty.
   * Wystawianie ocen i opinii po odbytej wizycie.

2. **Lekarz (Doctor):**
   * Rejestracja poprzez dedykowany formularz zgłoszeniowy (wymaga weryfikacji – nowo utworzone konto ma status nieaktywny/oczekujący).
   * Logowanie do profilu (po zatwierdzeniu przez administratora).
   * Zarządzanie własnym kalendarzem (definiowanie przedziałów czasowych, w których przyjmuje pacjentów).
   * Podgląd zaplanowanych wizyt.

3. **Administrator (Admin):**
   * **Weryfikacja i aktywacja kont lekarzy** zgłoszonych przez formularz rejestracyjny.
   * Zarządzanie słownikami w systemie (np. dodawanie nowych specjalizacji lekarskich).
   * Moderacja opinii i zarządzanie użytkownikami.

## 🎯 Realizacja wymagań projektowych

### 1. Proste operacje CRUD
Aplikacja w wielu miejscach wykorzystuje standardowe operacje:
* **Create/Read/Update:** Formularz zgłoszeniowy lekarza (Create), wyświetlenie listy oczekujących przez Admina (Read), zmiana statusu konta na "Aktywne" (Update).
* **Create/Delete:** Dodawanie i anulowanie slotów w kalendarzu przez lekarza.
* **Create/Update/Delete:** Zarządzanie opiniami przez pacjentów i administratora.

### 2. Przetwarzanie transakcyjne i kontrola współbieżności (Kluczowy element)
Najbardziej krytycznym punktem systemu jest **rezerwacja wizyty przez pacjenta**.
* **Problem:** Możliwość wystąpienia zjawiska *race condition* (wyścigu) – dwóch pacjentów próbuje zarezerwować ten sam termin wizyty u tego samego lekarza w ułamku sekundy z poziomu podstrony lekarza.
* **Rozwiązanie:** Operacja rezerwacji zostanie zamknięta w transakcji bazodanowej. Wykorzystany zostanie mechanizm blokowania (np. *Optimistic Locking* z wykorzystaniem wersjonowania rekordów lub *Pessimistic Locking* na poziomie bazy danych w PostgreSQL za pomocą zapytania `SELECT ... FOR UPDATE`). Zapewni to spójność danych i uniemożliwi podwójną rezerwację tego samego slotu czasowego.

### 3. Operacje o charakterze raportującym i złożone zapytania
System udostępni końcówki API realizujące złożone zapytania (wykorzystujące instrukcje `JOIN`, `GROUP BY`, funkcje agregujące):
* **Profil Lekarza:** Zapytanie złączające tabele (Lekarz, Specjalizacje, Opinie, Kalendarz) w celu zaserwowania wszystkich niezbędnych danych dla frontendu na dedykowanej podstronie lekarza.
* **Ranking lekarzy:** Zapytanie wyliczające średnią ocenę (`AVG`) oraz liczbę odbytych wizyt (`COUNT`), z możliwością filtrowania po specjalizacji.
* **Statystyki dla Admina:** Raport pokazujący obciążenie poszczególnych specjalizacji (np. liczba wizyt w danym miesiącu w rozbiciu na specjalizacje).
