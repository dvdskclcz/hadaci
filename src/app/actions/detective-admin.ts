'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { verifyAdminSession } from '@/app/actions/admin'
import { validateAnswer } from '@/lib/game/validator'
import { getDetectiveRefereeSystemPrompt } from '@/lib/detective-prompt'

// Inicializace privátního Supabase klienta s plnými právy pro administraci
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

export interface AdminDetectiveCase {
    id: string
    slug: string
    publish_date: string
    entity_type: 'person' | 'place' | 'object' | 'event' | 'concept'
    difficulty: 'easy' | 'medium' | 'hard'
    secret_answer: string
    accepted_synonyms: string[]
    initial_clue: string
    is_active: boolean
    created_at: string
    updated_at: string
    facts_count?: number
}

export interface AdminDetectiveFact {
    id: string
    case_id: string
    fact_type: 'core' | 'key_fact' | 'qa'
    fact_text: string
    created_at: string
}

export interface SaveDetectiveCasePayload {
    id?: string
    slug?: string
    publish_date: string
    difficulty: 'easy' | 'medium' | 'hard'
    entity_type: 'person' | 'place' | 'object' | 'event' | 'concept'
    initial_clue: string
    secret_answer: string
    accepted_synonyms: string[] | string
    is_active: boolean
}

// Pomocná funkce pro vygenerování embeddingu přes OpenAI API
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: text.trim(),
        }),
    })

    if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Chyba OpenAI Embeddings (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const embedding = data?.data?.[0]?.embedding
    if (!embedding || !Array.isArray(embedding)) {
        throw new Error('OpenAI nevrátilo platné vektorové pole.')
    }
    return embedding
}

// 1. Načtení všech případů pro admin konzoli
export async function getAdminDetectiveCasesAction(): Promise<{
    cases?: AdminDetectiveCase[]
    error?: string
}> {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const adminSupabase = getAdminSupabaseClient()

    try {
        // Načteme případy
        const { data: casesData, error: casesError } = await adminSupabase
            .from('detective_cases')
            .select('*')
            .order('publish_date', { ascending: false })

        if (casesError) {
            console.error('❌ Chyba při načítání případů v adminu:', casesError)
            return { error: 'Nepodařilo se načíst případy z databáze.' }
        }

        const cases = (casesData as AdminDetectiveCase[]) || []

        // Načteme počty faktů pro jednotlivé případy
        const { data: factsData, error: factsError } = await adminSupabase
            .from('detective_facts')
            .select('case_id')

        const countMap = new Map<string, number>()
        if (!factsError && factsData) {
            for (const f of factsData) {
                countMap.set(f.case_id, (countMap.get(f.case_id) || 0) + 1)
            }
        }

        const enrichedCases = cases.map((c) => ({
            ...c,
            accepted_synonyms: Array.isArray(c.accepted_synonyms) ? c.accepted_synonyms : [],
            facts_count: countMap.get(c.id) || 0,
        }))

        return { cases: enrichedCases }
    } catch (err: any) {
        console.error('❌ Neočekávaná chyba v getAdminDetectiveCasesAction:', err)
        return { error: err.message || 'Chyba serveru.' }
    }
}

// 2. Uložení / aktualizace metadat případu
export async function saveDetectiveCaseAction(payload: SaveDetectiveCasePayload): Promise<{
    success?: boolean
    case?: AdminDetectiveCase
    error?: string
}> {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const adminSupabase = getAdminSupabaseClient()

    const {
        id,
        slug,
        publish_date,
        difficulty,
        entity_type,
        initial_clue,
        secret_answer,
        accepted_synonyms,
        is_active,
    } = payload

    if (!publish_date || !difficulty || !entity_type || !initial_clue || !secret_answer) {
        return { error: 'Vyplňte prosím všechna povinná pole.' }
    }

    // Normalizace synonym
    let synonymsArray: string[] = []
    if (Array.isArray(accepted_synonyms)) {
        synonymsArray = accepted_synonyms.map((s) => String(s).trim()).filter(Boolean)
    } else if (typeof accepted_synonyms === 'string') {
        synonymsArray = accepted_synonyms
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
    }

    try {
        const updateData: any = {
            publish_date,
            difficulty,
            entity_type,
            initial_clue: initial_clue.trim(),
            secret_answer: secret_answer.trim(),
            accepted_synonyms: synonymsArray,
            is_active: Boolean(is_active),
            updated_at: new Date().toISOString(),
        }

        if (slug) {
            updateData.slug = slug.trim()
        }

        let savedCase: any = null

        if (id) {
            const { data, error } = await adminSupabase
                .from('detective_cases')
                .update(updateData)
                .eq('id', id)
                .select('*')
                .single()

            if (error) {
                console.error('❌ Chyba při aktualizaci případu:', error)
                return { error: error.message || 'Nepodařilo se uložit změny případu.' }
            }
            savedCase = data
        } else {
            // Vložení nového případu
            if (!updateData.slug) {
                updateData.slug = secret_answer
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '')
            }

            const { data, error } = await adminSupabase
                .from('detective_cases')
                .insert(updateData)
                .select('*')
                .single()

            if (error) {
                console.error('❌ Chyba při vkládání nového případu:', error)
                return { error: error.message || 'Nepodařilo se vytvořit nový případ.' }
            }
            savedCase = data
        }

        revalidatePath('/admin')
        revalidatePath('/vyslech')

        return { success: true, case: savedCase }
    } catch (err: any) {
        console.error('❌ Neočekávaná chyba v saveDetectiveCaseAction:', err)
        return { error: err.message || 'Chyba serveru při ukládání.' }
    }
}

// 3. Načtení všech faktů k danému případu
export async function getAdminCaseFactsAction(caseId: string): Promise<{
    facts?: AdminDetectiveFact[]
    error?: string
}> {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const adminSupabase = getAdminSupabaseClient()

    try {
        const { data, error } = await adminSupabase
            .from('detective_facts')
            .select('id, case_id, fact_type, fact_text, created_at')
            .eq('case_id', caseId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('❌ Chyba při načítání faktů:', error)
            return { error: 'Nepodařilo se načíst fakta případu.' }
        }

        // Seřazení podle typu: 1. core, 2. key_fact, 3. qa
        const orderWeight: Record<string, number> = { core: 1, key_fact: 2, qa: 3 }
        const sortedFacts = (data as AdminDetectiveFact[]).sort((a, b) => {
            const wA = orderWeight[a.fact_type] || 99
            const wB = orderWeight[b.fact_type] || 99
            if (wA !== wB) return wA - wB
            return (a.created_at || '').localeCompare(b.created_at || '')
        })

        return { facts: sortedFacts }
    } catch (err: any) {
        console.error('❌ Neočekávaná chyba v getAdminCaseFactsAction:', err)
        return { error: err.message || 'Chyba serveru.' }
    }
}

// 4. Přidání nebo úprava faktu včetně přepočtu vektorového embeddingu
export async function upsertDetectiveFactAction(params: {
    id?: string
    caseId: string
    factType: 'core' | 'key_fact' | 'qa'
    content: string
}): Promise<{
    success?: boolean
    fact?: AdminDetectiveFact
    error?: string
}> {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const { id, caseId, factType, content } = params
    const text = content?.trim()
    if (!text) {
        return { error: 'Text faktu nesmí být prázdný.' }
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        return { error: 'V systému chybí OPENAI_API_KEY pro výpočet embeddingu.' }
    }

    try {
        // Vygenerování embeddingu
        const embedding = await generateEmbedding(text, apiKey)
        const adminSupabase = getAdminSupabaseClient()

        let savedFact: any = null

        if (id) {
            const { data, error } = await adminSupabase
                .from('detective_facts')
                .update({
                    fact_type: factType,
                    fact_text: text,
                    embedding,
                })
                .eq('id', id)
                .select('id, case_id, fact_type, fact_text, created_at')
                .single()

            if (error) {
                console.error('❌ Chyba při aktualizaci faktu:', error)
                return { error: error.message || 'Nepodařilo se aktualizovat fakt.' }
            }
            savedFact = data
        } else {
            const { data, error } = await adminSupabase
                .from('detective_facts')
                .insert({
                    case_id: caseId,
                    fact_type: factType,
                    fact_text: text,
                    embedding,
                })
                .select('id, case_id, fact_type, fact_text, created_at')
                .single()

            if (error) {
                console.error('❌ Chyba při vkládání faktu:', error)
                return { error: error.message || 'Nepodařilo se vytvořit fakt.' }
            }
            savedFact = data
        }

        revalidatePath('/vyslech')
        return { success: true, fact: savedFact }
    } catch (err: any) {
        console.error('❌ Chyba v upsertDetectiveFactAction:', err)
        return { error: err.message || 'Chyba při ukládání faktu s embeddingem.' }
    }
}

// 5. Smazání faktu z databáze
export async function deleteDetectiveFactAction(factId: string): Promise<{
    success?: boolean
    error?: string
}> {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const adminSupabase = getAdminSupabaseClient()

    try {
        const { error } = await adminSupabase
            .from('detective_facts')
            .delete()
            .eq('id', factId)

        if (error) {
            console.error('❌ Chyba při mazání faktu:', error)
            return { error: error.message || 'Nepodařilo se smazat fakt.' }
        }

        revalidatePath('/vyslech')
        return { success: true }
    } catch (err: any) {
        console.error('❌ Chyba v deleteDetectiveFactAction:', err)
        return { error: err.message || 'Chyba při mazání faktu.' }
    }
}

// 6. Testovací simulátor otázky (1:1 k ostrému enginu, nic neukládá do user state)
export async function testDetectiveQuestionAction(params: {
    caseId: string
    question: string
}): Promise<{
    status: 'VALID' | 'INVALID' | 'ERROR'
    verdict?: 'ANO' | 'NE' | 'NELZE_OVERIT'
    reasoning?: string
    reason?: string
    message?: string
    matchedFacts: Array<{
        id: string
        fact_type: string
        content: string
        similarity: number
    }>
}> {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) {
        return {
            status: 'ERROR',
            message: 'Neautorizovaný přístup.',
            matchedFacts: [],
        }
    }

    const { caseId, question } = params
    const rawQ = (question || '').trim()

    // --- A. Shodný pre-filtr s ostrou hrou ---
    if (!rawQ || rawQ.length < 4) {
        return {
            status: 'INVALID',
            message: 'Zadej prosím celou zjišťovací otázku (minimálně 4 znaky).',
            matchedFacts: [],
        }
    }

    if (/\bnebo\b/i.test(rawQ) || /\bči\b/i.test(rawQ)) {
        return {
            status: 'INVALID',
            message: 'Otázky s volbou „nebo / či“ (např. „Je to muž nebo žena?“) nejsou povoleny. Zeptej se na každou možnost zvlášť s jednoznačnou odpovědí ANO/NE.',
            matchedFacts: [],
        }
    }

    const metaRegex = /\b(písmen[oa]?|písmen|slabik[ay]?|slabik|rým[uy]?|rýmuje|začíná na|končí na|obsahuje písmeno)\b/i
    if (metaRegex.test(rawQ)) {
        return {
            status: 'INVALID',
            message: 'Otázky na pravopis, písmena, slabiky a rýmy nejsou povoleny. Ptej se na vlastnosti, význam, historii a podstatu hledaného pojmu.',
            matchedFacts: [],
        }
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
        return {
            status: 'ERROR',
            message: 'V systému chybí OPENAI_API_KEY pro vyhodnocení otázky.',
            matchedFacts: [],
        }
    }

    const adminSupabase = getAdminSupabaseClient()

    try {
        // --- B. Vektorové hledání (match_count: 8) ---
        const queryEmbedding = await generateEmbedding(rawQ, apiKey)

        let rpcMatchedFacts: any[] = []
        try {
            const { data: matches } = await adminSupabase.rpc('match_detective_facts', {
                query_embedding: queryEmbedding,
                match_case_id: caseId,
                match_count: 8,
            })
            if (matches && Array.isArray(matches)) {
                rpcMatchedFacts = matches
            }
        } catch (rpcErr) {
            console.warn('⚠️ RPC match_detective_facts selhalo, použiji fallback:', rpcErr)
        }

        // --- C. Načtení všech core faktů ---
        const { data: coreFactsData } = await adminSupabase
            .from('detective_facts')
            .select('id, fact_type, fact_text')
            .eq('case_id', caseId)
            .eq('fact_type', 'core')

        const coreFacts = coreFactsData || []

        // Fallback pro případ, že RPC nic nenašlo
        let fallbackFacts: any[] = []
        if (rpcMatchedFacts.length === 0) {
            const { data: fb } = await adminSupabase
                .from('detective_facts')
                .select('id, fact_type, fact_text')
                .eq('case_id', caseId)
                .limit(15)
            fallbackFacts = fb || []
        }

        // Sestavení seznamu debug faktů pro Rentgen AI
        const debugFactsMap = new Map<string, { id: string; fact_type: string; content: string; similarity: number }>()

        for (const m of rpcMatchedFacts) {
            debugFactsMap.set(m.fact_text, {
                id: m.id,
                fact_type: m.fact_type,
                content: m.fact_text,
                similarity: Math.round((m.similarity || 0) * 1000) / 10, // v procentech na 1 des. místo
            })
        }

        for (const c of coreFacts) {
            if (!debugFactsMap.has(c.fact_text)) {
                debugFactsMap.set(c.fact_text, {
                    id: c.id,
                    fact_type: c.fact_type,
                    content: c.fact_text,
                    similarity: 100, // Základní rozřazovací fakt (vždy přítomen v kontextu)
                })
            }
        }

        for (const fb of fallbackFacts) {
            if (!debugFactsMap.has(fb.fact_text)) {
                debugFactsMap.set(fb.fact_text, {
                    id: fb.id,
                    fact_type: fb.fact_type,
                    content: fb.fact_text,
                    similarity: 50,
                })
            }
        }

        const debugFactsList = Array.from(debugFactsMap.values())

        const contextTexts = debugFactsList.map((f, i) => `${i + 1}. ${f.content}`).join('\n')

        // --- D. Volání gpt-4o-mini se shodným 6-bodovým system promptem ---
        const chatRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                temperature: 0,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: getDetectiveRefereeSystemPrompt(contextTexts),
                    },
                    {
                        role: 'user',
                        content: rawQ,
                    },
                ],
            }),
        })

        if (!chatRes.ok) {
            const errTxt = await chatRes.text()
            throw new Error(`OpenAI Chat API selhalo (${chatRes.status}): ${errTxt}`)
        }

        const chatData = await chatRes.json()
        const parsed = JSON.parse(chatData.choices[0].message.content)
        const v = String(parsed.verdict || '').toUpperCase()

        let verdict: 'ANO' | 'NE' | 'NELZE_OVERIT' = 'NELZE_OVERIT'
        if (v === 'ANO' || v === 'NE') {
            verdict = v
        }

        const reasoning = parsed.reasoning || parsed.reason || ''

        return {
            status: 'VALID',
            verdict,
            reasoning,
            reason: reasoning,
            message: reasoning,
            matchedFacts: debugFactsList,
        }
    } catch (err: any) {
        console.error('❌ Chyba v testDetectiveQuestionAction:', err)
        return {
            status: 'ERROR',
            message: err.message || 'Chyba při testování otázky.',
            matchedFacts: [],
        }
    }
}

// 7. Testovací simulátor finálního tipu
export async function testDetectiveGuessAction(params: {
    caseId: string
    guess: string
}): Promise<{
    isCorrect: boolean
    isTypo?: boolean
    message?: string
    matchedAnswer?: string
    error?: string
}> {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { isCorrect: false, error: 'Neautorizovaný přístup.' }

    const { caseId, guess } = params
    const rawGuess = (guess || '').trim()
    if (!rawGuess) {
        return { isCorrect: false, message: 'Zadej testovací tip.' }
    }

    const adminSupabase = getAdminSupabaseClient()

    try {
        const { data: caseData, error } = await adminSupabase
            .from('detective_cases')
            .select('secret_answer, accepted_synonyms')
            .eq('id', caseId)
            .single()

        if (error || !caseData) {
            return { isCorrect: false, error: 'Případ nebyl v databázi nalezen.' }
        }

        const synonyms = Array.isArray(caseData.accepted_synonyms) ? caseData.accepted_synonyms : []
        const validation = validateAnswer(rawGuess, caseData.secret_answer, synonyms)

        return {
            isCorrect: validation.isCorrect,
            isTypo: validation.isTypo,
            message: validation.message,
            matchedAnswer: validation.isCorrect ? caseData.secret_answer : undefined,
        }
    } catch (err: any) {
        console.error('❌ Chyba v testDetectiveGuessAction:', err)
        return { isCorrect: false, error: err.message || 'Chyba při ověřování tipu.' }
    }
}

export interface AdminPlayerQuestionItem {
    id: string
    caseId: string
    caseSlug: string
    caseSecretAnswer: string
    userNickname?: string
    userId?: string
    question: string
    verdict: 'ANO' | 'NE' | 'NELZE_OVERIT'
    timestamp: string
    penalty?: number
    sessionStatus?: string
}

export interface GetDetectivePlayerQuestionsParams {
    caseSlug?: string
    verdict?: 'ALL' | 'ANO' | 'NE' | 'NELZE_OVERIT'
    limit?: number
}

// 8. Načtení reálně položených otázek hráčů z databáze
export async function getDetectivePlayerQuestionsAction(params?: GetDetectivePlayerQuestionsParams): Promise<{
    questions?: AdminPlayerQuestionItem[]
    cases?: Array<{ id: string; slug: string; secret_answer: string }>
    totalFound?: number
    stats?: {
        total: number
        ano: number
        ne: number
        nelzeOverit: number
    }
    error?: string
}> {
    const isAuthenticated = await verifyAdminSession()
    if (!isAuthenticated) return { error: 'Neautorizovaný přístup.' }

    const adminSupabase = getAdminSupabaseClient()

    try {
        // 1. Načteme všechny případy pro mapování ID -> slug a secret_answer
        const { data: casesData, error: casesError } = await adminSupabase
            .from('detective_cases')
            .select('id, slug, secret_answer')
            .order('publish_date', { ascending: false })

        if (casesError) {
            console.error('Chyba při načítání případů v getDetectivePlayerQuestionsAction:', casesError)
        }

        const casesMap = new Map<string, { id: string; slug: string; secret_answer: string }>()
        const allCasesList = (casesData || []).map((c: any) => {
            const item = { id: c.id, slug: c.slug, secret_answer: c.secret_answer }
            casesMap.set(c.id, item)
            casesMap.set(c.slug, item)
            return item
        })

        // 2. Načteme herní stavy hráčů z user_detective_state
        let query = adminSupabase
            .from('user_detective_state')
            .select('id, user_id, case_id, status, questions_log, updated_at')
            .order('updated_at', { ascending: false })
            .limit(200)

        // Pokud je filtrováno podle konkrétního případu už na úrovni DB
        if (params?.caseSlug && params.caseSlug !== 'ALL') {
            const targetCase = casesMap.get(params.caseSlug)
            if (targetCase) {
                query = query.eq('case_id', targetCase.id)
            }
        }

        const { data: statesData, error: statesError } = await query

        if (statesError) {
            return { error: `Chyba při čtení z databáze: ${statesError.message}` }
        }

        // 3. Načteme přezdívky hráčů z profiles pro obohacení
        const userIds = Array.from(new Set((statesData || []).map((s: any) => s.user_id).filter(Boolean)))
        const profileNickMap = new Map<string, string>()
        if (userIds.length > 0) {
            const { data: profiles } = await adminSupabase
                .from('profiles')
                .select('id, nickname')
                .in('id', userIds)

            if (profiles) {
                profiles.forEach((p: any) => {
                    if (p.id && p.nickname) {
                        profileNickMap.set(p.id, p.nickname)
                    }
                })
            }
        }

        // 4. Rozbalíme JSON pole questions_log do jednotlivých záznamů
        const allQuestions: AdminPlayerQuestionItem[] = []

        for (const state of statesData || []) {
            const caseInfo = casesMap.get(state.case_id)
            const questionsLog = Array.isArray(state.questions_log) ? state.questions_log : []
            const nickname = profileNickMap.get(state.user_id) || `Hráč #${state.user_id.slice(0, 6)}`

            for (const q of questionsLog) {
                if (!q || !q.question) continue
                allQuestions.push({
                    id: q.id || `q_${Math.random().toString(36).substring(2, 9)}`,
                    caseId: state.case_id,
                    caseSlug: caseInfo?.slug || 'neznamy-spis',
                    caseSecretAnswer: caseInfo?.secret_answer || 'Neznámá tajenka',
                    userId: state.user_id,
                    userNickname: nickname,
                    question: q.question,
                    verdict: q.verdict || 'NELZE_OVERIT',
                    timestamp: q.timestamp || state.updated_at,
                    penalty: q.penalty ?? 4,
                    sessionStatus: state.status,
                })
            }
        }

        // 5. Seřadíme od nejnovějších
        allQuestions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        // Statistiky ze všech načtených
        const stats = {
            total: allQuestions.length,
            ano: allQuestions.filter((q) => q.verdict === 'ANO').length,
            ne: allQuestions.filter((q) => q.verdict === 'NE').length,
            nelzeOverit: allQuestions.filter((q) => q.verdict === 'NELZE_OVERIT').length,
        }

        // 6. Aplikujeme filtry
        let filtered = allQuestions
        if (params?.caseSlug && params.caseSlug !== 'ALL') {
            filtered = filtered.filter((q) => q.caseSlug === params.caseSlug)
        }
        if (params?.verdict && params.verdict !== 'ALL') {
            filtered = filtered.filter((q) => q.verdict === params.verdict)
        }

        const limit = params?.limit || 150
        const resultQuestions = filtered.slice(0, limit)

        return {
            questions: resultQuestions,
            cases: allCasesList,
            totalFound: filtered.length,
            stats,
        }
    } catch (err: any) {
        console.error('Chyba v getDetectivePlayerQuestionsAction:', err)
        return { error: err.message || 'Chyba při načítání položených otázek.' }
    }
}


