export type LeaderboardPeriod = 'week' | 'month' | 'all'

export interface LeaderboardPlayerEntry {
    userId: string
    nickname: string
    totalScore: number
    solvedCount: number
    riddleScore: number
    riddleCount: number
    detectiveScore: number
    detectiveCount: number
    dailyStreakCurrent: number
    dailyStreakMax: number
    solveStreakCurrent: number
    solveStreakMax: number
    isCurrentUser?: boolean
}

export interface LeaderboardPeriodData {
    period: LeaderboardPeriod
    label: string         // např. "16. 11. – 22. 11. 2026" | "Listopad 2026" | "Síň slávy"
    rangeLabel: string    // např. "Pondělí 16. 11. – Neděle 22. 11. 2026"
    players: LeaderboardPlayerEntry[]
}

export interface FullLeaderboardData {
    week: LeaderboardPeriodData
    month: LeaderboardPeriodData
    all: LeaderboardPeriodData
    currentUserId?: string | null
}

/**
 * Vrací ISO řetězec půlnoci (00:00:00) v časovém pásmu Europe/Prague pro daný rok, měsíc a den.
 */
export function getPragueMidnightISO(year: number, month: number, day: number): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${year}-${pad(month)}-${pad(day)}T00:00:00`

    // Otestujeme standardní zimní čas CET (+01:00)
    const d1 = new Date(`${dateStr}+01:00`)
    const hour1 = parseInt(
        new Intl.DateTimeFormat('en-US', {
            timeZone: 'Europe/Prague',
            hour: 'numeric',
            hour12: false,
        }).format(d1),
        10
    )

    if (hour1 === 0 || hour1 === 24) {
        return d1.toISOString()
    }
    // Letní čas CEST (+02:00)
    return new Date(`${dateStr}+02:00`).toISOString()
}

/**
 * Spočítá časové hranice a popisky pro aktuální týden a měsíc v časovém pásmu Europe/Prague.
 */
export function getPraguePeriodBoundaries(now = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Prague',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'short',
    })
    const parts = formatter.formatToParts(now)
    let year = 2026, month = 11, day = 22, weekday = 'Sun'
    for (const part of parts) {
        if (part.type === 'year') year = parseInt(part.value, 10)
        if (part.type === 'month') month = parseInt(part.value, 10)
        if (part.type === 'day') day = parseInt(part.value, 10)
        if (part.type === 'weekday') weekday = part.value
    }

    const dayMap: Record<string, number> = {
        Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
    }
    const dayOfWeek = dayMap[weekday] ?? 1

    // Pondělí a neděle aktuálního týdne
    const currentPragueMidnightEpoch = Date.UTC(year, month - 1, day)
    const mondayEpoch = currentPragueMidnightEpoch - (dayOfWeek - 1) * 86400000
    const sundayEpoch = currentPragueMidnightEpoch + (7 - dayOfWeek) * 86400000

    const mondayDate = new Date(mondayEpoch)
    const monY = mondayDate.getUTCFullYear()
    const monM = mondayDate.getUTCMonth() + 1
    const monD = mondayDate.getUTCDate()

    const sundayDate = new Date(sundayEpoch)
    const sunY = sundayDate.getUTCFullYear()
    const sunM = sundayDate.getUTCMonth() + 1
    const sunD = sundayDate.getUTCDate()

    const weekStartISO = getPragueMidnightISO(monY, monM, monD)
    const monthStartISO = getPragueMidnightISO(year, month, 1)

    // Poslední den v aktuálním měsíci
    const lastDayOfMonth = new Date(year, month, 0).getDate()

    const CZECH_MONTHS = [
        'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
        'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
    ]
    const czechMonthName = CZECH_MONTHS[month - 1] || ''

    return {
        week: {
            startISO: weekStartISO,
            startDate: new Date(weekStartISO),
            label: `${monD}. ${monM}. – ${sunD}. ${sunM}. ${sunY}`,
            rangeLabel: `Pondělí ${monD}. ${monM}. – Neděle ${sunD}. ${sunM}. ${sunY}`,
        },
        month: {
            startISO: monthStartISO,
            startDate: new Date(monthStartISO),
            label: `${czechMonthName} ${year}`,
            rangeLabel: `1. ${month}. – ${lastDayOfMonth}. ${month}. ${year}`,
        },
        all: {
            label: 'Síň slávy',
            rangeLabel: 'Celkové historické pořadí',
        },
    }
}
