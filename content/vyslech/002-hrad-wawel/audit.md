# Validační audit spisu #002: Hrad Wawel 🏰🔎

Tento dokument slouží jako kontrolní simulace dotazování hráče v herním módu **Detektivní výslech**. Ověřuje, že znalostní báze v souboru `case.json` poskytuje jednoznačný podklad pro dichotomické odpovědi **ANO** nebo **NE** a že systém nikdy nesklouzne k neutrálnímu „Nelze ověřit“.

---

## Část 1: Simulace 10 typických rozřazovacích otázek

### 1. „Hledáme skutečné místo na Zemi?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[0]` – *„Hledaná entita je skutečné existující geografické místo a stavební komplex na planetě Zemi (nikoliv fiktivní ani mytologické místo).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 2. „Jedná se o lidskou stavbu, budovu nebo hrad?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[1]` – *„Jedná se o historické opevněné sídlo, hrad a architektonický komplex vytvořený lidskou rukou.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 3. „Nachází se toto místo v České republice?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[3]` – *„Tento hrad leží na území dnešního Polska (nikoliv v České republice, na Slovensku, v Německu ani v Rakousku).“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 4. „Leží toto místo v Polsku?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[3]` – *„Tento hrad leží na území dnešního Polska...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 5. „Nachází se v hlavním městě Varšavě?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[4]` – *„Nenachází se v hlavním městě Varšavě; leží v historickém královském městě Krakov (Kraków).“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 6. „Nachází se ve městě Krakov?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[4]` – *„...leží v historickém královském městě Krakov (Kraków).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 7. „Je to hradní zřícenina nebo zbořené torzo?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[7]` – *„Jde o celistvě dochovaný monumentální komplex (nejedná se o zříceninu, ruinu ani zaniklou stavbu).“* a `key_facts[9]` – *„Hrad Wawel NENÍ zřícenina ani torzo...“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 8. „Sloužilo toto místo jako sídlo a pohřebiště králů?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[6]` – *„Po celá staletí sloužil jako oficiální sídlo a korunovační místo polských králů a panovníků.“* a `key_facts[2]` – *„V podzemních kryptách wawelské katedrály jsou uloženy hrobky téměř všech polských králů...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 9. „Stojí tento komplex na kopci u řeky Visly?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[5]` – *„Tyčí se na vápencovém pahorku na levém břehu nejdelší polské řeky Visly (Wisła).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 10. „Je toto místo zapsáno na seznamu památek UNESCO?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[8]` & `key_facts[19]` – *„Dnes slouží jako jedno z nejnavštěvovanějších národních muzeí v Polsku a je zapsán na seznamu světového dědictví UNESCO... v roce 1978.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

---

## Část 2: Simulace 5 záludných a hraničních otázek

### 11. „Sídlí v tomto hradě současný polský prezident?“
*(Častý omyl hráčů zaměňujících historické sídlo za současné státní sídlo hlavy státu.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[9]` – *„V současnosti neslouží jako úřední sídlo prezidenta ani vlády Polské republiky...“* a `key_facts[12]` – *„Na Wawelu v současné době NESÍDLÍ prezident Polské republiky ani polský parlament (ti mají svá sídla ve Varšavě).“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 12. „Váže se k tomuto místu pověst o drakovi?“
*(Ověření unikátního folkloru a sochy chrlící oheň.)*
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `key_facts[4]` – *„S návrším je neoddělitelně spjata slavná pověst o drakovi (Smok Wawelski)...“* a `key_facts[5]` – *„Pod hradním svahem stojí známá bronzová socha draka, která v pravidelných intervalech chrlí skutečný plamen.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 13. „Je na Wawelu trvale vystaven obraz Dáma s hranostajem od Leonarda da Vinciho?“
*(Častá záměna krakovských památek a institucí.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `key_facts[13]` – *„Na Wawelu dnes NENÍ trvale vystaven slavný obraz Dáma s hranostajem od Leonarda da Vinciho; ačkoliv zde byl v minulosti dočasně deponován, jeho stálou expozicí je nedaleké Muzeum knížat Czartoryských v Krakově.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 14. „Byl v tomto hradě po letecké havárii v roce 2010 pohřben prezident Lech Kaczyński?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `key_facts[3]` – *„V roce 2010 zde byl po letecké katastrofě u Smolenska pohřben tehdejší polský prezident Lech Kaczyński s manželkou Marií.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 15. „Sloužil tento hrad za nacistické okupace jako sídlo generálního guvernéra?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `key_facts[15]` – *„Během druhé světové války si hrad Wawel zvolil za svou hlavní rezidenci a úřad nacistický generální guvernér okupovaného Polska Hans Frank.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

---

## 🎯 Závěrečné vyhodnocení auditu
- Všech 15 simulačních otázek má jednoznačnou oporu v `case.json`.
- Negativní vymezení spolehlivě zabraňují záměnám s Varšavou, Prahou, zříceninami i současným sídlem prezidenta.
- Spis je plně saturován pro AI rozhodčího i vektorové hledání.

