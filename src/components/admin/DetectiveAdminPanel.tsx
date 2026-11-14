'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    AdminDetectiveCase,
    AdminDetectiveFact,
    getAdminDetectiveCasesAction,
    saveDetectiveCaseAction,
    getAdminCaseFactsAction,
    upsertDetectiveFactAction,
    deleteDetectiveFactAction,
    testDetectiveQuestionAction,
    testDetectiveGuessAction,
} from '@/app/actions/detective-admin'
import { formatCzechDate } from '@/lib/utils'
import {
    Search,
    Sparkles,
    Plus,
    Trash2,
    Edit2,
    Check,
    Loader2,
    X,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    CheckCircle2,
    Send,
    Database,
    HelpCircle,
    Calendar,
    Layers,
    FileText,
    Activity,
    FolderKanban,
    Eye,
    Key,
    ShieldAlert,
    Cpu,
} from 'lucide-react'

type CaseFilter = 'all' | 'published' | 'scheduled' | 'draft'

interface TestHistoryItem {
    id: string
    type: 'question' | 'guess'
    query: string
    timestamp: string
    questionResult?: {
        status: 'VALID' | 'INVALID' | 'ERROR'
        verdict?: 'ANO' | 'NE' | 'NELZE_OVERIT'
        reason?: string
        message?: string
        matchedFacts: Array<{
            id: string
            fact_type: string
            content: string
            similarity: number
        }>
    }
    guessResult?: {
        isCorrect: boolean
        isTypo?: boolean
        message?: string
        matchedAnswer?: string
        error?: string
    }
    isExpandedRentgen?: boolean
}

const ENTITY_LABELS: Record<string, string> = {
    person: '👤 Osobnost',
    place: '🏰 Místo',
    object: '📦 Předmět',
    event: '⚡ Událost',
    concept: '💡 Pojem',
}

const DIFFICULTY_LABELS: Record<string, string> = {
    easy: '🟢 Lehká',
    medium: '🟡 Střední',
    hard: '🔴 Těžká',
}

export default function DetectiveAdminPanel() {
    // 1. Stav seznamu případů
    const [cases, setCases] = useState<AdminDetectiveCase[]>([])
    const [loadingCases, setLoadingCases] = useState(true)
    const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
    const [caseFilter, setCaseFilter] = useState<CaseFilter>('all')
    const [caseSearchQuery, setCaseSearchQuery] = useState('')

    // 2. Metadata formulář
    const [isEditingMetadata, setIsEditingMetadata] = useState(false)
    const [isCreatingNewCase, setIsCreatingNewCase] = useState(false)
    const [slugInput, setSlugInput] = useState('')
    const [publishDateInput, setPublishDateInput] = useState('')
    const [difficultyInput, setDifficultyInput] = useState<'easy' | 'medium' | 'hard'>('medium')
    const [entityTypeInput, setEntityTypeInput] = useState<'person' | 'place' | 'object' | 'event' | 'concept'>('person')
    const [initialClueInput, setInitialClueInput] = useState('')
    const [secretAnswerInput, setSecretAnswerInput] = useState('')
    const [synonymsInput, setSynonymsInput] = useState('')
    const [isActiveInput, setIsActiveInput] = useState(true)
    const [savingMetadata, setSavingMetadata] = useState(false)
    const [metadataFeedback, setMetadataFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

    // 3. Aktivní pod-záložka: 'simulator' | 'facts'
    const [activeSubTab, setActiveSubTab] = useState<'simulator' | 'facts'>('simulator')

    // 4. Fakta spisu
    const [facts, setFacts] = useState<AdminDetectiveFact[]>([])
    const [loadingFacts, setLoadingFacts] = useState(false)
    const [editingFactId, setEditingFactId] = useState<string | null>(null)
    const [editingFactText, setEditingFactText] = useState('')
    const [editingFactType, setEditingFactType] = useState<'core' | 'key_fact' | 'qa'>('core')
    const [addingFactToType, setAddingFactToType] = useState<'core' | 'key_fact' | 'qa' | null>(null)
    const [newFactText, setNewFactText] = useState('')
    const [savingFact, setSavingFact] = useState(false)
    const [factsFeedback, setFactsFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

    // 5. Testovací pískoviště (Simulátor)
    const [testTabMode, setTestTabMode] = useState<'question' | 'guess'>('question')
    const [questionInput, setQuestionInput] = useState('')
    const [guessInput, setGuessInput] = useState('')
    const [testingQuestion, setTestingQuestion] = useState(false)
    const [testingGuess, setTestingGuess] = useState(false)
    const [history, setHistory] = useState<TestHistoryItem[]>([])

    const todayStr = new Date().toISOString().split('T')[0]

    // Načtení případů
    const loadCases = useCallback(async () => {
        setLoadingCases(true)
        const res = await getAdminDetectiveCasesAction()
        setLoadingCases(false)
        if (res.cases) {
            setCases(res.cases)
            if (!selectedCaseId && res.cases.length > 0) {
                setSelectedCaseId(res.cases[0].id)
            }
        }
    }, [selectedCaseId])

    useEffect(() => {
        loadCases()
    }, [loadCases])

    // Aktuálně vybraný případ
    const selectedCase = cases.find((c) => c.id === selectedCaseId) || null

    // Synchronizace formuláře metadat při změně vybraného případu
    useEffect(() => {
        if (selectedCase && !isCreatingNewCase) {
            setSlugInput(selectedCase.slug || '')
            setPublishDateInput(selectedCase.publish_date || '')
            setDifficultyInput(selectedCase.difficulty || 'medium')
            setEntityTypeInput(selectedCase.entity_type || 'person')
            setInitialClueInput(selectedCase.initial_clue || '')
            setSecretAnswerInput(selectedCase.secret_answer || '')
            setSynonymsInput((selectedCase.accepted_synonyms || []).join(', '))
            setIsActiveInput(Boolean(selectedCase.is_active))
            setIsEditingMetadata(false)
            setMetadataFeedback(null)
        }
    }, [selectedCase, isCreatingNewCase])

    // Načtení faktů při změně vybraného případu nebo přepnutí na záložku faktů
    const loadFacts = useCallback(async (caseId: string) => {
        setLoadingFacts(true)
        const res = await getAdminCaseFactsAction(caseId)
        setLoadingFacts(false)
        if (res.facts) {
            setFacts(res.facts)
        } else if (res.error) {
            setFactsFeedback({ text: res.error, type: 'error' })
        }
    }, [])

    useEffect(() => {
        if (selectedCaseId) {
            loadFacts(selectedCaseId)
        } else {
            setFacts([])
        }
    }, [selectedCaseId, loadFacts])

    // Uložení metadat případu
    const handleSaveMetadata = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingMetadata(true)
        setMetadataFeedback(null)

        const payload = {
            id: isCreatingNewCase ? undefined : selectedCaseId || undefined,
            slug: slugInput.trim(),
            publish_date: publishDateInput,
            difficulty: difficultyInput,
            entity_type: entityTypeInput,
            initial_clue: initialClueInput.trim(),
            secret_answer: secretAnswerInput.trim(),
            accepted_synonyms: synonymsInput,
            is_active: isActiveInput,
        }

        const res = await saveDetectiveCaseAction(payload)
        setSavingMetadata(false)

        if (res.error) {
            setMetadataFeedback({ text: res.error, type: 'error' })
        } else if (res.case) {
            setMetadataFeedback({ text: 'Metadata případu byla úspěšně uložena!', type: 'success' })
            setIsEditingMetadata(false)
            setIsCreatingNewCase(false)

            // Aktualizace v lokálním stavu
            const saved = res.case
            setCases((prev) => {
                const idx = prev.findIndex((c) => c.id === saved.id)
                if (idx >= 0) {
                    const updated = [...prev]
                    updated[idx] = { ...saved, facts_count: prev[idx].facts_count }
                    return updated
                }
                return [saved, ...prev]
            })
            setSelectedCaseId(saved.id)
        }
    }

    // Začátek vytváření nového případu
    const handleStartCreateNewCase = () => {
        setIsCreatingNewCase(true)
        setIsEditingMetadata(true)
        setSlugInput('')
        setPublishDateInput(todayStr)
        setDifficultyInput('medium')
        setEntityTypeInput('person')
        setInitialClueInput('')
        setSecretAnswerInput('')
        setSynonymsInput('')
        setIsActiveInput(true)
        setMetadataFeedback(null)
    }

    // Zrušení úprav nového případu
    const handleCancelCreateNewCase = () => {
        setIsCreatingNewCase(false)
        setIsEditingMetadata(false)
        if (selectedCase) {
            setSlugInput(selectedCase.slug || '')
            setPublishDateInput(selectedCase.publish_date || '')
            setDifficultyInput(selectedCase.difficulty || 'medium')
            setEntityTypeInput(selectedCase.entity_type || 'person')
            setInitialClueInput(selectedCase.initial_clue || '')
            setSecretAnswerInput(selectedCase.secret_answer || '')
            setSynonymsInput((selectedCase.accepted_synonyms || []).join(', '))
            setIsActiveInput(Boolean(selectedCase.is_active))
        }
    }

    // Přidání nového faktu
    const handleAddFactSubmit = async (type: 'core' | 'key_fact' | 'qa') => {
        if (!selectedCaseId) return
        const text = newFactText.trim()
        if (!text) return

        setSavingFact(true)
        setFactsFeedback(null)

        const res = await upsertDetectiveFactAction({
            caseId: selectedCaseId,
            factType: type,
            content: text,
        })
        setSavingFact(false)

        if (res.error) {
            setFactsFeedback({ text: res.error, type: 'error' })
        } else if (res.fact) {
            setFacts((prev) => [...prev, res.fact!])
            setNewFactText('')
            setAddingFactToType(null)
            setFactsFeedback({ text: 'Fakt byl úspěšně uložen s novým embeddingem!', type: 'success' })
            // Zvýšit počet faktů v hlavičce případu
            setCases((prev) =>
                prev.map((c) => (c.id === selectedCaseId ? { ...c, facts_count: (c.facts_count || 0) + 1 } : c))
            )
            setTimeout(() => setFactsFeedback(null), 3000)
        }
    }

    // Editace faktu
    const handleStartEditFact = (fact: AdminDetectiveFact) => {
        setEditingFactId(fact.id)
        setEditingFactText(fact.fact_text)
        setEditingFactType(fact.fact_type)
        setAddingFactToType(null)
    }

    const handleSaveEditedFact = async () => {
        if (!selectedCaseId || !editingFactId) return
        const text = editingFactText.trim()
        if (!text) return

        setSavingFact(true)
        setFactsFeedback(null)

        const res = await upsertDetectiveFactAction({
            id: editingFactId,
            caseId: selectedCaseId,
            factType: editingFactType,
            content: text,
        })
        setSavingFact(false)

        if (res.error) {
            setFactsFeedback({ text: res.error, type: 'error' })
        } else if (res.fact) {
            setFacts((prev) => prev.map((f) => (f.id === editingFactId ? res.fact! : f)))
            setEditingFactId(null)
            setEditingFactText('')
            setFactsFeedback({ text: 'Fakt byl aktualizován a vektor přepočítán!', type: 'success' })
            setTimeout(() => setFactsFeedback(null), 3000)
        }
    }

    // Smazání faktu
    const handleDeleteFact = async (factId: string, previewText: string) => {
        if (!confirm(`Opravdu smazat tento fakt?\n"${previewText.slice(0, 80)}..."`)) return

        const res = await deleteDetectiveFactAction(factId)
        if (res.error) {
            setFactsFeedback({ text: res.error, type: 'error' })
        } else {
            setFacts((prev) => prev.filter((f) => f.id !== factId))
            setCases((prev) =>
                prev.map((c) => (c.id === selectedCaseId ? { ...c, facts_count: Math.max(0, (c.facts_count || 1) - 1) } : c))
            )
            setFactsFeedback({ text: 'Fakt byl smazán.', type: 'success' })
            setTimeout(() => setFactsFeedback(null), 3000)
        }
    }

    // --- TESTOVACÍ SIMULÁTOR: Otázka ---
    const handleRunQuestionTest = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCaseId) return
        const q = questionInput.trim()
        if (!q) return

        setTestingQuestion(true)
        const res = await testDetectiveQuestionAction({
            caseId: selectedCaseId,
            question: q,
        })
        setTestingQuestion(false)

        const newItem: TestHistoryItem = {
            id: String(Date.now()),
            type: 'question',
            query: q,
            timestamp: new Date().toLocaleTimeString('cs-CZ'),
            questionResult: res,
            isExpandedRentgen: false,
        }

        setHistory((prev) => [newItem, ...prev])
        setQuestionInput('')
    }

    // --- TESTOVACÍ SIMULÁTOR: Finální tip ---
    const handleRunGuessTest = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCaseId) return
        const g = guessInput.trim()
        if (!g) return

        setTestingGuess(true)
        const res = await testDetectiveGuessAction({
            caseId: selectedCaseId,
            guess: g,
        })
        setTestingGuess(false)

        const newItem: TestHistoryItem = {
            id: String(Date.now()),
            type: 'guess',
            query: g,
            timestamp: new Date().toLocaleTimeString('cs-CZ'),
            guessResult: res,
        }

        setHistory((prev) => [newItem, ...prev])
        setGuessInput('')
    }

    // Přepnutí akordeonu Rentgen AI
    const toggleRentgen = (historyId: string) => {
        setHistory((prev) =>
            prev.map((item) => (item.id === historyId ? { ...item, isExpandedRentgen: !item.isExpandedRentgen } : item))
        )
    }

    // Vyčištění historie
    const handleClearHistory = () => {
        setHistory([])
    }

    // Filtrované případy pro výběr
    const filteredCases = cases.filter((c) => {
        const matchesSearch =
            !caseSearchQuery ||
            c.secret_answer.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
            c.slug.toLowerCase().includes(caseSearchQuery.toLowerCase())

        if (!matchesSearch) return false

        const isPub = c.is_active && c.publish_date <= todayStr
        const isSched = c.is_active && c.publish_date > todayStr
        const isDraft = !c.is_active

        if (caseFilter === 'published') return isPub
        if (caseFilter === 'scheduled') return isSched
        if (caseFilter === 'draft') return isDraft
        return true
    })

    return (
        <div className="w-full space-y-6">
            {/* 1. Horní sekce: Výběr vyšetřovaného případu */}
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <FolderKanban className="w-4 h-4 text-cyan-400" />
                            <span>Spisy detektivních případů</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Vyber případ pro inspekci, správu vyšetřovacího spisu a AI testování
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleStartCreateNewCase}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nový případ</span>
                    </button>
                </div>

                {/* Filtry a vyhledávání */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setCaseFilter('all')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${caseFilter === 'all' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Vše ({cases.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setCaseFilter('published')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${caseFilter === 'published'
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Publikováno (
                            {cases.filter((c) => c.is_active && c.publish_date <= todayStr).length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setCaseFilter('scheduled')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${caseFilter === 'scheduled'
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Naplánováno (
                            {cases.filter((c) => c.is_active && c.publish_date > todayStr).length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setCaseFilter('draft')}
                            className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${caseFilter === 'draft' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            Koncepty ({cases.filter((c) => !c.is_active).length})
                        </button>
                    </div>

                    <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={caseSearchQuery}
                            onChange={(e) => setCaseSearchQuery(e.target.value)}
                            placeholder="Hledat případ podle tajenky nebo slugu..."
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                    </div>
                </div>

                {/* Seznam karet případů */}
                {loadingCases ? (
                    <div className="py-6 flex justify-center items-center gap-2 text-slate-400 text-xs">
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>Načítám případy z databáze...</span>
                    </div>
                ) : filteredCases.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center">
                        Nenalezen žádný případ odpovídající filtru.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                        {filteredCases.map((c) => {
                            const isSelected = selectedCaseId === c.id && !isCreatingNewCase
                            const isPub = c.is_active && c.publish_date <= todayStr
                            const isSched = c.is_active && c.publish_date > todayStr

                            return (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedCaseId(c.id)
                                        setIsCreatingNewCase(false)
                                    }}
                                    className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between gap-2 ${isSelected
                                            ? 'bg-cyan-950/40 border-cyan-500/70 ring-1 ring-cyan-500/50 shadow-md'
                                            : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                                        }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="text-[10px] text-slate-500 font-mono">
                                                {c.slug}
                                            </span>
                                            {isPub ? (
                                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                    Publikováno
                                                </span>
                                            ) : isSched ? (
                                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                    {formatCzechDate(c.publish_date)}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                                    Koncept
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm font-black text-white truncate">
                                            {c.secret_answer}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400">
                                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                            {ENTITY_LABELS[c.entity_type] || c.entity_type}
                                        </span>
                                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                            {DIFFICULTY_LABELS[c.difficulty] || c.difficulty}
                                        </span>
                                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-cyan-300 font-semibold flex items-center gap-1">
                                            <Database className="w-2.5 h-2.5" />
                                            {c.facts_count || 0} faktů
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* 2. Metadata vybraného případu (Editace / Náhled) */}
            {(selectedCase || isCreatingNewCase) && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                            <h3 className="text-sm font-bold text-white">
                                {isCreatingNewCase
                                    ? 'Nový vyšetřovaný případ'
                                    : `Spis: ${selectedCase?.secret_answer}`}
                            </h3>
                            <span className="text-xs text-slate-500 font-mono">
                                ({isCreatingNewCase ? 'nový koncept' : selectedCase?.slug})
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {isCreatingNewCase ? (
                                <button
                                    type="button"
                                    onClick={handleCancelCreateNewCase}
                                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white rounded-lg border border-slate-700 transition"
                                >
                                    Zrušit
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsEditingMetadata(!isEditingMetadata)}
                                    className={`px-2.5 py-1 text-xs rounded-lg border font-semibold flex items-center gap-1.5 transition ${isEditingMetadata
                                            ? 'bg-slate-800 text-cyan-300 border-cyan-500/40'
                                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                                        }`}
                                >
                                    <Edit2 className="w-3 h-3" />
                                    <span>{isEditingMetadata ? 'Zavřít editor' : 'Upravit metadata'}</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {metadataFeedback && (
                        <div
                            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${metadataFeedback.type === 'success'
                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                                }`}
                        >
                            {metadataFeedback.type === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                            ) : (
                                <AlertCircle className="w-4 h-4 shrink-0" />
                            )}
                            <span>{metadataFeedback.text}</span>
                        </div>
                    )}

                    {/* Formulář metadat */}
                    <form onSubmit={handleSaveMetadata} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                    Kanonická tajenka *
                                </label>
                                <input
                                    type="text"
                                    value={secretAnswerInput}
                                    onChange={(e) => setSecretAnswerInput(e.target.value)}
                                    disabled={!isEditingMetadata && !isCreatingNewCase}
                                    required
                                    placeholder="např. Karel Čapek"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                    Slug případu
                                </label>
                                <input
                                    type="text"
                                    value={slugInput}
                                    onChange={(e) => setSlugInput(e.target.value)}
                                    disabled={!isEditingMetadata && !isCreatingNewCase}
                                    placeholder="např. 001-karel-capek"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 disabled:opacity-60 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                    Datum publikace (pondělí) *
                                </label>
                                <input
                                    type="date"
                                    value={publishDateInput}
                                    onChange={(e) => setPublishDateInput(e.target.value)}
                                    disabled={!isEditingMetadata && !isCreatingNewCase}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 disabled:opacity-60"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                    Typ entity *
                                </label>
                                <select
                                    value={entityTypeInput}
                                    onChange={(e) => setEntityTypeInput(e.target.value as any)}
                                    disabled={!isEditingMetadata && !isCreatingNewCase}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 disabled:opacity-60"
                                >
                                    <option value="person">👤 Osobnost</option>
                                    <option value="place">🏰 Místo</option>
                                    <option value="object">📦 Předmět</option>
                                    <option value="event">⚡ Událost</option>
                                    <option value="concept">💡 Pojem</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                    Obtížnost *
                                </label>
                                <select
                                    value={difficultyInput}
                                    onChange={(e) => setDifficultyInput(e.target.value as any)}
                                    disabled={!isEditingMetadata && !isCreatingNewCase}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 disabled:opacity-60"
                                >
                                    <option value="easy">🟢 Lehká</option>
                                    <option value="medium">🟡 Střední</option>
                                    <option value="hard">🔴 Těžká</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                    Uznávaná synonyma a tvary (oddělená čárkou)
                                </label>
                                <input
                                    type="text"
                                    value={synonymsInput}
                                    onChange={(e) => setSynonymsInput(e.target.value)}
                                    disabled={!isEditingMetadata && !isCreatingNewCase}
                                    placeholder="např. Čapek, Karel Capek, Capek"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 disabled:opacity-60"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-5">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isActiveInput}
                                        onChange={(e) => setIsActiveInput(e.target.checked)}
                                        disabled={!isEditingMetadata && !isCreatingNewCase}
                                        className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                                    <span className="ml-2 text-xs font-semibold text-slate-300">
                                        Aktivní případ
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                                Úvodní nápověda pro hráče (1 úvodní hádanka bez prozrazení identity) *
                            </label>
                            <textarea
                                value={initialClueInput}
                                onChange={(e) => setInitialClueInput(e.target.value)}
                                disabled={!isEditingMetadata && !isCreatingNewCase}
                                required
                                rows={2}
                                placeholder="např. Zanechal po sobě varování před stroji i diktátory, ale jeho slovo dnes zná celý svět."
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 disabled:opacity-60 leading-relaxed"
                            />
                        </div>

                        {(isEditingMetadata || isCreatingNewCase) && (
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={savingMetadata}
                                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
                                >
                                    {savingMetadata ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Check className="w-3.5 h-3.5" />
                                    )}
                                    <span>{isCreatingNewCase ? 'Vytvořit případ' : 'Uložit metadata spisu'}</span>
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            )}

            {/* 3. Dvě hlavní pod-záložky pro vybraný případ: Simulátor vs Editor faktů */}
            {selectedCase && !isCreatingNewCase && (
                <div className="space-y-4">
                    {/* Přepínač pod-záložek */}
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
                        <button
                            type="button"
                            onClick={() => setActiveSubTab('simulator')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeSubTab === 'simulator'
                                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                        >
                            <Cpu className="w-4 h-4" />
                            <span>🧪 Testovací pískoviště (Simulátor AI)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveSubTab('facts')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeSubTab === 'facts'
                                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                                }`}
                        >
                            <Database className="w-4 h-4" />
                            <span>📚 Editor vyšetřovacího spisu ({facts.length} faktů)</span>
                        </button>
                    </div>

                    {/* ========================================================= */}
                    {/* POD-ZÁLOŽKA A: TESTOVACÍ PÍSKOVIŠTĚ (SIMULÁTOR)           */}
                    {/* ========================================================= */}
                    {activeSubTab === 'simulator' && (
                        <div className="space-y-4">
                            {/* Panel zadávání dotazů do simulátoru */}
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                                            <span>Simulace hráčských dotazů (GPT-4o-mini + RAG fakta)</span>
                                        </h4>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Prověř reakce AI rozhodčího a zkontroluj sémantické přiřazení faktů ze spisu pro případ{' '}
                                            <strong className="text-white">„{selectedCase.secret_answer}“</strong>.
                                        </p>
                                    </div>

                                    {history.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={handleClearHistory}
                                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-950 rounded-lg border border-slate-800 transition self-start sm:self-auto"
                                        >
                                            Vyčistit historii testování
                                        </button>
                                    )}
                                </div>

                                {/* Přepínač módu testování: Otázka ANO/NE vs Finální tip */}
                                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                                    <button
                                        type="button"
                                        onClick={() => setTestTabMode('question')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${testTabMode === 'question'
                                                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                                                : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        <HelpCircle className="w-3.5 h-3.5" />
                                        <span>Zjišťovací otázka (ANO/NE)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTestTabMode('guess')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${testTabMode === 'guess'
                                                ? 'bg-slate-800 text-amber-300 border border-amber-500/40'
                                                : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        <Key className="w-3.5 h-3.5" />
                                        <span>Finální tip (Tajenka)</span>
                                    </button>
                                </div>

                                {testTabMode === 'question' ? (
                                    <form onSubmit={handleRunQuestionTest} className="space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={questionInput}
                                                onChange={(e) => setQuestionInput(e.target.value)}
                                                placeholder="Zadej otázku, např. „Narodil se v Česku?“, „Žil ve 20. století?“, „Získal Nobelovu cenu?“..."
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                                            />
                                            <button
                                                type="submit"
                                                disabled={testingQuestion || !questionInput.trim()}
                                                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
                                            >
                                                {testingQuestion ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Send className="w-3.5 h-3.5" />
                                                )}
                                                <span>Vyzkoušet otázku</span>
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-500">
                                            Otázka projde pre-filtrem (pravopis, vylučovací volba „nebo“), vyhledá top 8 faktů + core fakta a GPT-4o-mini vrátí verdikt a Rentgen AI.
                                        </p>
                                    </form>
                                ) : (
                                    <form onSubmit={handleRunGuessTest} className="space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={guessInput}
                                                onChange={(e) => setGuessInput(e.target.value)}
                                                placeholder="Zadej testovací finální tip, např. „Karel Čapek“, „Čapek“, „Josef Čapek“..."
                                                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                                            />
                                            <button
                                                type="submit"
                                                disabled={testingGuess || !guessInput.trim()}
                                                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
                                            >
                                                {testingGuess ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Send className="w-3.5 h-3.5" />
                                                )}
                                                <span>Vyzkoušet tip</span>
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-500">
                                            Ověří shodu přes Levenshtein algoritmus a validátor vůči tajence „{selectedCase.secret_answer}“ a uznávaným synonymům.
                                        </p>
                                    </form>
                                )}
                            </div>

                            {/* Výpis historie testování */}
                            <div className="space-y-3">
                                {history.length === 0 ? (
                                    <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-2">
                                        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
                                            <Activity className="w-5 h-5 text-cyan-400" />
                                        </div>
                                        <h5 className="text-xs font-bold text-slate-300">Historie testování je zatím prázdná</h5>
                                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                                            Polož první zjišťovací otázku nebo vyzkoušej finální tip. Výsledky včetně Rentgenu AI (použitých faktů) se zobrazí zde.
                                        </p>
                                    </div>
                                ) : (
                                    history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3"
                                        >
                                            {/* Hlavička dotazu */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono text-slate-500">
                                                        {item.timestamp}
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${item.type === 'question'
                                                                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                                                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                                            }`}
                                                    >
                                                        {item.type === 'question' ? 'Otázka' : 'Finální tip'}
                                                    </span>
                                                    <span className="text-xs font-bold text-white">
                                                        „{item.query}“
                                                    </span>
                                                </div>

                                                {/* Odznak verdiktu */}
                                                <div>
                                                    {item.type === 'question' && item.questionResult && (
                                                        <>
                                                            {item.questionResult.status === 'INVALID' && (
                                                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                                                    <ShieldAlert className="w-3.5 h-3.5" />
                                                                    <span>BLOCKED (Neplatná otázka)</span>
                                                                </span>
                                                            )}
                                                            {item.questionResult.status === 'ERROR' && (
                                                                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                                                    CHYBA SERVERU
                                                                </span>
                                                            )}
                                                            {item.questionResult.status === 'VALID' && (
                                                                <span
                                                                    className={`text-xs font-black px-3 py-1 rounded-lg border flex items-center gap-1.5 ${item.questionResult.verdict === 'ANO'
                                                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                                            : item.questionResult.verdict === 'NE'
                                                                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                                                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                                                        }`}
                                                                >
                                                                    <span>
                                                                        VERDIKT: {item.questionResult.verdict}
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </>
                                                    )}

                                                    {item.type === 'guess' && item.guessResult && (
                                                        <span
                                                            className={`text-xs font-black px-3 py-1 rounded-lg border flex items-center gap-1.5 ${item.guessResult.isCorrect
                                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                                    : item.guessResult.isTypo
                                                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                                                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                                                }`}
                                                        >
                                                            <span>
                                                                {item.guessResult.isCorrect
                                                                    ? '✅ SPRÁVNĚ'
                                                                    : item.guessResult.isTypo
                                                                        ? '⚠️ PŘEKLEP'
                                                                        : '❌ ŠPATNĚ'}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Text vysvětlení / zprávy */}
                                            {item.type === 'question' && item.questionResult && (
                                                <p className="text-xs text-slate-300 pl-1">
                                                    {item.questionResult.message || item.questionResult.reason || 'Bez doplňujícího komentáře.'}
                                                </p>
                                            )}

                                            {item.type === 'guess' && item.guessResult && (
                                                <p className="text-xs text-slate-300 pl-1">
                                                    {item.guessResult.message ||
                                                        (item.guessResult.isCorrect
                                                            ? `Uznáno! Kanonická odpověď: ${item.guessResult.matchedAnswer || selectedCase.secret_answer}`
                                                            : 'Tip neodpovídá tajence ani synonymům.')}
                                                </p>
                                            )}

                                            {/* Rentgen AI Akordeon (pouze u otázek) */}
                                            {item.type === 'question' &&
                                                item.questionResult?.matchedFacts &&
                                                item.questionResult.matchedFacts.length > 0 && (
                                                    <div className="pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRentgen(item.id)}
                                                            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition"
                                                        >
                                                            {item.isExpandedRentgen ? (
                                                                <ChevronUp className="w-3.5 h-3.5" />
                                                            ) : (
                                                                <ChevronDown className="w-3.5 h-3.5" />
                                                            )}
                                                            <span>
                                                                🔍 Rentgen AI (
                                                                {item.questionResult.matchedFacts.length} použitých faktů z databáze)
                                                            </span>
                                                        </button>

                                                        {item.isExpandedRentgen && (
                                                            <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                                                                <p className="text-[10px] text-slate-400 mb-2">
                                                                    Tyto fakty byly AI rozhodčímu předány v promptu jako uzavřený kontext spisu:
                                                                </p>
                                                                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                                                    {item.questionResult.matchedFacts.map((fact, idx) => {
                                                                        const isCore = fact.fact_type === 'core'
                                                                        const isQA = fact.fact_type === 'qa'

                                                                        return (
                                                                            <div
                                                                                key={fact.id || idx}
                                                                                className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] flex flex-col sm:flex-row sm:items-start justify-between gap-1.5"
                                                                            >
                                                                                <div className="flex-1 text-slate-300">
                                                                                    {fact.content}
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                                    <span
                                                                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isCore
                                                                                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                                                                                : isQA
                                                                                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                                                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                                                            }`}
                                                                                    >
                                                                                        {isCore
                                                                                            ? 'core'
                                                                                            : isQA
                                                                                                ? 'qa'
                                                                                                : 'key_fact'}
                                                                                    </span>
                                                                                    <span className="text-[10px] font-mono text-cyan-400">
                                                                                        {isCore
                                                                                            ? '100% (základ)'
                                                                                            : `${fact.similarity}%`}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* POD-ZÁLOŽKA B: EDITOR FAKTŮ SPISU                         */}
                    {/* ========================================================= */}
                    {activeSubTab === 'facts' && (
                        <div className="space-y-6">
                            {factsFeedback && (
                                <div
                                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${factsFeedback.type === 'success'
                                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                                            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                                        }`}
                                >
                                    {factsFeedback.type === 'success' ? (
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                    )}
                                    <span>{factsFeedback.text}</span>
                                </div>
                            )}

                            {loadingFacts ? (
                                <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-xs">
                                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                                    <span>Načítám fakta vyšetřovacího spisu...</span>
                                </div>
                            ) : (
                                <>
                                    {/* SKUPINA 1: Základní fakta (core) */}
                                    <FactGroupSection
                                        title="1. Základní rozřazovací fakta (core)"
                                        description="8–10 základních faktů podle typu entity (existence v realitě, živé/neživé, časové zařazení, geografická vazba). Tyto fakty jsou VŽDY přítomny v kontextu AI rozhodčího."
                                        factType="core"
                                        facts={facts.filter((f) => f.fact_type === 'core')}
                                        addingFactToType={addingFactToType}
                                        setAddingFactToType={setAddingFactToType}
                                        newFactText={newFactText}
                                        setNewFactText={setNewFactText}
                                        handleAddFactSubmit={handleAddFactSubmit}
                                        editingFactId={editingFactId}
                                        editingFactText={editingFactText}
                                        setEditingFactText={setEditingFactText}
                                        handleStartEditFact={handleStartEditFact}
                                        handleSaveEditedFact={handleSaveEditedFact}
                                        setEditingFactId={setEditingFactId}
                                        handleDeleteFact={handleDeleteFact}
                                        savingFact={savingFact}
                                        badgeColor="bg-sky-500/20 text-sky-300 border-sky-500/30"
                                    />

                                    {/* SKUPINA 2: Klíčová fakta a vymezení (key_fact) */}
                                    <FactGroupSection
                                        title="2. Klíčová fakta a vymezení (key_fact)"
                                        description="Cca 20 nejznámějších encyklopedických faktů včetně explicitního vymezení, čím to NENÍ a s čím se to plete."
                                        factType="key_fact"
                                        facts={facts.filter((f) => f.fact_type === 'key_fact')}
                                        addingFactToType={addingFactToType}
                                        setAddingFactToType={setAddingFactToType}
                                        newFactText={newFactText}
                                        setNewFactText={setNewFactText}
                                        handleAddFactSubmit={handleAddFactSubmit}
                                        editingFactId={editingFactId}
                                        editingFactText={editingFactText}
                                        setEditingFactText={setEditingFactText}
                                        handleStartEditFact={handleStartEditFact}
                                        handleSaveEditedFact={handleSaveEditedFact}
                                        setEditingFactId={setEditingFactId}
                                        handleDeleteFact={handleDeleteFact}
                                        savingFact={savingFact}
                                        badgeColor="bg-purple-500/20 text-purple-300 border-purple-500/30"
                                    />

                                    {/* SKUPINA 3: Očekávané otázky (qa) */}
                                    <FactGroupSection
                                        title="3. Očekávané zjišťovací otázky (qa)"
                                        description="Cca 20 statisticky nejčastějších otázek hráčů s jednoznačnou odpovědí ANO / NE."
                                        factType="qa"
                                        facts={facts.filter((f) => f.fact_type === 'qa')}
                                        addingFactToType={addingFactToType}
                                        setAddingFactToType={setAddingFactToType}
                                        newFactText={newFactText}
                                        setNewFactText={setNewFactText}
                                        handleAddFactSubmit={handleAddFactSubmit}
                                        editingFactId={editingFactId}
                                        editingFactText={editingFactText}
                                        setEditingFactText={setEditingFactText}
                                        handleStartEditFact={handleStartEditFact}
                                        handleSaveEditedFact={handleSaveEditedFact}
                                        setEditingFactId={setEditingFactId}
                                        handleDeleteFact={handleDeleteFact}
                                        savingFact={savingFact}
                                        badgeColor="bg-amber-500/20 text-amber-300 border-amber-500/30"
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Pomocná komponenta pro sekci jedné skupiny faktů
function FactGroupSection({
    title,
    description,
    factType,
    facts,
    addingFactToType,
    setAddingFactToType,
    newFactText,
    setNewFactText,
    handleAddFactSubmit,
    editingFactId,
    editingFactText,
    setEditingFactText,
    handleStartEditFact,
    handleSaveEditedFact,
    setEditingFactId,
    handleDeleteFact,
    savingFact,
    badgeColor,
}: {
    title: string
    description: string
    factType: 'core' | 'key_fact' | 'qa'
    facts: AdminDetectiveFact[]
    addingFactToType: 'core' | 'key_fact' | 'qa' | null
    setAddingFactToType: (type: 'core' | 'key_fact' | 'qa' | null) => void
    newFactText: string
    setNewFactText: (txt: string) => void
    handleAddFactSubmit: (type: 'core' | 'key_fact' | 'qa') => void
    editingFactId: string | null
    editingFactText: string
    setEditingFactText: (txt: string) => void
    handleStartEditFact: (f: AdminDetectiveFact) => void
    handleSaveEditedFact: () => void
    setEditingFactId: (id: string | null) => void
    handleDeleteFact: (id: string, preview: string) => void
    savingFact: boolean
    badgeColor: string
}) {
    const isAdding = addingFactToType === factType

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                            {facts.length} faktů
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
                </div>

                {!isAdding && (
                    <button
                        type="button"
                        onClick={() => {
                            setAddingFactToType(factType)
                            setNewFactText('')
                        }}
                        className="px-2.5 py-1 text-xs rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold flex items-center gap-1.5 transition self-start sm:self-auto shrink-0"
                    >
                        <Plus className="w-3 h-3 text-cyan-400" />
                        <span>Přidat fakt</span>
                    </button>
                )}
            </div>

            {/* Formulář pro přidání nového faktu */}
            {isAdding && (
                <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2">
                    <label className="block text-[11px] font-semibold text-cyan-300">
                        Nový fakt ({factType}):
                    </label>
                    <textarea
                        value={newFactText}
                        onChange={(e) => setNewFactText(e.target.value)}
                        placeholder="Napiš fakt, např. „Narodil se na území dnešního Česka (v Malých Svatoňovicích).“..."
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setAddingFactToType(null)
                                setNewFactText('')
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition"
                        >
                            Zrušit
                        </button>
                        <button
                            type="button"
                            disabled={savingFact || !newFactText.trim()}
                            onClick={() => handleAddFactSubmit(factType)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                        >
                            {savingFact ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Přepočítávám vektor...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Uložit a vygenerovat vektor</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Seznam faktů */}
            {facts.length === 0 ? (
                <p className="text-xs text-slate-500 py-2 italic">
                    V této sekci zatím není žádný fakt.
                </p>
            ) : (
                <div className="space-y-1.5">
                    {facts.map((fact, index) => {
                        const isEditing = editingFactId === fact.id

                        if (isEditing) {
                            return (
                                <div
                                    key={fact.id}
                                    className="p-3 rounded-xl bg-slate-950 border border-amber-500/50 space-y-2"
                                >
                                    <textarea
                                        value={editingFactText}
                                        onChange={(e) => setEditingFactText(e.target.value)}
                                        rows={2}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                                    />
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditingFactId(null)}
                                            className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition"
                                        >
                                            Zrušit
                                        </button>
                                        <button
                                            type="button"
                                            disabled={savingFact || !editingFactText.trim()}
                                            onClick={handleSaveEditedFact}
                                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                                        >
                                            {savingFact ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    <span>Přepočítávám vektor...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span>Uložit změnu</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div
                                key={fact.id}
                                className="group p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 flex items-start justify-between gap-3 transition"
                            >
                                <div className="flex items-start gap-2 text-xs text-slate-200 leading-relaxed">
                                    <span className="text-slate-500 font-mono text-[11px] shrink-0 pt-0.5">
                                        {index + 1}.
                                    </span>
                                    <span>{fact.fact_text}</span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                                    <button
                                        type="button"
                                        onClick={() => handleStartEditFact(fact)}
                                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                                        title="Upravit fakt a přepočítat embedding"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteFact(fact.id, fact.fact_text)}
                                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                                        title="Smazat fakt"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

