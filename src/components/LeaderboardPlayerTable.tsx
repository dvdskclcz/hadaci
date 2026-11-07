'use client'

import { useState } from 'react'
import { Trophy, Flame, Target } from 'lucide-react'

type Player = {
    nickname: string
    solved_count: number
    total_score: number
    daily_streak_current: number
    daily_streak_max: number
    solve_streak_current: number
    solve_streak_max: number
    [key: string]: any
}

export function LeaderboardPlayerTable({ players }: { players: Player[] }) {
    const [mode, setMode] = useState<'score' | 'streak'>('score')

    const sortedPlayers = [...players].sort((a, b) => {
        if (mode === 'score') {
            return (b.total_score || 0) - (a.total_score || 0)
        } else {
            // Řazení podle mistrovské série (solve_streak_max nebo current), pak denní série
            const aStreak = Math.max(a.solve_streak_max || 0, a.solve_streak_current || 0)
            const bStreak = Math.max(b.solve_streak_max || 0, b.solve_streak_current || 0)
            if (bStreak !== aStreak) return bStreak - aStreak
            return (b.daily_streak_max || 0) - (a.daily_streak_max || 0)
        }
    })

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-left">
            {/* Hlavička karty s přepínačem */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white">Top Hádači</h2>
                        <p className="text-[11px] text-slate-400">
                            {mode === 'score' ? 'Pořadí podle celkového počtu bodů' : 'Pořadí podle rekordních sérií'}
                        </p>
                    </div>
                </div>

                {/* Přepínač: Nejvyšší skóre vs. Nejdelší série */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setMode('score')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                            mode === 'score'
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Nejvyšší skóre</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('streak')}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                            mode === 'streak'
                                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                        }`}
                    >
                        <Target className="w-3.5 h-3.5" />
                        <span>Nejdelší série</span>
                    </button>
                </div>
            </div>

            {/* Tabulka */}
            <div className="overflow-x-auto mt-2">
                <table className="w-full text-xs text-left">
                    <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold whitespace-nowrap">
                            <th className="py-2.5 px-2 text-center w-8">#</th>
                            <th className="py-2.5 px-3">Hráč</th>
                            <th className="py-2.5 px-2 text-center" title="Denní kalendářní série (aktuální / max)">
                                🔥 Denní
                            </th>
                            <th className="py-2.5 px-2 text-center" title="Mistrovská série bez chyby (aktuální / max)">
                                🎯 V řadě
                            </th>
                            <th className="py-2.5 px-2 text-center">Uhádnuto</th>
                            <th className="py-2.5 px-3 text-right">Celkem bodů</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {sortedPlayers && sortedPlayers.length > 0 ? (
                            sortedPlayers.map((p, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/30 transition">
                                    <td className="py-3 px-2 font-bold text-slate-500 text-center">
                                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                                    </td>
                                    <td className="py-3 px-3 font-semibold text-slate-200 whitespace-nowrap">
                                        {p.nickname}
                                    </td>
                                    <td className="py-3 px-2 text-center font-medium text-amber-400 whitespace-nowrap">
                                        <span title={`Aktuální: ${p.daily_streak_current}, Rekord: ${p.daily_streak_max}`}>
                                            {p.daily_streak_current}
                                            {p.daily_streak_max > p.daily_streak_current && (
                                                <span className="text-[10px] text-slate-500 ml-1">
                                                    (max {p.daily_streak_max})
                                                </span>
                                            )}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-center font-medium text-emerald-400 whitespace-nowrap">
                                        <span title={`Aktuální: ${p.solve_streak_current}, Rekord: ${p.solve_streak_max}`}>
                                            {p.solve_streak_current}
                                            {p.solve_streak_max > p.solve_streak_current && (
                                                <span className="text-[10px] text-slate-500 ml-1">
                                                    (max {p.solve_streak_max})
                                                </span>
                                            )}
                                        </span>
                                    </td>
                                    <td className="py-3 px-2 text-center text-slate-400 whitespace-nowrap">
                                        {p.solved_count}
                                    </td>
                                    <td className="py-3 px-3 text-right font-bold text-amber-400 whitespace-nowrap">
                                        {p.total_score} b.
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                                    Zatím nikdo v síni slávy. Zahraj si hádanku dne a zapiš se sem!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default LeaderboardPlayerTable

