'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import {
    calculateDetectiveStats,
    getDetectiveBadges,
    getRiddleBadges,
    PlayerProfileData,
    DetectiveStats,
    RiddleStats,
    BadgeItem,
} from '@/lib/badges'

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

export async function getPlayerProfileAction(): Promise<PlayerProfileData | null> {
    const supabase = await createServerSupabaseClient()
    const adminSupabase = getAdminSupabaseClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })

    // 1. Profil uživatele
    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

    // 2. Detektivní výslech: stavy a spisy
    const [{ data: detectiveStates }, { data: allCases }] = await Promise.all([
        adminSupabase
            .from('user_detective_state')
            .select('case_id, status, score_earned, questions_log, wrong_guesses_count, is_drawer_repair, drawer_attempts, created_at, updated_at')
            .eq('user_id', user.id),
        adminSupabase
            .from('detective_cases')
            .select('id, slug, publish_date')
            .lte('publish_date', todayStr)
            .eq('is_active', true)
            .order('publish_date', { ascending: true }),
    ])

    const { stats: detectiveStats, hasDrawerComeback } = calculateDetectiveStats(
        detectiveStates || [],
        allCases || []
    )

    const detectiveBadges = getDetectiveBadges(detectiveStats, hasDrawerComeback)

    // 3. Denní hádanky: stavy hráče
    const { data: riddleStates } = await adminSupabase
        .from('user_riddle_state')
        .select('riddle_id, status, score_earned, used_ai, wrong_guesses_count')
        .eq('user_id', user.id)

    const allRiddleStates = riddleStates || []
    const riddleSolved = allRiddleStates.filter((r) => r.status === 'SOLVED')
    const riddleSolvedCount = riddleSolved.length
    const riddleAttemptedCount = allRiddleStates.length
    const riddleSuccessRate =
        riddleAttemptedCount > 0
            ? Math.round((riddleSolvedCount / riddleAttemptedCount) * 100)
            : 0
    const riddleTotalScore = riddleSolved.reduce(
        (acc, r) => acc + (typeof r.score_earned === 'number' ? r.score_earned : 0),
        0
    )

    const riddleStats: RiddleStats = {
        solvedCount: riddleSolvedCount,
        attemptedCount: riddleAttemptedCount,
        successRate: riddleSuccessRate,
        totalScore: riddleTotalScore,
        dailyStreakCurrent: profile?.daily_streak_current ?? 0,
        dailyStreakMax: profile?.daily_streak_max ?? 0,
        solveStreakCurrent: profile?.solve_streak_current ?? 0,
        solveStreakMax: profile?.solve_streak_max ?? 0,
    }

    const pureMindCount = riddleSolved.filter((r) => r.used_ai === false).length
    const riddleBadges = getRiddleBadges(riddleStats, pureMindCount)

    const displayName =
        user.user_metadata?.full_name ||
        profile?.nickname ||
        user.email?.split('@')[0] ||
        'Detektiv'

    return {
        user: {
            id: user.id,
            email: user.email,
            displayName,
            avatarUrl: user.user_metadata?.avatar_url,
            nickname: profile?.nickname || null,
        },
        detectiveStats,
        riddleStats,
        badges: [...detectiveBadges, ...riddleBadges],
    }
}
