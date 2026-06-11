# ClearBook – instrukcja uruchomienia skryptu seed

## Wymagania

```bash
pip install psycopg2-binary bcrypt python-dotenv
```

Skrypt automatycznie wczytuje zmienne z `api/.env` (lub `.env` w katalogu projektu).
Jeśli `python-dotenv` nie jest zainstalowany, należy przekazać zmienne ręcznie:

```bash
DB_NAME=clearbook DB_USER=clearbook_user DB_PASSWORD=haslo python seed_database.py
```

---

## Uruchomienie standardowe

```bash
python seed_database.py
```

Domyślnie: 80 lekarzy, 200 pacjentów, 7–10 wizyt/pacjent, **8 tygodni do przodu**, 4 tygodnie wstecz.

## Wyczyść dane i wgraj od nowa

```bash
python seed_database.py --reset
```

## Kontrola okna kalendarza

```bash
# 12 tygodni do przodu (idealnie do demonstracji)
python seed_database.py --future-weeks 12

# 6 tygodni wstecz (więcej danych historycznych)
python seed_database.py --past-weeks 6 --future-weeks 8
```

## Skala danych

```bash
# Mniejszy zestaw – szybki test lokalny
python seed_database.py --patients 30 --doctors 20

# Większy zestaw – demo/prezentacja
python seed_database.py --patients 500 --doctors 120 --future-weeks 10
```

## Liczba wizyt na pacjenta

```bash
python seed_database.py --min-appts 5 --max-appts 8
```

## Tylko sprawdź połączenie (bez zapisu)

```bash
python seed_database.py --dry-run
```

---

## Wszystkie parametry

| Parametr | Domyślna | Opis |
|---|---|---|
| `--doctors N` | 80 | Liczba lekarzy do wygenerowania |
| `--patients N` | 200 | Liczba pacjentów |
| `--min-appts N` | 7 | Min. wizyt na pacjenta |
| `--max-appts N` | 10 | Max. wizyt na pacjenta |
| `--past-weeks N` | 4 | Tygodnie wstecz (dane historyczne) |
| `--future-weeks N` | 8 | Tygodnie do przodu (widoczny kalendarz) |
| `--reset` | — | Usuń poprzednie dane seed przed wstawieniem |
| `--dry-run` | — | Tylko test połączenia, bez zapisu |
