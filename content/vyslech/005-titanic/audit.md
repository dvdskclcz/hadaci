# Validační audit spisu #005: Titanic 🚢🧊

Tento dokument slouží jako kontrolní simulace dotazování hráče v herním módu **Detektivní výslech**. Ověřuje, že znalostní báze v souboru `case.json` poskytuje spolehlivý podklad pro dichotomické odpovědi **ANO** nebo **NE** a že systém nikdy nesklouzne k neutrálnímu „Nelze ověřit“.

---

## Část 1: Simulace 10 kontrolních otázek (včetně chytáků)

### 1. „Existuje toto plavidlo dodnes na hladině moře v aktivním provozu?“
*(Základní časový a statusový chyták: loď byla slavná, ale dnes existuje pouze jako vrak na dně.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[8]` – *„V současnosti tato loď neexistuje jako plovoucí plavidlo, neslouží k dopravě a nelze se na ní plavit; její rozlomený vrak leží na dně oceánu v hloubce téměř 3 800 metrů.“* a `key_facts[10]` – *„Titanic DNES NEEXISTUJE jako funkční loď na hladině, nepluje po moři, nelze si na něj koupit lístek ani v něm přenocovat jako v hotelu.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 2. „Potopila se tato loď v Tichém oceánu?“
*(Geografický chyták: oceánské rozhraní.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[6]` – *„Místem zkázy byl severní Atlantský oceán (zhruba 600 kilometrů jihovýchodně od pobřeží kanadského ostrova Newfoundland).“* a `key_facts[6]` – *„Katastrofa se odehrála v severním Atlantském oceánu (NIKOLIV v Tichém, Indickém, Severním ledovém oceánu ani ve Středozemním moři).“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 3. „Šlo o válečnou loď, bitevní křižník nebo letadlovou loď?“
*(Funkční a typový chyták: civilní vs. vojenské plavidlo.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[2]` – *„...britský zaoceánský parník (transatlantickou linkovou loď pro přepravu cestujících a pošty).“* a `key_facts[1]` – *„Titanic NIKDY nebyl válečnou lodí, bitevním křižníkem, letadlovou lodí ani vojenským transportérem; šlo o čistě civilní linkovou loď.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 4. „Jednalo se o námořní loď nebo parník?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[2]` – *„Jedná se o námořní plavidlo, konkrétně britský zaoceánský parník...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 5. „Způsobil potopení lodi náraz do ledovce?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[4]` – *„Potopil se v noci ze 14. na 15. dubna 1912 během své první (panenské) plavby po srážce s ledovcem.“* a `key_facts[5]` – *„Bezprostřední příčinou potopení byla srážka s obřím ledovcem v neděli 14. dubna 1912 ve 23:40...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 6. „Stala se tato katastrofa v severním Atlantském oceánu?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[6]` – *„Místem zkázy byl severní Atlantský oceán...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 7. „Byla tato loď postavena ve 20. století?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[3]` – *„Byl postaven na počátku 20. století v loděnicích Harland & Wolff v Belfastu...“* a `key_facts[3]` – *„Stavba probíhala v letech 1909–1912, loď vyplula v dubnu 1912... (tedy na počátku 20. století).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 8. „Byl vrak této lodi někdy kompletně vyzvednut na hladinu?“
*(Technický a záchranný chyták: vyzvednutí vs. ponechání na dně.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `key_facts[14]` – *„Loď nebyla NIKDY vyzdvižena z mořského dna na hladinu; leží rozlomená na dvě hlavní části (příď a záď) vzdálené od sebe zhruba 600 metrů.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 9. „Leží vrak na dně oceánu v hloubce více než 3 000 metrů?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[8]` – *„...její rozlomený vrak leží na dně oceánu v hloubce téměř 3 800 metrů.“* a `key_facts[15]` – *„Trosky spočívají na oceánském dně v hloubce přibližně 3 800 metrů (3,8 kilometru) pod mořskou hladinou...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 10. „Byl o této lodi natočen slavný oscarový film Jamese Camerona?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `key_facts[17]` – *„V roce 1997 o něm režisér James Cameron natočil slavný stejnojmenný velkofilm (Titanic) s Leonardem DiCapriem a Kate Winslet, který získal 11 filmových Oscarů.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

---

## 🎯 Závěrečné vyhodnocení auditu
- Všech 10 kontrolních i chytákových otázek má jednoznačnou oporu v `case.json`.
- Negativní vymezení spolehlivě pokrývají nemožnost současného provozu na hladině, Atlantik vs. Pacifik, civilní vs. válečnou loď i setrvání vraku na dně.
- Spis je plně připraven pro synchronizaci do vektorové databáze a nasazení do ostré hry.

