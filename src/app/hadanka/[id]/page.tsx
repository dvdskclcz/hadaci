import { Suspense } from 'react'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import RiddleCard from '@/components/RiddleCard'
import { ArrowLeft } from 'lucide-react'

type Props = {
    params: Promise<{ id: string }>
}

async function SpecificRiddleGame({ params }: Props) {
    // 1. Explicitní dynamic signál pro Next.js 16
    await connection()

    // 2. Rozbalení ID až uvnitř Suspense hranice
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const todayStr = new Date().toISOString().split('T')[0]

    // Načteme hádanku podle ID (nesmí mít budoucí datum publikace)
    const { data: riddle, error } = await supabase
        .from('riddles')
        .select('id, category, hints, publish_date')
        .eq('id', id)
        .eq('is_active', true)
        .lte('publish_date', todayStr)
        .maybeSingle()

    if (error || !riddle) {
        notFound()
    }

    const allHints = riddle.hints as string[]

    return (
        <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-lg mb-4 flex items-center justify-between">
                <Link
                    href="/archiv"
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Zpět do archivu a šuplíku</span>
                </Link>
                <span className="text-[11px] text-slate-500">
                    Zveřejněno: {riddle.publish_date}
                </span>
            </div>

            <RiddleCard
                riddleId={riddle.id}
                category={riddle.category}
                initialHints={[allHints[0]]}
                totalHintsCount={allHints.length}
            />
        </div>
    )
}

// Hlavní komponenta stránky je synchronní a pouze obalí obsah do Suspense
export default function RiddlePage({ params }: Props) {
    return (
        <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
            <Suspense fallback={<p className="text-slate-400 text-sm animate-pulse">Příprava hádanky...</p>}>
                <SpecificRiddleGame params={params} />
            </Suspense>
        </main>
    )
}