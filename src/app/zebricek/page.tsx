import { Suspense } from 'react'
import { connection } from 'next/server'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Bot, Brain, MessageSquare, ArrowRight } from 'lucide-react'
import LeaderboardPlayerTable from '@/components/LeaderboardPlayerTable'

async function LeaderboardTables() {
    await connection()
    const supabase = await createServerSupabaseClient()

    // 1. Načteme souboj AI modelů
    const { data: aiStats } = await supabase
        .from('v_ai_model_stats')
        .select('*')

    // 2. Načteme žebříček hráčů z pohledu
    const { data: players } = await supabase
        .from('v_leaderboard_players')
        .select('*')
        .limit(20)

    // 3. Načteme profily s jejich sériemi
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname, daily_streak_current, daily_streak_max, solve_streak_current, solve_streak_max')

    // Propojíme data z pohledu s profily
    const profileMap = new Map<string, any>()
    profiles?.forEach((prof: any) => {
        if (prof.id) profileMap.set(prof.id, prof)
        if (prof.nickname) profileMap.set(prof.nickname, prof)
    })

    const enrichedPlayers = (players || []).map((p: any) => {
        const prof = profileMap.get(p.user_id) || profileMap.get(p.id) || profileMap.get(p.nickname)
        return {
            ...p,
            daily_streak_current: p.daily_streak_current ?? prof?.daily_streak_current ?? 0,
            daily_streak_max: p.daily_streak_max ?? prof?.daily_streak_max ?? 0,
            solve_streak_current: p.solve_streak_current ?? prof?.solve_streak_current ?? 0,
            solve_streak_max: p.solve_streak_max ?? prof?.solve_streak_max ?? 0,
        }
    })

    return (
        <div className="space-y-8">
            {/* 1. Karta: Aréna AI modelů */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-left">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Bot className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white">Aréna AI modelů</h2>
                        <p className="text-[11px] text-slate-400">Který model dovede hráče k odpovědi nejrychleji?</p>
                    </div>
                </div>

                <div className="overflow-x-auto mt-4">
                    <table className="w-full text-xs text-left">
                        <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                                <th className="py-2.5 px-3">Parťák</th>
                                <th className="py-2.5 px-3 text-center">Her</th>
                                <th className="py-2.5 px-3 text-center">Průměr stop</th>
                                <th className="py-2.5 px-3 text-right">Průměr bodů</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {aiStats && aiStats.length > 0 ? (
                                aiStats.map((stat: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-800/30 transition">
                                        <td className="py-3 px-3 font-semibold text-slate-200 flex items-center gap-1.5">
                                            {stat.model_name.includes('Čistá') ? (
                                                <Brain className="w-3.5 h-3.5 text-amber-400" />
                                            ) : (
                                                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                                            )}
                                            <span>{stat.model_name}</span>
                                        </td>
                                        <td className="py-3 px-3 text-center text-slate-400">{stat.total_games}</td>
                                        <td className="py-3 px-3 text-center font-bold text-amber-400">
                                            {stat.avg_hints}
                                        </td>
                                        <td className="py-3 px-3 text-right font-semibold text-emerald-400">
                                            {stat.avg_score} b.
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-6 text-center text-slate-500 italic">
                                        Zatím žádná odehraná data. Buď první, kdo hádanku prolomí!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 2. Karta: Nejlepší hádači se sloupci sérií a přepínačem Skóre vs. Série */}
            <LeaderboardPlayerTable players={enrichedPlayers} />

            {/* 3. Upoutávka na Režim 2: Detektivní výslech */}
            <Link
                href="/vyslech"
                className="group block bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-cyan-500/20 hover:border-cyan-500/50 rounded-3xl p-6 text-left relative overflow-hidden transition shadow-lg"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition">
                                    Detektivní výslech
                                </span>
                                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold">
                                    Novinka v1.6.0
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Žádné pasivní čtení nápověd! Pokládej zjišťovací otázky a systém ti bude odpovídat pouze <strong>ANO</strong>, <strong>NE</strong> nebo <strong>Nelze ověřit</strong>. Využij dedukci a odhal případ!
                            </p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 shrink-0 self-center">
                        <span>Hrát</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                    </div>
                </div>
            </Link>
        </div>
    )
}

export default function LeaderboardPage() {
    return (
        <main className="w-full max-w-xl mx-auto px-4 pb-12 flex-1">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-black text-amber-400 tracking-tight mb-1">Síň slávy & AI Aréna</h1>
                <p className="text-xs text-slate-400">Statistiky úspěšnosti hráčů a umělé inteligence</p>
            </div>

            <Suspense fallback={<p className="text-slate-400 text-xs text-center animate-pulse">Načítám žebříčky z databáze...</p>}>
                <LeaderboardTables />
            </Suspense>
        </main>
    )
}
