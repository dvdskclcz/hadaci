'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Archive,
    FolderArchive,
    CheckCircle2,
    PlayCircle,
    Trophy,
    Lock,
    Search,
    Sparkles,
    Calendar,
    ArrowRight,
} from 'lucide-react'
import { formatCzechDate, formatCaseTitle } from '@/lib/utils'

export type ArchiveRiddleItem = {
    type: 'riddle'
    id: string
    category: string
    publish_date: string
    is_daily: boolean
    userState?: {
        status: 'IN_PROGRESS' | 'SOLVED' | 'IN_DRAWER'
        score_earned?: number
        updated_at?: string
    } | null
}

export type ArchiveDetectiveItem = {
    type: 'detective'
    id: string
    slug: string
    publish_date: string
    entity_type: 'person' | 'place' | 'object' | 'event' | 'concept'
    difficulty: 'easy' | 'medium' | 'hard'
    initial_clue: string
    secret_answer?: string | null
    userState?: {
        status: 'IN_PROGRESS' | 'SOLVED' | 'DRAWER'
        score_earned?: number
        questions_count?: number
        is_drawer_repair?: boolean
        secret_answer?: string | null
        updated_at?: string
    } | null
}

export type ArchiveItem = ArchiveRiddleItem | ArchiveDetectiveItem

interface ArchiveBoardProps {
    initialItems: ArchiveItem[]
    todayStr: string
    initialFilter?: 'all' | 'riddles' | 'detective'
}

const ENTITY_LABELS: Record<string, string> = {
    person: '👤 Osobnost',
    place: '🏰 Místo',
    object: '📦 Předmět',
    event: '⚡ Událost',
    concept: '💡 Pojem',
}

const DIFFICULTY_LABELS: Record<string, string> = {
    easy: '🟢 Snadné',
    medium: '⚡ Střední',
    hard: '🔥 Velká výzva',
}

export default function ArchiveBoard({
    initialItems,
    todayStr,
    initialFilter = 'all',
}: ArchiveBoardProps) {
    const [filterType, setFilterType] = useState<'all' | 'riddles' | 'detective'>(initialFilter)
    const [items, setItems] = useState<ArchiveItem[]>(initialItems)

    // Synchronizace lokálního stavu z localStorage pro anonymní nepřihlášené hráče
    useEffect(() => {
        if (typeof window === 'undefined') return

        setItems((prevItems) =>
            prevItems.map((item) => {
                if (item.type === 'detective') {
                    // Pokud stav chybí nebo je neúplný (anonymní hráč)
                    if (!item.userState) {
                        try {
                            const local = localStorage.getItem(`hadaci_vyslech_${item.id}`)
                            if (local) {
                                const parsed = JSON.parse(local)
                                const isLocalSolved = parsed.status === 'SOLVED'
                                return {
                                    ...item,
                                    secret_answer: isLocalSolved ? parsed.secretAnswer || null : null,
                                    userState: {
                                        status: parsed.status || 'IN_PROGRESS',
                                        score_earned: parsed.score,
                                        questions_count: Array.isArray(parsed.questionsLog)
                                            ? parsed.questionsLog.length
                                            : 0,
                                        is_drawer_repair: Boolean(parsed.isDrawerRetry),
                                        secret_answer: isLocalSolved ? parsed.secretAnswer || null : null,
                                    },
                                }
                            }
                        } catch {
                            // Ignorovat neplatný JSON
                        }
                    }
                } else if (item.type === 'riddle') {
                    if (!item.userState) {
                        try {
                            const localSolved = localStorage.getItem(`hadaci_solved_${item.id}`)
                            if (localSolved) {
                                const parsed = JSON.parse(localSolved)
                                return {
                                    ...item,
                                    userState: {
                                        status: 'SOLVED',
                                        score_earned: parsed.score,
                                    },
                                }
                            }
                        } catch {
                            // Ignorovat
                        }
                    }
                }
                return item
            })
        )
    }, [])

    // Počty pro filtry
    const totalCount = items.length
    const riddlesCount = items.filter((i) => i.type === 'riddle').length
    const detectiveCount = items.filter((i) => i.type === 'detective').length

    // Položky pro Šuplík (čekající na odvetu / dořešení)
    const drawerItems = items.filter((item) => {
        if (item.type === 'riddle') {
            return item.userState?.status === 'IN_DRAWER'
        }
        return item.userState?.status === 'DRAWER'
    })

    // Filtrované položky pro hlavní archiv
    const filteredItems = items.filter((item) => {
        if (filterType === 'riddles') return item.type === 'riddle'
        if (filterType === 'detective') return item.type === 'detective'
        return true
    })

    return (
        <div className="space-y-6">
            {/* 1. SEKCE: ŠUPLÍK (pokud má hráč resty v hádankách nebo výsleších) */}
            {drawerItems.length > 0 && (
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-3xl p-5 text-left space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                        <FolderArchive className="w-4 h-4 text-amber-400" />
                        <h2 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                            K dořešení v šuplíku ({drawerItems.length})
                        </h2>
                    </div>

                    <div className="space-y-2">
                        {drawerItems.map((item) => {
                            if (item.type === 'detective') {
                                return (
                                    <Link
                                        key={`drawer-det-${item.id}`}
                                        href={`/vyslech?case=${item.slug}`}
                                        className="block group"
                                    >
                                        <div className="bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400/60 p-3.5 rounded-2xl flex items-center justify-between transition">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                                    <Search className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                                            🕵️ Detektivní výslech
                                                        </span>
                                                        <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                                                            {formatCaseTitle(item.slug)}
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {formatCzechDate(item.publish_date)}
                                                    </div>
                                                </div>
                                            </div>

                                            <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl border bg-cyan-500/20 border-cyan-500/40 text-cyan-300 group-hover:bg-cyan-400 group-hover:text-slate-950 transition">
                                                Zkusit odvetu (50 b.) 🔓
                                            </span>
                                        </div>
                                    </Link>
                                )
                            }

                            // Denní hádanka v šuplíku
                            const isToday = item.publish_date === todayStr
                            const lastUpdate = item.userState?.updated_at
                                ? new Date(item.userState.updated_at).toLocaleDateString('en-CA', {
                                      timeZone: 'Europe/Prague',
                                  })
                                : todayStr
                            const isLockedToday = lastUpdate === todayStr

                            return isLockedToday ? (
                                <div
                                    key={`drawer-rid-${item.id}`}
                                    className="bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl flex items-center justify-between opacity-75 cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center shrink-0">
                                            <Lock className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-300">
                                                {item.category}
                                            </div>
                                            <div className="text-[10px] text-slate-500">
                                                {formatCzechDate(item.publish_date)}
                                            </div>
                                        </div>
                                    </div>

                                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl border bg-slate-800/80 border-slate-700 text-slate-400">
                                        Zamčeno do zítřka 🔒
                                    </span>
                                </div>
                            ) : (
                                <Link
                                    key={`drawer-rid-${item.id}`}
                                    href={isToday ? '/' : `/hadanka/${item.id}`}
                                    className="block group"
                                >
                                    <div className="bg-slate-900/90 border border-amber-500/30 hover:border-amber-400/60 p-3.5 rounded-2xl flex items-center justify-between transition">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                                                <FolderArchive className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                                                    {item.category}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {formatCzechDate(item.publish_date)}
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

            {/* 2. PŘEPÍNAČ TYPŮ HER (FILTR) */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
                <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                        filterType === 'all'
                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Vše ({totalCount})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setFilterType('riddles')}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                        filterType === 'riddles'
                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <span>🧩 Denní hádanky ({riddlesCount})</span>
                </button>

                <button
                    type="button"
                    onClick={() => setFilterType('detective')}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                        filterType === 'detective'
                            ? 'bg-cyan-500 text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                    }`}
                >
                    <Search className="w-3.5 h-3.5" />
                    <span>🕵️ Výslechy ({detectiveCount})</span>
                </button>
            </div>

            {/* 3. HLAVNÍ SEZNAM ARCHIVNÍCH POLOŽEK */}
            <div className="space-y-3">
                {filteredItems.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center text-slate-400 text-xs">
                        Pro vybraný filtr nejsou v archivu žádné položky.
                    </div>
                ) : (
                    filteredItems.map((item) => {
                        // --- A. KARTA DETEKTIVNÍHO VÝSLECHU ---
                        if (item.type === 'detective') {
                            const isSolved = item.userState?.status === 'SOLVED'
                            const isInDrawer = item.userState?.status === 'DRAWER'
                            const isInProgress = item.userState?.status === 'IN_PROGRESS'
                            const questionsCount = item.userState?.questions_count ?? 0

                            return (
                                <Link
                                    key={`det-${item.id}`}
                                    href={`/vyslech?case=${item.slug}`}
                                    className="block group"
                                >
                                    <div className="bg-slate-900 border border-cyan-500/25 hover:border-cyan-400/50 p-4 rounded-2xl flex items-center justify-between transition group-hover:bg-slate-900/80 shadow-sm">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center justify-center shrink-0">
                                                {isSolved ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                ) : isInDrawer ? (
                                                    <FolderArchive className="w-5 h-5 text-amber-500" />
                                                ) : (
                                                    <Search className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
                                                )}
                                            </div>

                                            <div className="text-left min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/35 font-bold px-2 py-0.2 rounded-full">
                                                        🕵️ Detektivní výslech
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                                                        {DIFFICULTY_LABELS[item.difficulty] || item.difficulty}
                                                    </span>
                                                </div>

                                                <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate">
                                                    {formatCaseTitle(item.slug)}
                                                </p>

                                                <span className="text-[11px] text-slate-400 font-medium">
                                                    {formatCzechDate(item.publish_date)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="shrink-0 pl-2">
                                            {isSolved ? (
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1 rounded-xl flex items-center gap-1">
                                                        <Trophy className="w-3.5 h-3.5" />
                                                        {item.userState?.score_earned} b.
                                                    </span>
                                                    <div className="text-[10px] text-slate-500 mt-1">
                                                        {questionsCount} {questionsCount === 1 ? 'otázka' : questionsCount >= 2 && questionsCount <= 4 ? 'otázky' : 'otázek'}
                                                    </div>
                                                </div>
                                            ) : isInDrawer ? (
                                                <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2.5 py-1 rounded-xl">
                                                    V šuplíku (50 b.)
                                                </span>
                                            ) : isInProgress ? (
                                                <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 px-2.5 py-1 rounded-xl">
                                                    Rozehráno ({questionsCount} ot.)
                                                </span>
                                            ) : (
                                                <span className="text-xs font-semibold text-cyan-400 bg-cyan-950/30 border border-cyan-800/40 px-3 py-1 rounded-xl group-hover:bg-cyan-500 group-hover:text-slate-950 transition">
                                                    Vyšetřovat
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        }

                        // --- B. KARTA DENNÍ HÁDANKY ---
                        const isSolved = item.userState?.status === 'SOLVED'
                        const isInDrawer = item.userState?.status === 'IN_DRAWER'
                        const isToday = item.publish_date === todayStr

                        return (
                            <Link
                                key={`rid-${item.id}`}
                                href={isToday ? '/' : `/hadanka/${item.id}`}
                                className="block group"
                            >
                                <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl flex items-center justify-between transition group-hover:bg-slate-900/80 shadow-sm">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                                            {isSolved ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                            ) : isInDrawer ? (
                                                <FolderArchive className="w-5 h-5 text-amber-500" />
                                            ) : (
                                                <PlayCircle className="w-5 h-5 text-indigo-400 group-hover:text-amber-400 transition" />
                                            )}
                                        </div>

                                        <div className="text-left min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-bold text-white group-hover:text-amber-400 transition truncate">
                                                    {item.category}
                                                </span>
                                                {isToday && (
                                                    <span className="text-[10px] bg-amber-400/10 border border-amber-400/30 text-amber-400 px-2 py-0.2 rounded-full font-bold">
                                                        Dnešní
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-slate-400 font-medium">
                                                {formatCzechDate(item.publish_date)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="shrink-0 pl-2">
                                        {isSolved ? (
                                            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1 rounded-xl flex items-center gap-1">
                                                <Trophy className="w-3.5 h-3.5" />
                                                {item.userState?.score_earned} b.
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
                    })
                )}
            </div>
        </div>
    )
}
