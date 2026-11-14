'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    DetectiveCasePublic,
    UserDetectiveState,
    QuestionItem,
    askDetectiveQuestionAction,
    submitDetectiveGuessAction,
} from '@/app/actions/detective'
import NicknameEditor from '@/components/NicknameEditor'
import { formatCaseTitle } from '@/lib/utils'
import {
    Search,
    HelpCircle,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Trophy,
    Send,
    Loader2,
    Share2,
    Check,
    Archive,
    RotateCcw,
    FileText,
    Sparkles,
} from 'lucide-react'

interface DetectiveBoardProps {
    initialCase: DetectiveCasePublic | null
    allCases: DetectiveCasePublic[]
    initialUserState: UserDetectiveState | null
}

const ENTITY_CONFIG: Record<
    string,
    { label: string; icon: string; classes: string }
> = {
    person: {
        label: 'Osobnost',
        icon: '👤',
        classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    place: {
        label: 'Místo',
        icon: '🏰',
        classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    object: {
        label: 'Předmět',
        icon: '📦',
        classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    event: {
        label: 'Událost',
        icon: '⚡',
        classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    concept: {
        label: 'Pojem',
        icon: '💡',
        classes: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    },
}

const DIFFICULTY_CONFIG: Record<
    string,
    { label: string; icon: string; classes: string }
> = {
    easy: {
        label: 'Snadné',
        icon: '🎯',
        classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    medium: {
        label: 'Střední',
        icon: '⚡',
        classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    hard: {
        label: 'Velká výzva',
        icon: '🔥',
        classes: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
}

export default function DetectiveBoard({
    initialCase,
    allCases,
    initialUserState,
}: DetectiveBoardProps) {
    if (!initialCase) {
        return (
            <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
                <Search className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                <h2 className="text-lg font-bold text-white mb-1">Žádný aktivní případ</h2>
                <p className="text-xs">Momentálně není k dispozici žádný otevřený detektivní spis.</p>
            </div>
        )
    }

    const [isDrawerRetry, setIsDrawerRetry] = useState<boolean>(
        initialUserState?.is_drawer_repair || false
    )
    const [status, setStatus] = useState<'IN_PROGRESS' | 'SOLVED' | 'DRAWER'>(
        initialUserState?.status || 'IN_PROGRESS'
    )
    const [score, setScore] = useState<number>(
        initialUserState?.score_earned ?? (isDrawerRetry ? 50 : 100)
    )
    const [questionsLog, setQuestionsLog] = useState<QuestionItem[]>(
        initialUserState?.questions_log || []
    )
    const [wrongGuesses, setWrongGuesses] = useState<number>(
        initialUserState?.wrong_guesses_count || 0
    )
    const [secretAnswer, setSecretAnswer] = useState<string | null>(
        initialUserState?.secret_answer || null
    )

    // Form inputs and UI state
    const [mode, setMode] = useState<'QUESTION' | 'GUESS'>('QUESTION')
    const [inputText, setInputText] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [infoMessage, setInfoMessage] = useState<{
        type: 'info' | 'error' | 'warning' | 'success'
        text: string
    } | null>(null)
    const [isCopied, setIsCopied] = useState(false)

    // Local storage persistence fallback for anonymous guests
    useEffect(() => {
        if (!initialUserState && typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(`hadaci_vyslech_${initialCase.id}`)
                if (stored) {
                    const parsed = JSON.parse(stored)
                    if (parsed.questionsLog) setQuestionsLog(parsed.questionsLog)
                    if (parsed.score !== undefined) setScore(parsed.score)
                    if (parsed.wrongGuesses !== undefined) setWrongGuesses(parsed.wrongGuesses)
                    if (parsed.status) setStatus(parsed.status)
                    if (parsed.secretAnswer) setSecretAnswer(parsed.secretAnswer)
                    if (parsed.isDrawerRetry !== undefined) setIsDrawerRetry(parsed.isDrawerRetry)
                }
            } catch (err) {
                console.warn('Nelze načíst stav z localStorage:', err)
            }
        }
    }, [initialCase.id, initialUserState])

    // Save to localStorage when anonymous state changes
    useEffect(() => {
        if (!initialUserState && typeof window !== 'undefined') {
            try {
                const payload = {
                    questionsLog,
                    score,
                    wrongGuesses,
                    status,
                    secretAnswer,
                    isDrawerRetry,
                }
                localStorage.setItem(
                    `hadaci_vyslech_${initialCase.id}`,
                    JSON.stringify(payload)
                )
            } catch (err) {
                console.warn('Nelze uložit stav do localStorage:', err)
            }
        }
    }, [questionsLog, score, wrongGuesses, status, secretAnswer, isDrawerRetry, initialCase.id, initialUserState])

    const entity = ENTITY_CONFIG[initialCase.entity_type] || ENTITY_CONFIG.concept
    const difficulty = DIFFICULTY_CONFIG[initialCase.difficulty] || DIFFICULTY_CONFIG.medium

    // Handle Question Submission
    const handleAskQuestion = async (e: React.FormEvent) => {
        e.preventDefault()
        const q = inputText.trim()
        if (!q || isLoading || status !== 'IN_PROGRESS') return

        setIsLoading(true)
        setInfoMessage(null)

        try {
            const res = await askDetectiveQuestionAction({
                caseId: initialCase.id,
                question: q,
                currentQuestionsLog: questionsLog,
                currentScore: score,
                isDrawerRetry,
            })

            if (res.status === 'INVALID') {
                setInfoMessage({ type: 'warning', text: res.message || 'Neplatný dotaz.' })
            } else if (res.status === 'DUPLICATE') {
                setInfoMessage({
                    type: 'info',
                    text: res.message || 'Tuto otázku jsi již položil.',
                })
                setInputText('')
            } else if (res.status === 'VALID' && res.questionItem) {
                setQuestionsLog((prev) => [...prev, res.questionItem!])
                if (res.updatedScore !== undefined) {
                    setScore(res.updatedScore)
                }
                setInputText('')

                if (res.isGameOver) {
                    setStatus('DRAWER')
                    setInfoMessage({
                        type: 'error',
                        text: res.message || 'Dosáhl jsi limitu 20 otázek. Případ byl odložen do Šuplíku k pozdější odvetě.',
                    })
                }
            } else if (res.status === 'DRAWER') {
                setStatus('DRAWER')
                setInfoMessage({
                    type: 'error',
                    text: res.message || 'Případ byl odložen do Šuplíku k pozdější odvetě.',
                })
            } else {
                setInfoMessage({
                    type: 'error',
                    text: res.message || 'Při vyhodnocení otázky došlo k chybě.',
                })
            }
        } catch (err: any) {
            setInfoMessage({
                type: 'error',
                text: err.message || 'Nepodařilo se položit otázku.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Handle Guess Submission
    const handleMakeGuess = async (e: React.FormEvent) => {
        e.preventDefault()
        const guess = inputText.trim()
        if (!guess || isLoading || status !== 'IN_PROGRESS') return

        setIsLoading(true)
        setInfoMessage(null)

        try {
            const res = await submitDetectiveGuessAction({
                caseId: initialCase.id,
                guess,
                currentQuestionsLog: questionsLog,
                currentScore: score,
                wrongGuessesCount: wrongGuesses,
                isDrawerRetry,
            })

            if (res.isTypo) {
                setInfoMessage({
                    type: 'warning',
                    text: res.message || 'Drobný překlep! Oprav ho bez ztráty bodů.',
                })
            } else if (res.correct) {
                setStatus('SOLVED')
                setScore(res.score ?? score)
                setSecretAnswer(res.secretAnswer || null)
                setInfoMessage({
                    type: 'success',
                    text: res.message || 'Gratulujeme! Případ byl úspěšně vyřešen.',
                })
                setInputText('')
            } else {
                // Wrong guess
                if (res.score !== undefined) setScore(res.score)
                if (res.newWrongCount !== undefined) setWrongGuesses(res.newWrongCount)

                if (res.isGameOver) {
                    setStatus('DRAWER')
                    setInfoMessage({
                        type: 'error',
                        text: res.message || 'Tři chybné pokusy. Případ byl odložen do Šuplíku k pozdější odvetě.',
                    })
                } else {
                    const fallbackRemaining = Math.max(0, 3 - (res.newWrongCount ?? wrongGuesses + 1))
                    const fallbackAttempts = fallbackRemaining === 1 ? 'zbývá 1 poslední pokus' : `zbývají ${fallbackRemaining} pokusy`
                    setInfoMessage({
                        type: 'error',
                        text: res.message || `${res.newWrongCount ?? wrongGuesses + 1}. chybný tip (-15 b.) – ${fallbackAttempts}.`,
                    })
                }
                setInputText('')
            }
        } catch (err: any) {
            setInfoMessage({
                type: 'error',
                text: err.message || 'Při ověřování tipu došlo k chybě.',
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Retry from drawer handler
    const handleDrawerRetry = () => {
        setIsDrawerRetry(true)
        setStatus('IN_PROGRESS')
        setScore(50)
        setWrongGuesses(0)
        setQuestionsLog([])
        setInfoMessage({
            type: 'info',
            text: 'Režim odvety zahájen! Hraješ o 50 bodů. Můžeš položit dalších 20 otázek.',
        })
    }

    // Share results handler
    const handleShare = async () => {
        const title = formatCaseTitle(initialCase.slug)
        const text = `🕵️‍♂️ Hádači.cz – Detektivní výslech\n${title}\n✅ Úspěšně vyřešeno na ${questionsLog.length} otázek se ziskem ${score} bodů!\nVyzkoušej své deduktivní schopnosti na: https://hadaci.cz/vyslech?case=${initialCase.slug}`

        if (navigator?.clipboard) {
            await navigator.clipboard.writeText(text)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2500)
        }
    }

    return (
        <div className="w-full max-w-xl mx-auto space-y-4">
            {/* Přepínač archivních spisů / případů */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] pl-1">
                        Spisy:
                    </span>
                    {allCases.map((c) => (
                        <Link
                            key={c.id}
                            href={`/vyslech?case=${c.slug}`}
                            className={`px-3 py-1 rounded-full whitespace-nowrap transition border ${
                                c.id === initialCase.id
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                            }`}
                        >
                            {formatCaseTitle(c.slug)}
                        </Link>
                    ))}
                </div>

                <Link
                    href="/archiv"
                    className="text-[11px] text-slate-400 hover:text-cyan-400 font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 transition pl-2"
                >
                    <Archive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Všechny spisy</span>
                </Link>
            </div>

            {/* Hlavní karta vyšetřování */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
                {/* 1. Hlavička: Kategorie (pouze po vyřešení), Obtížnost, Otázky a Bodový strop */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4 mb-5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        {status === 'SOLVED' && (
                            <span
                                className={`px-2.5 py-1 rounded-full border text-xs font-semibold flex items-center gap-1 ${entity.classes}`}
                            >
                                <span>{entity.icon}</span>
                                <span>{entity.label}</span>
                            </span>
                        )}
                        <span
                            className={`px-2 py-0.5 rounded-full border text-[11px] font-medium flex items-center gap-1 ${difficulty.classes}`}
                        >
                            <span>{difficulty.icon}</span>
                            <span>{difficulty.label}</span>
                        </span>
                        {isDrawerRetry && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1">
                                🗄️ Odveta ze šuplíku
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">
                            ❓ {questionsLog.length} / 20 otázek
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                            +{score} b.
                        </span>
                    </div>
                </div>

                {/* 2. Spis případu: Úvodní vodítko */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-5 relative">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1.5 uppercase tracking-wider">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Výchozí stopa z vyšetřovacího spisu</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed italic">
                        „{initialCase.initial_clue}“
                    </p>
                </div>

                {/* 3. Vítězná obrazovka */}
                {status === 'SOLVED' && (
                    <div className="text-center py-4 space-y-5 animate-fade-in">
                        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                            <Trophy className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white mb-1">
                                Případ úspěšně vyřešen!
                            </h2>
                            <p className="text-slate-400 text-xs mb-3">
                                Hledaný pojem byl odhalen:
                            </p>
                            <div className="text-xl font-black text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 py-3 px-6 rounded-2xl inline-block shadow-inner">
                                {secretAnswer}
                            </div>
                        </div>

                        <div className="text-sm font-semibold text-amber-400">
                            +{score} bodů do síně slávy
                            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                                <span>Zapsáno jako:</span>
                                <NicknameEditor />
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
                            >
                                {isCopied ? (
                                    <>
                                        <Check className="w-4 h-4 text-emerald-400" />
                                        <span>Zkopírováno!</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-4 h-4 text-indigo-400" />
                                        <span>Sdílet výsledek</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* 4. Obrazovka odložení do šuplíku (neúspěch / limit vyčerpán) */}
                {status === 'DRAWER' && (
                    <div className="text-center py-4 space-y-4 animate-fade-in">
                        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
                            <Archive className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white mb-1">
                                Vyšetřování uvízlo ve slepé uličce
                            </h2>
                            <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">
                                {wrongGuesses >= 3
                                    ? 'Vyčerpal jsi všechny 3 pokusy na finální tip. Tajenka zůstává skrytá.'
                                    : 'Byl vyčerpán limit 20 otázek. Případ byl odložen do Šuplíku.'}
                            </p>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleDrawerRetry}
                                className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition border border-amber-500/30"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Zkusit odvetu ze šuplíku (50 b.)</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 5. Protokol výslechu (Seznam položených otázek a odpovědí) */}
                <div className="mt-5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-2">
                        <span>Protokol výslechu</span>
                        <span>{questionsLog.length} záznamů</span>
                    </div>

                    {questionsLog.length === 0 ? (
                        <div className="py-8 text-center text-slate-500 text-xs italic bg-slate-950/30 rounded-2xl border border-dashed border-slate-800">
                            Zatím jsi nepoložil žádnou otázku. Polož zjišťovací otázku, na kterou
                            lze odpovědět ANO či NE (např. „Žije tato osoba ještě?“ nebo „Je to v Evropě?“).
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {questionsLog.map((item, idx) => (
                                <div
                                    key={item.id || idx}
                                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                                >
                                    <div className="flex items-start gap-2 text-slate-300">
                                        <span className="font-mono text-slate-500 font-bold">
                                            #{idx + 1}
                                        </span>
                                        <p className="leading-snug">{item.question}</p>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-1.5">
                                        {item.verdict === 'ANO' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span>ANO</span>
                                            </span>
                                        )}
                                        {item.verdict === 'NE' && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                                                <XCircle className="w-3 h-3" />
                                                <span>NE</span>
                                            </span>
                                        )}
                                        {item.verdict === 'NELZE_OVERIT' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-700/40 text-slate-300 border border-slate-700 font-medium text-[11px]">
                                                <HelpCircle className="w-3 h-3 text-slate-400" />
                                                <span>NELZE OVĚŘIT</span>
                                            </span>
                                        )}
                                        <span className="font-mono text-[10px] text-slate-500">
                                            -{item.penalty} b.
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 6. Zprávy a varování */}
                {infoMessage && (
                    <div
                        className={`mt-4 p-3 rounded-xl border text-xs flex items-center gap-2 animate-fade-in ${
                            infoMessage.type === 'error'
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                : infoMessage.type === 'warning'
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                : infoMessage.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300'
                        }`}
                    >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="leading-snug">{infoMessage.text}</span>
                    </div>
                )}

                {/* 7. Akční panel (Vkládání otázek / tipování) */}
                {status === 'IN_PROGRESS' && (
                    <div className="mt-6 pt-5 border-t border-slate-800">
                        {/* Přepínač režimu akce */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('QUESTION')
                                    setInfoMessage(null)
                                }}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                                    mode === 'QUESTION'
                                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-sm'
                                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                }`}
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Položit otázku (-4 b.)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setMode('GUESS')
                                    setInfoMessage(null)
                                }}
                                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                                    mode === 'GUESS'
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Vznést finální tip (-15 b.)</span>
                            </button>
                        </div>

                        {/* Formulář s textovým polem */}
                        <form
                            onSubmit={mode === 'QUESTION' ? handleAskQuestion : handleMakeGuess}
                            className="space-y-2"
                        >
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    disabled={isLoading}
                                    placeholder={
                                        mode === 'QUESTION'
                                            ? 'Např.: Je to muž? / Žije ještě? / Nachází se v Evropě?'
                                            : `Zadej přesný název nebo jméno (${
                                                  3 - wrongGuesses === 1
                                                      ? 'zbývá poslední pokus'
                                                      : `zbývají ${3 - wrongGuesses} pokusy`
                                              })...`
                                    }
                                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-4 pr-12 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                                />

                                <button
                                    type="submit"
                                    disabled={isLoading || !inputText.trim()}
                                    className="absolute right-2 p-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 text-slate-950 disabled:text-slate-600 transition"
                                    title={mode === 'QUESTION' ? 'Odeslat otázku' : 'Odeslat tip'}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </button>
                            </div>

                            <p className="text-[11px] text-slate-500 text-center">
                                {mode === 'QUESTION'
                                    ? 'Otázka musí být zjišťovací (ANO/NE). Nelze se ptát na pravopis, písmena a vylučovací „nebo“.'
                                    : `Na finální tip máš maximálně 3 pokusy (${
                                          3 - wrongGuesses === 1
                                              ? 'zbývá 1 poslední pokus'
                                              : `zbývají ${3 - wrongGuesses} pokusy`
                                      }). Drobný překlep tě body nestojí.`}
                            </p>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}

