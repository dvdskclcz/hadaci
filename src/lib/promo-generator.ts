export type PromoTemplateId = 'riddle' | 'detective' | 'leaderboard' | 'archive'
export type PromoFormatId = 'short' | 'long'

export interface PromoGeneratorData {
    todayRiddle: {
        category: string
        firstClue: string
        publishDate: string
    } | null
    activeDetectiveCase: {
        caseNumber: string
        slug: string
        initialClue: string
        publishDate: string
    } | null
    topPlayers: Array<{
        rank: number
        nickname: string
        totalScore: number
        solvedCount: number
    }>
    weekLabel: string
    archiveStats: {
        riddlesCount: number
        detectiveCasesCount: number
        totalCount: number
    }
}

export function generatePromoText(
    template: PromoTemplateId,
    format: PromoFormatId,
    data: PromoGeneratorData
): string {
    switch (template) {
        case 'riddle': {
            const category = data.todayRiddle?.category || 'České reálie'
            const firstClue =
                data.todayRiddle?.firstClue || 'Nová denní hádanka čeká na své odhalení.'

            if (format === 'short') {
                return `Dnešní hádanka na Hádači.cz je venku! 🧩

Kategorie: ${category}
1. nápověda: „${firstClue}“

Dokážeš to uhádnout na co nejméně nápověd?
👉 https://hadaci.cz`
            } else {
                return `Nová denní výzva na Hádači.cz! 🧠✨

Každý den odhalujeme jednu českou osobnost, památku, film nebo reálii. Čím méně stop potřebuješ k odhalení, tím vyšší skóre získáš.

Dnešní kategorie: 🏷️ ${category}
Úvodní stopa: „${firstClue}“

Zvládneš to dřív než naši AI parťáci v aréně? Bez registrace, zdarma a v češtině.

Otestuj své znalosti:
👉 https://hadaci.cz

#hadaci #kviz #hadanka #logika #ceskahra #hadanky #znalosti #cesko`
            }
        }

        case 'detective': {
            const caseNumber = data.activeDetectiveCase?.caseNumber || '#001'
            const initialClue =
                data.activeDetectiveCase?.initialClue || 'Případ čeká na tvé otázky.'

            if (format === 'short') {
                return `Nový případ v Detektivním výslechu ${caseNumber}! 🕵️🔍

Úvodní stopa: „${initialClue}“

Polož podezřelému až 20 zjišťovacích otázek (odpovídá jen ANO / NE / NELZE OVĚŘIT) a odhal tajenku.
👉 https://hadaci.cz/vyslech`
            } else {
                return `Máme tu nový nevyřešený případ pro bystré detektivy! 🕵️‍♂️📂

V herním módu Detektivní výslech ${caseNumber} nečteš pasivně nápovědy – ty sám vedeš výslech. Systém ti odpovídá pouze ANO, NE nebo NELZE OVĚŘIT. Máš 20 otázek na to, abys odhalil tajenku.

Úvodní záznam ve spisu:
„${initialClue}“

Využij dedukci, zeptej se správně a uzavři vyšetřování!
Vyzkoušej zdarma přímo v prohlížeči:
👉 https://hadaci.cz/vyslech

#hadaci #vyslech #detektiv #dedukce #kviz #hadanka #logika #ceskahra`
            }
        }

        case 'leaderboard': {
            const weekLabel = data.weekLabel || 'Aktuální týden'
            const players = data.topPlayers || []

            let shortPlayersText = ''
            let longPlayersText = ''

            if (players.length > 0) {
                const medals = ['🥇', '🥈', '🥉']
                shortPlayersText = players
                    .map((p, i) => `${medals[i] || `${p.rank}.`} ${p.nickname} (${p.totalScore} b.)`)
                    .join('\n')

                longPlayersText = players
                    .map(
                        (p, i) =>
                            `${medals[i] || `${p.rank}.`} ${p.rank}. místo: ${p.nickname} – ${p.totalScore} b. (${p.solvedCount} vyřešených her)`
                    )
                    .join('\n')
            } else {
                shortPlayersText = 'Zatím v tomto týdnu nikdo nezískal body – první místo může být tvoje!'
                longPlayersText = 'Zatím v tomto týdnu nikdo nezískal body – první místo je volné!'
            }

            if (format === 'short') {
                return `Kdo kraluje letošnímu týdnu na Hádači.cz? 🏆🔥
Období: ${weekLabel}

${shortPlayersText}

Troufneš si je překonat? Zapiš se do žebříčku:
👉 https://hadaci.cz/zebricky`
            } else {
                return `Boj o čelo týdenního žebříčku na Hádači.cz vrcholí! 🏆🔥

Tento týden (${weekLabel}) si nejlépe vedou tito mistři dedukce:
${longPlayersText}

Sbírej body z denních hádanek i detektivních výslechů, buduj série a dostaň se na stupně vítězů!

Zkontroluj aktuální pořadí a zapoj se do hry:
👉 https://hadaci.cz/zebricky

#hadaci #zebricek #sinslavy #soutez #kviz #hadanka #logika #ceskahra`
            }
        }

        case 'archive': {
            const totalCount = data.archiveStats?.totalCount || 0
            const riddlesCount = data.archiveStats?.riddlesCount || 0
            const detectiveCasesCount = data.archiveStats?.detectiveCasesCount || 0

            if (format === 'short') {
                return `Nestihl jsi předchozí hádanky? 📚

V archivu Hádači.cz na tebe čeká už ${totalCount} hádanek a detektivních spisů! Hraj kdykoliv zpětně, zdarma a bez otravných reklam.

Zahraj si v archivu:
👉 https://hadaci.cz/archiv`
            } else {
                return `Hledáš kvalitní odpočinek pro mozkové závity? 🧠📚

Na Hádači.cz najdeš kompletní archiv se všemi ${totalCount} odehranými tématy (${riddlesCount} denních hádanek a ${detectiveCasesCount} detektivních výslechů). Můžeš luštit vlastním tempem, dořešit resty ze šuplíku nebo potrénovat před zítřejší hádankou.

100% v češtině, zdarma a bez otravných reklam.
Vyber si hádanku v archivu:
👉 https://hadaci.cz/archiv

#hadaci #archiv #kviz #hadanka #logika #ceskahra #vzdelavani #zabava`
            }
        }
    }
}
