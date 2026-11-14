# Validační audit spisu #001: Karel Čapek 🕵️‍♂️🔎

Tento dokument slouží jako kontrolní simulace dotazování hráče v herním módu **Detektivní výslech**. Ověřuje, že znalostní báze v souboru `case.json` poskytuje jednoznačný podklad pro dichotomické odpovědi **ANO** nebo **NE** a že systém nikdy nesklouzne k neutrálnímu „Nelze ověřit“.

---

## Část 1: Simulace 10 typických rozřazovacích otázek

### 1. „Hledáme reálnou lidskou bytost?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[0]` – *„Hledaná entita je skutečná historická lidská bytost (reálný člověk, nikoliv fiktivní postava).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 2. „Žije tato osoba ještě dnes?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[2]` – *„Tato osoba v současnosti již nežije (zemřela ve 20. století).“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 3. „Je to muž?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[1]` – *„Jedná se o osobu mužského pohlaví.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 4. „Pochází tato osobnost z Česka / narodila se na území dnešního Česka?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[4]` – *„Byl české národnosti a státním občanem Rakouska-Uherska a následně Československa.“* a `core_facts[9]` – *„Narodil se v Podkrkonoší v obci Malé Svatoňovice v severovýchodních Čechách, na území dnešního Česka (tehdy součást Rakouska-Uherska)...“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 5. „Působil tento člověk v oblasti kultury nebo umění?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `core_facts[5]` – *„Jeho primární životní profesí byla literatura, dramata, žurnalistika a publicistika (spisovatel a novinář).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 6. „Byl to politik nebo zastával vysokou státní funkci?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[7]` – *„Nikdy nebyl vrcholným voleným politikem, poslancem, ministrem ani prezidentem státu.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 7. „Působil především v období 19. století?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[3]` – *„Osoba žila a působila na přelomu 19. a 20. století a především v období první československé republiky.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 8. „Byl to vědec, vynálezce nebo lékař?“
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `core_facts[8]` – *„Nebyl vědcem, lékařem ani technickým vynálezcem, ačkoliv o vědě a technice rozsáhle psal.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 9. „Napsal dílo, které varovalo před mloky?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `key_facts[2]` – *„Je autorem slavného varovného sci-fi a utopického románu Válka s mloky (1936).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

### 10. „Napsal divadelní hru Bílá nemoc?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `key_facts[3]` – *„Napsal dramatická varování před fašismem, diktaturou a fanatismem Bílá nemoc (1937) a Matka (1938).“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

---

## Část 2: Simulace 5 záludných a hraničních otázek

### 11. „Vymyslel on sám osobně slovo robot?“
*(Častý omyl hráčů – Karel hru napsal, ale slovo navrhl bratr Josef.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `key_facts[1]` – *„Slovo „robot“ sám nevymyslel; autorem slova byl jeho starší bratr Josef Čapek, Karel ho však poprvé použil a celosvětově proslavil.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 12. „Zemřel v koncentračním táboře nebo rukou nacistů?“
*(Častá záměna s bratrem Josefem Čapkem, který zahynul v Bergen-Belsenu.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `key_facts[9]` – *„Karel Čapek nezemřel v koncentračním táboře ani nebyl popraven nacisty; zemřel na zápal plic 25. prosince 1938 v Praze.“* a `key_facts[10]` – *„V koncentračním táboře Bergen-Belsen naopak v dubnu 1945 zahynul jeho bratr, malíř Josef Čapek.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 13. „Dostal Nobelovu cenu za literaturu?“
*(Byl na ni opakovaně navržen, ale z politických důvodů ji nezískal.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `key_facts[11]` – *„Karel Čapek nikdy nezískal Nobelovu cenu za literaturu, přestože byl na ni celkem sedmkrát nominován.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 14. „Byl za první republiky členem KSČ nebo komunistou?“
*(Často mylně spojováno kvůli jeho sociálnímu cítění a antifašismu.)*
- **Očekávaná odpověď:** `NE`
- **Opora ve spisu:** `key_facts[18]` – *„Nebyl komunistou ani stoupencem marxismu; v roce 1924 otiskl v časopise Přítomnost slavnou stať „Proč nejsem komunistou“.“*
- **Verdikt:** ✅ SPLNĚNO (NE)

### 15. „Byl v přímém příbuzenském vztahu s významným malířem?“
- **Očekávaná odpověď:** `ANO`
- **Opora ve spisu:** `key_facts[1]` & `key_facts[10]` – *„...jeho starší bratr Josef Čapek...“, „...jeho bratr, malíř Josef Čapek.“*
- **Verdikt:** ✅ SPLNĚNO (ANO)

---

## 🎯 Závěrečné vyhodnocení auditu
- Všech 15 simulačních otázek má přímou a nezpochybnitelnou oporu ve faktech spisu.
- Spis je z hlediska sémantického vyhledávání a LLM rozhodčího plně saturován a připraven k synchronizaci do databáze.

