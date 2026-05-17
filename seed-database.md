# Standardowe uruchomienie

```bash
python seed_database.py
```

# Wyczyść wszystkie dane seed i wgraj od nowa (np. po zmianach w danych)

```bash
python seed_database.py --reset
```

# Wygeneruj więcej pacjentów i wizyt

```bash
python seed_database.py --patients 30 --past 100 --future 50
```

# Tylko sprawdź połączenie z bazą bez zapisu

```bash
python seed_database.py --dry-run
```
