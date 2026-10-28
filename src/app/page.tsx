import { Suspense } from 'react'
import { connection } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import RiddleCard from '@/components/RiddleCard'
import UserNav from '@/components/UserNav'

async function DailyGame() {
  // Explicitně Next.js sdělíme, že tato komponenta běží dynamicky při požadavku
  await connection()

  const supabase = await createServerSupabaseClient()

  // Dnešní datum YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0]

  // 1. Zkusíme najít hádanku určenou přesně pro dnešní den
  let { data: riddle } = await supabase
    .from('riddles')
    .select('id, category, hints')
    .eq('publish_date', todayStr)
    .eq('is_active', true)
    .maybeSingle()

  // 2. Fallback pro případ, že na dnešek není naplánováno
  if (!riddle) {
    const { data: fallbackRiddle } = await supabase
      .from('riddles')
      .select('id, category, hints')
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

  const allHints = (riddle.hints as string[]) || []

  // 3. Načtení rozehraného stavu hráče
  let initialHints = [allHints[0]]
  let initialIsSolved = false
  let initialIsInDrawer = false
  let initialScore: number | null = null
  let initialSecretAnswer: string | null = null

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
      // Odkryjeme přesně tolik stop, kolik má hráč v databázi
      const step = Math.max(1, Math.min(state.current_step || 1, allHints.length))
      initialHints = allHints.slice(0, step)

      if (state.status === 'SOLVED') {
        initialIsSolved = true
        initialScore = state.score_earned || null

        // Tajenku dotáhneme ze serveru pouze pro hráče, který už hádanku úspěšně vyřešil
        const { data: secretData } = await supabase
          .from('riddles')
          .select('secret_answer')
          .eq('id', riddle.id)
          .single()

        initialSecretAnswer = secretData?.secret_answer || null
      } else if (state.status === 'IN_DRAWER') {
        // Zjistíme, zda byla do šuplíku uložena dnes
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })
        const lastUpdate = state.updated_at
          ? new Date(state.updated_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })
          : today

        if (lastUpdate === today) {
          initialIsInDrawer = true
        }
      }
    }
  }

  return (
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
  )
}

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-black text-amber-400 tracking-tight">Hádači.cz</h1>
          <p className="text-[11px] text-slate-400">Trénuj hlavu, promptuj AI a sbírej body</p>
        </div>
        <UserNav />
      </div>

      <Suspense fallback={<p className="text-slate-400 text-sm animate-pulse">Příprava hracího stolu...</p>}>
        <DailyGame />
      </Suspense>
    </main>
  )
}