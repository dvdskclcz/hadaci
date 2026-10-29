'use client'

import { useState, useEffect } from 'react'
import { APP_VERSION, CHANGELOG } from '@/lib/changelog'
import { Sparkles, X, CheckCircle2, History } from 'lucide-react'

export default function ChangelogModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [hasUnread, setHasUnread] = useState(false)

    useEffect(() => {
        const seenVersion = localStorage.getItem('hadaci_seen_version')
        if (seenVersion !== APP_VERSION) {
            setHasUnread(true)
        }
    }, [])

    const handleOpen = () => {
        setIsOpen(true)
        setHasUnread(false)
        localStorage.setItem('hadaci_seen_version', APP_VERSION)
    }

    return (
        <>
            {/* Tlačítko verze s indikátorem */}
            <button
                type="button"
                onClick={handleOpen}
                className="group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] font-mono text-slate-400 hover:text-slate-200 transition"
            >
                {hasUnread && (
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                )}
                <span>{APP_VERSION}</span>
                <Sparkles className="w-3 h-3 text-amber-400 opacity-70 group-hover:opacity-100 transition" />
            </button>

            {/* Modální okno novinek */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[85vh] flex flex-col text-left">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Hlavička */}
                        <div className="flex items-center gap-3 mb-5 pr-8">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                                <History className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    Co je nového v Hádačích
                                    <span className="text-xs font-mono font-normal bg-amber-400/10 border border-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full">
                                        {APP_VERSION}
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-400">Přehled vylepšení a nových funkcí</p>
                            </div>
                        </div>

                        {/* Seznam verzí */}
                        <div className="space-y-6 overflow-y-auto pr-1">
                            {CHANGELOG.map((release, idx) => (
                                <div
                                    key={release.version}
                                    className={`border-l-2 pl-4 py-0.5 ${idx === 0 ? 'border-amber-500' : 'border-slate-800'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-200">
                                            {release.title}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-500">
                                            {release.date}
                                        </span>
                                    </div>

                                    <ul className="space-y-1.5 mt-2">
                                        {release.highlights.map((item, itemIdx) => (
                                            <li
                                                key={itemIdx}
                                                className="text-xs text-slate-400 flex items-start gap-2 leading-relaxed"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Spodní tlačítko */}
                        <div className="pt-4 border-t border-slate-800/80 mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition"
                            >
                                Rozumím, jdu luštit!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}