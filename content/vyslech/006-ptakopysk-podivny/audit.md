# Validační audit spisu #006: Ptakopysk podivný 🦆🦦

Tento dokument slouží jako kontrolní simulace dotazování hráče v herním módu **Detektivní výslech**. Ověřuje, že znalostní báze v souboru `case.json` poskytuje spolehlivý podklad pro dichotomické odpovědi **ANO** nebo **NE** a že systém nikdy nesklouzne k neutrálnímu „Nelze ověřit“.

---

## Část 1: Simulace 10 kontrolních otázek (včetně chytáků)

### 1. „Patří tento živočich mezi savce?“
*(Taxonomický chyták: ačkoliv má zobák a klade vejce, jde o pravého vejcorodého savce.)*
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[1]` – *„Jedná se o živého živočicha (zvíře), konkrétně o savce (nikoliv ptáka, plaza, obojživelníka ani rybu).“* a `key_facts[0]` – *„Ptakopysk podivný (Ornithorhynchus anatinus) ... tvoří starobylý řád ptakořitních (Monotremata).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 2. „Klade tento živočich vejce?“
*(Biologický paradox: savec kladoucí vejce.)*
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[2]` – *„Ačkoliv patří mezi savce, samice tohoto druhu rodí mláďata tak, že klade vejce (patří do starobylého řádu ptakořitních savců).“* a `key_facts[10]` – *„Samice klade po spáření jedno až tři malá kožovitá vejce podobná plazím...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 3. „Může být tento živočich jedovatý?“
*(Toxikologický chyták: jedovatý savec je v přírodě velká vzácnost.)*
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[8]` – *„Dospělí samci mají na vnitřní straně zadních končetin rohovité ostruhy napojené na jedovou žlázu – jedná se o jednoho z mála jedovatých savců na světě.“* a `key_facts[6]` – *„Dospělí samci mají na patách zadních nohou duté rohovité ostruhy spojené s krurální žlázou produkující jed...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 4. „Žije tento tvor přirozeně ve volné přírodě v Evropě nebo v ČR?“
*(Geografický chyták: výskyt je přísně omezen na Austrálii a Tasmánii.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[6]` – *„Ve volné přírodě se NENACHÁZÍ v Evropě, v České republice, v Americe, v Asii ani v Africe.“* a `core_facts[5]` – *„Je to geografický endemit kontinentu Austrálie a Oceánie (jižní polokoule); žije výhradně ve východní části Austrálie a na ostrově Tasmánie.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 5. „Jedná se o vyhynulého živočicha?“
*(Evoluční chyták: archaický vzhled svádí k myšlence na pravěkého tvora.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[4]` – *„Tento živočišný druh NENÍ vyhynulý; stále žije v současnosti ve volné přírodě na naší planetě.“* a `key_facts[17]` – *„NENÍ to pravěký vyhynulý tvor; je to dosud žijící druh, v Červeném seznamu IUCN vedený jako téměř ohrožený...“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 6. „Má tělo pokryté peřím jako ptáci?“
*(Morfologický chyták: zobák kachny vs. tělo se srstí.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `key_facts[15]` – *„Ačkoliv má zobák a klade vejce, NENÍ to pták (nemá peří, křídla ani duté kosti...)“* a `key_facts[5]` – *„Tělo kryje mimořádně hustá, jemná a nepromokavá srst...“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 7. „Má tento tvor na hlavě zobák?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[9]` – *„Má unikátní tělesnou stavbu kombinující měkký kožovitý zobák připomínající kachní...“* a `key_facts[1]` – *„Zobák ptakopyska NENÍ z tvrdé ptačí rohoviny; je měkký, pružný, kožovitý a posetý tisíci elektroreceptory...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 8. „Krmí samice svá mláďata mateřským mlékem?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[3]` – *„Vylíhnutá mláďata krmí samice mateřským mlékem, které vylučuje ze zvláštních mléčných žláz na kůži břicha...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 9. „Má samice na břiše klasické prsní bradavky?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[3]` – *„...samice nemá pravé prsní bradavky.“* a `key_facts[11]` – *„Mláďata se živí mateřským mlékem, avšak samice nemá bradavky; mléko vylučuje modifikovanými potními žlázami na břišní kůži a mláďata jej ze srsti slízávají.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 10. „Považovali evropští vědci po objevení první exemplář za podvrh sešitý z různých zvířat?“
*(Historický fakt ověřující nápovědu spisu.)*
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `key_facts[13]` – *„Když britský přírodovědec George Shaw obdržel z Austrálie první vycpanou kůži ptakopyska, byl přesvědčen, že jde o asijský podvrh zhotovený přišitím kachního zobáku k tělu zvířete podobného bobrovi, a hledal na těle stehy.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

---

## 🎯 Závěrečné vyhodnocení auditu
- Všech 10 kontrolních otázek má jednoznačnou oporu v `case.json`.
- Negativní vymezení spolehlivě pokrývají savce vs. ptáka/plaza, absenci peří i bradavek, endemitní výskyt v Austrálii a vyvracejí vyhynutí druhu.
- Spis je plně připraven pro synchronizaci do vektorové databáze a nasazení do ostré hry.
