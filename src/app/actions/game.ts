'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { validateAnswer } from '@/lib/game/validator'

// Zajistí existenci anonymního uživatele
async function getOrCreateUser(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user

    const { data: anonData, error } = await supabase.auth.signInAnonymously()
    if (error) throw new Error(`Chyba anonymního přihlášení: ${error.message}`)
    return anonData.user
}

// 1. Odeslání tipu
export async function submitGuessAction(riddleId: string, guess: string) {
    const supabase = await createServerSupabaseClient()
    const user = await getOrCreateUser(supabase)

    // Načteme celou hádanku (tajenku drží pouze server)
    const { data: riddle, error: rErr } = await supabase
        .from('riddles')
        .select('*')
        .eq('id', riddleId)
        .single()

    if (rErr || !riddle) return { error: 'Hádanka nebyla nalezena.' }

    // Načteme nebo založíme stav hry pro tohoto hráče
    let { data: state } = await supabase
        .from('user_riddle_state')
        .select('*')
        .eq('user_id', user.id)
        .eq('riddle_id', riddleId)
        .maybeSingle()

    if (!state) {
        const { data: newState } = await supabase
            .from('user_riddle_state')
            .insert({
                user_id: user.id,
                riddle_id: riddleId,
                current_step: 1,
                wrong_guesses_count: 0,
                status: 'IN_PROGRESS',
            })
            .select()
            .single()
        state = newState
    }

    if (state.status === 'SOLVED') {
        return { error: 'Tuto hádanku už máš úspěšně vyřešenou!' }
    }

    const validation = validateAnswer(guess, riddle.secret_answer, riddle.accepted_aliases)

    // Případ A: Překlep -> nestrháváme pokus ani body
    if (validation.isTypo) {
        return {
            status: 'TYPO',
            message: validation.message,
            currentStep: state.current_step,
        }
    }

    const allHints = riddle.hints as string[]
    const totalHints = allHints.length

    // Případ B: Správná odpověď -> Výhra!
    if (validation.isCorrect) {
        // Výpočet bodů (start na 100 b., odečet za nápovědy a chybné pokusy)
        const penaltyPerHint = 100 / totalHints
        const hintPenalty = (state.current_step - 1) * penaltyPerHint
        const wrongPenalty = state.wrong_guesses_count * 5
        const finalScore = Math.max(10, Math.round(100 - hintPenalty - wrongPenalty))

        await supabase
            .from('user_riddle_state')
            .update({
                status: 'SOLVED',
                score_earned: finalScore,
                updated_at: new Date().toISOString(),
            })
            .eq('id', state.id)

        return {
            status: 'SOLVED',
            score: finalScore,
            secretAnswer: riddle.secret_answer,
            hintsRevealed: allHints.slice(0, state.current_step),
        }
    }

    // Případ C: Špatná odpověď -> Posun na další nápovědu + penalizace
    const nextStep = state.current_step + 1
    const isOutOfHints = nextStep > totalHints

    await supabase
        .from('user_riddle_state')
        .update({
            current_step: Math.min(nextStep, totalHints),
            wrong_guesses_count: state.wrong_guesses_count + 1,
            status: isOutOfHints ? 'IN_DRAWER' : 'IN_PROGRESS',
            updated_at: new Date().toISOString(),
        })
        .eq('id', state.id)

    return {
        status: isOutOfHints ? 'IN_DRAWER' : 'WRONG',
        message: isOutOfHints
            ? 'Došly ti nápovědy! Hádanka je odložena do šuplíku. Můžeš bádat dál.'
            : 'Bohužel vedle. Odemkla se ti další stopa (-5 b. za chybný tip).',
        currentStep: Math.min(nextStep, totalHints),
        hintsRevealed: allHints.slice(0, Math.min(nextStep, totalHints)),
    }
}

// 2. Vyžádání další nápovědy bez tipování
export async function requestNextHintAction(riddleId: string) {
    const supabase = await createServerSupabaseClient()
    const user = await getOrCreateUser(supabase)

    const { data: riddle } = await supabase
        .from('riddles')
        .select('hints')
        .eq('id', riddleId)
        .single()

    let { data: state } = await supabase
        .from('user_riddle_state')
        .select('*')
        .eq('user_id', user.id)
        .eq('riddle_id', riddleId)
        .maybeSingle()

    if (!state || !riddle) return { error: 'Chyba stavu.' }

    const allHints = riddle.hints as string[]
    const nextStep = Math.min(state.current_step + 1, allHints.length)

    await supabase
        .from('user_riddle_state')
        .update({
            current_step: nextStep,
            updated_at: new Date().toISOString(),
        })
        .eq('id', state.id)

    return {
        currentStep: nextStep,
        hintsRevealed: allHints.slice(0, nextStep),
    }
}

// 3. Uložení informace o tom, zda a jakou AI hráč použil
export async function recordAiUsageAction(
    riddleId: string,
    usedAi: boolean,
    aiModelName?: string
) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Uživatel nenalezen.' }

    const { error } = await supabase
        .from('user_riddle_state')
        .update({
            used_ai: usedAi,
            ai_model_name: usedAi ? (aiModelName || 'Nespecifikováno') : 'Čistá hlava',
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('riddle_id', riddleId)

    if (error) return { error: error.message }
    return { success: true }
}

import { revalidatePath } from 'next/cache'

// ... stávající kód submitGuessAction, requestNextHintAction, recordAiUsageAction ...

// 4. Uložení nebo změna hráčské přezdívky
export async function updateNicknameAction(nickname: string) {
    const cleanNick = nickname.trim().slice(0, 30)
    if (!cleanNick) return { error: 'Přezdívka nesmí být prázdná.' }

    const supabase = await createServerSupabaseClient()
    const user = await getOrCreateUser(supabase)

    const { error } = await supabase
        .from('profiles')
        .upsert(
            {
                id: user.id,
                nickname: cleanNick,
            },
            { onConflict: 'id' }
        )

    if (error) return { error: error.message }

    // Okamžitě aktualizujeme data na stránce žebříčku i na hlavní stránce
    revalidatePath('/zebricek')
    revalidatePath('/')

    return { success: true, nickname: cleanNick }
}

// 5. Získání stávající přezdívky hráče
export async function getNicknameAction() {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', user.id)
        .maybeSingle()

    return data?.nickname || null
}

// 6. Uložení reklamace / hlášení problému s hádankou
export async function submitRiddleReportAction(
    riddleId: string,
    reportType: string,
    message?: string
) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
        .from('riddle_reports')
        .insert({
            riddle_id: riddleId,
            user_id: user?.id || null,
            report_type: reportType,
            message: message?.trim() || null,
        })

    if (error) return { error: error.message }
    return { success: true }
}

// 7. Uložení tipu na nové téma nebo osobnost od hráče
export async function submitTopicSuggestionAction(
    categoryType: string,
    suggestion: string
) {
    const cleanSuggestion = suggestion.trim()
    if (!cleanSuggestion) {
        return { error: 'Napiš prosím svůj tip nebo nápad.' }
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
        .from('topic_suggestions')
        .insert({
            user_id: user?.id || null,
            category_type: categoryType || 'Obecný tip',
            suggestion: cleanSuggestion.slice(0, 500),
        })

    if (error) return { error: error.message }
    return { success: true }
}