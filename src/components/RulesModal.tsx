'use client'

import { useState } from 'react'
import { HelpCircle, X, Sparkles } from 'lucide-react'

export default function RulesModal() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            {/* Tlačítko v liště */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
                title="Jak se hra hraje?"
            >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Pravidla</span>
            </button>

            {/* Modální okno s explicitním obnovením zalamování textu */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in whitespace-normal">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative text-left">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-9 h-9 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Jak hrát Hádači.cz?</h3>
                                <p className="text-[11px] text-slate-400">Rychlý průvodce pro luštitele</p>
                            </div>
                        </div>

                        <div className="space-y-3.5 text-xs text-slate-300">
                            <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                                <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                                    1
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white mb-0.5">Jedna denní hádanka</p>
                                    <p className="text-slate-400 leading-relaxed text-[11px] break-words">
                                        Každou půlnoc vychází nová záhada z českých luhů a hájů – osobnost, památka, popkultura nebo vynález. Další hádanky najdeš v archivu.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                                <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                                    2
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white mb-0.5">Stopy a body</p>
                                    <p className="text-slate-400 leading-relaxed text-[11px] break-words">
                                        Začínáš se 100 body. Každá odkrytá stopa tě stojí část bodů. Čím dříve tajenku uhodneš, tím výše stoupáš v žebříčku.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                                    3
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white mb-0.5">AI je povolena (ale přiznej barvu!)</p>
                                    <p className="text-slate-400 leading-relaxed text-[11px] break-words">
                                        Klidně si pomoz ChatGPT, Claude či jiným modelem. V cíli tě jen poprosíme o pravdivé označení, jak jsi k výsledku došel.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                                    4
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-white mb-0.5">Tolerance překlepů</p>
                                    <p className="text-slate-400 leading-relaxed text-[11px] break-words">
                                        Nemusíš se bát drobných překlepů ani diakritiky, herní kontrolor tě pochopí. Pokud by ale odpověď neprošla, využij tlačítko reklamace.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs transition"
                            >
                                Rozumím, jdu hádat!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}