import { Suspense } from 'react'
import { connection } from 'next/server'
import { getActiveDetectiveCaseAction } from '@/app/actions/detective'
import DetectiveBoard from '@/components/DetectiveBoard'

export const metadata = {
    title: 'Detektivní výslech | Hádači.cz',
    description:
        'Polož až 20 zjišťovacích otázek s odpověďmi ANO, NE nebo Nelze ověřit. Odhal hledanou entitu a získej body do síně slávy!',
}

interface DetectivePageProps {
    searchParams: Promise<{ slug?: string; case?: string }>
}

async function DetectiveCaseLoader({ searchParams }: DetectivePageProps) {
    await connection()
    let slug: string | undefined = undefined
    try {
        const params = searchParams ? await searchParams : undefined
        slug = params?.case || params?.slug
    } catch (err) {
        console.warn('⚠️ Chyba při načítání searchParams v /vyslech:', err)
    }

    const { currentCase, allCases, userState } = await getActiveDetectiveCaseAction(slug)

    return (
        <DetectiveBoard
            initialCase={currentCase}
            allCases={allCases}
            initialUserState={userState}
        />
    )
}

export default async function DetectivePage({ searchParams }: DetectivePageProps) {
    return (
        <main className="w-full max-w-xl mx-auto px-4 pb-12 flex-1">
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
                    <span>🕵️‍♂️</span>
                    <span>Režim 2: Kladení otázek</span>
                </div>
                <h1 className="text-3xl font-black text-amber-400 tracking-tight mb-1">
                    Detektivní výslech
                </h1>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Ptej se na cokoliv formou zjišťovacích otázek (ANO/NE). Systém ověří uzavřený vyšetřovací spis a odpoví bez spoilerů.
                </p>
            </div>

            <Suspense
                fallback={
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs animate-pulse">
                        Načítám detektivní spis a stav vyšetřování...
                    </div>
                }
            >
                <DetectiveCaseLoader searchParams={searchParams} />
            </Suspense>
        </main>
    )
}

