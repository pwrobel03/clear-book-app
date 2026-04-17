## 🗺️ Plan Realizacji Projektu (Roadmap)

Projekt będzie realizowany zgodnie z poniższym harmonogramem prac.

### Etap 1: Inicjalizacja środowiska i szkielet aplikacji
* **Backend:** Utworzenie bazowego projektu w Spring Boot (Java) z wykorzystaniem Spring Initializr (zależności m.in.: Spring Web, Spring Data JPA, PostgreSQL Driver).
* **Frontend:** Inicjalizacja projektu w Next.js (React) z podstawowym routingiem.
* **Baza danych:** Postawienie lokalnej instancji PostgreSQL (np. z wykorzystaniem Docker Compose) i nawiązanie połączenia z aplikacją Spring Boot.

### Etap 2: System autoryzacji i zarządzanie użytkownikami (Fundament)
* Zaprojektowanie modelu danych dla użytkowników (Encje JPA: `User`, `Role`).
* Konfiguracja **Spring Security** na backendzie.
* Implementacja bezstanowego uwierzytelniania opartego na tokenach **JWT (JSON Web Token)**.
* Stworzenie końcówek API (endpoints) do logowania i rejestracji.
* Implementacja formularzy logowania/rejestracji na frontendzie (Next.js) oraz bezpieczne przechowywanie sesji (tokenów JWT) po stronie klienta.

### Etap 3: Implementacja domeny biznesowej i prostych operacji CRUD
* Stworzenie modeli JPA dla głównych encji: `Doctor`, `Specialization`, `Review` (Opinia).
* Przygotowanie relacji pomiędzy tabelami w bazie danych (np. *One-to-Many*, *Many-to-Many*).
* Wystawienie punktów końcowych REST API do zarządzania tymi zasobami (dodawanie specjalizacji, przeglądanie profilu lekarza, dodawanie i edycja opinii).

### Etap 4: Mechanizm kalendarza i rezerwacji (Przetwarzanie transakcyjne)
* Projekt struktury danych dla kalendarza lekarza (`AvailabilitySlot`) oraz samej wizyty (`Appointment`).
* **Implementacja kluczowej logiki transakcyjnej:** Zabezpieczenie procesu rezerwacji wizyty przed zjawiskiem *race condition*. Zastosowanie mechanizmów izolacji transakcji oraz blokad (*Optimistic/Pessimistic Locking*) na poziomie bazy PostgreSQL.
* Integracja rezerwacji na frontendzie w Next.js.

### Etap 5: Raportowanie i złożone zapytania SQL
* Stworzenie niestandardowych zapytań (np. przy użyciu adnotacji `@Query` w Spring Data JPA lub natywnych zapytań SQL).
* Wygenerowanie raportów: ranking lekarzy, statystyki obciążenia specjalizacji, średnie oceny.
* Wyświetlenie danych w panelu Administratora na frontendzie.

### Etap 6: Weryfikacja kont lekarzy i finalizacja
* Implementacja logiki zmiany statusów kont lekarzy przez administratora.
* Finalne testy integracyjne sprawdzające poprawność działania bazy danych pod obciążeniem współbieżnym.
* Dopracowanie interfejsu graficznego (UI).