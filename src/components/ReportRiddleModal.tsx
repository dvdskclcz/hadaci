'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Flag, X, Send, CheckCircle2 } from 'lucide-react'

type Props = {
    riddleId: string
    lastGuess?: string
}

export default function ReportRiddleModal({ riddleId, lastGuess = '' }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [reason, setReason] = useState('Neuznaná správná odpověď')
    const [note, setNote] = useState(lastGuess ? `Můj tip byl: "${lastGuess}"` : '')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase.from('riddle_reports').insert({
            riddle_id: riddleId,
            user_id: user?.id ?? null,
            reason: reason,
            message: note,
            status: 'pending'
        })

        setLoading(false)

        if (!error) {
            setSuccess(true)
            setTimeout(() => {
                setSuccess(false)
                setIsOpen(false)
            }, 1800)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                type="button"
                className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-amber-400 transition"
            >
                <Flag className="w-3 h-3" />
                <span>Něco nesedí? Reklamovat odpověď či chybu</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 shadow-2xl relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {success ? (
                            <div className="py-8 text-center space-y-2">
                                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                                <h3 className="text-sm font-bold text-white">Díky za zpětnou vazbu!</h3>
                                <p className="text-xs text-slate-400">Podíváme se na to a případně doplníme uznatelná synonyma.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4 text-left">
                                <div>
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Flag className="w-4 h-4 text-amber-400" />
                                        Reklamace / hlášení hádanky
                                    </h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Myslíš, že tvůj tip měl být uznán, nebo je v zadání chyba?
                                    </p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Důvod</label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                                    >
                                        <option value="Neuznaná správná odpověď">Správná odpověď nebyla uznána</option>
                                        <option value="Překlep / faktická chyba v nápovědě">Překlep nebo faktická chyba v nápovědě</option>
                                        <option value="Příliš nejednoznačné">Příliš vágní / nejednoznačné stopy</option>
                                        <option value="Jiné">Jiné</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Detail / tvůj tip</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Napiš, jakou odpověď jsi zadával/a nebo co je špatně..."
                                        className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none"
                                    />
                                </div>

                                <div className="flex gap-2 justify-end pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                                    >
                                        Zrušit
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition disabled:opacity-50"
                                    >
                                        <Send className="w-3 h-3" />
                                        <span>{loading ? 'Odesílám...' : 'Odeslat'}</span>
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}