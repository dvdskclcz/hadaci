import { Suspense } from 'react'
import { connection } from 'next/server'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Archive, CheckCircle2, FolderArchive, PlayCircle, Trophy, Lock } from 'lucide-react'
import TopicSuggestionModal from '@/components/TopicSuggestionModal'
import { formatCzechDate } from '@/lib/utils'

async function ArchiveList() {
  await connection()
  const supabase = await createServerSupabaseClient()
  
  // Český čas YYYY-MM-DD
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })

  const { data: { user } } = await supabase.auth.getUser()

  // 1. Načteme všechny publikované hádanky (minulé i dnešní)
  const { data: riddles } = await supabase
    .from('riddles')
    .select('id, category, publish_date, is_daily')
    .eq('is_active', true)
    .lte('publish_date', todayStr)
    .order('publish_date', { ascending: false })

  // 2. Načteme stav odehraných her pro přihlášeného hráče
  let userStates: Record<string, any> = {}
  if (user) {
    const { data: states } = await supabase
      .from('user_riddle_state')
      .select('riddle_id, status, score_earned, updated_at')
      .eq('user_id', user.id)

    if (states) {
      userStates = states.reduce((acc, curr) => {
        acc[curr.riddle_id] = curr
        return acc
      }, {} as Record<string, any>)
    }
  }

  if (!riddles || riddles.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center text-slate-400 text-xs">
        V archivu zatím nejsou žádné starší hádanky.
      </div>
    )
  }

  // Rozdělení na šuplík (čekající na odvetu) a standardní archiv
  const drawerRiddles = riddles.filter(r => userStates[r.id]?.status === 'IN_DRAWER')

  return (
    <div className="space-y-6">
      {/* Sekce: Šuplík (pokud má hráč resty) */}
      {drawerRiddles.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-3xl p-5 text-left">
          <div className="flex items-center gap-2 mb-3">
            <FolderArchive className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              K dořešení v šuplíku ({drawerRiddles.length})
            </h2>
          </div>
          <div className="space-y-2">
            {drawerRiddles.map((riddle) => {
              const state = userStates[riddle.id]
              const isToday = riddle.publish_date === todayStr
              const lastUpdate = state?.updated_at
                ? new Date(state.updated_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Prague' })
                : todayStr
              const isLockedToday = lastUpdate === todayStr

              return isLockedToday ? (
                <div
                  key={`drawer-${riddle.id}`}
                  className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl flex items-center justify-between opacity-75 cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-300">
                        {riddle.category}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {formatCzechDate(riddle.publish_date)}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl border bg-slate-800/80 border-slate-700 text-slate-400">
                    Zamčeno do zítřka 🔒
                  </span>
                </div>
              ) : (
                <Link
                  key={`drawer-${riddle.id}`}
                  href={isToday ? '/' : `/hadanka/${riddle.id}`}
                  className="block group"
                >
                  <div className="bg-slate-900/90 border border-amber-500/30 hover:border-amber-400/60 p-3.5 rounded-2xl flex items-center justify-between transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <FolderArchive className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                          {riddle.category}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatCzechDate(riddle.publish_date)}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl border bg-amber-500/20 border-amber-500/40 text-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                      Zkusit znovu 🔓
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Kompletní přehled archivu */}
      <div className="space-y-3">
        {riddles.map((riddle) => {
          const state = userStates[riddle.id]
          const isSolved = state?.status === 'SOLVED'
          const isInDrawer = state?.status === 'IN_DRAWER'
          const isToday = riddle.publish_date === todayStr

          return (
            <Link
              key={riddle.id}
              href={isToday ? '/' : `/hadanka/${riddle.id}`}
              className="block group"
            >
              <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex items-center justify-between transition group-hover:bg-slate-900/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    {isSolved ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isInDrawer ? (
                      <FolderArchive className="w-5 h-5 text-amber-500" />
                    ) : (
                      <PlayCircle className="w-5 h-5 text-indigo-400 group-hover:text-amber-400 transition" />
                    )}
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                        {riddle.category}
                      </span>
                      {isToday && (
                        <span className="text-[10px] bg-amber-400/10 border border-amber-400/30 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                          Dnešní
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {formatCzechDate(riddle.publish_date)}
                    </span>
                  </div>
                </div>

                <div>
                  {isSolved ? (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1 rounded-xl flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      {state.score_earned} b.
                    </span>
                  ) : isInDrawer ? (
                    <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-xl">
                      V šuplíku
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/30 border border-indigo-800/40 px-3 py-1 rounded-xl group-hover:bg-amber-400 group-hover:text-slate-950 transition">
                      Luštit
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function ArchivePage() {
  return (
    <main className="w-full max-w-xl mx-auto px-4 pb-12 flex-1">
      <div className="text-center mb-6">
        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-2">
          <Archive className="w-5 h-5" />
        </div>
        <h1 className="text-3xl font-black text-amber-400 tracking-tight mb-1">Archiv a šuplík</h1>
        <p className="text-xs text-slate-400">
          Zahraj si minulé hádanky nebo dořeš ty, které ti minule utekly
        </p>
      </div>

      <Suspense fallback={<p className="text-slate-400 text-xs text-center animate-pulse">Otevírám archiv...</p>}>
        <ArchiveList />
      </Suspense>

      <div className="mt-8">
        <TopicSuggestionModal variant="banner" />
      </div>
    </main>
  )
}
