'use client'

import { useState, useEffect, useTransition } from 'react'
import {
    Megaphone,
    Copy,
    Check,
    RotateCcw,
    Sparkles,
    MessageSquare,
    Share2,
    Calendar,
    Search,
    Trophy,
    BookOpen,
    ExternalLink,
    RefreshCw,
    ShieldCheck,
    Image as ImageIcon,
} from 'lucide-react'
import { getPromoGeneratorDataAction } from '@/app/actions/admin'
import {
    PromoTemplateId,
    PromoFormatId,
    PromoGeneratorData,
    generatePromoText,
} from '@/lib/promo-generator'

const TEMPLATES: Array<{
    id: PromoTemplateId
    label: string
    shortDesc: string
    icon: typeof Calendar
    color: string
    url: string
}> = [
    {
        id: 'riddle',
        label: '🧩 Dnešní hádanka',
        shortDesc: 'Kategorie & 1. nápověda',
        icon: Calendar,
        color: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
        url: 'https://hadaci.cz',
    },
    {
        id: 'detective',
        label: '🕵️ Detektivní výslech',
        shortDesc: 'Číslo spisu & úvodní stopa',
        icon: Search,
        color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
        url: 'https://hadaci.cz/vyslech',
    },
    {
        id: 'leaderboard',
        label: '🔥 Týdenní žebříček',
        shortDesc: 'TOP 3 hráči & výzva',
        icon: Trophy,
        color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
        url: 'https://hadaci.cz/zebricky',
    },
    {
        id: 'archive',
        label: '📚 Archiv & Šuplík',
        shortDesc: 'Počet her v archivu',
        icon: BookOpen,
        color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400',
        url: 'https://hadaci.cz/archiv',
    },
]

export default function PromoGeneratorPanel() {
    const [data, setData] = useState<PromoGeneratorData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const [selectedTemplate, setSelectedTemplate] = useState<PromoTemplateId>('riddle')
    const [selectedFormat, setSelectedFormat] = useState<PromoFormatId>('short')
    const [customText, setCustomText] = useState('')
    const [copied, setCopied] = useState(false)

    // Načtení živých dat z administrace
    const loadData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await getPromoGeneratorDataAction()
            if ('error' in res && res.error) {
                setError(res.error)
            } else if ('data' in res) {
                setData(res.data)
                // Inicializujeme text
                const text = generatePromoText(selectedTemplate, selectedFormat, res.data)
                setCustomText(text)
            }
        } catch (err: any) {
            setError(err?.message || 'Chyba při načítání podkladů pro promo')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    // Přepočet textu při změně šablony nebo formátu (pokud máme data)
    const handleTemplateChange = (tmpl: PromoTemplateId) => {
        setSelectedTemplate(tmpl)
        if (data) {
            const text = generatePromoText(tmpl, selectedFormat, data)
            setCustomText(text)
        }
    }

    const handleFormatChange = (fmt: PromoFormatId) => {
        setSelectedFormat(fmt)
        if (data) {
            const text = generatePromoText(selectedTemplate, fmt, data)
            setCustomText(text)
        }
    }

    // Obnovení výchozího textu šablony
    const handleResetToDefault = () => {
        if (!data) return
        const text = generatePromoText(selectedTemplate, selectedFormat, data)
        setCustomText(text)
    }

    // Výchozí text pro porovnání
    const defaultText = data ? generatePromoText(selectedTemplate, selectedFormat, data) : ''
    const isModified = customText.trim() !== defaultText.trim()

    // Kopírování do schránky s fallbackem
    const handleCopy = async () => {
        if (!customText) return

        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(customText)
            } else {
                // Fallback pro starší prohlížeče / sandbox
                const textarea = document.createElement('textarea')
                textarea.value = customText
                textarea.style.position = 'fixed'
                textarea.style.opacity = '0'
                document.body.appendChild(textarea)
                textarea.select()
                document.execCommand('copy')
                document.body.removeChild(textarea)
            }

            setCopied(true)
            setTimeout(() => {
                setCopied(false)
            }, 2500)
        } catch (err) {
            console.error('Chyba při kopírování:', err)
            alert('Nepodařilo se zkopírovat do schránky. Zkopíruj text ručně označením.')
        }
    }

    const currentTemplateObj = TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0]
    const charCount = customText.length
    const wordCount = customText.trim() ? customText.trim().split(/\s+/).length : 0

    return (
        <div className="space-y-6 text-left">
            {/* Hlavička sekce */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <span>Promo generátor pro sociální sítě & chaty</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                                100% Bez spoilerů
                            </span>
                        </h2>
                        <p className="text-xs text-slate-400">
                            Připrav si jedním klikem poutavý příspěvek na Slack, Teams, WhatsApp, X, Facebook nebo LinkedIn.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        startTransition(() => {
                            loadData()
                        })
                    }}
                    disabled={loading || isPending}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5 disabled:opacity-50"
                    title="Obnovit aktuální data z databáze"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading || isPending ? 'animate-spin' : ''}`} />
                    <span>Aktualizovat data</span>
                </button>
            </div>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-2xl text-xs">
                    {error}
                </div>
            )}

            {/* 1. Volba šablony */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>1. Vyber téma příspěvku</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {TEMPLATES.map((tmpl) => {
                        const Icon = tmpl.icon
                        const isSelected = selectedTemplate === tmpl.id

                        return (
                            <button
                                key={tmpl.id}
                                type="button"
                                onClick={() => handleTemplateChange(tmpl.id)}
                                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                                    isSelected
                                        ? `${tmpl.color} border-current shadow-md ring-1 ring-current`
                                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <Icon className="w-4 h-4" />
                                    {isSelected && <Check className="w-4 h-4 text-current" />}
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white mb-0.5">{tmpl.label}</div>
                                    <div className="text-[11px] text-slate-400">{tmpl.shortDesc}</div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* 2. Volba formátu / sítě */}
            <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>2. Formát a cílová síť</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => handleFormatChange('short')}
                        className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                            selectedFormat === 'short'
                                ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                            <div>
                                <div className="text-xs font-bold text-white">💬 Krátký formát</div>
                                <div className="text-[11px] text-slate-400">Pro Teams, Slack, WhatsApp, X (Twitter)</div>
                            </div>
                        </div>
                        {selectedFormat === 'short' && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>

                    <button
                        type="button"
                        onClick={() => handleFormatChange('long')}
                        className={`p-3.5 rounded-2xl border text-left transition flex items-center justify-between ${
                            selectedFormat === 'long'
                                ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Megaphone className="w-4 h-4 text-indigo-400" />
                            <div>
                                <div className="text-xs font-bold text-white">📢 Delší s hashtagy</div>
                                <div className="text-[11px] text-slate-400">Pro Facebook, LinkedIn, blogy a fóra</div>
                            </div>
                        </div>
                        {selectedFormat === 'long' && <Check className="w-4 h-4 text-indigo-400" />}
                    </button>
                </div>
            </div>

            {/* 3. Editor textu a akční tlačítka */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-white">Náhled & Úprava textu</label>
                        {isModified && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold">
                                Upraveno ručně
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 self-end sm:self-auto">
                        <span className="font-mono text-[11px] text-slate-400">
                            {charCount} znaků • {wordCount} slov
                        </span>
                        {isModified && (
                            <button
                                type="button"
                                onClick={handleResetToDefault}
                                className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition text-[11px]"
                            >
                                <RotateCcw className="w-3 h-3" />
                                <span>Obnovit výchozí text</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="relative">
                    <textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        rows={9}
                        placeholder={loading ? 'Načítám data z databáze...' : 'Zde se vygeneruje propagační text...'}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed resize-y"
                    />
                </div>

                {/* Akční řádek s kopírováním a odkazem */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-[11px]">
                            100% spoiler-free. Žádné vyzrazení tajenky ani zbývajících stop.
                        </span>
                    </div>

                    <div className="flex items-center gap-2 self-stretch sm:self-auto">
                        <a
                            href={currentTemplateObj.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
                            title="Otevřít cílovou stránku v novém okně"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Navštívit</span>
                        </a>

                        <button
                            type="button"
                            onClick={handleCopy}
                            disabled={!customText || loading}
                            className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                                copied
                                    ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400 shadow-emerald-500/20'
                                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
                            }`}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 stroke-[3]" />
                                    <span>Zkopírováno do schránky!</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>Zkopírovat příspěvek</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. Kompaktní náhled OpenGraph karty */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                            Náhled sociální karty (OpenGraph karta odkazu)
                        </h3>
                    </div>
                    <span className="text-[10px] text-slate-500">Automaticky se připojí k URL</span>
                </div>

                <div className="max-w-md mx-auto sm:mx-0 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/opengraph-image"
                        alt="Náhled OpenGraph karty Hádači.cz"
                        className="w-full h-auto aspect-[1200/630] object-cover bg-slate-900 border-b border-slate-800"
                    />
                    <div className="p-3">
                        <div className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">HADACI.CZ</div>
                        <div className="text-xs font-bold text-white truncate">
                            {selectedTemplate === 'detective'
                                ? 'Detektivní výslech • Hádači.cz'
                                : selectedTemplate === 'leaderboard'
                                ? 'Síň slávy a žebříčky • Hádači.cz'
                                : selectedTemplate === 'archive'
                                ? 'Archiv hádanek • Hádači.cz'
                                : 'Hádači.cz • Denní hádanka s českými reáliemi'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {selectedTemplate === 'detective'
                                ? 'Polož až 20 zjišťovacích otázek a odhal tajný případ!'
                                : 'Otestuj své znalosti v české vědomostní hře zdarma.'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
