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

