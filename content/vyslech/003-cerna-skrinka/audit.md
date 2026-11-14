# Validační audit spisu #003: Černá skříňka 📦🔎

Tento dokument slouží jako kontrolní simulace dotazování hráče v herním módu **Detektivní výslech**. Ověřuje, že znalostní báze v souboru `case.json` poskytuje jednoznačný podklad pro dichotomické odpovědi **ANO** nebo **NE** a že systém nikdy nesklouzne k neutrálnímu „Nelze ověřit“.

---

## Část 1: Simulace 10 typických rozřazovacích otázek

### 1. „Hledáme reálný fyzický předmět?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[0]` – *„Hledaná entita je skutečný fyzický předmět a technické elektronické zařízení (nikoliv živá bytost, fiktivní věc ani abstraktní myšlenka).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 2. „Jedná se o živého tvora nebo rostlinu?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[0]` – *„...nikoliv živá bytost, fiktivní věc ani abstraktní myšlenka...“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 3. „Používá se tento předmět v dopravě, konkrétně v letectví?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[2]` – *„Tento předmět se primárně používá v letectví (na palubách dopravních i vojenských letadel a vrtulníků).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 4. „Slouží toto zařízení k ukládání záznamů a dat?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[1]` – *„Jedná se o záznamový přístroj určený k uchovávání provozních dat a zvukových nahrávek.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 5. „Dá se toto zařízení běžně koupit v elektru pro domácí použití?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[6]` – *„Není to běžný spotřební produkt a nelze jej zakoupit v běžném obchodě s elektronikou.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 6. „Slouží k vyšetřování příčin nehod a havárií?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[7]` & `key_facts[17]` – *„Jeho hlavním posláním je objasnění příčin leteckých havárií a incidentů...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 7. „Je toto zařízení umístěno v přední části letadla před piloty?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[3]` & `key_facts[9]` – *„Černá skříňka NENÍ umístěna v přídi letadla ani přímo v pilotní kabině; standardně se montuje do ocasní části letadla...“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 8. „Odolá toto zařízení extrémnímu žáru, požáru a nárazu?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[5]` & `key_facts[6]` – *„Skříňka musí vydržet přímý žár o teplotě 1 100 °C po dobu minimálně jedné hodiny...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 9. „Vysílá pod vodou signál pro své nalezení?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[8]` & `key_facts[12]` – *„Podvodní akustický lokátor (pinger) se aktivuje ihned po kontaktu s vodou a vysílá pravidelný ultrazvukový impuls na frekvenci 37,5 kHz...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 10. „Skládá se ze zapisovače letových údajů a hlasového záznamníku?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[4]` & `key_facts[2]` – *„Kompletní systém letového záznamu tvoří dvě samostatné jednotky: FDR (letové údaje) a CVR (zvuky a hovory v pilotní kabině).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

---

## Část 2: Simulace 5 záludných a hraničních otázek

### 11. „Má tento předmět ve skutečnosti černou barvu?“
*(Klíčový omyl vyplývající z lidového názvu.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `key_facts[0]` – *„Navzdory svému lidovému názvu „černá skříňka“ NENÍ tento přístroj černé barvy; jeho vnější plášť má jasně signální oranžovou barvu...“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 12. „Je tento předmět nalakován jasně oranžovou barvou?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `key_facts[0]` – *„...jeho vnější plášť má jasně signální oranžovou barvu (tzv. mezinárodní oranžová), aby byl snadno viditelný mezi troskami a na zemi.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 13. „Vysílá černá skříňka během běžného letu všechna data v reálném čase přes satelit?“
*(Častá mylná představa moderních laiků.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `key_facts[8]` – *„Černá skříňka standardně NEVYSÍLÁ průběžně data na zem přes internet či satelit; záznam lze analyzovat až po fyzickém nalezení a vylovení přístroje.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 14. „Dokáže tento přístroj sám aktivně převzít řízení nebo zabránit pádu letadla?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[9]` & `key_facts[16]` – *„Samotná skříňka nemůže zabránit nehodě ani nevydává pilotům varovné pokyny během letu; jejím úkolem je pouze nestranně zaznamenávat fakta.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 15. „Nahrává hlasový záznamník pilotů neomezeně celou historii od prvního letu letadla?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `key_facts[13]` – *„Hlasový zapisovač v kabině (CVR) nenahrává neomezeně dlouhou minulost; podle mezinárodních předpisů nahrává v nepřetržité smyčce obvykle posledních 2 hodiny... přičemž starší zvuk se automaticky přemazává.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

---

## 🎯 Závěrečné vyhodnocení auditu
- Všech 15 simulačních otázek je podloženo přesnými fakty.
- Klíčový paradox barvy (oranžová vs. černá) i rozdělení na FDR a CVR je plně pokryto.
- Spis spolehlivě odpoví ANO / NE a je připraven k nahrání do databáze.

