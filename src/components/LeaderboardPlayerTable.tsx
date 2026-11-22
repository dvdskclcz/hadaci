'use client'

import { useState } from 'react'
import { Trophy, Target, Calendar, UserCheck } from 'lucide-react'
import { FullLeaderboardData, LeaderboardPeriod } from '@/lib/leaderboard-types'

export function LeaderboardPlayerTable({ data }: { data: FullLeaderboardData }) {
    const [period, setPeriod] = useState<LeaderboardPeriod>('week')
    const [mode, setMode] = useState<'score' | 'streak'>('score')

    const activePeriodData = data[period]
    const players = activePeriodData.players || []

    const sortedPlayers = [...players].sort((a, b) => {
        if (mode === 'score') {
            // Primárně celkový počet bodů DESC, sekundárně počet uhádnutých DESC
            if (b.totalScore !== a.totalScore) {
                return b.totalScore - a.totalScore
            }
            return b.solvedCount - a.solvedCount
        } else {
            // Primárně mistrovská série v řadě (solveStreakCurrent DESC, pak max DESC)
            if (b.solveStreakCurrent !== a.solveStreakCurrent) {
                return b.solveStreakCurrent - a.solveStreakCurrent
            }
            if (b.solveStreakMax !== a.solveStreakMax) {
                return b.solveStreakMax - a.solveStreakMax
            }
            // Sekundárně denní série (dailyStreakCurrent DESC, pak max DESC)
            if (b.dailyStreakCurrent !== a.dailyStreakCurrent) {
                return b.dailyStreakCurrent - a.dailyStreakCurrent
            }
            return b.dailyStreakMax - a.dailyStreakMax
        }
    })

    const hasCurrentUserInTable = sortedPlayers.some((p) => p.isCurrentUser)

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl text-left space-y-4">
            {/* 1. Horní přepínač období */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                    type="button"
                    onClick={() => {
                        setPeriod('week')
                        setMode('score')
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
                        period === 'week'
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                >
                    <span>🔥</span>
                    <span className="truncate">Tento týden</span>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setPeriod('month')
                        setMode('score')
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
                        period === 'month'
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                >
                    <span>📅</span>
                    <span className="truncate">Tento měsíc</span>
                </button>
                <button
                    type="button"
                    onClick={() => setPeriod('all')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
                        period === 'all'
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                >
                    <span>🏆</span>
                    <span className="truncate">Celkově</span>
                </button>
            </div>

            {/* 2. Informační řádek s intervalem a pod-přepínačem */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                            <Trophy className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">
                                {period === 'week' && 'Týdenní žebříček'}
                                {period === 'month' && 'Měsíční žebříček'}
                                {period === 'all' && 'Síň slávy (Celkově)'}
                            </h2>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                                <Calendar className="w-3 h-3 text-amber-400/80 shrink-0" />
                                <span className="font-medium text-slate-300">{activePeriodData.rangeLabel}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Přepínač Skóre vs. Série (pouze u celkového žebříčku) */}
                {period === 'all' ? (
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
                ) : (
                    <div className="text-[11px] text-slate-500 italic hidden sm:block">
                        Pořadí podle bodů za hádanky a detektivní výslechy
                    </div>
                )}
            </div>

            {/* 3. Tabulka výsledků */}
            <div className="w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/40">
                <table className="w-full table-fixed text-xs text-left">
                    <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold bg-slate-950/60">
                            <th className="py-2.5 px-2 text-center w-9 sm:w-11">#</th>
                            <th className="py-2.5 px-2 sm:px-3">Hráč</th>
                            {mode === 'score' ? (
                                <>
                                    <th className="py-2.5 px-2 text-center w-20 sm:w-28" title="Celkem vyřešených her (Hádanky + Výslechy)">
                                        Vyřešeno
                                    </th>
                                    <th className="py-2.5 px-2 sm:px-3 text-right w-24 sm:w-32" title="Celkem získaných bodů v období">
                                        Body
                                    </th>
                                </>
                            ) : (
                                <>
                                    <th className="py-2.5 px-2 text-center w-20 sm:w-24" title="Denní kalendářní série">
                                        🔥 Denní
                                    </th>
                                    <th className="py-2.5 px-2 sm:px-3 text-center w-24 sm:w-28" title="Mistrovská série bez chyby">
                                        🎯 V řadě
                                    </th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {sortedPlayers && sortedPlayers.length > 0 ? (
                            sortedPlayers.map((p, idx) => {
                                const isTop1 = idx === 0
                                const isTop2 = idx === 1
                                const isTop3 = idx === 2

                                return (
                                    <tr
                                        key={p.userId || idx}
                                        className={`transition ${
                                            p.isCurrentUser
                                                ? 'bg-amber-500/10 border-l-2 border-amber-500 hover:bg-amber-500/15'
                                                : 'hover:bg-slate-800/30'
                                        }`}
                                    >
                                        {/* Pořadí s medailemi pro top 3 */}
                                        <td className="py-3 px-2 text-center font-bold">
                                            {isTop1 ? (
                                                <span className="text-base" title="1. místo">🥇</span>
                                            ) : isTop2 ? (
                                                <span className="text-base" title="2. místo">🥈</span>
                                            ) : isTop3 ? (
                                                <span className="text-base" title="3. místo">🥉</span>
                                            ) : (
                                                <span className="text-slate-500 text-[11px]">{idx + 1}.</span>
                                            )}
                                        </td>

                                        {/* Jméno hráče + označení přihlášeného uživatele */}
                                        <td className="py-3 px-2 sm:px-3 min-w-0">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span
                                                    className={`truncate font-semibold ${
                                                        p.isCurrentUser
                                                            ? 'text-amber-300 font-bold'
                                                            : 'text-slate-200'
                                                    }`}
                                                    title={p.nickname}
                                                >
                                                    {p.nickname}
                                                </span>
                                                {p.isCurrentUser && (
                                                    <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase shrink-0 tracking-wider">
                                                        Ty
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {mode === 'score' ? (
                                            <>
                                                {/* Počet vyřešených her s rozpadem */}
                                                <td className="py-3 px-2 text-center">
                                                    <div className="font-semibold text-slate-200">
                                                        {p.solvedCount}
                                                    </div>
                                                    {(p.riddleCount > 0 || p.detectiveCount > 0) && (
                                                        <div className="text-[10px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                                                            <span title={`${p.riddleCount} vyřešených hádanek`}>
                                                                🧩 {p.riddleCount}
                                                            </span>
                                                            <span className="text-slate-700">•</span>
                                                            <span title={`${p.detectiveCount} vyřešených případů`}>
                                                                🕵️ {p.detectiveCount}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Body s rozpadem */}
                                                <td className="py-3 px-2 sm:px-3 text-right">
                                                    <div className="font-bold text-amber-400">
                                                        {p.totalScore} b.
                                                    </div>
                                                    {(p.riddleScore > 0 || p.detectiveScore > 0) && (
                                                        <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                                                            {p.riddleScore > 0 && (
                                                                <span title={`${p.riddleScore} b. z hádanek`}>
                                                                    🧩 {p.riddleScore}
                                                                </span>
                                                            )}
                                                            {p.riddleScore > 0 && p.detectiveScore > 0 && (
                                                                <span className="text-slate-700">+</span>
                                                            )}
                                                            {p.detectiveScore > 0 && (
                                                                <span title={`${p.detectiveScore} b. z výslechu`}>
                                                                    🕵️ {p.detectiveScore}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                {/* Denní série */}
                                                <td className="py-3 px-2 text-center font-medium text-amber-400">
                                                    <span title={`Aktuální: ${p.dailyStreakCurrent}, Rekord: ${p.dailyStreakMax}`}>
                                                        {p.dailyStreakCurrent}
                                                        {p.dailyStreakMax > p.dailyStreakCurrent && (
                                                            <span className="text-[10px] text-slate-500 ml-1 hidden sm:inline">
                                                                (max {p.dailyStreakMax})
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Mistrovská série v řadě */}
                                                <td className="py-3 px-2 sm:px-3 text-center font-medium text-emerald-400">
                                                    <span title={`Aktuální: ${p.solveStreakCurrent}, Rekord: ${p.solveStreakMax}`}>
                                                        {p.solveStreakCurrent}
                                                        {p.solveStreakMax > p.solveStreakCurrent && (
                                                            <span className="text-[10px] text-slate-500 ml-1 hidden sm:inline">
                                                                (max {p.solveStreakMax})
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-8 px-4 text-center text-slate-400">
                                    <div className="text-2xl mb-2">
                                        {period === 'week' ? '⏳' : period === 'month' ? '📅' : '🏆'}
                                    </div>
                                    <p className="font-semibold text-slate-300 text-xs">
                                        {period === 'week' && 'V tomto týdnu zatím nikdo nezískal body.'}
                                        {period === 'month' && 'V tomto měsíci zatím nikdo nezískal body.'}
                                        {period === 'all' && 'V síni slávy zatím nikdo není.'}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mt-1">
                                        Vyřeš dnešní hádanku nebo otevři detektivní spis a zapiš se na 1. místo!
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 4. Přívětivá poznámka pro přihlášeného hráče, pokud v aktuálním období ještě neskóroval */}
            {data.currentUserId && !hasCurrentUserInTable && (
                <div className="flex items-center gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-[11px] text-slate-400">
                    <UserCheck className="w-4 h-4 text-amber-400/70 shrink-0" />
                    <span>
                        V tomto období jsi zatím nezískal žádné body. Zahraj si dnešní hádanku a obsaď své místo v žebříčku!
                    </span>
                </div>
            )}
        </div>
    )
}

export default LeaderboardPlayerTable
