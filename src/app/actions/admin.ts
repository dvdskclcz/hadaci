'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { getLeaderboardAction } from '@/app/actions/leaderboard'
import { PromoGeneratorData } from '@/lib/promo-generator'

// Inicializace privátního Supabase klienta s plnými právy
function getAdminSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(url, serviceKey)
}

// Bezpečný otisk (hash) administračního hesla
function getAdminToken() {
    const password = process.env.ADMIN_PASSWORD || 'hadaci_fallback_secret'
    return crypto.createHash('sha256').update(`${password}_hadaci_secure_salt`).digest('hex')
}

// 1. Ověření admin hesla
export async function loginAdminAction(password: string) {
    const correctPassword = process.env.ADMIN_PASSWORD

    if (!correctPassword || password !== correctPassword) {
        return { error: 'Nesprávné administrační heslo.' }
    }

    const cookieStore = await cookies()
    cookieStore.set('hadaci_admin_session', getAdminToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 dní
        path: '/',
    })

    return { success: true }
}

// 2. Kontrola přihlášení admina
export async function verifyAdminSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get('hadaci_admin_session')
    return session?.value === getAdminToken()
}

// 3. Odhlášení admina
export async function logoutAdminAction() {
    const cookieStore = await cookies()
    cookieStore.delete('hadaci_admin_session')
    return { success: true }
}

// 4. Vytvoření nové hádanky (5 až 10 stop)
export async function createRiddleAction(formData: FormData) {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const title = (formData.get('title') as string)?.trim()
    const category = (formData.get('category') as string)?.trim()
    const secretAnswer = (formData.get('secret_answer') as string)?.trim()
    const publishDate = (formData.get('publish_date') as string)?.trim()
    const aliasesRaw = (formData.get('aliases') as string)?.trim() || ''

    const rawHints = formData.getAll('hints').map((h) => (typeof h === 'string' ? h.trim() : ''))

    if (!title || !category || !secretAnswer || !publishDate) {
        return { error: 'Vyplň prosím všechna povinná pole.' }
    }

    if (rawHints.length < 5 || rawHints.length > 10) {
        return { error: 'Hádanka musí mít 5 až 10 stop.' }
    }

    if (rawHints.some((h) => !h)) {
        return { error: 'Všechny přidané stopy musí být vyplněné.' }
    }

    const acceptedAliases = aliasesRaw
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)

    const supabase = getAdminSupabaseClient()

    const { error } = await supabase.from('riddles').insert({
        title,
        category,
        secret_answer: secretAnswer,
        type: 'PROGRESSIVE',
        accepted_aliases: acceptedAliases,
        hints: rawHints,
        publish_date: publishDate,
        is_active: true,
        is_daily: false,
    })

    if (error) {
        return { error: `Chyba při ukládání: ${error.message}` }
    }

    revalidatePath('/')
    revalidatePath('/archiv')
    revalidatePath('/admin')

    return { success: true }
}

// 5. Aktualizace existující hádanky
export async function updateRiddleAction(riddleId: string, formData: FormData) {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const title = (formData.get('title') as string)?.trim()
    const category = (formData.get('category') as string)?.trim()
    const secretAnswer = (formData.get('secret_answer') as string)?.trim()
    const publishDate = (formData.get('publish_date') as string)?.trim()
    const aliasesRaw = (formData.get('aliases') as string)?.trim() || ''

    const rawHints = formData.getAll('hints').map((h) => (typeof h === 'string' ? h.trim() : ''))

    if (!title || !category || !secretAnswer || !publishDate) {
        return { error: 'Vyplň prosím všechna povinná pole.' }
    }

    if (rawHints.length < 5 || rawHints.length > 10) {
        return { error: 'Hádanka musí mít 5 až 10 stop.' }
    }

    if (rawHints.some((h) => !h)) {
        return { error: 'Všechny stopy musí být vyplněné.' }
    }

    const acceptedAliases = aliasesRaw
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean)

    const supabase = getAdminSupabaseClient()

    const { error } = await supabase
        .from('riddles')
        .update({
            title,
            category,
            secret_answer: secretAnswer,
            accepted_aliases: acceptedAliases,
            hints: rawHints,
            publish_date: publishDate,
        })
        .eq('id', riddleId)

    if (error) {
        return { error: `Chyba při aktualizaci: ${error.message}` }
    }

    revalidatePath('/')
    revalidatePath('/archiv')
    revalidatePath(`/hadanka/${riddleId}`)
    revalidatePath('/admin')

    return { success: true }
}

// 6. Smazání hádanky
export async function deleteRiddleAction(riddleId: string) {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const supabase = getAdminSupabaseClient()
    const { error } = await supabase.from('riddles').delete().eq('id', riddleId)

    if (error) return { error: error.message }

    revalidatePath('/')
    revalidatePath('/archiv')
    revalidatePath('/admin')

    return { success: true }
}

// 7. Změna stavu komunitního námětu
export async function updateTopicSuggestionStatusAction(
    suggestionId: string,
    newStatus: 'NEW' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'REJECTED'
) {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const supabase = getAdminSupabaseClient()
    const { error } = await supabase
        .from('topic_suggestions')
        .update({ status: newStatus })
        .eq('id', suggestionId)

    if (error) return { error: error.message }

    revalidatePath('/admin')
    return { success: true }
}

// 8. Smazání komunitního námětu
export async function deleteTopicSuggestionAction(suggestionId: string) {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const supabase = getAdminSupabaseClient()
    const { error } = await supabase
        .from('topic_suggestions')
        .delete()
        .eq('id', suggestionId)

    if (error) return { error: error.message }

    revalidatePath('/admin')
    return { success: true }
}

// 9. Změna stavu reklamace
export async function updateReportStatusAction(
    reportId: string,
    newStatus: 'RESOLVED' | 'DISMISSED'
) {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const supabase = getAdminSupabaseClient()
    const { error } = await supabase
        .from('riddle_reports')
        .update({ status: newStatus })
        .eq('id', reportId)

    if (error) return { error: error.message }

    revalidatePath('/admin')
    return { success: true }
}

// 10. Smazání reklamace
export async function deleteReportAction(reportId: string) {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const supabase = getAdminSupabaseClient()
    const { error } = await supabase
        .from('riddle_reports')
        .delete()
        .eq('id', reportId)

    if (error) return { error: error.message }

    revalidatePath('/admin')
    return { success: true }
}

// 11. Načtení dat pro Promo & Sítě generátor (100% spoiler-free)
export async function getPromoGeneratorDataAction(): Promise<
    { error: string } | { data: PromoGeneratorData }
> {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const supabase = getAdminSupabaseClient()
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })

    // 1. Dnešní aktivní denní hádanka: VRAŤ POUZE category a clues[0] / hints[0] (žádná tajenka!)
    let { data: riddle } = await supabase
        .from('riddles')
        .select('category, hints, publish_date')
        .eq('publish_date', todayStr)
        .maybeSingle()

    if (!riddle) {
        const { data: latestRiddle } = await supabase
            .from('riddles')
            .select('category, hints, publish_date')
            .lte('publish_date', todayStr)
            .order('publish_date', { ascending: false })
            .limit(1)
            .maybeSingle()
        riddle = latestRiddle
    }

    let todayRiddle: PromoGeneratorData['todayRiddle'] = null
    if (riddle) {
        const firstClue =
            Array.isArray(riddle.hints) && riddle.hints.length > 0
                ? String(riddle.hints[0])
                : ''
        todayRiddle = {
            category: riddle.category || 'České reálie',
            firstClue,
            publishDate: riddle.publish_date,
        }
    }

    // 2. Aktivní Detektivní výslech: VRAŤ POUZE číslo spisu ze slug a initial_clue (žádná tajenka ani summary!)
    const { data: detectiveCase } = await supabase
        .from('detective_cases')
        .select('slug, initial_clue, publish_date')
        .eq('is_active', true)
        .lte('publish_date', todayStr)
        .order('publish_date', { ascending: false })
        .limit(1)
        .maybeSingle()

    let activeDetectiveCase: PromoGeneratorData['activeDetectiveCase'] = null
    if (detectiveCase) {
        const match = detectiveCase.slug.match(/^(\d+)/)
        const caseNumber = match ? `#${match[1]}` : `#${detectiveCase.slug}`
        activeDetectiveCase = {
            caseNumber,
            slug: detectiveCase.slug,
            initialClue: detectiveCase.initial_clue,
            publishDate: detectiveCase.publish_date,
        }
    }

    // 3. TOP 3 hráči z týdenního žebříčku
    let topPlayers: PromoGeneratorData['topPlayers'] = []
    let weekLabel = 'Aktuální týden'
    try {
        const leaderboard = await getLeaderboardAction()
        topPlayers = (leaderboard.week.players || []).slice(0, 3).map((p, idx) => ({
            rank: idx + 1,
            nickname: p.nickname,
            totalScore: p.totalScore,
            solvedCount: p.solvedCount,
        }))
        weekLabel = leaderboard.week.rangeLabel || leaderboard.week.label || 'Aktuální týden'
    } catch (err) {
        console.warn('Nepodařilo se načíst týdenní žebříček pro promo generátor:', err)
    }

    // 4. Celkový počet publikovaných her v archivu
    const [riddlesCountRes, casesCountRes] = await Promise.all([
        supabase
            .from('riddles')
            .select('*', { count: 'exact', head: true })
            .lte('publish_date', todayStr),
        supabase
            .from('detective_cases')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true)
            .lte('publish_date', todayStr),
    ])

    const riddlesCount = riddlesCountRes.count || 0
    const detectiveCasesCount = casesCountRes.count || 0

    return {
        data: {
            todayRiddle,
            activeDetectiveCase,
            topPlayers,
            weekLabel,
            archiveStats: {
                riddlesCount,
                detectiveCasesCount,
                totalCount: riddlesCount + detectiveCasesCount,
            },
        },
    }
}