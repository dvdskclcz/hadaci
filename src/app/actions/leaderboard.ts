'use server'

import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
    LeaderboardPeriod,
    LeaderboardPlayerEntry,
    LeaderboardPeriodData,
    FullLeaderboardData,
    getPraguePeriodBoundaries,
} from '@/lib/leaderboard-types'

function getAdminSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(url, serviceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    })
}

export async function getLeaderboardAction(): Promise<FullLeaderboardData> {
    const supabase = await createServerSupabaseClient()
    const adminSupabase = getAdminSupabaseClient()

    // 1. Zjistíme přihlášeného uživatele
    const {
        data: { user },
    } = await supabase.auth.getUser()
    const currentUserId = user?.id || null

    // 2. Časové hranice pro Europe/Prague
    const boundaries = getPraguePeriodBoundaries()

    // 3. Paralelní načtení profilů a vyřešených her
    const [profilesRes, riddleRes, detectiveRes] = await Promise.all([
        adminSupabase
            .from('profiles')
            .select('id, nickname, daily_streak_current, daily_streak_max, solve_streak_current, solve_streak_max'),
        adminSupabase
            .from('user_riddle_state')
            .select('user_id, score_earned, status, created_at, updated_at')
            .eq('status', 'SOLVED'),
        adminSupabase
            .from('user_detective_state')
            .select('user_id, score_earned, status, created_at, updated_at')
            .eq('status', 'SOLVED'),
    ])

    const profiles = profilesRes.data || []
    const riddleStates = riddleRes.data || []
    const detectiveStates = detectiveRes.data || []

    const profileMap = new Map<string, {
        id: string
        nickname: string
        daily_streak_current: number
        daily_streak_max: number
        solve_streak_current: number
        solve_streak_max: number
    }>()

    profiles.forEach((p) => {
        if (p.id) {
            profileMap.set(p.id, {
                id: p.id,
                nickname: p.nickname || 'Anonym',
                daily_streak_current: p.daily_streak_current ?? 0,
                daily_streak_max: p.daily_streak_max ?? 0,
                solve_streak_current: p.solve_streak_current ?? 0,
                solve_streak_max: p.solve_streak_max ?? 0,
            })
        }
    })

    // Pomocná agregační funkce pro vybrané období
    function buildPeriodData(
        period: LeaderboardPeriod,
        startDate: Date | null,
        label: string,
        rangeLabel: string
    ): LeaderboardPeriodData {
        type AggItem = {
            userId: string
            riddleScore: number
            riddleCount: number
            detectiveScore: number
            detectiveCount: number
        }

        const userAgg = new Map<string, AggItem>()

        const getOrCreate = (uid: string): AggItem => {
            let item = userAgg.get(uid)
            if (!item) {
                item = {
                    userId: uid,
                    riddleScore: 0,
                    riddleCount: 0,
                    detectiveScore: 0,
                    detectiveCount: 0,
                }
                userAgg.set(uid, item)
            }
            return item
        }

        // Zpracování denních hádanek
        for (const r of riddleStates) {
            if (!r.user_id) continue
            const solvedDate = new Date(r.updated_at || r.created_at || 0)
            if (startDate && solvedDate < startDate) continue

            const item = getOrCreate(r.user_id)
            const score = typeof r.score_earned === 'number' ? r.score_earned : 0
            item.riddleScore += score
            item.riddleCount += 1
        }

        // Zpracování detektivních výslechů
        for (const d of detectiveStates) {
            if (!d.user_id) continue
            const solvedDate = new Date(d.updated_at || d.created_at || 0)
            if (startDate && solvedDate < startDate) continue

            const item = getOrCreate(d.user_id)
            const score = typeof d.score_earned === 'number' ? d.score_earned : 100
            item.detectiveScore += score
            item.detectiveCount += 1
        }

        // Vytvoření hráčských záznamů
        const players: LeaderboardPlayerEntry[] = []

        if (period === 'all') {
            // Pro celkový žebříček zahrneme hráče s body i hráče se sériemi
            const allUserIds = new Set<string>([...userAgg.keys(), ...profileMap.keys()])
            for (const uid of allUserIds) {
                const agg = userAgg.get(uid)
                const prof = profileMap.get(uid)
                const riddleScore = agg?.riddleScore ?? 0
                const riddleCount = agg?.riddleCount ?? 0
                const detectiveScore = agg?.detectiveScore ?? 0
                const detectiveCount = agg?.detectiveCount ?? 0
                const totalScore = riddleScore + detectiveScore
                const solvedCount = riddleCount + detectiveCount
                const dailyStreakCurrent = prof?.daily_streak_current ?? 0
                const dailyStreakMax = prof?.daily_streak_max ?? 0
                const solveStreakCurrent = prof?.solve_streak_current ?? 0
                const solveStreakMax = prof?.solve_streak_max ?? 0

                // Zobrazíme hráče, kteří mají alespoň 1 bod nebo odehranou sérii
                if (totalScore > 0 || solvedCount > 0 || dailyStreakCurrent > 0 || solveStreakCurrent > 0) {
                    players.push({
                        userId: uid,
                        nickname: prof?.nickname || 'Anonym',
                        totalScore,
                        solvedCount,
                        riddleScore,
                        riddleCount,
                        detectiveScore,
                        detectiveCount,
                        dailyStreakCurrent,
                        dailyStreakMax,
                        solveStreakCurrent,
                        solveStreakMax,
                        isCurrentUser: uid === currentUserId,
                    })
                }
            }
        } else {
            // Pro týden a měsíc: pouze hráči, kteří v daném období získali body
            for (const [uid, agg] of userAgg.entries()) {
                const totalScore = agg.riddleScore + agg.detectiveScore
                const solvedCount = agg.riddleCount + agg.detectiveCount
                if (totalScore <= 0 && solvedCount <= 0) continue

                const prof = profileMap.get(uid)
                players.push({
                    userId: uid,
                    nickname: prof?.nickname || 'Anonym',
                    totalScore,
                    solvedCount,
                    riddleScore: agg.riddleScore,
                    riddleCount: agg.riddleCount,
                    detectiveScore: agg.detectiveScore,
                    detectiveCount: agg.detectiveCount,
                    dailyStreakCurrent: prof?.daily_streak_current ?? 0,
                    dailyStreakMax: prof?.daily_streak_max ?? 0,
                    solveStreakCurrent: prof?.solve_streak_current ?? 0,
                    solveStreakMax: prof?.solve_streak_max ?? 0,
                    isCurrentUser: uid === currentUserId,
                })
            }
        }

        // Výchozí řazení: nejvyšší celkové skóre sestupně, následně počet vyřešených her
        players.sort((a, b) => {
            if (b.totalScore !== a.totalScore) {
                return b.totalScore - a.totalScore
            }
            return b.solvedCount - a.solvedCount
        })

        return {
            period,
            label,
            rangeLabel,
            players,
        }
    }

    return {
        week: buildPeriodData('week', boundaries.week.startDate, boundaries.week.label, boundaries.week.rangeLabel),
        month: buildPeriodData('month', boundaries.month.startDate, boundaries.month.label, boundaries.month.rangeLabel),
        all: buildPeriodData('all', null, boundaries.all.label, boundaries.all.rangeLabel),
        currentUserId,
    }
}
