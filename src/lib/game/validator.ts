// Odstranění diakritiky, ořez mezer a převod na malá písmena
export function normalizeText(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Odstraní háčky a čárky
        .replace(/\s+/g, ' ') // Sloučí vícenásobné mezery
}

// Damerau-Levenshteinova vzdálenost (podporuje i prohození sousedních písmen)
function getDamerauLevenshteinDistance(a: string, b: string): number {
    const la = a.length
    const lb = b.length
    const d: number[][] = []

    for (let i = 0; i <= la; i++) {
        d[i] = []
        d[i][0] = i
    }
    for (let j = 0; j <= lb; j++) {
        d[0][j] = j
    }

    for (let i = 1; i <= la; i++) {
        for (let j = 1; j <= lb; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1

            d[i][j] = Math.min(
                d[i - 1][j] + 1,       // smazání
                d[i][j - 1] + 1,       // vložení
                d[i - 1][j - 1] + cost // náhrada
            )

            // Transpozice (prohození dvou sousedních písmen např. "pa" -> "ap")
            if (
                i > 1 &&
                j > 1 &&
                a[i - 1] === b[j - 2] &&
                a[i - 2] === b[j - 1]
            ) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
            }
        }
    }

    return d[la][lb]
}

export type ValidationResult = {
    isCorrect: boolean
    isTypo: boolean
    message?: string
}

export function validateAnswer(
    userGuess: string,
    secretAnswer: string,
    acceptedAliases: string[] = []
): ValidationResult {
    const cleanGuess = normalizeText(userGuess)
    const cleanSecret = normalizeText(secretAnswer)
    const cleanAliases = acceptedAliases.map(normalizeText)

    const allValidAnswers = [cleanSecret, ...cleanAliases]

    // 1. Přesná shoda (i bez diakritiky)
    if (allValidAnswers.includes(cleanGuess)) {
        return { isCorrect: true, isTypo: false }
    }

    // 2. Kontrola překlepu přes Damerau-Levenshtein
    // Pro krátká slova (5-9 znaků) tolerujeme vzdálenost 1.
    // Pro delší sousloví (10+ znaků, např. "karel capek") tolerujeme vzdálenost až 2.
    if (cleanGuess.length >= 5) {
        for (const valid of allValidAnswers) {
            const dist = getDamerauLevenshteinDistance(cleanGuess, valid)
            const maxAllowedDist = valid.length >= 10 ? 2 : 1

            if (dist > 0 && dist <= maxAllowedDist) {
                return {
                    isCorrect: false,
                    isTypo: true,
                    message: 'Těsně vedle! Máš v odpovědi drobný překlep. Oprav ho bez ztráty bodů.',
                }
            }
        }
    }

    return { isCorrect: false, isTypo: false }
}