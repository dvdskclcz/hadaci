# Instrukce pro generátor spisů „Detektivní výslech“ 🕵️‍♂️📋

Tento dokument je metodickým průvodcem pro tvorbu nového vyšetřovacího spisu pro herní mód **Detektivní výslech** v aplikaci Hádači.cz.

Cílem je vytvořit pro zvolené heslo složku `content/vyslech/NNN-slug/`, která obsahuje dva soubory:
1. `case.json` – strukturovaná znalostní báze pro sémantické vyhledávání a LLM soudce.
2. `audit.md` – validační protokol ověřující, že systém nikdy nevrátí nechtěnou odpověď „Nelze ověřit“.

---

## 📁 1. Struktura a pravidla souboru `case.json`

Soubor musí být validní JSON v kódování UTF-8 s následující strukturou:

```json
{
  "slug": "001-karel-capek",
  "publish_date": "2026-11-16",
  "entity_type": "person",
  "difficulty": "medium",
  "secret_answer": "Karel Čapek",
  "accepted_synonyms": [
    "Čapek",
    "Karel Capek",
    "bratr Josefa Čapka"
  ],
  "initial_clue": "Svými slovy varoval před stroji i mloky a obohatil světové slovníky.",
  "core_facts": [
    "...",
    "..."
  ],
  "key_facts": [
    "...",
    "..."
  ],
  "anticipated_qa": [
    { "q": "Je to člověk?", "a": "ANO" },
    { "q": "Žije v současnosti?", "a": "NE" }
  ]
}
```

### Specifikace jednotlivých polí:

### `slug` (string)
- Formát: `NNN-kebab-case-nazev` (např. `001-karel-capek`, `002-hrad-wawel`).
- Číslování odpovídá číslu případu v `_fronta-hesel.md`.

### `publish_date` (string)
- Formát `YYYY-MM-DD`.
- Hry se publikují v **týdenním pondělním cyklu** (každé pondělí nový případ).

### `entity_type` (string enum)
Povolené hodnoty:
- `"person"` – skutečná historická či žijící osoba
- `"place"` – město, hrad, pohoří, budova, řeka, geografická lokalita
- `"object"` – vynález, přístroj, umělecké dílo, dopravní prostředek, fyzická věc
- `"event"` – historická událost, bitva, revoluce, festival, katastrofa
- `"concept"` – myšlenkový směr, instituce, fenomén, tradice

### `difficulty` (string enum)
- `"easy"` – všeobecně známý pojem ze základní školy
- `"medium"` – známý pojem s několika zavádějícími souvislostmi
- `"hard"` – specializovanější pojem vyžadující hlubší dedukci

### `secret_answer` (string)
- Přesný kanonický název hesla v češtině (např. `Karel Čapek`, `Hrad Wawel`).

### `accepted_synonyms` (string[])
- Alternativní uznávané tvary (bez diakritiky, příjmení samotné, známé tituly, variantní přepisy).
- Tyto tvary validátor odpovědí uzná jako plnou výhru.

### `initial_clue` (string)
- Jediná úvodní věta, kterou hráč uvidí na začátku výslechu jako vodítko.
- Styl: poetická hádanka, nápověda v náznacích. **Nesmí** přímo jmenovat klíčové dílo nebo prozradit podstatu.

### `core_facts` (string[8–10])
Základní binární rozřazovací síť pro první fázi hráčského dotazování (princip 20 otázek).
Musí pokrýt:
1. Reálnost / fikci (zda entita reálně existuje v našem světě).
2. Živost / neživost (u person: zda je to člověk, zda ještě žije, pohlaví).
3. Časové zařazení (století, éra, období vzniku či zániku).
4. Geografické ukotvení (kontinent, stát, vazba k ČR vs. zahraničí). **Důležité pravidlo pro historii:** U historických osobností, míst a událostí musí spis vždy uvádět jak dobový historický kontext, tak výslovnou příslušnost k území dnešního státu (např. „Malé Svatoňovice v severovýchodních Čechách, na území dnešního Česka, tehdy v Rakousku-Uhersku“). Hráči se totiž běžně ptají „Narodil se v Česku?“ a AI soudce musí mít oporu pro jednoznačné ANO.
5. Materiál / podstata (u objektů hmotnost, velikost, zda se vejde do kapsy / do místnosti).
6. Primární doména (kultura, věda, politika, sport, technologie, příroda).

### `key_facts` (string[20])
Dvacet klíčových encyklopedických faktů. Musí obsahovat:
- Nejznámější zásluhy, díla, funkce, vlastnosti.
- Propojení historických reálií se současnou geografií (např. území dnešních států).
- **Geografické ukotvení a sousedství s ČR**: U geografických míst, památek a staveb (zejména zahraničních) musí spis vždy výslovně uvádět kontinent (např. Evropa) a případné sousedství daného státu s Českou republikou (např. u Wawelu: „Hrad se nachází v Polsku, které je sousedním státem České republiky“), aby AI rozhodčí i hráč měli jistou oporu pro otázky typu „Leží to v sousedním státě ČR?“ nebo „Je to v Evropě?“.
- **Negativní vymezení (čím pojem NENÍ)**: Zásadní pro eliminaci omylů LLM soudce.
  - *Příklad pro Čapka:* „Karel Čapek nezemřel v koncentračním táboře ani nebyl popraven nacisty (zemřel na zápal plic v prosinci 1938).“
  - *Příklad pro Čapka:* „Slovo robot sám nevymyslel, autorem slova byl jeho bratr Josef Čapek, Karel ho však použil a proslavil ve hře R.U.R.“
  - *Příklad pro Čapka:* „Karel Čapek nikdy nezískal Nobelovu cenu za literaturu, ačkoliv na ni byl několikrát nominován.“
- Záměny: S kým nebo čím se pojem nejčastěji plete.

### `anticipated_qa` (Array<{ q: string, a: "ANO" | "NE" }>[20])
Dvacet nejpravděpodobnějších hráčských otázek s autoritativní odpovědí `ANO` nebo `NE`:
- 10 obecných rozřazovacích otázek („Je to člověk?“, „Pochází z Česka?“, „Dá se to koupit v obchodě?“). U historických témat vždy zahrnout otázku typu „Pochází z Česka / narodil se na území dnešního Česka?“.
- 10 konkrétních verifikačních otázek směřujících k potvrzení hypotézy.

---

## 📝 2. Struktura souboru `audit.md`

`audit.md` je simulační test spisu. Obsahuje:
1. **10 typických hráčských otázek**: Standardní postup eliminace a zúžení.
2. **5 záludných / hraničních otázek**: Otázky testující nuance, záměny a negativní vymezení.
3. **Vyhodnocení pokrytí**: Pro každou z 15 otázek audit uvádí:
   - Znění otázky
   - Očekávanou odpověď (`ANO` / `NE`)
   - Citaci konkrétního faktu z `case.json`, který tuto odpověď neprůstřelně dokládá
   - Verdikt: `SPLNĚNO (ANO/NE)` – nikdy nesmí vyjít `Nelze ověřit`!

---

## ⚡ 3. Kontrolní checklist před nahráním do databáze

- [ ] JSON je syntakticky validní (žádné čárky za poslední položkou).
- [ ] `core_facts` obsahuje minimálně 8 položek.
- [ ] `key_facts` obsahuje přesně 20 položek včetně negativních vymezení.
- [ ] `anticipated_qa` obsahuje přesně 20 otázek a odpovědí (`ANO` nebo `NE`).
- [ ] Všechny otázky v `audit.md` mají oporu v textech faktu.
- [ ] Byla spuštěna synchronizace: `pnpm sync:vyslech`.

