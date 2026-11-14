# Fronta hesel pro herní mód „Detektivní výslech“ 🕵️‍♂️🔍

Tento soubor slouží jako centrální zásobník témat pro tvorbu nových detektivních spisů. Každý případ se publikuje v týdenním pondělním cyklu.

---

## 📌 Pravidla pro výběr hesel
1. **Jednoznačná identifikace**: Pojem musí mít jasné encyklopedické hranice (žádné vágní pocity nebo subjektivní kategorie).
2. **Kulturní ukotvení**: Převážně české reálie, světové fenomény dobře známé v ČR nebo zásadní milníky lidstva.
3. **Pestrý mix kategorií**: Střídání 5 typů entit (`person`, `place`, `object`, `event`, `concept`).
4. **Bohatá faktografie**: O heslu musí být možné sestavit alespoň 30 nezpochybnitelných faktů pro dichotomické odpovědi ANO / NE.

---

## 🗂️ Aktuální fronta ke zpracování

| # | Heslo / Tajenka | Typ entity | Obtížnost | Stav | Složka / Slug |
|---|-----------------|------------|-----------|------|---------------|
| 001 | **Karel Čapek** | `person` | Střední | ✅ Hotovo | `001-karel-capek` |
| 002 | **Hrad Wawel** | `place` | Střední | ✅ Hotovo | `002-hrad-wawel` |
| 003 | **Černá skříňka v letadle** | `object` | Lehká | ✅ Hotovo | `003-cerna-skrinka` |
| 004 | **Polární záře** | `concept` | Střední | ✅ Hotovo | `004-polarni-zare` |
| 005 | **Titanic** | `object` | Lehká | ✅ Hotovo | `005-titanic` |
| 006 | **Pražské jaro 1968** | `event` | Střední | 💡 Nápad | `006-prazske-jaro-1968` |
| 007 | **Kostkový cukr** | `object` | Lehká | 💡 Nápad | `007-kostkovy-cukr` |
| 008 | **Ještěd (vysílač a hotel)** | `place` | Lehká | 💡 Nápad | `008-jested` |
| 009 | **Remoska** | `object` | Střední | 💡 Nápad | `009-remoska` |
| 010 | **Emil Zátopek** | `person` | Lehká | 💡 Nápad | `010-emil-zatopek` |

---

## 🛠️ Jak postupovat při zpracování dalšího hesla:
1. Vyber téma ze stavu `⏳ Připraveno k sepsání`.
2. Postupuj podle pokynů v souboru `_instrukce-generatoru.md`.
3. Vytvoř složku `content/vyslech/NNN-slug/`.
4. Vytvoř soubor `case.json` a proveď kontrolní `audit.md`.
5. Spusť synchronizaci do vektorové databáze:
   ```bash
   pnpm sync:vyslech
   ```
6. Označ stav hesla v této tabulce jako `✅ Hotovo`.

