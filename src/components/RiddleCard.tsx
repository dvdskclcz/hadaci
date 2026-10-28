'use client'

import { useState } from 'react'
import Link from 'next/link'
import RiddleReportButton from '@/components/RiddleReportButton'
import NicknameEditor from '@/components/NicknameEditor'
import {
    submitGuessAction,
    requestNextHintAction,
    recordAiUsageAction,
} from '@/app/actions/game'
import {
    Sparkles,
    Copy,
    Check,
    ArrowRight,
    Lightbulb,
    Trophy,
    Coffee,
    Share2,
    Bot,
    Brain,
    FolderArchive,
} from 'lucide-react'

type RiddleCardProps = {
    riddleId: string
    category: string
    initialHints: string[]
    totalHintsCount: number
    initialIsSolved?: boolean
    initialScore?: number | null
    initialSecretAnswer?: string | null
}

const AI_MODELS = [
    { id: 'chatgpt', name: 'ChatGPT' },
    { id: 'gemini', name: 'Gemini' },
    { id: 'claude', name: 'Claude' },
    { id: 'copilot', name: 'Copilot' },
    { id: 'perplexity', name: 'Perplexity' },
    { id: 'other', name: 'Jiný model' },
]

export default function RiddleCard({
    riddleId,
    category,
    initialHints,
    totalHintsCount,
    initialIsSolved = false,
    initialScore = null,
    initialSecretAnswer = null,
}: RiddleCardProps) {
    const [hints, setHints] = useState<string[]>(initialHints)
    const [guess, setGuess] = useState('')
    const [message, setMessage] = useState<string | null>(null)
    const [isTypo, setIsTypo] = useState(false)
    const [isSolved, setIsSolved] = useState(initialIsSolved)
    const [score, setScore] = useState<number | null>(initialScore)
    const [secretAnswer, setSecretAnswer] = useState<string | null>(initialSecretAnswer)
    const [copiedPrompt, setCopiedPrompt] = useState(false)
    const [loading, setLoading] = useState(false)

    // Sledování přiznání AI a stavů
    const [usedPromptCopy, setUsedPromptCopy] = useState(false)
    const [selectedAi, setSelectedAi] = useState<string | null>(null)
    const [aiSaved, setAiSaved] = useState(false)
    const [copiedShare, setCopiedShare] = useState(false)
    const [showDonate, setShowDonate] = useState(false)

    // Zkopírování formátovaného promptu pro AI
    const handleCopyPrompt = () => {
        const formattedHints = hints.map((h, i) => `${i + 1}. ${h}`).join('\n')
        const promptText = `Hledáme: ${category}.\nDosavadní nápovědy a stopy:\n${formattedHints}\n\nKdo nebo co to je? Napiš mi 3 nejpravděpodobnější tipy a stručné zdůvodnění.`

        navigator.clipboard.writeText(promptText)
        setUsedPromptCopy(true)
        setCopiedPrompt(true)
        setTimeout(() => setCopiedPrompt(false), 2500)
    }

    // Odeslání odpovědi
    const handleGuessSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!guess.trim() || loading) return

        setLoading(true)
        setMessage(null)
        setIsTypo(false)

        const res = await submitGuessAction(riddleId, guess)
        setLoading(false)

        if ('error' in res && res.error) {
            setMessage(res.error)
            return
        }

        if ('status' in res) {
            if (res.status === 'TYPO') {
                setIsTypo(true)
                setMessage(res.message || null)
                return
            }

            if (res.status === 'SOLVED') {
                setIsSolved(true)
                setScore(res.score || 0)
                setSecretAnswer(res.secretAnswer || '')
                if (res.hintsRevealed) setHints(res.hintsRevealed)
                return
            }

            if (res.status === 'WRONG' || res.status === 'IN_DRAWER') {
                setMessage(res.message || null)
                if (res.hintsRevealed) setHints(res.hintsRevealed)
                setGuess('')
            }
        }
    }

    // Přeskočení na další nápovědu přes serverovou akci
    const handleNextHint = async () => {
        if (loading || hints.length >= totalHintsCount) return

        setLoading(true)
        setMessage(null)
        setIsTypo(false)

        const res = await requestNextHintAction(riddleId)
        setLoading(false)

        if ('error' in res && res.error) {
            setMessage(res.error)
            return
        }

        if ('hintsRevealed' in res && res.hintsRevealed) {
            setHints(res.hintsRevealed)
        }
    }

    // Uložení přiznání AI / Čisté hlavy
    const handleSelectAi = async (usedAi: boolean, modelName?: string) => {
        const label = usedAi ? modelName || 'Jiný' : 'Čistá hlava'
        setSelectedAi(label)
        setAiSaved(true)
        await recordAiUsageAction(riddleId, usedAi, modelName)
    }

    // Sdílení výsledku (Wordle mřížka)
    const handleShareResult = () => {
        const total = totalHintsCount
        const used = hints.length
        const grid = '🟩'.repeat(used) + '⬜'.repeat(Math.max(0, total - used))
        const partner = selectedAi ? `Parťák: ${selectedAi}` : 'Hádači.cz'

        const shareText = `Hádači.cz 🕵️‍♂️\nKategorie: ${category}\n${grid} (${used}/${total} stop)\nZískáno: ${score} bodů\n${partner}\nhttps://hadaci.cz`

        navigator.clipboard.writeText(shareText)
        setCopiedShare(true)
        setTimeout(() => setCopiedShare(false), 2500)
    }

    const iban = 'CZ8708000000001388225023'
    const qrCodeUrl = `https://api.paylibo.com/paylibo/generator/image?iban=${iban}&amount=50.00&currency=CZK&message=Kava%20pro%20Hadace`

    return (
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Horní lišta */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                    {category}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <span>
                        Stopa {hints.length} z {totalHintsCount}
                    </span>
                </div>
            </div>

            {/* Vítězná obrazovka */}
            {isSolved ? (
                <div className="text-center py-2 animate-fade-in space-y-6">
                    <div>
                        <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-400">
                            <Trophy className="w-7 h-7" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-1">Skvělá práce!</h2>
                        <p className="text-slate-400 text-xs mb-3">Správná odpověď byla:</p>
                        <div className="text-lg font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 py-2.5 px-6 rounded-xl inline-block">
                            {secretAnswer}
                        </div>
                        <div className="text-sm font-semibold text-amber-400 mt-2">
                            +{score} bodů do žebříčku
                            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                                <span>Zapsáno v síni slávy jako:</span>
                                <NicknameEditor />
                            </div>
                        </div>
                    </div>

                    {/* Přiznání AI */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                                <Bot className="w-4 h-4 text-indigo-400" />
                                Jak jsi na to přišel?
                            </span>
                            {aiSaved && (
                                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> Uloženo
                                </span>
                            )}
                        </div>

                        <p className="text-[11px] text-slate-400 mb-3">
                            {usedPromptCopy
                                ? 'Všimli jsme si, že jsi kopíroval nápovědy pro AI. Který model ti pomohl?'
                                : 'Použil jsi vlastní dedukci, nebo ti napověděla umělá inteligence?'}
                        </p>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => handleSelectAi(false)}
                                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${selectedAi === 'Čistá hlava'
                                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                                    }`}
                            >
                                <Brain className="w-3.5 h-3.5 text-amber-400" />
                                <span>Čistá hlava 🧠</span>
                            </button>

                            {AI_MODELS.map((model) => (
                                <button
                                    key={model.id}
                                    type="button"
                                    onClick={() => handleSelectAi(true, model.name)}
                                    className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition ${selectedAi === model.name
                                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold'
                                            : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                                        }`}
                                >
                                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>{model.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tlačítka sdílení & podpora */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleShareResult}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
                        >
                            {copiedShare ? (
                                <>
                                    <Check className="w-4 h-4 text-emerald-400" />
                                    <span className="text-emerald-400">Zkopírováno!</span>
                                </>
                            ) : (
                                <>
                                    <Share2 className="w-4 h-4 text-amber-400" />
                                    <span>Sdílet výsledek</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowDonate(!showDonate)}
                            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
                        >
                            <Coffee className="w-4 h-4" />
                            <span>Pozvat na kávu</span>
                        </button>
                    </div>

                    {/* QR kód pro donate */}
                    {showDonate && (
                        <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30 text-center animate-fade-in">
                            <p className="text-xs text-amber-300 font-bold mb-1">
                                Díky za podporu Hádačů! ☕
                            </p>
                            <p className="text-[11px] text-slate-400 mb-3">
                                Pípni z mobilního bankovnictví (50 Kč na provoz a tokeny)
                            </p>
                            <div className="inline-block p-2 bg-white rounded-xl shadow-md">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={qrCodeUrl}
                                    alt="QR platba 50 Kč"
                                    className="w-36 h-36"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2">
                                Česká spořitelna • Okamžitá QR platba
                            </p>
                        </div>
                    )}

                    <div className="pt-2 border-t border-slate-800/60 mt-4">
                        <Link
                            href="/archiv"
                            className="w-full py-2.5 px-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
                        >
                            <FolderArchive className="w-4 h-4 text-indigo-400" />
                            <span>Pokračovat v luštění z archivu a šuplíku</span>
                        </Link>
                    </div>

                    <RiddleReportButton riddleId={riddleId} />
                </div>
            ) : (
                <>
                    {/* Odkryté stopy */}
                    <div className="space-y-3 mb-6">
                        {hints.map((hintText, index) => (
                            <div
                                key={index}
                                className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl text-left"
                            >
                                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Nápověda #{index + 1}
                                </div>
                                <p className="text-sm text-slate-200 leading-relaxed italic">
                                    „{hintText}“
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Prompt pro AI */}
                    <button
                        onClick={handleCopyPrompt}
                        type="button"
                        className="w-full mb-6 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold transition"
                    >
                        {copiedPrompt ? (
                            <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400">Stopy zkopírovány jako prompt pro AI!</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 text-indigo-400" />
                                <span>Zkopírovat stopy jako prompt pro tvou AI</span>
                                <Copy className="w-3.5 h-3.5 ml-1 opacity-70" />
                            </>
                        )}
                    </button>

                    {/* Chybové zprávy */}
                    {message && (
                        <div
                            className={`p-3 rounded-xl text-xs mb-4 text-left border ${isTypo
                                    ? 'bg-amber-950/50 border-amber-600/50 text-amber-200'
                                    : 'bg-rose-950/50 border-rose-600/50 text-rose-200'
                                }`}
                        >
                            {message}
                        </div>
                    )}

                    {/* Formulář odpovědi */}
                    <form onSubmit={handleGuessSubmit} className="space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                placeholder="Tvůj tip (např. Karel Čapek)..."
                                disabled={loading}
                                className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                            />
                            <button
                                type="submit"
                                disabled={loading || !guess.trim()}
                                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-3 rounded-xl text-sm transition flex items-center gap-1.5"
                            >
                                <span>Tipnout</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {hints.length < totalHintsCount && (
                            <button
                                type="button"
                                onClick={handleNextHint}
                                disabled={loading}
                                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 py-2 transition disabled:opacity-50"
                            >
                                {loading
                                    ? 'Odkrývám další stopu...'
                                    : 'Zatím nevím, odkrýt další nápovědu bez pokusu'}
                            </button>
                        )}
                    </form>
                </>
            )}
        </div>
    )
}