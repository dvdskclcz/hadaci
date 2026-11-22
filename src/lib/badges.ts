export interface BadgeItem {
    id: string
    name: string
    icon: string
    category: 'detective' | 'riddle'
    description: string
    conditionText: string
    unlocked: boolean
    progressText?: string
}

export interface DetectiveStats {
    solvedCount: number
    attemptedCount: number
    successRate: number
    avgQuestions: number | null
    bestQuestions: number | null
    currentStreak: number
    maxStreak: number
}

export interface RiddleStats {
    solvedCount: number
    attemptedCount: number
    successRate: number
    totalScore: number
    dailyStreakCurrent: number
    dailyStreakMax: number
    solveStreakCurrent: number
    solveStreakMax: number
}

export interface PlayerProfileData {
    user: {
        id: string
        email?: string
        displayName: string
        avatarUrl?: string
        nickname?: string
    }
    detectiveStats: DetectiveStats
    riddleStats: RiddleStats
    badges: BadgeItem[]
}

/**
 * Výpočet statistik Detektivního výslechu z databáze user_detective_state
 */
export function calculateDetectiveStats(
    userStates: any[],
    allCases: Array<{ id: string; publish_date?: string; slug?: string }> = []
): {
    stats: DetectiveStats
    hasDrawerComeback: boolean
} {
    const caseDateMap = new Map<string, string>()
    for (const c of allCases) {
        if (c.id && c.publish_date) {
            caseDateMap.set(c.id, c.publish_date)
        }
    }

    const attemptedCount = userStates.length
    const solvedStates = userStates.filter((s) => s.status === 'SOLVED')
    const solvedCount = solvedStates.length
    const successRate = attemptedCount > 0 ? Math.round((solvedCount / attemptedCount) * 100) : 0

    const questionsList: number[] = solvedStates.map((s) => {
        if (Array.isArray(s.questions_log)) return s.questions_log.length
        return 0
    })

    const avgQuestions =
        solvedCount > 0
            ? Math.round((questionsList.reduce((acc, val) => acc + val, 0) / solvedCount) * 10) / 10
            : null

    const bestQuestions = solvedCount > 0 ? Math.min(...questionsList) : null

    // Řazení podle data vydání případu vzestupně pro sledování sérií
    const sortedAttempts = [...userStates].sort((a, b) => {
        const dateA = caseDateMap.get(a.case_id) || a.created_at || ''
        const dateB = caseDateMap.get(b.case_id) || b.created_at || ''
        return dateA.localeCompare(dateB)
    })

    let runningStreak = 0
    let maxStreak = 0

    for (const item of sortedAttempts) {
        if (item.status === 'SOLVED') {
            runningStreak++
            if (runningStreak > maxStreak) {
                maxStreak = runningStreak
            }
        } else if (item.status === 'DRAWER') {
            runningStreak = 0
        }
        // IN_PROGRESS neukončuje sérii ani ji nenavyšuje
    }

    const currentStreak = runningStreak

    const hasDrawerComeback = solvedStates.some(
        (s) => s.is_drawer_repair === true || (typeof s.drawer_attempts === 'number' && s.drawer_attempts > 0)
    )

    return {
        stats: {
            solvedCount,
            attemptedCount,
            successRate,
            avgQuestions,
            bestQuestions,
            currentStreak,
            maxStreak,
        },
        hasDrawerComeback,
    }
}

/**
 * 5 odznaků pro Detektivní výslech dle specifikace
 */
export function getDetectiveBadges(
    stats: DetectiveStats,
    hasDrawerComeback: boolean
): BadgeItem[] {
    return [
        {
            id: 'detective_first',
            name: 'Zelenáč u sboru',
            icon: '🕵️',
            category: 'detective',
            description: 'Vyřeš svůj 1. detektivní spis',
            conditionText: 'Vyřeš alespoň 1 spis',
            unlocked: stats.solvedCount >= 1,
            progressText: stats.solvedCount >= 1 ? 'Splněno' : `${stats.solvedCount} / 1`,
        },
        {
            id: 'detective_fast',
            name: 'Blesková dedukce',
            icon: '⚡',
            category: 'detective',
            description: 'Uzavři spis na 5 nebo méně položených otázek',
            conditionText: 'Uzavři spis na ≤ 5 otázek',
            unlocked: stats.bestQuestions !== null && stats.bestQuestions <= 5,
            progressText:
                stats.bestQuestions !== null
                    ? stats.bestQuestions <= 5
                        ? `Rekord: ${stats.bestQuestions} ot.`
                        : `Rekord: ${stats.bestQuestions} ot. (cíl: ≤ 5)`
                    : 'Zatím neodehráno',
        },
        {
            id: 'detective_streak_3',
            name: 'Neomylný vyšetřovatel',
            icon: '🔥',
            category: 'detective',
            description: 'Vyřeš 3 detektivní spisy v řadě',
            conditionText: 'Vyřeš 3 spisy v řadě bez neuzavřeného spisu',
            unlocked: stats.currentStreak >= 3 || stats.maxStreak >= 3,
            progressText:
                stats.currentStreak >= 3 || stats.maxStreak >= 3
                    ? 'Splněno'
                    : `Série: ${stats.currentStreak} / 3`,
        },
        {
            id: 'detective_drawer_comeback',
            name: 'Návrat ze šuplíku',
            icon: '🔄',
            category: 'detective',
            description: 'Úspěšně vyřeš spis, který byl dříve odložen do šuplíku',
            conditionText: 'Úspěšná odveta spisu ze šuplíku',
            unlocked: hasDrawerComeback,
            progressText: hasDrawerComeback ? 'Splněno' : 'Vyřeš spis v odvetě ze šuplíku',
        },
        {
            id: 'detective_master_5',
            name: 'Šéfinspektor',
            icon: '🏆',
            category: 'detective',
            description: 'Uzavři alespoň 5 detektivních spisů',
            conditionText: 'Vyřeš celkem 5 spisů',
            unlocked: stats.solvedCount >= 5,
            progressText: stats.solvedCount >= 5 ? 'Splněno' : `${stats.solvedCount} / 5`,
        },
    ]
}

/**
 * 5 odznaků pro klasické Denní hádanky
 */
export function getRiddleBadges(
    stats: RiddleStats,
    pureMindCount: number
): BadgeItem[] {
    return [
        {
            id: 'riddle_first',
            name: 'První stopa',
            icon: '🌟',
            category: 'riddle',
            description: 'Vyřeš svou 1. denní hádanku',
            conditionText: 'Uhodni alespoň 1 hádanku',
            unlocked: stats.solvedCount >= 1,
            progressText: stats.solvedCount >= 1 ? 'Splněno' : `${stats.solvedCount} / 1`,
        },
        {
            id: 'riddle_streak_3',
            name: 'Denní vytrvalec',
            icon: '🔥',
            category: 'riddle',
            description: 'Udrž denní sérii alespoň 3 dny v řadě',
            conditionText: 'Denní série alespoň 3 dny',
            unlocked: stats.dailyStreakCurrent >= 3 || stats.dailyStreakMax >= 3,
            progressText:
                stats.dailyStreakCurrent >= 3 || stats.dailyStreakMax >= 3
                    ? 'Splněno'
                    : `Série: ${stats.dailyStreakCurrent} / 3 dní`,
        },
        {
            id: 'riddle_streak_7',
            name: 'Týdenní šampion',
            icon: '⚡',
            category: 'riddle',
            description: 'Udrž denní sérii alespoň 7 dní v řadě',
            conditionText: 'Denní série 7 dní v kuse',
            unlocked: stats.dailyStreakCurrent >= 7 || stats.dailyStreakMax >= 7,
            progressText:
                stats.dailyStreakCurrent >= 7 || stats.dailyStreakMax >= 7
                    ? 'Splněno'
                    : `Série: ${stats.dailyStreakCurrent} / 7 dní`,
        },
        {
            id: 'riddle_master_5',
            name: 'Mistr hádanek',
            icon: '🎯',
            category: 'riddle',
            description: 'Uhodni 5 hádanek v řadě bez jediné chyby',
            conditionText: 'Mistrovská série 5 vyřešených hádanek za sebou',
            unlocked: stats.solveStreakCurrent >= 5 || stats.solveStreakMax >= 5,
            progressText:
                stats.solveStreakCurrent >= 5 || stats.solveStreakMax >= 5
                    ? 'Splněno'
                    : `V řadě: ${stats.solveStreakCurrent} / 5`,
        },
        {
            id: 'riddle_pure_mind',
            name: 'Čistá hlava',
            icon: '🧠',
            category: 'riddle',
            description: 'Vyřeš hádanku bez pomoci AI partnera',
            conditionText: 'Uhodni hádanku jako Čistá hlava',
            unlocked: pureMindCount >= 1,
            progressText: pureMindCount >= 1 ? 'Splněno' : 'Vyřeš hádanku bez AI',
        },
    ]
}
