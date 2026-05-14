# Pełna Dokumentacja Scenariuszy Testowych

Poniżej znajduje się krótki opis wszystkich 88 testów integracyjnych, zgrupowanych według tabel/obszarów, które sprawdzają. Opisy skupiają się na logice biznesowej oraz mechanizmach ochrony danych (jak współbieżność, Copy-on-Write, czy UPSERT).

---

## 1. Tabela: `appointments` (Wizyty i Rezerwacje) - 16 testów

_Najbardziej newralgiczna tabela. Testuje maszynę stanów wizyty oraz bezpieczeństwo rezerwacji w czasie rzeczywistym._

**Współbieżność (Pessimistic Locking)**

1. **shouldPreventDoubleBookingUnderConcurrentLoad** – Udowadnia poprawne działanie blokady bazodanowej. Spośród 10 pacjentów klikających rezerwację w tej samej milisekundzie, tylko jeden otrzymuje termin, reszta dostaje komunikat o zajętym oknie.

**Rezerwacja Terminu (ReserveSlot)** -

2. **happyPath** – Odkłada w czasie "miękką" rezerwację (`RESERVED`) nakładając 15-minutową ochronę na dany termin.
3. **pastTime_throws** – Odrzuca próbę zapisania wizyty z datą wsteczną.
4. **outsideBlockBounds_throws** – Weryfikuje, czy system odrzuci pacjenta próbującego zapisać się poza zadeklarowanymi godzinami pracy lekarza.
5. **doubleBooking_throws** – Tradycyjna obrona przed podwójnym bukowaniem w ramach jednego wątku.

**Potwierdzanie Wizyty (ConfirmAppointment)**

6. **happyPath** – Zmienia wizytę z `RESERVED` na `SCHEDULED` po dodaniu notatek od pacjenta.
7. **expiredReservation_throws** – Blokuje proces zatwierdzania, jeśli 15-minutowy czas na decyzję właśnie upłynął.
8. **wrongPatient_throws** – Bezpieczeństwo: blokuje przejęcie rezerwacji przez innego pacjenta.

**Anulowanie przez Pacjenta (CancelAppointmentByPatient)**

9. **happyPath** – Pacjent z sukcesem anuluje swoją wizytę (zmienia status na `CANCELLED`).
10. **wrongPatient_throws** – Odcina możliwość odwołania cudzej wizyty. 11. **wrongStatus_throws** – Zapobiega anulowaniu wizyty historycznej (zakończonej - `COMPLETED`).

**Anulowanie przez Lekarza (CancelAppointmentByDoctor)**

12. **happyPath** – Lekarz odwołuje wizytę wraz ze wstawieniem oficjalnej notatki o powodzie (zapis do bazy powiadomień e-mail).
13. **wrongDoctor_throws** – Odcina dostęp lekarzowi próbującemu edytować kalendarz swojego kolegi.

**Oznaczanie Nieobecności (MarkAsNoShow)**

14. **happyPath** – Przypisuje status `NO_SHOW` pacjentowi, który nie stawił się na wizycie.
15. **beforeStart_throws** – Zabrania uznania pacjenta za nieobecnego, zanim wizyta w ogóle się rozpoczęła.
16. **windowExpired_throws** – Restrykcja bazodanowa: nieobecność można "wbić" tylko przez 15 minut od ustalonego czasu startu wizyty.

---

## 2. Tabela: `availability_blocks` (Grafiki Lekarzy) - 13 testów

_Sprawdza w jakich ramach czasowych dozwolone jest przyjmowanie pacjentów oraz kaskadowe zmiany harmonogramów._

**Tworzenie Bloku Pracy (CreateWorkingBlock)**

17. **happyPath** – Zapisuje na stałe do bazy poprawny układ godzin pracy dla lekarza.
18. **overlap_throws** – Pilnuje, by lekarz nie założył bloku "od 10 do 12", jeśli ma już inny blok "od 9 do 11" (wykrywanie nakładania się).
19. **pastTime_throws** – Blokuje generowanie grafiku wstecz.

**Usuwanie Bloku (DeleteWorkingBlock)**

20. **happyPath_cancelsAppointments** – Testuje kaskadę: po usunięciu bloku, baza z automatu zwalnia i ustawia jako `CANCELLED` przypisane do niego wizyty na dany dzień.
21. **completedAppointment_notAffected** – Inteligentne usuwanie grafiku: usuwając stary blok, system omija i zachowuje historyczne wizyty (`COMPLETED`) na potrzeby archiwum.
22. **wrongDoctor_throws** – Odrzuca próby skasowania zmian innych lekarzy.

**Edycja Czasu Pracy (UpdateWorkingBlockTime - Safe Shrink)**

23. **safeShrink_cancelsOutOfBoundsAppointments** – Jeśli lekarz nagle skraca dyżur (np. wyjdzie o 14:00, zamiast o 16:00), test sprawdza czy system wyrzuci pacjentów z przedziału 14:00-16:00.
24. **appointmentStillFits_isPreserved** – Ciąg dalszy "Safe Shrink" – gwarantuje, że przy obcięciu godzin, pacjenci umówieni np. na 11:00 pozostaną w pełni nienaruszeni.
25. **overlap_throws** – Zabezpiecza bazę przed "rozciągnięciem" bloku tak, by kolidował z ewentualnym dyżurem wieczornym.

**Szablony Tygodniowe i Czyszczenie (Bulk Operations)**

26. **happyPath (CopyWeek)** – Sprawdza wydajność i poprawność generowania powtarzalnych dyżurów.
27. **emptySourceWeek_throws** – Zabezpieczenie przed próbą "skopiowania pustki".
28. **happyPath (Clear)** – Szybkie niszczenie masy rekordów grafiku i przyległych do nich wizyt (funkcja "Wyczyść tydzień").
29. **emptyRange_returnsZero** – Weryfikuje prawidłowe zliczenia usuniętych rekordów w obszarze bez danych.

---

## 3. Tabele: `medical_centers` & `center_memberships` (Placówki) - 16 testów

_Testy relacyjne, autoryzacja Role-Based-Access, bezpieczeństwo pomiędzy placówkami a personelem._

**Operacje Podstawowe (MedicalCenter)**

30. **shouldExecuteFullCrudCycle** – Waliduje bazowe operacje SQL: utworzenie, pobranie, edycja (UPDATE) i permanentne zniszczenie kliniki.

**System Zaproszeń (InviteByCode)**

31. **happyPath** – Wiąże tabelę InviteCodes z Membership (tworzy wpis typu `INVITED` w wybranej klinice).
32. **nonAdmin_throws** – Zapobiega rekrutowaniu znajomych przez lekarza niebędącego adminem przychodni.
33. **invalidCode_throws** – Odrzuca przetworzenie fałszywego lub zużytego już kodu zaproszenia.
34. **alreadyActiveMember_throws** – Blokuje ponowną inwitację pracownika figurującego już w bazie.
35. **renewAfterRejection** – Wyłapuje sytuację biznesową, gdzie lekarz odrzucił ofertę i zmienia jego wiersz bazodanowy tak, by umożliwić ponowne wysłanie zaproszenia.

**Reakcja na Zaproszenie (InvitationResponse)**

36. **accept_happyPath** – Lekarz staje się pełnoprawnym członkiem zespołu (`ACTIVE`) – pojawia się na liście wyszukiwań placówki.
37. **accept_wrongUser_throws** – Blokuje "włamanie" do placówki ze strony innej osoby za pomocą cudzego ID zaproszenia.
38. **accept_notPending_throws** – Próba podwójnej akceptacji kończy się błędem.
39. **reject_happyPath** – Odkłada ofertę do archiwum pod statusem `REJECTED`.

**Zarządzanie Personelem (List & Remove)**

40. **returnsOnlyActiveMembers** – Filtracja zapytań: test filtrujący (zaproszeni i usunięci są pomijani w zestawieniu).
41. **happyPath (Remove)** – Zmienia flagę zatrudnienia na "Miękkie Usunięcie" (`SUSPENDED`).
42. **doctorRemoval_cancelsFutureAppointments** – Ważna Kaskada: zwalniając lekarza w konkretnej klinice, test gwarantuje odcięcie (anulowanie) tylko przyszłych wizyt i usunięcie bloków dostępności dla TEJ JEDNEJ konkretnej lokalizacji.
43. **removeSelf_throws** – Ochrona logiki biznesowej, by dyrektor nie zwolnił sam siebie.
44. **nonAdmin_throws** – Zabrania zwolnienia lekarza przez pracownika równego z nim rangą.

---

## 4. Tabela: `doctor_profiles` (Wyszukiwarka i Dostęp) - 10 testów

_Sprawdza kto i z jakiego poziomu zabezpieczeń ma wgląd w dane wrażliwe (certyfikaty, niejawne opisy)._

**Dostęp Publiczny (Unauthenticated)**

45. **happyPath** – Pobiera zweryfikowany profil, dostępny dla całej sieci bez nagłówków JWT.
46. **privateProfile_throws** – Blokada `404 Not Found`, jeśli lekarz nie przeszedł jeszcze audytu licencji (profil ukryty).
47. **unknownId_throws** – Test ochrony zasobów na błędne ID.

**Dostęp z Zezwoleniem Celowym (With Requester Context)**

48. **publicProfile_anyUser_succeeds** – Potwierdza, że logowanie nie psuje ścieżki publicznej.
49. **privateProfile_adminInSharedCenter_succeeds** – Test złożonego złączenia (`JOIN`). Pozwala adminowi z placówki "A" na podgląd konta ("PENDING") lekarza z tejże samej placówki "A", by móc obejrzeć wgrany przez niego skan dyplomu!
50. **privateProfile_memberNotAdmin_throws** – Udowadnia, że koledzy z pracy nie mają podglądu w dokumenty nowego współpracownika (wymagana rola ADMIN w danej klinice).
51. **privateProfile_noSharedCenter_throws** – Ślepa weryfikacja. Nie zezwala dyrektorowi kliniki na inwigilowanie prywatnego profilu lekarza, który nigdy nie dostał do jego placówki zaproszenia.
52. **privateProfile_nullRequester_throws** – Czysta tarcza (Fallback), obrona profilu przed włamaniem od strony API.

**Ośrodki Powiązane (AffiliatedCenters)** 53. **happyPath** – Ładuje z bazy obiekty powiązane `MedicalCenter` dla wybranego lekarza. 54. **noMemberships_returnsEmpty** – Zachowanie aplikacji w razie pustych list zwracanych z relacji bazy.

---

## 5. Tabela: `appointment_reviews` (Recenzje) - 15 testów

_System agregujący wskaźniki reputacyjne oraz blokujący oszustwa ("Farmy opinii")._

**Zapisywanie Opinii (CreateReview)**

55. **happyPath** – Bezpieczne wstawienie wiersza z oceną gwiazdkową 1-5 oraz komentarzem.
56. **anonymous_hidesPatientName** – W warstwie DTO odcina prawdziwe nazwisko przed wystawieniem rekordu na zewnątrz ("Anonymous").
57. **wrongPatient_throws** – Obrona API przed sfałszowaniem tożsamości oceniającego.
58. **notCompleted_throws** – Zabrania opinii dla anulowanych wizyt lub wizyt jeszcze niezrealizowanych (status walidacyjny).
59. **duplicate_throws** – Wyjątek unikalnego klucza zapobiega dodawaniu kilku opinii dla tej samej, unikalnej wizyty bazowej.

**Edycja / Usuwanie (Update / Delete)**

60. **happyPath (Update)** – Modyfikacja własnej oceny i opisówki bez duplikacji rekordu.
61. **wrongPatient_throws (Update)** – Brak modyfikacji cudzego komentarza.
62. **happyPath (Delete)** – Fizyczne wyrzucenie wiersza relacyjnego (Tabela Review).
63. **wrongPatient_throws (Delete)** – Chroni komentarz przed usunięciem przez intruza.

**Prawa Lekarza (DoctorReply)**

64. **reply_happyPath** – Rejestruje odpowiedź lekarza do komentarza.
65. **reply_wrongDoctor_throws** – Uniemożliwia odpowiadanie lekarzom innym niż ten, który uczestniczył w rzeczonej wizycie.
66. **deleteReply_clearsReply** – Czyści odpowiedź lekarską na `NULL` podczas zachowania samego komentarza pacjenta.
67. **happyPath (GetByPublicId)** – Wydobycie opinii dla całego profilu poprzez odpytanie sortowane czasowo malejąco.
68. **noReviews_returnsEmpty** – Obsługa braku danych dla nowego profilu.

**Zdarzenia Asynchroniczne po Transakcji (TransactionPhase.AFTER_COMMIT)**

69. **statsAreUpdatedAfterReview** – Udowadnia architekturę "Eventual Consistency". Dopiero kiedy opinia bezpiecznie osiądzie w relacyjnej bazie, w tle aktywuje się wątek przeliczający na nowo średnią oraz licznik recenzji `averageRating`, uaktualniając dane `doctor_profiles`. W ten sposób nie obciąża się klienta-pacjenta.

---

## 6. Tabela: `doctor_services` (Katalog Usług) - 7 testów

_Mechanizmy Copy-on-Write ukrywające modyfikacje przeszłości dla spójności fakturowej._

70. **happyPath (CreateService)** – Poprawnie ładuje do tablicy obiektów nową wizytę o wskazanym czasie trwania i cenie.
71. **inPlace_whenNoAppointments (Update)** – Wykorzystuje optymalny, szybki `UPDATE` prosto na oryginalnym wierszu (z racji, że nikt jeszcze nie zapisał się na ten cennik, modyfikacje nie niszczą relacji).
72. **copyOnWrite_whenAppointmentsExist (Update)** – Krytyczny test integralności wstecznej! Udowadnia, że w przypadku istnienia zrealizowanych wizyt z określonym cennikiem, modyfikacja usługi skutkuje ukryciem jej ("soft delete") i podpięciem nowej o identycznej strukturze (ale np. wyższej cenie) do nowych wizyt pacjentów.
73. **wrongDoctor_throws (Update)** – Gwarantuje niezależność edycji własnego cennika usług.
74. **happyPath (Deactivate)** – Poprawnie flaguje parametr usługi na stan wyłączony (nie będzie widziana w kalendarzu przy nowych rezerwacjach).
75. **withLinkedAppointments_stillDeactivates** – Udowadnia, że stary katalog deaktywuje się z powodzeniem bez psucia wcześniejszej bazy (unikając wyjątku referencyjnego `ForeignKeyConstraintViolation`).
76. **wrongDoctor_throws (Deactivate)** – Blokowanie obcego zapytania.

---

## 7. Tabela: `invite_codes` (Kody Zaproszeń) - 8 testów

_Stosuje metody `UPSERT` minimalizujące zacięcia podczas aktualizowania małych, newralgicznych rekordów._

77. **createsNewCode** – Sprawdza spójność logiki matematycznej i bazy przy pierwszej iniekcji kodu (CB-XXXX-XXXX).
78. **returnsExistingValidCode** – Sprawdza czy kod nie ulegnie przedawnieniu jeśli API wysyła żądanie generowania dla osoby już wyposażonej w kod aktywny.
79. **renewsExpiredCode (UPSERT)** – Ujawnia, że zamiast `DELETE -> INSERT`, aplikacja modyfikuje kod za pomocą `UPDATE`, jeśli ten stracił już datę ważności (oszczędza zasoby DB).
80. **updatesRecordInPlace** – "Zmuś do wygenerowania nowego": test wymuszenia nowego kodu. Utrzymuje klucz główny (ID wiersza), by nie łamać w locie unikalności.
81. **createsWhenNoneExists** – Zachowanie rezerwowe - brak usterki przy żądaniu przymusowym jeśli zapisu jeszcze nie było w ogóle.
82. **happyPath (ResolveUser)** – Pobranie użytkownika (wiersza z User) do którego należy dostarczony String.
83. **expiredCode_returnsEmpty** – Logika biznesowa - przeterminowany string nie mapuje na konto.
84. **unknownCode_returnsEmpty** – Błędny (przypadkowy) ciąg zwraca bezpieczne "pusto".

---

## 8. Tabela: `refresh_tokens` (Sesje - Bezpieczeństwo) - 3 testy

_Testuje obronę bazy danych pod kątem sesji przechwyconych / wygasłych._

85. **shouldCreateAndRotateToken** – Udowadnia, że cykl "Rotacji" jest poprawny w bazie: wstawiany jest nowy token, a jego bezpośredni protoplasta oznacza się statusem odwołania (revoked).
86. **shouldDetectTheftAndWipeAllSessions** – Weryfikuje mechanizm "Theft Detection". Test wysyła zużyty token (udając hakera przejmującego cookie). Aplikacja nie tylko tego odmawia, ale prewencyjnie wyszukuje _wszystkie aktywne tokeny przypisane do tego samego pacjenta i bezpowrotnie zamyka mu wszystkie sesje_ w DB!
87. **shouldRejectExpiredToken** – Nie przepuszcza użytkownika logującego się kluczem o starszym Timestampie.

---

## 9. Środowisko i Kontekst - 1 test

88. **contextLoads** – Bazowy test Spring Boot ładujący pełen kontekst aplikacji i potwierdzający udane zintegrowanie pustego silnika PostgreSQL we frameworku Testcontainers.
