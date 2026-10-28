import { Suspense } from 'react'
import { connection } from 'next/server'
import { verifyAdminSession } from '@/app/actions/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import AdminPanel from '@/components/AdminPanel'

async function AdminContent() {
    await connection()

    const isAuthenticated = await verifyAdminSession()
    let riddles: any[] = []
    let categories: string[] = []
    let nextAvailableDate = ''
    let suggestions: any[] = []
    let reports: any[] = []

    if (isAuthenticated) {
        const supabase = await createServerSupabaseClient()

        // 1. Načtení všech hádanek
        const { data: riddlesData } = await supabase
            .from('riddles')
            .select('id, title, category, secret_answer, publish_date, hints, accepted_aliases')
            .order('publish_date', { ascending: true })

        riddles = riddlesData || []

        // Unikátní kategorie z databáze
        const uniqueCats = Array.from(
            new Set(riddles.map((r) => r.category).filter(Boolean))
        )
        categories = uniqueCats

        // Výpočet nejbližšího volného data
        const occupiedDates = new Set(
            riddles.map((r) => r.publish_date).filter(Boolean)
        )

        const checkDate = new Date()
        for (let i = 0; i < 365; i++) {
            const y = checkDate.getFullYear()
            const m = String(checkDate.getMonth() + 1).padStart(2, '0')
            const d = String(checkDate.getDate()).padStart(2, '0')
            const formatted = `${y}-${m}-${d}`

            if (!occupiedDates.has(formatted)) {
                nextAvailableDate = formatted
                break
            }
            checkDate.setDate(checkDate.getDate() + 1)
        }

        // 2. Načtení námětů od komunity
        const { data: suggestionsData } = await supabase
            .from('topic_suggestions')
            .select('id, category_type, suggestion, status, created_at')
            .order('created_at', { ascending: false })

        suggestions = suggestionsData || []

        // 3. Načtení reklamací a nahlášených chyb
        const { data: reportsData } = await supabase
            .from('riddle_reports')
            .select('id, riddle_id, report_type, message, status, created_at, riddles(title, secret_answer)')
            .order('created_at', { ascending: false })

        reports = reportsData || []
    }

    return (
        <AdminPanel
            isInitiallyAuthenticated={isAuthenticated}
            existingRiddles={riddles}
            existingCategories={categories}
            nextAvailableDate={nextAvailableDate}
            existingSuggestions={suggestions}
            existingReports={reports}
        />
    )
}

export default function AdminPage() {
    return (
        <main className="w-full min-h-screen px-4 pb-16 flex-1">
            <div className="text-center mb-6">
                <h1 className="text-3xl font-black text-amber-400 tracking-tight mb-1">
                    Konzole Hádači.cz
                </h1>
                <p className="text-xs text-slate-400">Správa edičního plánu, námětů a reklamací</p>
            </div>

            <Suspense
                fallback={
                    <p className="text-slate-400 text-xs text-center animate-pulse">
                        Ověřuji oprávnění...
                    </p>
                }
            >
                <AdminContent />
            </Suspense>
        </main>
    )
}