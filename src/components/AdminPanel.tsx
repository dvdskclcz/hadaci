'use client'

import { useState } from 'react'
import {
    loginAdminAction,
    logoutAdminAction,
    createRiddleAction,
    updateRiddleAction,
    deleteRiddleAction,
    updateTopicSuggestionStatusAction,
    deleteTopicSuggestionAction,
    updateReportStatusAction,
    deleteReportAction,
} from '@/app/actions/admin'
import {
    Lock,
    PlusCircle,
    Calendar,
    Trash2,
    Check,
    Loader2,
    LogOut,
    Plus,
    Minus,
    Edit2,
    Search,
    X,
    Lightbulb,
    Clock,
    CheckCircle2,
    XCircle,
    Sparkles,
    AlertTriangle,
} from 'lucide-react'

export type RiddleOverview = {
    id: string
    title: string
    category: string
    secret_answer: string
    publish_date: string
    hints?: string[]
    accepted_aliases?: string[]
}

export type TopicSuggestionItem = {
    id: string
    category_type: string
    suggestion: string
    status: 'NEW' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'REJECTED'
    created_at: string
}

export type ReportItem = {
    id: string
    riddle_id: string
    report_type: string
    message: string | null
    status: 'PENDING' | 'RESOLVED' | 'DISMISSED'
    created_at: string
    riddles?: { title: string; secret_answer: string } | null
}

type Props = {
    isInitiallyAuthenticated: boolean
    existingRiddles: RiddleOverview[]
    existingCategories?: string[]
    nextAvailableDate?: string
    existingSuggestions?: TopicSuggestionItem[]
    existingReports?: ReportItem[]
}

const DEFAULT_CATEGORIES = [
    'Česká osobnost & Věda',
    'Česká literatura & Spisovatelé',
    'Památka & Historie',
    'Kulturní fenomén & Postava',
    'Technika & Motorismus',
    'Film, Divadlo & Televize',
    'Geografie & Příroda',
]

export default function AdminPanel({
    isInitiallyAuthenticated,
    existingRiddles,
    existingCategories = [],
    nextAvailableDate = '',
    existingSuggestions = [],
    existingReports = [],
}: Props) {
    const [isAuthenticated, setIsAuthenticated] = useState(isInitiallyAuthenticated)
    const [password, setPassword] = useState('')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Přepínání 3 záložek
    const [activeTab, setActiveTab] = useState<'riddles' | 'suggestions' | 'reports'>('riddles')

    // Stavy pro hlášení a reklamace
    const [reportsList, setReportsList] = useState<ReportItem[]>(existingReports)
    const pendingReportsCount = reportsList.filter((r) => r.status === 'PENDING').length

    // Stavy pro komunitní tipy
    const [suggestionsList, setSuggestionsList] = useState<TopicSuggestionItem[]>(existingSuggestions)
    const [suggestionStatusFilter, setSuggestionStatusFilter] = useState<string>('ALL')
    const newSuggestionsCount = suggestionsList.filter((s) => s.status === 'NEW').length

    // Stavy pro hádanky
    const [editingRiddleId, setEditingRiddleId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    // Řízené hodnoty formuláře
    const [titleInput, setTitleInput] = useState('')
    const [categoryInput, setCategoryInput] = useState('')
    const [secretAnswerInput, setSecretAnswerInput] = useState('')
    const [publishDateInput, setPublishDateInput] = useState(nextAvailableDate)
    const [aliasesInput, setAliasesInput] = useState('')
    const [hintsList, setHintsList] = useState<string[]>(['', '', '', '', ''])

    const allAvailableCategories = Array.from(
        new Set([...existingCategories, ...DEFAULT_CATEGORIES])
    )

    const handleHintChange = (index: number, value: string) => {
        const updated = [...hintsList]
        updated[index] = value
        setHintsList(updated)
    }

    const handleAddHint = () => {
        if (hintsList.length < 10) {
            setHintsList([...hintsList, ''])
        }
    }

    const handleRemoveHint = (indexToRemove: number) => {
        if (hintsList.length > 5) {
            setHintsList(hintsList.filter((_, idx) => idx !== indexToRemove))
        }
    }

    const handleStartEdit = (r: RiddleOverview) => {
        setActiveTab('riddles')
        setEditingRiddleId(r.id)
        setTitleInput(r.title || '')
        setCategoryInput(r.category || '')
        setSecretAnswerInput(r.secret_answer || '')
        setPublishDateInput(r.publish_date || '')
        setAliasesInput((r.accepted_aliases || []).join(', '))

        if (r.hints && Array.isArray(r.hints) && r.hints.length >= 5) {
            setHintsList(r.hints)
        } else {
            setHintsList(['', '', '', '', ''])
        }

        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleCancelEdit = () => {
        setEditingRiddleId(null)
        setTitleInput('')
        setCategoryInput('')
        setSecretAnswerInput('')
        setPublishDateInput(nextAvailableDate)
        setAliasesInput('')
        setHintsList(['', '', '', '', ''])
        setErrorMsg(null)
    }

    const handleAdoptSuggestion = (s: TopicSuggestionItem) => {
        setActiveTab('riddles')
        setEditingRiddleId(null)
        setTitleInput(s.suggestion)
        setSecretAnswerInput(s.suggestion)
        setCategoryInput(s.category_type !== 'Jiné' ? s.category_type : '')
        setSuccessMsg(`Námět "${s.suggestion}" byl přenesen do formuláře!`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => setSuccessMsg(null), 4000)
    }

    const handleStatusChange = async (
        id: string,
        newStatus: 'NEW' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'REJECTED'
    ) => {
        setSuggestionsList((prev) =>
            prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        )
        await updateTopicSuggestionStatusAction(id, newStatus)
    }

    const handleDeleteSuggestion = async (id: string, text: string) => {
        if (!confirm(`Opravdu smazat námět "${text}"?`)) return
        setSuggestionsList((prev) => prev.filter((item) => item.id !== id))
        await deleteTopicSuggestionAction(id)
    }

    const handleResolveReport = async (id: string) => {
        setReportsList((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: 'RESOLVED' } : r))
        )
        await updateReportStatusAction(id, 'RESOLVED')
    }

    const handleDeleteReport = async (id: string) => {
        if (!confirm('Opravdu smazat toto hlášení?')) return
        setReportsList((prev) => prev.filter((r) => r.id !== id))
        await deleteReportAction(id)
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg(null)

        const res = await loginAdminAction(password)
        setLoading(false)

        if (res.error) {
            setErrorMsg(res.error)
        } else {
            setIsAuthenticated(true)
        }
    }

    const handleLogout = async () => {
        await logoutAdminAction()
        setIsAuthenticated(false)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg(null)
        setSuccessMsg(null)

        const form = e.currentTarget
        const formData = new FormData(form)

        let res: { error?: string; success?: boolean }

        if (editingRiddleId) {
            res = await updateRiddleAction(editingRiddleId, formData)
        } else {
            res = await createRiddleAction(formData)
        }

        setLoading(false)

        if (res.error) {
            setErrorMsg(res.error)
        } else {
            setSuccessMsg(
                editingRiddleId
                    ? 'Hádanka byla úspěšně upravena!'
                    : `Nová hádanka s ${hintsList.length} stopami byla naplánována!`
            )

            if (editingRiddleId) {
                handleCancelEdit()
            } else {
                setTitleInput('')
                setCategoryInput('')
                setSecretAnswerInput('')
                setAliasesInput('')
                setHintsList(['', '', '', '', ''])

                if (publishDateInput) {
                    const nextD = new Date(publishDateInput)
                    nextD.setDate(nextD.getDate() + 1)
                    setPublishDateInput(nextD.toISOString().split('T')[0])
                }
            }

            setTimeout(() => setSuccessMsg(null), 4000)
        }
    }

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Opravdu smazat hádanku "${title}"?`)) return
        const res = await deleteRiddleAction(id)
        if (res.error) {
            alert(`Chyba: ${res.error}`)
        } else if (editingRiddleId === id) {
            handleCancelEdit()
        }
    }

    const filteredRiddles = existingRiddles.filter((r) => {
        const q = searchQuery.toLowerCase().trim()
        if (!q) return true
        return (
            r.title?.toLowerCase().includes(q) ||
            r.secret_answer?.toLowerCase().includes(q) ||
            r.category?.toLowerCase().includes(q) ||
            r.publish_date?.toLowerCase().includes(q)
        )
    })

    const filteredSuggestions = suggestionsList.filter((s) => {
        if (suggestionStatusFilter === 'ALL') return true
        return s.status === suggestionStatusFilter
    })

    // 1. Přihlašovací dialog
    if (!isAuthenticated) {
        return (
            <div className="w-full max-w-sm mx-auto bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
                    <Lock className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-white mb-1">Správa Hádačů</h2>
                <p className="text-xs text-slate-400 mb-6">Zadej administrační heslo</p>

                <form onSubmit={handleLogin} className="space-y-3">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Heslo..."
                        required
                        autoFocus
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />

                    {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    >
                        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Odemknout konzoli</span>
                    </button>
                </form>
            </div>
        )
    }

    // 2. Hlavní panel
    return (
        <div className="w-full max-w-3xl mx-auto space-y-6 text-left">
            {/* Horní pruh s přepínačem záložek */}
            <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('riddles')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'riddles'
                                ? 'bg-amber-400 text-slate-950 shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Hádanky a kalendář</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('suggestions')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'suggestions'
                                ? 'bg-indigo-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Náměty</span>
                        {newSuggestionsCount > 0 && (
                            <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                {newSuggestionsCount}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('reports')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${activeTab === 'reports'
                                ? 'bg-rose-500 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Reklamace</span>
                        {pendingReportsCount > 0 && (
                            <span className="bg-rose-700 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                {pendingReportsCount}
                            </span>
                        )}
                    </button>
                </div>

                <button
                    onClick={handleLogout}
                    className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition self-end sm:self-auto"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Odhlásit</span>
                </button>
            </div>

            {/* ========================================================= */}
            {/* ZÁLOŽKA 1: HÁDANKY A KALENDÁŘ                             */}
            {/* ========================================================= */}
            {activeTab === 'riddles' && (
                <div className="space-y-8 animate-fade-in">
                    {/* Formulář */}
                    <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${editingRiddleId
                                            ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400'
                                            : 'bg-amber-400/10 border border-amber-400/30 text-amber-400'
                                        }`}
                                >
                                    {editingRiddleId ? <Edit2 className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">
                                        {editingRiddleId ? 'Upravit existující hádanku' : 'Nová hádanka do kalendáře'}
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        {editingRiddleId
                                            ? `Edituješ hádanku: ${titleInput || 'Bez názvu'}`
                                            : 'Zadej fakta, 5 až 10 stop a datum vydání'}
                                    </p>
                                </div>
                            </div>

                            {editingRiddleId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 transition"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Zrušit úpravy</span>
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                        Interní název hádanky *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        value={titleInput}
                                        onChange={(e) => setTitleInput(e.target.value)}
                                        placeholder="Např. Božena Němcová"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                        Kategorie *
                                    </label>
                                    <div>
                                        <input
                                            type="text"
                                            name="category"
                                            value={categoryInput}
                                            onChange={(e) => setCategoryInput(e.target.value)}
                                            list="category-suggestions"
                                            required
                                            placeholder="Vyber níže nebo napiš novou..."
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                                        />

                                        <datalist id="category-suggestions">
                                            {allAvailableCategories.map((cat) => (
                                                <option key={cat} value={cat} />
                                            ))}
                                        </datalist>

                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {allAvailableCategories.map((cat) => (
                                                <button
                                                    key={cat}
                                                    type="button"
                                                    onClick={() => setCategoryInput(cat)}
                                                    className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${categoryInput === cat
                                                            ? 'bg-amber-400/20 border-amber-400/60 text-amber-300 font-bold'
                                                            : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                                                        }`}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                        Přesné správné řešení (tajenka) *
                                    </label>
                                    <input
                                        type="text"
                                        name="secret_answer"
                                        required
                                        value={secretAnswerInput}
                                        onChange={(e) => setSecretAnswerInput(e.target.value)}
                                        placeholder="Např. Božena Němcová"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[10px] uppercase font-bold text-slate-400 block">
                                            Datum zveřejnění v kalendáři *
                                        </label>
                                        {!editingRiddleId && nextAvailableDate && (
                                            <span className="text-[10px] text-amber-400 font-semibold">
                                                Nejbližší volný termín
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="date"
                                        name="publish_date"
                                        required
                                        value={publishDateInput}
                                        onChange={(e) => setPublishDateInput(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                    Alternativní odpovědi a synonyma (oddělené čárkou)
                                </label>
                                <input
                                    type="text"
                                    name="aliases"
                                    value={aliasesInput}
                                    onChange={(e) => setAliasesInput(e.target.value)}
                                    placeholder="nemcova, barunka panklova, bozena nemcova"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">
                                    O překlepy se postará Levenshtein, sem piš odlišné varianty jména nebo příjmení.
                                </p>
                            </div>

                            {/* Sekce stop: 5 až 10 */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] uppercase font-bold text-amber-400 block">
                                            Postupné stopy (od nejtěžší po nejjasnější)
                                        </label>
                                        <span className="text-[10px] font-bold bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 text-slate-300">
                                            {hintsList.length} / 10
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAddHint}
                                            disabled={hintsList.length >= 10}
                                            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold flex items-center gap-1 transition"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Přidat stopu</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {hintsList.map((hintVal, idx) => (
                                        <div key={idx} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-slate-400 font-semibold">
                                                    Stopa #{idx + 1} {idx === 0 ? '(nejtěžší)' : idx === hintsList.length - 1 ? '(nejjasnější)' : ''}
                                                </span>
                                                {hintsList.length > 5 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveHint(idx)}
                                                        className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-0.5 transition"
                                                        title="Odebrat tuto stopu"
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                        <span>Odebrat</span>
                                                    </button>
                                                )}
                                            </div>
                                            <textarea
                                                name="hints"
                                                value={hintVal}
                                                onChange={(e) => handleHintChange(idx, e.target.value)}
                                                required
                                                rows={2}
                                                placeholder={`Znění stopy č. ${idx + 1}...`}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
                            {successMsg && (
                                <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
                                    <Check className="w-4 h-4 shrink-0" />
                                    <span>{successMsg}</span>
                                </div>
                            )}

                            <div className="flex gap-2">
                                {editingRiddleId && (
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="w-1/3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs transition"
                                    >
                                        Zrušit
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-1 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition ${editingRiddleId
                                            ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                        } disabled:opacity-50`}
                                >
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    <span>
                                        {editingRiddleId
                                            ? `Uložit změny v hádance (${hintsList.length} stop)`
                                            : `Uložit a naplánovat hádanku (${hintsList.length} stop)`}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Seznam naplánovaných hádanek */}
                    <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-400" />
                                <h2 className="text-base font-bold text-white">Naplánované hádanky</h2>
                                <span className="text-xs text-slate-500 font-semibold">({filteredRiddles.length})</span>
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Hledat tajenku, kategorii, datum..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold">
                                        <th className="py-2.5 px-3">Datum</th>
                                        <th className="py-2.5 px-3">Tajenka</th>
                                        <th className="py-2.5 px-3">Kategorie</th>
                                        <th className="py-2.5 px-3 text-right">Akce</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {filteredRiddles.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-6 text-center text-slate-500 text-xs">
                                                Žádná hádanka neodpovídá hledání.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRiddles.map((r) => {
                                            const isCurrentEditing = editingRiddleId === r.id
                                            return (
                                                <tr
                                                    key={r.id}
                                                    className={`transition ${isCurrentEditing
                                                            ? 'bg-indigo-500/10 border-l-2 border-indigo-400'
                                                            : 'hover:bg-slate-800/30'
                                                        }`}
                                                >
                                                    <td className="py-3 px-3 font-semibold text-amber-400 whitespace-nowrap">
                                                        {r.publish_date}
                                                    </td>
                                                    <td className="py-3 px-3 font-bold text-white">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{r.secret_answer}</span>
                                                            {isCurrentEditing && (
                                                                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-normal">
                                                                    Právě edituješ
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 text-slate-400">{r.category}</td>
                                                    <td className="py-3 px-3 text-right">
                                                        <div className="inline-flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleStartEdit(r)}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-950/40 transition"
                                                                title="Upravit hádanku"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(r.id, r.secret_answer)}
                                                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                                                                title="Smazat hádanku"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* ZÁLOŽKA 2: NÁMĚTY OD HRÁČŮ                                */}
            {/* ========================================================= */}
            {activeTab === 'suggestions' && (
                <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                                <Lightbulb className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-white">Náměty a tipy od hráčů</h2>
                                <p className="text-xs text-slate-400">
                                    Zpracovávej přání komunity a přenášej je do kalendáře
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                            {[
                                { id: 'ALL', label: 'Vše' },
                                { id: 'NEW', label: 'Nové' },
                                { id: 'IN_PROGRESS', label: 'Řeším' },
                                { id: 'IMPLEMENTED', label: 'Nasazeno' },
                                { id: 'REJECTED', label: 'Nechci' },
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setSuggestionStatusFilter(f.id)}
                                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${suggestionStatusFilter === f.id
                                            ? 'bg-slate-800 text-white'
                                            : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredSuggestions.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-xs">
                            Žádné tipy v této kategorii.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredSuggestions.map((item) => {
                                const dateStr = item.created_at ? item.created_at.split('T')[0] : ''

                                return (
                                    <div
                                        key={item.id}
                                        className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
                                    >
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                                                    {item.category_type}
                                                </span>
                                                <span className="text-[10px] text-slate-500">{dateStr}</span>

                                                {item.status === 'NEW' && (
                                                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                                                        Nový
                                                    </span>
                                                )}
                                                {item.status === 'IN_PROGRESS' && (
                                                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Clock className="w-2.5 h-2.5" />
                                                        Řeším
                                                    </span>
                                                )}
                                                {item.status === 'IMPLEMENTED' && (
                                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                                        Nasazeno
                                                    </span>
                                                )}
                                                {item.status === 'REJECTED' && (
                                                    <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <XCircle className="w-2.5 h-2.5" />
                                                        Nechci
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm font-bold text-white tracking-wide">
                                                {item.suggestion}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                            <button
                                                type="button"
                                                onClick={() => handleAdoptSuggestion(item)}
                                                className="px-2.5 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 hover:bg-amber-400/20 text-xs font-semibold flex items-center gap-1 transition"
                                                title="Přenést do formuláře a vytvořit hádanku"
                                            >
                                                <Sparkles className="w-3.5 h-3.5" />
                                                <span>Převzít</span>
                                            </button>

                                            <div className="h-4 w-px bg-slate-800 mx-1" />

                                            <button
                                                type="button"
                                                onClick={() => handleStatusChange(item.id, 'IN_PROGRESS')}
                                                className={`p-1.5 rounded-xl border transition ${item.status === 'IN_PROGRESS'
                                                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                                                        : 'border-slate-800 text-slate-400 hover:text-indigo-400 hover:bg-slate-900'
                                                    }`}
                                                title="Označit jako: Řeším"
                                            >
                                                <Clock className="w-4 h-4" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleStatusChange(item.id, 'IMPLEMENTED')}
                                                className={`p-1.5 rounded-xl border transition ${item.status === 'IMPLEMENTED'
                                                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                                        : 'border-slate-800 text-slate-400 hover:text-emerald-400 hover:bg-slate-900'
                                                    }`}
                                                title="Označit jako: Nasazeno"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleStatusChange(item.id, 'REJECTED')}
                                                className={`p-1.5 rounded-xl border transition ${item.status === 'REJECTED'
                                                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                                                        : 'border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-900'
                                                    }`}
                                                title="Označit jako: Nechci"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSuggestion(item.id, item.suggestion)}
                                                className="p-1.5 rounded-xl border border-slate-800 text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition ml-1"
                                                title="Smazat námět z databáze"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================= */}
            {/* ZÁLOŽKA 3: REKLAMACE A HLÁŠENÍ OD HRÁČŮ                   */}
            {/* ========================================================= */}
            {activeTab === 'reports' && (
                <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6 animate-fade-in">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Reklamace a nahlášené chyby</h2>
                            <p className="text-xs text-slate-400">
                                Přehled nahlášených chybějících synonym a nepřesností od hráčů
                            </p>
                        </div>
                    </div>

                    {reportsList.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 text-xs">
                            Zatím žádné nahlášené problémy. Všechno běží hladce!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reportsList.map((rep) => {
                                const dateStr = rep.created_at ? rep.created_at.split('T')[0] : ''
                                const isPending = rep.status === 'PENDING'

                                return (
                                    <div
                                        key={rep.id}
                                        className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
                                    >
                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30">
                                                    {rep.riddles?.secret_answer || 'Hádanka'}
                                                </span>
                                                <span className="text-[10px] text-slate-500">{dateStr}</span>
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isPending
                                                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                        }`}
                                                >
                                                    {isPending ? 'Čeká na vyřízení' : 'Vyřízeno'}
                                                </span>
                                            </div>

                                            <div className="text-xs font-bold text-white">
                                                {rep.report_type}
                                            </div>

                                            {rep.message && (
                                                <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/50">
                                                    „{rep.message}“
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                            {isPending && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleResolveReport(rep.id)}
                                                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition"
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Označit za vyřízené</span>
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleDeleteReport(rep.id)}
                                                className="p-1.5 rounded-xl border border-slate-800 text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition"
                                                title="Smazat hlášení"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}