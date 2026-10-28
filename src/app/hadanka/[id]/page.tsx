import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import RiddleCard from '@/components/RiddleCard'
import { ArrowLeft } from 'lucide-react'

type Props = {
    params: Promise<{ id: string }>
}

export default async function ArchiveRiddlePage({ params }: Props) {
    const { id } = await params
    const supabase = await createServerSupabaseClient()

    // 1. Ověření publikace podle českého data
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })

    const { data: riddle } = await supabase
        .from('riddles')
        .select('id, category, hints, publish_date')
        .eq('id', id)
        .eq('is_active', true)
        .lte('publish_date', todayStr)
        .single()

    if (!riddle) {
        notFound()
    }

    const allHints: string[] = riddle.hints || []
    let initialHints = [allHints[0]]
    let initialIsSolved = false
    let initialIsInDrawer = false
    let initialScore: number | null = null
    let initialSecretAnswer: string | null = null

    // 2. Načtení rozehraného stavu uživatele
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (user) {
        const { data: state } = await supabase
            .from('user_riddle_state')
            .select('current_step, status, score_earned, updated_at')
            .eq('user_id', user.id)
            .eq('riddle_id', riddle.id)
            .maybeSingle()

        if (state) {
            const step = Math.max(1, Math.min(state.current_step || 1, allHints.length))
            initialHints = allHints.slice(0, step)

            if (state.status === 'SOLVED') {
                initialIsSolved = true
                initialScore = state.score_earned || null

                // Tajenku dotáhneme pouze pro vyřešenou hádanku
                const { data: secretData } = await supabase
                    .from('riddles')
                    .select('secret_answer')
                    .eq('id', riddle.id)
                    .single()

                initialSecretAnswer = secretData?.secret_answer || null
            } else if (state.status === 'IN_DRAWER') {
                // Kontrola denního zámku šuplíku podle českého data poslední akce
                const lastUpdate = state.updated_at
                    ? new Date(state.updated_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })
                    : todayStr

                if (lastUpdate === todayStr) {
                    initialIsInDrawer = true
                }
            }
        }
    }

    return (
        <main className="w-full max-w-lg mx-auto px-4 pb-12 flex-1 flex flex-col items-center">
            {/* Horní navigační odkaz zpět do archivu */}
            <div className="w-full flex items-center justify-between mb-6">
                <Link
                    href="/archiv"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Zpět do archivu</span>
                </Link>
                <span className="text-[11px] font-mono text-slate-500">
                    Publikováno: {riddle.publish_date}
                </span>
            </div>

            <RiddleCard
                riddleId={riddle.id}
                category={riddle.category}
                initialHints={initialHints}
                totalHintsCount={allHints.length}
                initialIsSolved={initialIsSolved}
                initialIsInDrawer={initialIsInDrawer}
                initialScore={initialScore}
                initialSecretAnswer={initialSecretAnswer}
            />
        </main>
    )
}