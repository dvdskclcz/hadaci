'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { submitTopicSuggestionAction } from '@/app/actions/game'
import { Lightbulb, Check, Loader2, X, Sparkles } from 'lucide-react'

const SUGGESTION_CATEGORIES = [
    'Významná česká osobnost',
    'Místo, hrad nebo památka',
    'Český vynález, technika či značka',
    'Film, kniha nebo popkultura',
    'Celé nové téma / okruh',
    'Jiné',
]

type Props = {
    variant?: 'nav' | 'banner'
}

export default function TopicSuggestionModal({ variant = 'nav' }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [category, setCategory] = useState(SUGGESTION_CATEGORIES[0])
    const [suggestion, setSuggestion] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!suggestion.trim() || loading) return

        setLoading(true)
        setErrorMessage(null)

        const res = await submitTopicSuggestionAction(category, suggestion)
        setLoading(false)

        if (res.error) {
            setErrorMessage(res.error)
            return
        }

        setSubmitted(true)
        setTimeout(() => {
            setIsOpen(false)
            setSubmitted(false)
            setSuggestion('')
        }, 2500)
    }

    const modalContent = isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[85dvh] flex flex-col text-left">
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition"
                    aria-label="Zavřít"
                >
                    <X className="w-5 h-5" />
                </button>

                {submitted ? (
                    <div className="py-8 text-center space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                            <Check className="w-6 h-6" />
                        </div>
                        <h3 className="text-base font-bold text-white">Díky za skvělý tip!</h3>
                        <p className="text-xs text-slate-400">
                            Zapsali jsme si ho do edičního plánu pro další dny.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 text-left overflow-y-auto pr-1 min-h-0 flex-1">
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                                <Lightbulb className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Co by se mělo hádat?</h3>
                                <p className="text-[11px] text-slate-400">
                                    Dej nám vědět, jaké téma nebo osobnost by tě bavilo luštit.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                                Okruh / kategorie
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                            >
                                {SUGGESTION_CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                                Tvůj tip nebo konkrétní nápad
                            </label>
                            <textarea
                                value={suggestion}
                                onChange={(e) => setSuggestion(e.target.value)}
                                placeholder="Např. Jan Werich, Remoska, nebo více českých hradů a zámků..."
                                rows={3}
                                maxLength={500}
                                required
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
                            />
                            <div className="text-[10px] text-slate-500 text-right mt-1">
                                {suggestion.length}/500
                            </div>
                        </div>

                        {errorMessage && (
                            <p className="text-xs text-rose-400">{errorMessage}</p>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800 shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition"
                            >
                                Zavřít
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !suggestion.trim()}
                                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                            >
                                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                <span>Odeslat tip</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    ) : null

    return (
        <>
            {/* Tlačítko pro otevření okna podle umístění */}
            {variant === 'nav' ? (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="text-xs font-semibold p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    title="Navrhni, co by se mělo hádat příště"
                >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Dát tip</span>
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="w-full py-3 px-4 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Chybí ti tu oblíbené téma? Navrhni hádanku na přání</span>
                </button>
            )}

            {/* Vykreslení modálního okna přes React Portal přímo do body */}
            {mounted && modalContent && createPortal(modalContent, document.body)}
        </>
    )
}
