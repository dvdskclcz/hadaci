# Validační audit spisu #007: Věstonická venuše 🗿🏺

Tento dokument slouží jako kontrolní simulace dotazování hráče v herním módu **Detektivní výslech**. Ověřuje, že znalostní báze v souboru `case.json` poskytuje spolehlivý podklad pro dichotomické odpovědi **ANO** nebo **NE** a že systém nikdy nesklouzne k neutrálnímu „Nelze ověřit“.

---

## Část 1: Simulace 10 kontrolních otázek (včetně chytáků)

### 1. „Je tato soška vytesaná z kamene nebo vyřezaná ze slonoviny?“
*(Materiálový chyták: většina jiných evropských venuší je z vápence či mamutoviny, tato je unikátně z keramiky.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[4]` – *„Tento artefakt NENÍ vytesán z kamene, mramoru, dřeva, kovu, slonoviny/mamutoviny ani ze zvířecí kosti.“* a `key_facts[9]` – *„Na rozdíl od Willendorfské venuše z Rakouska (která je z vápence) nebo Venuše z Brassempouy z Francie (která je ze slonoviny) je Věstonická venuše zhotovena výhradně z pálené hlíny a jemného vápence.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 2. „Byla tato soška nalezena na území dnešní České republiky?“
*(Zeměpisný a historický vztah k modernímu státu.)*
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[7]` – *„Byla nalezena na území dnešní České republiky (konkrétně na jižní Moravě pod Pálavou v katastru obce Dolní Věstonice).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 3. „Měří tato soška na výšku více než půl metru?“
*(Rozměrový chyták: monumentální socha vs. drobná kapesní plastika.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[5]` – *„Jde o drobný předmět vysoký pouze přibližně 11,5 centimetru (vejde se do lidské dlaně a váží necelých 100 gramů, nejedná se o monumentální sochu).“* a `key_facts[12]` – *„Nejedná se o sochu v životní velikosti ani o monumentální pomník; celá se bez potíží vejde do sevřené lidské pěsti.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 4. „Pochází tento předmět z pravěké doby kamenné?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[6]` – *„Pochází ze starší doby kamenné (mladý paleolit, kultura lovců mamutů / gravettien), její stáří se odhaduje na přibližně 25 000 až 29 000 let př. n. l.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 5. „Byla tato soška vyrobena z pálené hlíny (keramiky)?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[3]` – *„Je vyrobena z pálené hlíny (keramiky) smíšené s jemným vápencem – jedná se o nejstarší známou keramickou sošku na světě.“* a `key_facts[0]` – *„Věstonická venuše je celosvětově nejstarším známým dokladem použití pálené hlíny (keramiky) člověkem v historii...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 6. „Zobrazuje tato soška ženskou postavu?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[2]` – *„Plastika stylizovaně zobrazuje ženské lidské tělo (tzv. paleolitická venuše) se zvýrazněnými znaky mateřství a plodnosti.“* a `key_facts[2]` – *„Soška má výrazně naddimenzované poprsí, boky, břicho a hýždě jako symboly plodnosti a hojnosti...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 7. „Vejde se tato soška svou velikostí do lidské dlaně?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[5]` – *„...vejde se do lidské dlaně a váží necelých 100 gramů...“* a `key_facts[1]` – *„Výška sošky je přesně 11,5 centimetru, největší šířka v bocích měří 4,3 centimetru a její hmotnost činí 98 gramů.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 8. „Byla tato soška při svém nálezu v ohništi rozlomena na dva kusy?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[8]` – *„...a to rozlomená na dva samostatné kusy v pravěkém ohništi.“* a `key_facts[8]` – *„Soška byla nalezena v centrálním ohništi pravěkého obydlí rozpadlá na dva kusy ležící zhruba 10 centimetrů od sebe...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 9. „Pochází tato soška ze starověkého Řecka nebo Říma?“
*(Pojmový chyták: název „Venuše“ evokuje římskou bohyni.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `key_facts[10]` – *„NENÍ to dílo starověkého Řecka ani Říma (nejedná se o antickou sochu bohyně Venuše z mramoru); vznikla desítky tisíc let před vznikem prvních civilizací.“* a `key_facts[17]` – *„Označení „venuše“ začali pro pravěké ženské sošky používat archeologové v 19. století s nadsázkou a narážkou na římskou bohyni krásy a plodnosti Venus.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 10. „Byla nalezena na jižní Moravě pod Pálavou?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[7]` – *„Byla nalezena na území dnešní České republiky (konkrétně na jižní Moravě pod Pálavou v katastru obce Dolní Věstonice).“* a `key_facts[6]` – *„Byla objevena 13. července 1925 na rozsáhlém sídlišti lovců mamutů mezi obcemi Dolní Věstonice a Pavlov na jižní Moravě.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

---

## 🎯 Závěrečné vyhodnocení auditu
- Všech 10 kontrolních otázek má jednoznačnou oporu v `case.json`.
- Negativní vymezení spolehlivě pokrývají keramiku vs. kámen/slonovinu, pravěk vs. antiku, drobné rozměry a jednoznačnou vazbu na ČR.
- Spis je plně připraven pro synchronizaci do vektorové databáze a nasazení do ostré hry.
