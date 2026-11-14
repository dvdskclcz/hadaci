'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { validateAnswer } from '@/lib/game/validator'
import { calculateNewStreaks } from '@/lib/streaks'
import { getDetectiveRefereeSystemPrompt } from '@/lib/detective-prompt'

// Privátní admin klient obcházející RLS na serveru
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

export interface QuestionItem {
    id: string
    question: string
    verdict: 'ANO' | 'NE' | 'NELZE_OVERIT'
    timestamp: string
    penalty: number
}

export interface DetectiveCasePublic {
    id: string
    slug: string
    publish_date: string
    entity_type: 'person' | 'place' | 'object' | 'event' | 'concept'
    difficulty: 'easy' | 'medium' | 'hard'
    initial_clue: string
    is_active?: boolean
}

export interface UserDetectiveState {
    status: 'IN_PROGRESS' | 'SOLVED' | 'DRAWER'
    score_earned: number
    questions_log: QuestionItem[]
    wrong_guesses_count: number
    is_drawer_repair: boolean
    secret_answer?: string | null
}

// Pomocná funkce pro aktualizaci sérií
async function updateDetectiveUserStreaks(
    supabase: any,
    userId: string,
    isFirstAttempt: boolean,
    isSolved: boolean,
    todayDateStr: string
) {
    if (!isFirstAttempt) return null

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('daily_streak_current, daily_streak_max, last_daily_date, solve_streak_current, solve_streak_max')
            .eq('id', userId)
            .maybeSingle()

        const currentProfile = {
            daily_streak_current: profile?.daily_streak_current ?? 0,
            daily_streak_max: profile?.daily_streak_max ?? 0,
            last_daily_date: profile?.last_daily_date ?? null,
            solve_streak_current: profile?.solve_streak_current ?? 0,
            solve_streak_max: profile?.solve_streak_max ?? 0,
        }

        const newStreaks = calculateNewStreaks(currentProfile, {
            userId,
            isFirstAttempt,
            isDailyRiddle: false, // Výslech je týdenní případ -> započítává se do Mistrovské série
            isSolved,
            todayDateStr,
        })

        if (newStreaks) {
            await supabase
                .from('profiles')
                .update(newStreaks)
                .eq('id', userId)
        }

        return newStreaks
    } catch (err) {
        console.warn('Nepodařilo se aktualizovat série v profiles pro detektivní mód:', err)
        return null
    }
}

// 1. Načtení aktivního případu (nikdy nevrací secret_answer pro nevyřešené hry)
export async function getActiveDetectiveCaseAction(slug?: string): Promise<{
    currentCase: DetectiveCasePublic | null
    allCases: DetectiveCasePublic[]
    userState: UserDetectiveState | null
    error?: string
}> {
    const adminSupabase = getAdminSupabaseClient()
    const supabase = await createServerSupabaseClient()
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })
    const SAFE_COLUMNS = 'id, slug, publish_date, entity_type, difficulty, initial_clue, is_active'

    // Seznam všech dostupných publikovaných případů načtených přes admin klienta (obchází RLS)
    const { data: allCasesData, error: allCasesError } = await adminSupabase
        .from('detective_cases')
        .select(SAFE_COLUMNS)
        .lte('publish_date', todayStr)
        .eq('is_active', true)
        .order('publish_date', { ascending: false })

    if (allCasesError) {
        console.warn('⚠️ Chyba při načítání případů detective_cases z DB:', allCasesError)
    }

    let allCases = (allCasesData as DetectiveCasePublic[]) || []
    let targetCase: any = null

    // Pokud byl předán konkrétní slug, pokusíme se načíst daný případ
    if (slug) {
        const { data: slugData, error: slugError } = await adminSupabase
            .from('detective_cases')
            .select(SAFE_COLUMNS)
            .eq('slug', slug)
            .lte('publish_date', todayStr)
            .eq('is_active', true)
            .maybeSingle()

        if (slugError) {
            console.warn(`⚠️ Chyba při načítání případu podle slug "${slug}":`, slugError)
        }
        targetCase = slugData

        // Fallback: Pokud slug neodpovídá sloupci slug, zkusíme sloupec id
        if (!targetCase) {
            const { data: idData } = await adminSupabase
                .from('detective_cases')
                .select(SAFE_COLUMNS)
                .eq('id', slug)
                .lte('publish_date', todayStr)
                .eq('is_active', true)
                .maybeSingle()

            if (idData) {
                targetCase = idData
            }
        }
    }

    // Pokud nemáme targetCase ze slugu, vezmeme nejnovější z publikovaných
    if (!targetCase && allCases.length > 0) {
        targetCase = allCases[0]
    }

    // Fallback 1: Pokud žádný případ nevyhovuje filtru publish_date <= dnes, zkusíme načíst jakýkoliv aktivní případ
    if (!targetCase) {
        console.warn(`⚠️ Žádný případ s publish_date <= ${todayStr} nenalezen. Zkouším načíst případ bez časového filtru...`)
        const { data: fallbackCase, error: fbErr } = await adminSupabase
            .from('detective_cases')
            .select(SAFE_COLUMNS)
            .order('publish_date', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (fbErr) {
            console.warn('⚠️ Chyba fallback dotazu na detective_cases:', fbErr)
        }
        if (fallbackCase) {
            targetCase = fallbackCase
        }
    }

    // Fallback 2: Zkusíme přímo konkrétní slug '001-karel-capek'
    if (!targetCase) {
        const { data: capekCase, error: capekErr } = await adminSupabase
            .from('detective_cases')
            .select(SAFE_COLUMNS)
            .eq('slug', '001-karel-capek')
            .maybeSingle()

        if (capekErr) {
            console.warn('⚠️ Chyba dotazu na 001-karel-capek:', capekErr)
        }
        if (capekCase) {
            targetCase = capekCase
        }
    }

    // Fallback 3: Pokud databáze nevrátila vůbec nic, načteme případ z lokálního JSON souboru
    if (!targetCase) {
        try {
            const fs = await import('node:fs')
            const path = await import('node:path')
            const jsonPath = path.join(process.cwd(), 'content', 'vyslech', '001-karel-capek', 'case.json')
            if (fs.existsSync(jsonPath)) {
                const raw = fs.readFileSync(jsonPath, 'utf8')
                const parsed = JSON.parse(raw)
                targetCase = {
                    id: '00000000-0000-0000-0000-000000000001',
                    slug: parsed.slug || '001-karel-capek',
                    publish_date: parsed.publish_date || todayStr,
                    entity_type: parsed.entity_type || 'person',
                    difficulty: parsed.difficulty || 'medium',
                    initial_clue: parsed.initial_clue || '',
                    is_active: true,
                }
                console.log('ℹ️ Aktivován lokální záložní případ 001-karel-capek z case.json.')
            }
        } catch (localErr) {
            console.warn('⚠️ Nelze načíst lokální záložní case.json:', localErr)
        }
    }

    if (!targetCase) {
        return { currentCase: null, allCases: [], userState: null }
    }

    if (allCases.length === 0) {
        allCases = [targetCase]
    }

    // Načteme stav přihlášeného uživatele (používáme striktně .maybeSingle())
    let userState: UserDetectiveState | null = null

    try {
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
            // Nepřihlášený uživatel – v pořádku, pokračuje se bez DB stavu
        } else if (user && targetCase.id) {
            const { data: dbState, error: stateError } = await adminSupabase
                .from('user_detective_state')
                .select('status, score_earned, questions_log, wrong_guesses_count, is_drawer_repair')
                .eq('user_id', user.id)
                .eq('case_id', targetCase.id)
                .maybeSingle()

            if (stateError) {
                console.warn('⚠️ Chyba při čtení user_detective_state:', stateError)
            }

            if (dbState) {
                userState = {
                    status: dbState.status,
                    score_earned: dbState.score_earned,
                    questions_log: (dbState.questions_log as QuestionItem[]) || [],
                    wrong_guesses_count: dbState.wrong_guesses_count || 0,
                    is_drawer_repair: dbState.is_drawer_repair || false,
                }

                // Tajenku vracíme POUZE pokud je případ již úspěšně vyřešen
                if (dbState.status === 'SOLVED') {
                    const { data: secretData, error: secretError } = await adminSupabase
                        .from('detective_cases')
                        .select('secret_answer')
                        .eq('id', targetCase.id)
                        .maybeSingle()

                    if (secretError) {
                        console.warn('⚠️ Chyba při načítání secret_answer pro vyřešený případ:', secretError)
                    }
                    userState.secret_answer = secretData?.secret_answer || null
                }
            }
        }
    } catch (userErr) {
        console.warn('⚠️ Neočekávaná chyba při načítání stavu hráče:', userErr)
    }

    return {
        currentCase: {
            id: targetCase.id,
            slug: targetCase.slug,
            publish_date: targetCase.publish_date,
            entity_type: targetCase.entity_type,
            difficulty: targetCase.difficulty,
            initial_clue: targetCase.initial_clue,
        },
        allCases: allCases.map((c) => ({
            id: c.id,
            slug: c.slug,
            publish_date: c.publish_date,
            entity_type: c.entity_type,
            difficulty: c.difficulty,
            initial_clue: c.initial_clue,
        })),
        userState,
    }
}

export interface DetectiveArchiveCase {
    id: string
    slug: string
    publish_date: string
    entity_type: 'person' | 'place' | 'object' | 'event' | 'concept'
    difficulty: 'easy' | 'medium' | 'hard'
    initial_clue: string
    secret_answer?: string | null
}

export interface DetectiveUserArchiveState {
    status: 'IN_PROGRESS' | 'SOLVED' | 'DRAWER'
    score_earned: number
    questions_count: number
    is_drawer_repair: boolean
    secret_answer?: string | null
    updated_at?: string
}

// 1b. Načtení všech publikovaných případů pro Archiv a Šuplík
export async function getPublishedDetectiveCasesAction(): Promise<{
    cases: DetectiveArchiveCase[]
    userStates: Record<string, DetectiveUserArchiveState>
}> {
    const adminSupabase = getAdminSupabaseClient()
    const supabase = await createServerSupabaseClient()
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })
    const SAFE_COLUMNS = 'id, slug, publish_date, entity_type, difficulty, initial_clue, is_active'

    const { data: casesData, error: casesError } = await adminSupabase
        .from('detective_cases')
        .select(SAFE_COLUMNS)
        .lte('publish_date', todayStr)
        .eq('is_active', true)
        .order('publish_date', { ascending: false })

    if (casesError) {
        console.warn('⚠️ Chyba při načítání případů pro archiv:', casesError)
    }

    let cases: DetectiveArchiveCase[] = (casesData as DetectiveArchiveCase[]) || []

    // Fallback pokud je databáze prázdná, zkusíme načíst lokální soubor
    if (cases.length === 0) {
        try {
            const fs = await import('node:fs')
            const path = await import('node:path')
            const jsonPath = path.join(process.cwd(), 'content', 'vyslech', '001-karel-capek', 'case.json')
            if (fs.existsSync(jsonPath)) {
                const raw = fs.readFileSync(jsonPath, 'utf8')
                const parsed = JSON.parse(raw)
                if (parsed.publish_date <= todayStr) {
                    cases.push({
                        id: '00000000-0000-0000-0000-000000000001',
                        slug: parsed.slug || '001-karel-capek',
                        publish_date: parsed.publish_date || todayStr,
                        entity_type: parsed.entity_type || 'person',
                        difficulty: parsed.difficulty || 'medium',
                        initial_clue: parsed.initial_clue || '',
                        secret_answer: null,
                    })
                }
            }
        } catch (localErr) {
            console.warn('⚠️ Nelze načíst lokální záložní case pro archiv:', localErr)
        }
    }

    const userStates: Record<string, DetectiveUserArchiveState> = {}

    try {
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (user) {
            const { data: states, error: statesError } = await adminSupabase
                .from('user_detective_state')
                .select('case_id, status, score_earned, questions_log, wrong_guesses_count, is_drawer_repair, updated_at')
                .eq('user_id', user.id)

            if (statesError) {
                console.warn('⚠️ Chyba při čtení user_detective_state pro archiv:', statesError)
            } else if (states) {
                // Načteme secret_answer VÝHRADNĚ pro úspěšně vyřešené případy
                const solvedCaseIds = states.filter((s) => s.status === 'SOLVED').map((s) => s.case_id)
                const solvedSecretMap = new Map<string, string>()

                if (solvedCaseIds.length > 0) {
                    const { data: secretRows, error: secErr } = await adminSupabase
                        .from('detective_cases')
                        .select('id, secret_answer')
                        .in('id', solvedCaseIds)

                    if (secErr) {
                        console.warn('⚠️ Chyba při načítání tajenek pro vyřešené případy v archivu:', secErr)
                    } else if (secretRows) {
                        for (const row of secretRows) {
                            solvedSecretMap.set(row.id, row.secret_answer)
                        }
                    }
                }

                for (const s of states) {
                    const qLog = Array.isArray(s.questions_log) ? s.questions_log : []
                    const isSolved = s.status === 'SOLVED'
                    const caseSecretAnswer = isSolved ? (solvedSecretMap.get(s.case_id) || null) : null

                    userStates[s.case_id] = {
                        status: s.status,
                        score_earned: s.score_earned || 0,
                        questions_count: qLog.length,
                        is_drawer_repair: Boolean(s.is_drawer_repair),
                        secret_answer: caseSecretAnswer,
                        updated_at: s.updated_at,
                    }
                }
            }
        }
    } catch (authErr) {
        console.warn('⚠️ Chyba autentizace při načítání stavů archivu výslechu:', authErr)
    }

    // Bezpečná úprava: secret_answer je přítomen pouze u SOLVED případů
    const safeCases = cases.map((c) => ({
        ...c,
        secret_answer: userStates[c.id]?.status === 'SOLVED' ? userStates[c.id]?.secret_answer || null : null,
    }))

    return { cases: safeCases, userStates }
}

export interface AskDetectiveQuestionParams {
    caseId: string
    question: string
    currentQuestionsLog?: QuestionItem[]
    currentScore?: number
    isDrawerRetry?: boolean
}

// 2. Položení zjišťovací otázky (s pre-filtrem, sémantickým hledáním a AI rozhodčím)
export async function askDetectiveQuestionAction(
    params: AskDetectiveQuestionParams
): Promise<{
    status: 'VALID' | 'INVALID' | 'DUPLICATE' | 'DRAWER' | 'ERROR'
    verdict?: 'ANO' | 'NE' | 'NELZE_OVERIT'
    questionItem?: QuestionItem
    updatedScore?: number
    message?: string
    isGameOver?: boolean
}> {
    const {
        caseId,
        question,
        currentQuestionsLog = [],
        currentScore = 100,
        isDrawerRetry = false,
    } = params

    const rawQ = question.trim()

    // --- A. Pre-filtr (0 b., nepočítá se do limitu 20 otázek) ---
    if (!rawQ || rawQ.length < 4) {
        return {
            status: 'INVALID',
            message: 'Zadej prosím celou zjišťovací otázku (minimálně 4 znaky).',
        }
    }

    // Blokace vylučovacího "nebo / či"
    if (/\bnebo\b/i.test(rawQ) || /\bči\b/i.test(rawQ)) {
        return {
            status: 'INVALID',
            message: 'Otázky s volbou „nebo / či“ (např. „Je to muž nebo žena?“) nejsou povoleny. Zeptej se na každou možnost zvlášť s jednoznačnou odpovědí ANO/NE.',
        }
    }

    // Blokace meta-otázek na pravopis a skladbu slova
    const metaRegex = /\b(písmen[oa]?|písmen|slabik[ay]?|slabik|rým[uy]?|rýmuje|začíná na|končí na|obsahuje písmeno)\b/i
    if (metaRegex.test(rawQ)) {
        return {
            status: 'INVALID',
            message: 'Otázky na pravopis, písmena, slabiky a rýmy nejsou povoleny. Ptej se na vlastnosti, význam, historii a podstatu hledaného pojmu.',
        }
    }

    const supabase = await createServerSupabaseClient()
    const adminSupabase = getAdminSupabaseClient()

    // Získání autoritativního stavu pro přihlášeného uživatele přímo z databáze
    let effectiveScore = currentScore
    let effectiveLog = currentQuestionsLog
    let effectiveDrawerRetry = isDrawerRetry

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        const { data: dbState } = await adminSupabase
            .from('user_detective_state')
            .select('score_earned, questions_log, is_drawer_repair, status')
            .eq('user_id', user.id)
            .eq('case_id', caseId)
            .maybeSingle()

        if (dbState) {
            if (dbState.status === 'SOLVED' || dbState.status === 'DRAWER') {
                return {
                    status: 'DRAWER',
                    message: 'Tento případ je již uzavřen a nelze dále klást otázky.',
                    isGameOver: true,
                }
            }
            if (typeof dbState.score_earned === 'number') {
                effectiveScore = dbState.score_earned
            }
            if (Array.isArray(dbState.questions_log)) {
                effectiveLog = dbState.questions_log as QuestionItem[]
            }
            if (typeof dbState.is_drawer_repair === 'boolean') {
                effectiveDrawerRetry = dbState.is_drawer_repair
            }
        }
    }

    // --- B. Kontrola duplicity (0 b.) ---
    const normQ = rawQ.toLowerCase().replace(/[?.,!]+$/, '')
    const duplicate = effectiveLog.find(
        (q) => q.question.trim().toLowerCase().replace(/[?.,!]+$/, '') === normQ
    )
    if (duplicate) {
        return {
            status: 'DUPLICATE',
            verdict: duplicate.verdict,
            questionItem: duplicate,
            updatedScore: effectiveScore,
            message: `Tuto otázku jsi již položil – odpověď byla: ${duplicate.verdict}.`,
        }
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        return {
            status: 'ERROR',
            message: 'V systému chybí OPENAI_API_KEY pro vyhodnocení výslechu.',
        }
    }

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })

    // Ověříme, že případ existuje a je publikovaný (publish_date <= dnes)
    const { data: caseCheck, error: caseCheckError } = await adminSupabase
        .from('detective_cases')
        .select('id')
        .eq('id', caseId)
        .lte('publish_date', todayStr)
        .eq('is_active', true)
        .maybeSingle()

    if (caseCheckError || !caseCheck) {
        return {
            status: 'ERROR',
            message: 'Případ nebyl v databázi nalezen nebo ještě nebyl publikován.',
        }
    }

    // --- C. Sémantické hledání ve spisu ---
    let matchedTexts: string[] = []
    let coreTexts: string[] = []

    try {
        // 1. Vygenerování embeddingu pro otázku
        const embRes = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: rawQ,
            }),
        })

        if (!embRes.ok) {
            throw new Error(`Chyba OpenAI Embeddings (${embRes.status})`)
        }

        const embData = await embRes.json()
        const queryEmbedding = embData?.data?.[0]?.embedding

        // 2. Sémantické vyhledání nejrelevantnějších faktů (top 8) přes admin klienta
        if (queryEmbedding) {
            const { data: rpcMatches } = await adminSupabase.rpc('match_detective_facts', {
                query_embedding: queryEmbedding,
                match_case_id: caseId,
                match_count: 8,
            })
            if (rpcMatches && rpcMatches.length > 0) {
                matchedTexts = rpcMatches.map((m: any) => m.fact_text)
            }
        }
    } catch (err) {
        console.warn('Sémantické vyhledávání selhalo, přecházím na fallback:', err)
    }

    // 3. Vždy dotáhneme všechny základní rozřazovací fakty ('core') přes admin klienta
    const { data: coreFacts } = await adminSupabase
        .from('detective_facts')
        .select('fact_text')
        .eq('case_id', caseId)
        .eq('fact_type', 'core')

    if (coreFacts && coreFacts.length > 0) {
        coreTexts = coreFacts.map((f: any) => f.fact_text)
    }

    // Pokud RPC nevrátilo nic, doplníme libovolná klíčová fakta
    if (matchedTexts.length === 0) {
        const { data: fallbackFacts } = await adminSupabase
            .from('detective_facts')
            .select('fact_text')
            .eq('case_id', caseId)
            .limit(15)
        if (fallbackFacts) {
            matchedTexts = fallbackFacts.map((f: any) => f.fact_text)
        }
    }

    const combinedFacts = Array.from(new Set([...coreTexts, ...matchedTexts]))
    const contextPrompt = combinedFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')

    // --- D. AI Rozhodčí (gpt-4o-mini s temperature: 0) ---
    let verdict: 'ANO' | 'NE' | 'NELZE_OVERIT' = 'NELZE_OVERIT'

    try {
        const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                temperature: 0,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: getDetectiveRefereeSystemPrompt(contextPrompt),
                    },
                    {
                        role: 'user',
                        content: rawQ,
                    },
                ],
            }),
        })

        if (!chatRes.ok) {
            throw new Error(`Chyba OpenAI Chat (${chatRes.status})`)
        }

        const chatData = await chatRes.json()
        const parsed = JSON.parse(chatData.choices[0].message.content)
        const v = String(parsed.verdict || '').toUpperCase()

        if (v === 'ANO' || v === 'NE') {
            verdict = v
        } else {
            verdict = 'NELZE_OVERIT'
        }
    } catch (err) {
        console.error('AI rozhodčí selhal:', err)
        return {
            status: 'ERROR',
            message: 'Nepodařilo se vyhodnotit otázku. Zkus to prosím za chvíli znovu.',
        }
    }

    // --- E. Bodování a uložení ---
    const penalty = verdict === 'NELZE_OVERIT' ? 2 : 4
    const minFloor = effectiveDrawerRetry ? 5 : 10
    const newScore = Math.max(minFloor, effectiveScore - penalty)

    const questionItem: QuestionItem = {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        question: rawQ,
        verdict,
        timestamp: new Date().toISOString(),
        penalty,
    }

    const updatedLog = [...effectiveLog, questionItem]
    const isGameOver = updatedLog.length >= 20

    // Uložíme stav přihlášenému hráči přes admin klienta (obchází RLS)
    if (user) {
        try {
            await adminSupabase.from('user_detective_state').upsert(
                {
                    user_id: user.id,
                    case_id: caseId,
                    status: isGameOver ? 'DRAWER' : 'IN_PROGRESS',
                    score_earned: newScore,
                    questions_log: updatedLog,
                    is_drawer_repair: effectiveDrawerRetry,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,case_id' }
            )
        } catch (dbErr) {
            console.warn('Uložení stavu výslechu do DB selhalo:', dbErr)
        }
    }

    return {
        status: isGameOver ? 'DRAWER' : 'VALID',
        verdict,
        questionItem,
        updatedScore: newScore,
        isGameOver,
        message: isGameOver
            ? 'Vyčerpal jsi všech 20 otázek! Případ byl odložen do Šuplíku k pozdější odvetě.'
            : undefined,
    }
}

export interface SubmitDetectiveGuessParams {
    caseId: string
    guess: string
    currentQuestionsLog?: QuestionItem[]
    currentScore?: number
    wrongGuessesCount?: number
    isDrawerRetry?: boolean
}

// 3. Vznesení finálního tipu na tajenku (přijímá pojmenovaný objekt)
export async function submitDetectiveGuessAction(
    params: SubmitDetectiveGuessParams
): Promise<{
    correct: boolean
    isTypo?: boolean
    score?: number
    secretAnswer?: string
    message?: string
    newWrongCount?: number
    isGameOver?: boolean
    streaks?: any
}> {
    const {
        caseId,
        guess,
        currentQuestionsLog = [],
        currentScore = 100,
        wrongGuessesCount = 0,
        isDrawerRetry = false,
    } = params

    const rawGuess = guess.trim()
    if (!rawGuess) {
        return { correct: false, message: 'Zadej svůj tip.' }
    }

    const adminSupabase = getAdminSupabaseClient()
    const supabase = await createServerSupabaseClient()
    const todayDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })

    // Načteme tajenku a synonyma ze serveru přes admin klienta s kontrolou publish_date <= dnes
    const { data: caseData, error } = await adminSupabase
        .from('detective_cases')
        .select('secret_answer, accepted_synonyms')
        .eq('id', caseId)
        .lte('publish_date', todayDateStr)
        .eq('is_active', true)
        .single()

    if (error || !caseData) {
        return { correct: false, message: 'Případ nebyl v databázi nalezen nebo ještě nebyl publikován.' }
    }

    const synonyms = Array.isArray(caseData.accepted_synonyms) ? caseData.accepted_synonyms : []
    const validation = validateAnswer(rawGuess, caseData.secret_answer, synonyms)

    // Případ A: Překlep -> bez penalizace
    if (validation.isTypo) {
        return {
            correct: false,
            isTypo: true,
            message: validation.message || 'Těsně vedle! Máš v odpovědi drobný překlep. Oprav ho bez ztráty bodů.',
        }
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Získání autoritativních hodnot pro přihlášeného uživatele přímo z databáze
    let effectiveScore = currentScore
    let effectiveWrongCount = wrongGuessesCount
    let effectiveLog = currentQuestionsLog
    let effectiveDrawerRetry = isDrawerRetry

    if (user) {
        const { data: dbState } = await adminSupabase
            .from('user_detective_state')
            .select('score_earned, wrong_guesses_count, questions_log, is_drawer_repair, status')
            .eq('user_id', user.id)
            .eq('case_id', caseId)
            .maybeSingle()

        if (dbState) {
            if (dbState.status === 'SOLVED') {
                return {
                    correct: true,
                    score: dbState.score_earned,
                    secretAnswer: caseData.secret_answer,
                    message: 'Tento případ jsi již úspěšně vyřešil!',
                }
            }
            if (typeof dbState.score_earned === 'number') {
                effectiveScore = dbState.score_earned
            }
            if (typeof dbState.wrong_guesses_count === 'number') {
                effectiveWrongCount = dbState.wrong_guesses_count
            }
            if (Array.isArray(dbState.questions_log)) {
                effectiveLog = dbState.questions_log as QuestionItem[]
            }
            if (typeof dbState.is_drawer_repair === 'boolean') {
                effectiveDrawerRetry = dbState.is_drawer_repair
            }
        }
    }

    // Případ B: Správný tip -> VÍTĚZSTVÍ!
    if (validation.isCorrect) {
        let finalStreaks: any = null

        if (user) {
            try {
                await adminSupabase.from('user_detective_state').upsert(
                    {
                        user_id: user.id,
                        case_id: caseId,
                        status: 'SOLVED',
                        score_earned: effectiveScore,
                        questions_log: effectiveLog,
                        wrong_guesses_count: effectiveWrongCount,
                        is_drawer_repair: effectiveDrawerRetry,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id,case_id' }
                )

                // Aktualizace Mistrovské série (Solve Streak) pro 1. ostrý pokus
                if (!effectiveDrawerRetry) {
                    finalStreaks = await updateDetectiveUserStreaks(
                        adminSupabase,
                        user.id,
                        true, // isFirstAttempt
                        true, // isSolved
                        todayDateStr
                    )
                }
            } catch (dbErr) {
                console.warn('Uložení vítězství výslechu do DB selhalo:', dbErr)
            }
        }

        return {
            correct: true,
            score: effectiveScore,
            secretAnswer: caseData.secret_answer,
            streaks: finalStreaks,
            message: 'Brilantní dedukce! Případ byl úspěšně vyřešen.',
        }
    }

    // Případ C: Chybný tip -> penalizace -15 b. (max 3 chybné pokusy)
    const minFloor = effectiveDrawerRetry ? 5 : 10
    const newScore = Math.max(minFloor, effectiveScore - 15)
    const newWrongCount = effectiveWrongCount + 1
    const isGameOver = newWrongCount >= 3
    const remaining = Math.max(0, 3 - newWrongCount)

    if (user) {
        try {
            await adminSupabase.from('user_detective_state').upsert(
                {
                    user_id: user.id,
                    case_id: caseId,
                    status: isGameOver ? 'DRAWER' : 'IN_PROGRESS',
                    score_earned: newScore,
                    questions_log: effectiveLog,
                    wrong_guesses_count: newWrongCount,
                    is_drawer_repair: effectiveDrawerRetry,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,case_id' }
            )

            // Pokud vyčerpal 3 pokusy na 1. pokus -> pád Mistrovské série
            if (isGameOver && !effectiveDrawerRetry) {
                await updateDetectiveUserStreaks(
                    adminSupabase,
                    user.id,
                    true, // isFirstAttempt
                    false, // isSolved
                    todayDateStr
                )
            }
        } catch (dbErr) {
            console.warn('Uložení chybného tipu do DB selhalo:', dbErr)
        }
    }

    const attemptsText = remaining === 1 ? 'zbývá 1 poslední pokus' : `zbývají ${remaining} pokusy`

    return {
        correct: false,
        score: newScore,
        newWrongCount,
        isGameOver,
        message: isGameOver
            ? 'Třetí chybný tip! Vyšetřování uvízlo ve slepé uličce. Případ byl odložen do Šuplíku k pozdější odvetě.'
            : `${newWrongCount}. chybný tip (-15 b.) – ${attemptsText}.`,
    }
}

