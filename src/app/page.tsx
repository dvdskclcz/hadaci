import { Suspense } from 'react'
import { connection } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import RiddleCard from '@/components/RiddleCard'

async function DailyGame() {
  // Explicitně Next.js 16 sdělíme, že tato komponenta běží až při požadavku klienta
  await connection()

  const supabase = await createServerSupabaseClient()

  // Zjistíme dnešní datum ve formátu YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0]

  // 1. Zkusíme najít hádanku určenou přesně pro dnešní den
  let { data: riddle } = await supabase
    .from('riddles')
    .select('id, category, hints, secret_answer')
    .eq('publish_date', todayStr)
    .eq('is_active', true)
    .maybeSingle()

  // 2. Pokud pro dnešek není nastaveno datum, vezmeme hádanku označenou jako is_daily
  if (!riddle) {
    const { data: fallbackRiddle } = await supabase
      .from('riddles')
      .select('id, category, hints, secret_answer')
      .eq('is_daily', true)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    riddle = fallbackRiddle
  }

  // Pojistka proti pádu aplikace, pokud by v DB nebyla žádná hádanka
  if (!riddle) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center text-slate-400 text-sm">
        Pro dnešní den není připravena žádná hádanka.
      </div>
    )
  }

  const allHints = riddle.hints as string[]
  const initialHints = [allHints[0]]

  return (
    <RiddleCard
      riddleId={riddle.id}
      category={riddle.category}
      initialHints={initialHints}
      totalHintsCount={allHints.length}
    />
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg text-center mb-6">
        <h1 className="text-4xl font-black text-amber-400 tracking-tight mb-1">Hádači.cz</h1>
        <p className="text-xs text-slate-400">Trénuj hlavu, promptuj AI a sbírej body</p>
      </div>

      <Suspense fallback={<p className="text-slate-400 text-sm animate-pulse">Příprava hracího stolu...</p>}>
        <DailyGame />
      </Suspense>
    </main>
  )
}