'use client'

import { useState } from 'react'
import {
    PlayerProfileData,
    DetectiveStats,
    RiddleStats,
    BadgeItem,
} from '@/lib/badges'
import NicknameEditor from '@/components/NicknameEditor'
import {
    User as UserIcon,
    Trophy,
    Search,
    Sparkles,
    Flame,
    Target,
    HelpCircle,
    CheckCircle2,
    Lock,
    Award,
    TrendingUp,
    FolderCheck,
    Zap,
} from 'lucide-react'

interface UserProfileViewProps {
    data: PlayerProfileData
    onClose?: () => void
}

export default function UserProfileView({ data, onClose }: UserProfileViewProps) {
    const { user, detectiveStats, riddleStats, badges } = data
    const [badgeFilter, setBadgeFilter] = useState<'all' | 'detective' | 'riddle'>('all')

    const filteredBadges = badges.filter((b) => {
        if (badgeFilter === 'all') return true
        return b.category === badgeFilter
    })

    const unlockedCount = badges.filter((b) => b.unlocked).length
    const detectiveUnlocked = badges.filter((b) => b.category === 'detective' && b.unlocked).length

    return (
        <div className="space-y-6 text-slate-200">
            {/* 1. Karta hráče / Záhlaví */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left relative overflow-hidden">
                <div className="relative shrink-0">
                    {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-amber-500/40 shadow-lg"
                        />
                    ) : (
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl shadow-lg">
                            🕵️‍♂️
                        </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 rounded-full p-1 text-[11px]" title="Aktivní hráč">
                        🟢
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 className="text-lg sm:text-xl font-black text-white truncate">
                                {user.displayName}
                            </h2>
                            {user.email && (
                                <p className="text-xs text-slate-400 truncate font-mono">
                                    {user.email}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center justify-center sm:justify-end gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl self-center sm:self-auto">
                            <span className="text-[11px] text-slate-400">Přezdívka:</span>
                            <NicknameEditor />
                        </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold text-[11px]">
                            <span>🕵️ Spisy:</span>
                            <span className="font-bold">{detectiveStats.solvedCount}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold text-[11px]">
                            <span>🏆 Odznaky:</span>
                            <span className="font-bold">{unlockedCount} / {badges.length}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Statistiky: 2 karty vedle sebe / pod sebou */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* A. Detektivní výslech – Statistiky */}
                <div className="bg-gradient-to-br from-cyan-950/30 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white">
                                    🕵️ Detektivní výslech – Statistiky
                                </h3>
                                <p className="text-[10px] text-slate-400">Dedukce a výslechy týdenních spisů</p>
                            </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            {detectiveUnlocked} / 5 odznaků
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                Uzavřené spisy
                            </span>
                            <div className="text-lg font-black text-white flex items-baseline gap-1">
                                <span>{detectiveStats.solvedCount}</span>
                                <span className="text-xs text-slate-500 font-normal">
                                    / {detectiveStats.attemptedCount}
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                Úspěšnost
                            </span>
                            <div className="text-lg font-black text-emerald-400">
                                {detectiveStats.successRate} %
                            </div>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                Průměr otázek
                            </span>
                            <div className="text-lg font-black text-cyan-300">
                                {detectiveStats.avgQuestions !== null ? `${detectiveStats.avgQuestions} ot.` : '–'}
                            </div>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                Nejrychlejší výslech
                            </span>
                            <div className="text-lg font-black text-amber-400">
                                {detectiveStats.bestQuestions !== null ? `${detectiveStats.bestQuestions} ot.` : '–'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 bg-slate-950/80 border border-cyan-500/20 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                            <span>🔥</span>
                            <span className="font-semibold">Aktuální vítězná série:</span>
                        </div>
                        <div className="font-black text-cyan-300">
                            {detectiveStats.currentStreak} v řadě
                            {detectiveStats.maxStreak > detectiveStats.currentStreak && (
                                <span className="text-[10px] text-slate-500 font-normal ml-1">
                                    (rekord: {detectiveStats.maxStreak})
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* B. Denní hádanky – Statistiky */}
                <div className="bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 border border-amber-500/20 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white">
                                    🧩 Denní hádanky – Statistiky
                                </h3>
                                <p className="text-[10px] text-slate-400">Každodenní hádání českých reálií</p>
                            </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {riddleStats.totalScore} bodů
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                Uhádnuté hádanky
                            </span>
                            <div className="text-lg font-black text-white flex items-baseline gap-1">
                                <span>{riddleStats.solvedCount}</span>
                                <span className="text-xs text-slate-500 font-normal">
                                    / {riddleStats.attemptedCount}
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                Úspěšnost
                            </span>
                            <div className="text-lg font-black text-emerald-400">
                                {riddleStats.successRate} %
                            </div>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                                <span>🔥 Denní série</span>
                            </span>
                            <div className="text-lg font-black text-amber-400">
                                {riddleStats.dailyStreakCurrent} dny
                                <span className="text-[10px] text-slate-500 font-normal block">
                                    Rekord: {riddleStats.dailyStreakMax}
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5 flex items-center gap-1">
                                <span>🎯 V řadě bez chyby</span>
                            </span>
                            <div className="text-lg font-black text-emerald-400">
                                {riddleStats.solveStreakCurrent}
                                <span className="text-[10px] text-slate-500 font-normal block">
                                    Rekord: {riddleStats.solveStreakMax}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-3 bg-slate-950/80 border border-amber-500/20 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                            <span>🏆</span>
                            <span className="font-semibold">Celkové herní body:</span>
                        </div>
                        <div className="font-black text-amber-400">
                            {riddleStats.totalScore} b.
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Sekce odznaků a trofejí */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                            <Award className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <span>Odznaky a úspěchy</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                                    {unlockedCount} / {badges.length}
                                </span>
                            </h3>
                            <p className="text-xs text-slate-400">
                                Odemkni speciální tituly za své znalosti a vyšetřovací dedukci
                            </p>
                        </div>
                    </div>

                    {/* Přepínač filtrů */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs self-start sm:self-auto">
                        <button
                            type="button"
                            onClick={() => setBadgeFilter('all')}
                            className={`px-3 py-1 rounded-lg font-semibold transition ${
                                badgeFilter === 'all'
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Všechny ({badges.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setBadgeFilter('detective')}
                            className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                                badgeFilter === 'detective'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>🕵️ Výslech</span>
                            <span className="text-[10px] font-bold">({detectiveUnlocked}/5)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setBadgeFilter('riddle')}
                            className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                                badgeFilter === 'riddle'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span>🧩 Denní hra</span>
                        </button>
                    </div>
                </div>

                {/* Grid odznaků */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredBadges.map((badge) => {
                        const isUnlocked = badge.unlocked

                        return (
                            <div
                                key={badge.id}
                                className={`rounded-2xl p-3.5 border transition relative overflow-hidden flex flex-col justify-between ${
                                    isUnlocked
                                        ? badge.category === 'detective'
                                            ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                                            : 'bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-950/20'
                                        : 'bg-slate-950/60 border-slate-800/80 opacity-70 hover:opacity-90'
                                }`}
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div
                                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${
                                                isUnlocked
                                                    ? badge.category === 'detective'
                                                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                                                        : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                                    : 'bg-slate-900 border-slate-800 grayscale'
                                            }`}
                                        >
                                            {badge.icon}
                                        </div>

                                        {isUnlocked ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span>Odemčeno</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                                                <Lock className="w-2.5 h-2.5 text-slate-500" />
                                                <span>Zamčeno</span>
                                            </span>
                                        )}
                                    </div>

                                    <h4 className="font-bold text-sm text-white mb-1 flex items-center gap-1.5">
                                        <span>{badge.name}</span>
                                        {badge.category === 'detective' && (
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                                                Výslech
                                            </span>
                                        )}
                                    </h4>

                                    <p className="text-xs text-slate-300 leading-relaxed mb-2">
                                        {badge.description}
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                                    <span className="text-slate-400 italic">
                                        {badge.conditionText}
                                    </span>
                                    {badge.progressText && (
                                        <span
                                            className={`font-mono font-bold ${
                                                isUnlocked ? 'text-emerald-400' : 'text-slate-400'
                                            }`}
                                        >
                                            {badge.progressText}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
