# Validační audit spisu #004: Polární záře 🌌✨

Tento dokument slouží jako kontrolní simulace dotazování hráče v herním módu **Detektivní výslech**. Ověřuje, že znalostní báze v souboru `case.json` poskytuje spolehlivý podklad pro dichotomické odpovědi **ANO** nebo **NE** a že systém nikdy nesklouzne k neutrálnímu „Nelze ověřit“.

---

## Část 1: Simulace 10 kontrolních otázek (včetně chytáků)

### 1. „Dá se na tuto věc fyzicky sáhnout rukou?“
*(Základní ontologický chyták: test nehmotné povahy světelného záření.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[2]` – *„Tento úkaz je zcela nehmotný a nehmatatelný; skládá se ze světelného záření a nelze se ho fyzicky dotknout, uchopit jej ani zvážit.“* a `key_facts[6]` – *„Polární záře NENÍ pevné těleso, kapalina ani prach; je to fotonové záření (světlo), na které se NEDÁ fyzicky sáhnout...“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 2. „Je tento úkaz někdy vidět i z České republiky?“
*(Zeměpisný a frekvenční chyták: běžný jev to v ČR není, ale při silné bouři prokazatelně ano.)*
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[9]` – *„...pouze výjimečně při mimořádně silné geomagnetické bouři bývá slabě pozorovatelná i z území ČR.“* a `key_facts[11]` – *„Ačkoliv je v ČR vzácná, NENÍ pravda, že by z ČR nebyla viditelná nikdy; při mohutných slunečních bouřích (např. v květnu 2024 či říjnu 2003) byla a může být z území ČR prokazatelně vyfotografována a spatřena.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 3. „Vzniká tento jev díky působení Měsíce?“
*(Astronomický chyták: Slunce vs. Měsíc.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[4]` – *„Vzniká interakcí nabitých částic slunečního větru s magnetickým polem Země a atomy plynů v zemské atmosféře (naše nejbližší hvězda je Slunce).“* a `key_facts[2]` – *„Zdrojem nabitých částic je Slunce... NIKOLIV Měsíc, planety ani vzdálený mezihvězdný prostor.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 4. „Jedná se o živého tvora, zvíře nebo člověka?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[1]` – *„Jde o neživý jev; není to člověk, zvíře, rostlina ani žádný jiný biologický organismus.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 5. „Vzniká tento jev činností člověka (jako ohňostroj nebo laser)?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[0]` – *„...nejedná se o fiktivní úkaz ani lidský výtvor.“* a `key_facts[7]` – *„NENÍ to dílo člověka, laserová show, světlomet, ohňostroj, umělá družice ani meteorologický balón.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 6. „Jedná se o světelný optický úkaz na noční obloze?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[0]` – *„Hledaná entita je skutečný přírodní atmosférický a optický jev...“* a `core_facts[5]` – *„Je pozorovatelná výhradně v noci za tmy; přes den na sluncem osvětlené obloze není lidským okem viditelná.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 7. „Vzniká díky aktivitě Slunce?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[4]` – *„Vzniká interakcí nabitých částic slunečního větru...“* a `key_facts[0]` – *„Jev vzniká excitací atomů a molekul plynů v ionosféře po srážce s elektrony a protony proudícími ze Slunce (sluneční vítr).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 8. „Vyskytuje se tento jev pravidelně v polárních oblastech Země?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[8]` – *„Nejčastěji a pravidelně se vyskytuje v polárních oblastech kolem magnetických pólů na severní i jižní polokouli (Arktida, Antarktida, Skandinávie, Island, Kanada, Aljaška).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 9. „Může mít tento jev zelenou barvu?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `key_facts[1]` – *„Barevné spektrum: Nejčastější je zelená barva (emise atomárního kyslíku ve výšce 100–150 km)...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 10. „Vydává tento jev hlasitý zvuk jako hrom při bouřce?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[7]` – *„Je to naprosto tichý světelný jev; sám o sobě nevydává žádný hrom, třesk ani hlasitý zvuk na rozdíl od blesku při bouřce.“* a `key_facts[10]` – *„Jev probíhá ve vakuu a extrémně řídkém plynu ionosféry ve výšce přes 100 km, odkud se na zem nepřenáší žádný slyšitelný akustický zvuk.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

---

## 🎯 Závěrečné vyhodnocení auditu
- Všech 10 kontrolních i chytákových otázek má jednoznačnou, neprůstřelnou oporu v `case.json`.
- Negativní vymezení spolehlivě pokrývají nehmatatelnost, Slunce vs. Měsíc i ojedinělou viditelnost z ČR.
- Spis je plně připraven pro synchronizaci do vektorové databáze a nasazení do ostré hry.

