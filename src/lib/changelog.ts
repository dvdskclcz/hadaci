export const APP_VERSION = 'v1.6.0'

export type ReleaseNote = {
  version: string
  date: string
  title: string
  highlights: string[]
  cta?: {
    text: string
    href: string
  }
}

export const CHANGELOG: ReleaseNote[] = [
  {
    version: 'v1.6.0',
    date: '14. listopadu 2026',
    title: 'Nový herní mód: Detektivní výslech',
    highlights: [
      'Nový týdenní mód Detektivní výslech (/vyslech): Máš před sebou pouze jednu úvodní stopu a uzavřený vyšetřovací spis. Ptej se na cokoliv formou zjišťovacích otázek (ANO/NE) – AI vyšetřovatel ověří každý dotaz proti spisovým faktům bez spoilerů.',
      'Taktické bodování a limit 20 otázek: Začínáš se 100 body. Odpověď ANO nebo NE stojí 4 body, NELZE OVĚŘIT jen 2 body a chybný finální tip 15 bodů (máš max. 3 pokusy na tip). Vyřešení na první ostrý pokus se započítává i do Mistrovské série.',
      'Odložení do Šuplíku: Pokud vyčerpáš 20 otázek nebo 3 tipy, tajenka zůstává skrytá a spis putuje do Šuplíku, odkud si můžeš kdykoliv spustit odvetu.',
      'Archiv týdenních spisů: Možnost zpětně dohrát i starší publikované případy.',
    ],
    cta: {
      text: 'Vyzkoušet Detektivní výslech',
      href: '/vyslech',
    },
  },
  {
    version: 'v1.5.0',
    date: '7. listopadu 2026',
    title: 'Herní šňůry, odznaky sérií a ochrana férové hry',
    highlights: [
      'Denní kalendářní série (🔥) sledující nepřerušenou každodenní účast',
      'Mistrovská série (🎯) počítající úspěšně vyřešené hádanky v řadě bez zaváhání',
      'Vizuální odznaky aktivních sérií přímo v horní liště u profilu hráče',
      'Přehled prodloužení sérií zobrazený ve vítězném okně po vyluštění',
      'Striktní pravidlo prvního pokusu chránící série před obcházením v Šuplíku',
      'Optimalizace reaktivity v RiddleCard a vyčištění serverových akcí',
    ],
  },
  {
    version: 'v1.4.0',
    date: '30. října 2026',
    title: 'Herní mechanika, opravy ze šuplíku a dynamické bodování',
    highlights: [
      'Dynamické bodování pro 5 až 10 nápověd (vždy férový strop 100 b. a garance min. 5 b.)',
      'Průběžný odečet penalizace za chybný tip (-5 b.) zobrazený přímo v reálném čase',
      'Plnohodnotný režim odvety v Šuplíku (opravný pokus za 50 b., další za fixních 20 b.)',
      'Denní zámek neuhodnutých hádanek do půlnoci s vizuální indikací',
      'Štítky obtížnosti podle délky hádanky (🎯 Klasika, ⚡ Střední, 🔥 Velká výzva)',
      'Neutrální nápovědné pole bez nechtěných spoilerů',
      'Sjednocení databázového schématu a oprava načítání AI modelů',
    ],
  },
  {
    version: 'v1.3.0',
    date: '29. října 2026',
    title: 'Mobilní ladění, pravidla pro nováčky a české formátování',
    highlights: [
      'Interaktivní průvodce pravidly hry při první návštěvě webu',
      'Kompletní optimalizace zobrazení na mobilech (žádné přetékání a čistá horní lišta)',
      'Spolehlivé ukládání vyřešeného stavu i volby AI pro anonymní hráče',
      'Český formát dat v archivu i administraci bez úvodních nul (např. 29. 10. 2026)',
      'Vyladěný kontrast loga a odstranění duplicitních tlačítek',
    ],
  },
  {
    version: 'v1.2.0',
    date: '29. října 2026',
    title: 'PWA podpora, šuplík a hlášení chyb',
    highlights: [
      'Možnost instalace Hádačů na plochu telefonu (PWA)',
      'Vizuální indikátor novinek a verzování aplikace',
      'Systém odkládání neuhodnutých hádanek do šuplíku s denním zámkem',
      'Nové tlačítko pro reklamaci a doplnění synonym přímo z herní plochy',
      'Vyladěné dynamické náhledy pro sdílení na WhatsAppu',
    ],
  },
  {
    version: 'v1.1.0',
    date: '25. října 2026',
    title: 'Síň slávy a synchronizace',
    highlights: [
      'Férový žebříček hráčů s ochranou proti duplicitním profilům',
      'Podpora vlastních přezdívek v síni slávy',
      'Ukládání postupu rozehraných her do databáze',
      'Komunitní formulář pro návrhy nových hádanek',
    ],
  },
  {
    version: 'v1.0.0',
    date: '20. října 2026',
    title: 'Oficiální spuštění Hádačů',
    highlights: [
      'Denní hádanky s 5 postupně odkrývanými indiciemi',
      'Tolerantní vyhodnocování překlepů a synonym',
      'Generátor promptů pro testování AI modelů (ChatGPT, Gemini, Claude)',
    ],
  },
]