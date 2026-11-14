import { Suspense } from 'react'
import { connection } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getPublishedDetectiveCasesAction } from '@/app/actions/detective'
import ArchiveBoard, {
  ArchiveItem,
  ArchiveRiddleItem,
  ArchiveDetectiveItem,
} from '@/components/ArchiveBoard'
import TopicSuggestionModal from '@/components/TopicSuggestionModal'
import { Archive } from 'lucide-react'

interface ArchivePageProps {
  searchParams?: Promise<{ filter?: 'all' | 'riddles' | 'detective' }>
}

async function ArchiveContentLoader({ searchParams }: ArchivePageProps) {
  await connection()
  let initialFilter: 'all' | 'riddles' | 'detective' = 'all'
  try {
    const params = searchParams ? await searchParams : undefined
    if (params?.filter === 'detective' || params?.filter === 'riddles') {
      initialFilter = params.filter
    }
  } catch (err) {
    console.warn('⚠️ Chyba při načítání searchParams v /archiv:', err)
  }

  const supabase = await createServerSupabaseClient()
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1. Paralelní načtení publikovaných hádanek a detektivních případů
  const [riddlesRes, detectiveRes] = await Promise.all([
    supabase
      .from('riddles')
      .select('id, category, publish_date, is_daily')
      .eq('is_active', true)
      .lte('publish_date', todayStr)
      .order('publish_date', { ascending: false }),
    getPublishedDetectiveCasesAction(),
  ])

  const riddles = riddlesRes.data || []
  const { cases: detectiveCases, userStates: detectiveUserStates } = detectiveRes

  // 2. Načteme stav odehraných hádanek pro přihlášeného hráče
  let userRiddleStates: Record<string, any> = {}
  if (user) {
    const { data: states } = await supabase
      .from('user_riddle_state')
      .select('riddle_id, status, score_earned, updated_at')
      .eq('user_id', user.id)

    if (states) {
      userRiddleStates = states.reduce((acc, curr) => {
        acc[curr.riddle_id] = curr
        return acc
      }, {} as Record<string, any>)
    }
  }

  // 3. Převedeme denní hádanky do sjednoceného formátu
  const riddleItems: ArchiveRiddleItem[] = riddles.map((r) => ({
    type: 'riddle',
    id: r.id,
    category: r.category,
    publish_date: r.publish_date,
    is_daily: Boolean(r.is_daily),
    userState: userRiddleStates[r.id]
      ? {
          status: userRiddleStates[r.id].status,
          score_earned: userRiddleStates[r.id].score_earned,
          updated_at: userRiddleStates[r.id].updated_at,
        }
      : null,
  }))

  // 4. Převedeme detektivní případy do sjednoceného formátu (tajenka je pouze u SOLVED)
  const detectiveItems: ArchiveDetectiveItem[] = detectiveCases.map((c) => ({
    type: 'detective',
    id: c.id,
    slug: c.slug,
    publish_date: c.publish_date,
    entity_type: c.entity_type,
    difficulty: c.difficulty,
    initial_clue: c.initial_clue,
    secret_answer: c.secret_answer || null,
    userState: detectiveUserStates[c.id]
      ? {
          status: detectiveUserStates[c.id].status,
          score_earned: detectiveUserStates[c.id].score_earned,
          questions_count: detectiveUserStates[c.id].questions_count,
          is_drawer_repair: detectiveUserStates[c.id].is_drawer_repair,
          secret_answer: detectiveUserStates[c.id].secret_answer || null,
          updated_at: detectiveUserStates[c.id].updated_at,
        }
      : null,
  }))

  // 5. Sloučíme obě sady a seřadíme chronologicky sestupně (nejnovější nahoře)
  const allItems: ArchiveItem[] = [...riddleItems, ...detectiveItems].sort((a, b) =>
    b.publish_date.localeCompare(a.publish_date)
  )

  return (
    <ArchiveBoard
      initialItems={allItems}
      todayStr={todayStr}
      initialFilter={initialFilter}
    />
  )
}

export default function ArchivePage({ searchParams }: ArchivePageProps) {
  return (
    <main className="w-full max-w-xl mx-auto px-4 pb-12 flex-1">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-2">
          <Archive className="w-5 h-5" />
        </div>
        <h1 className="text-3xl font-black text-amber-400 tracking-tight mb-1">Archiv a šuplík</h1>
        <p className="text-xs text-slate-400">
          Zahraj si minulé hádanky i detektivní výslechy nebo dořeš resty ze šuplíku
        </p>
      </div>

      <Suspense
        fallback={
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center text-slate-400 text-xs animate-pulse">
            Otevírám archiv a šuplík...
          </div>
        }
      >
        <ArchiveContentLoader searchParams={searchParams} />
      </Suspense>

      <div className="mt-8">
        <TopicSuggestionModal variant="banner" />
      </div>
    </main>
  )
}
