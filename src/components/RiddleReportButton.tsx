'use client'

import { useState } from 'react'
import { submitRiddleReportAction } from '@/app/actions/game'
import { Flag, Check, Loader2, X } from 'lucide-react'

const REPORT_REASONS = [
    'Moje odpověď měla být uznána (chybí alias)',
    'Faktická nepřesnost ve stopách',
    'Gramatická chyba nebo překlep v zadání',
    'Jiný problém',
]

export default function RiddleReportButton({ riddleId }: { riddleId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [reason, setReason] = useState(REPORT_REASONS[0])
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const res = await submitRiddleReportAction(riddleId, reason, message)
        setLoading(false)

        if (res.success) {
            setSubmitted(true)
            setTimeout(() => {
                setIsOpen(false)
                setSubmitted(false)
                setMessage('')
            }, 3000)
        }
    }

    if (!isOpen) {
        return (
            <div className="flex justify-center mt-3">
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="text-[11px] text-slate-500 hover:text-slate-400 flex items-center gap-1.5 transition"
                >
                    <Flag className="w-3 h-3" />
                    <span>Nahlásit problém s hádankou</span>
                </button>
            </div>
        )
    }

    return (
        <div className="mt-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left animate-fade-in relative">
            <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-3 right-3 text-slate-500 hover:text-slate-300"
            >
                <X className="w-4 h-4" />
            </button>

            {submitted ? (
                <div className="py-3 text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Díky za zpětnou vazbu! Prověříme to.</span>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Flag className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reklamace / nahlášení hádanky</span>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                            Důvod
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                        >
                            {REPORT_REASONS.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                            Podrobnosti (volitelné)
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Jakou odpověď jsi zadal, nebo co ve stopách nesedí?"
                            rows={2}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                        >
                            Zrušit
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition"
                        >
                            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>Odeslat hlášení</span>
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}