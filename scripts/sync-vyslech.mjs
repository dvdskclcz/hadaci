#!/usr/bin/env node
/**
 * Synchronizační skript pro herní mód „Detektivní výslech“ (Hádači.cz)
 * 
 * Načte případy z content/vyslech/NNN-slug/case.json,
 * vytvoří vektorové embeddingy přes OpenAI (text-embedding-3-small)
 * a nahraje je do Supabase tabulek detective_cases a detective_facts.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// --- 1. Načtení proměnných prostředí z .env.local ---
function loadEnvLocal() {
    const envPath = path.join(rootDir, '.env.local')
    const envVars = {}

    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n')
        for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('/*')) continue
            const eqIndex = trimmed.indexOf('=')
            if (eqIndex > 0) {
                const key = trimmed.slice(0, eqIndex).trim()
                let value = trimmed.slice(eqIndex + 1).trim()
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1)
                }
                envVars[key] = value
            }
        }
    }

    return {
        SUPABASE_URL: envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_KEY: envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        OPENAI_API_KEY: envVars.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    }
}

// --- 2. Vygenerování vektorových embeddingů přes OpenAI API ---
async function generateEmbeddings(texts, apiKey) {
    const BATCH_SIZE = 50
    const allEmbeddings = []

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE)
        
        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: batch,
            }),
        })

        if (!response.ok) {
            const errBody = await response.text()
            throw new Error(`Chyba OpenAI Embeddings API (${response.status}): ${errBody}`)
        }

        const data = await response.json()
        const sortedData = [...data.data].sort((a, b) => a.index - b.index)
        for (const item of sortedData) {
            allEmbeddings.push(item.embedding)
        }
    }

    return allEmbeddings
}

// --- 3. Hlavní běh synchronizace ---
async function main() {
    console.log('\n============================================================')
    console.log('🕵️‍♂️  HÁDAČI.CZ – Synchronizace spisů pro Detektivní výslech')
    console.log('============================================================\n')

    const { SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY } = loadEnvLocal()

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error('❌ CHYBA: Chybí konfigurace Supabase v .env.local!')
        console.error('   Ujistěte se, že máte nastaveno:')
        console.error('   - NEXT_PUBLIC_SUPABASE_URL')
        console.error('   - SUPABASE_SERVICE_ROLE_KEY')
        process.exit(1)
    }

    if (!OPENAI_API_KEY) {
        console.error('❌ CHYBA: Chybí OPENAI_API_KEY v .env.local!')
        console.error('   Pro generování vektorových embeddingů je vyžadován platný OpenAI API klíč.')
        console.error('   Doplňte do .env.local řádek:')
        console.error('   OPENAI_API_KEY=sk-...\n')
        process.exit(1)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false },
    })

    const vyslechDir = path.join(rootDir, 'content', 'vyslech')
    if (!fs.existsSync(vyslechDir)) {
        console.error(`❌ Složka ${vyslechDir} neexistuje!`)
        process.exit(1)
    }

    // Najdeme všechny podsložky s case.json
    const entries = fs.readdirSync(vyslechDir, { withFileTypes: true })
    const caseDirs = entries
        .filter((e) => e.isDirectory() && !e.name.startsWith('_'))
        .map((e) => path.join(vyslechDir, e.name))
        .filter((dir) => fs.existsSync(path.join(dir, 'case.json')))

    if (caseDirs.length === 0) {
        console.log('ℹ️  Nebyly nalezeny žádné složky s case.json v content/vyslech/.')
        return
    }

    console.log(`📂 Nalezeno ${caseDirs.length} případů ke zpracování...\n`)

    let totalCasesSynced = 0
    let totalFactsSynced = 0

    for (const dir of caseDirs) {
        const casePath = path.join(dir, 'case.json')
        const rawContent = fs.readFileSync(casePath, 'utf8')
        let caseData

        try {
            caseData = JSON.parse(rawContent)
        } catch (err) {
            console.error(`❌ Chyba syntaxe JSON v souboru: ${casePath}`)
            console.error(err.message)
            continue
        }

        console.log(`🔍 Zpracovávám případ: [${caseData.slug}] "${caseData.secret_answer}"`)

        // 1. Validace povinných polí
        const required = ['slug', 'publish_date', 'entity_type', 'secret_answer', 'core_facts', 'key_facts', 'anticipated_qa']
        const missing = required.filter((field) => !caseData[field])
        if (missing.length > 0) {
            console.error(`   ⚠️  Přeskakuji: chybí povinná pole [${missing.join(', ')}]`)
            continue
        }

        // 2. Příprava seznamu faktů ze 3 vrstev
        const factsToProcess = []

        // Vrstva A: Základní rozřazovací fakta
        for (const fact of caseData.core_facts) {
            factsToProcess.push({
                fact_type: 'core',
                text: fact,
            })
        }

        // Vrstva B: Klíčová encyklopedická fakta
        for (const fact of caseData.key_facts) {
            factsToProcess.push({
                fact_type: 'key_fact',
                text: fact,
            })
        }

        // Vrstva C: Předpokládané otázky a odpovědi
        for (const qa of caseData.anticipated_qa) {
            factsToProcess.push({
                fact_type: 'qa',
                text: `Otázka: ${qa.q} | Ověřená odpověď: ${qa.a}`,
            })
        }

        console.log(`   📝 Připraveno celkem ${factsToProcess.length} faktů (Core: ${caseData.core_facts.length}, Key: ${caseData.key_facts.length}, QA: ${caseData.anticipated_qa.length})`)

        // 3. Upsert do detective_cases
        const { data: upsertedCase, error: caseErr } = await supabase
            .from('detective_cases')
            .upsert(
                {
                    slug: caseData.slug,
                    publish_date: caseData.publish_date,
                    entity_type: caseData.entity_type,
                    difficulty: caseData.difficulty || 'medium',
                    secret_answer: caseData.secret_answer,
                    accepted_synonyms: caseData.accepted_synonyms || [],
                    initial_clue: caseData.initial_clue || '',
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'slug' }
            )
            .select('id, slug')
            .single()

        if (caseErr) {
            console.error(`   ❌ Chyba při ukládání případu do detective_cases:`, caseErr.message)
            if (caseErr.message?.includes('does not exist')) {
                console.error(`   💡 TIP: Nezapomeňte nejdříve spustit schéma z content/vyslech/schema.sql v Supabase SQL Editoru!`)
            }
            continue
        }

        const caseId = upsertedCase.id

        // 4. Vygenerování embeddingů přes OpenAI
        console.log(`   🧠 Generuji vektorové embeddingy přes OpenAI (text-embedding-3-small)...`)
        let embeddings
        try {
            const rawTexts = factsToProcess.map((f) => f.text)
            embeddings = await generateEmbeddings(rawTexts, OPENAI_API_KEY)
        } catch (err) {
            console.error(`   ❌ Selhalo generování embeddingů:`, err.message)
            continue
        }

        // 5. Smazání starých faktů pro daný případ
        const { error: delErr } = await supabase
            .from('detective_facts')
            .delete()
            .eq('case_id', caseId)

        if (delErr) {
            console.error(`   ⚠️  Varování při mazání starých faktů:`, delErr.message)
        }

        // 6. Vložení nových faktů s vektory
        const factsPayload = factsToProcess.map((f, idx) => ({
            case_id: caseId,
            fact_type: f.fact_type,
            fact_text: f.text,
            embedding: embeddings[idx],
        }))

        // Vkládáme po dávkách (po 50)
        const CHUNK_SIZE = 50
        let insertedForThisCase = 0

        for (let i = 0; i < factsPayload.length; i += CHUNK_SIZE) {
            const chunk = factsPayload.slice(i, i + CHUNK_SIZE)
            const { error: insertErr } = await supabase
                .from('detective_facts')
                .insert(chunk)

            if (insertErr) {
                console.error(`   ❌ Chyba při vkládání faktů do detective_facts:`, insertErr.message)
                break
            }
            insertedForThisCase += chunk.length
        }

        console.log(`   ✅ Uloženo: ${insertedForThisCase} vektorových faktů do databáze.\n`)
        totalCasesSynced += 1
        totalFactsSynced += insertedForThisCase
    }

    console.log('============================================================')
    console.log(`🎉 HOTOVO! Synchronizováno ${totalCasesSynced} případů a ${totalFactsSynced} vektorových faktů.`)
    console.log('============================================================\n')
}

main().catch((err) => {
    console.error('\n💥 Neošetřená chyba synchronizace:', err)
    process.exit(1)
})

