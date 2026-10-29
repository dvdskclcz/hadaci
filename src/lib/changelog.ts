export const APP_VERSION = 'v1.2.0'

export type ReleaseNote = {
    version: string
    date: string
    title: string
    highlights: string[]
}

export const CHANGELOG: ReleaseNote[] = [
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