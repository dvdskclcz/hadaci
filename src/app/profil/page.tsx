import { Suspense } from 'react'
import type { Metadata } from 'next'
import { connection } from 'next/server'
import Link from 'next/link'
import { getPlayerProfileAction } from '@/app/actions/profile'
import UserProfileView from '@/components/UserProfileView'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Profil hráče a odznaky',
    description:
        'Osobní statistiky hádače, úspěšnost v Detektivním výslechu a přehled všech odemčených herních odznaků.',
    alternates: {
        canonical: 'https://hadaci.cz/profil',
    },
    robots: {
        index: false,
        follow: false,
    },
}

async function ProfileContent() {
    await connection()
    const profileData = await getPlayerProfileAction()

    if (!profileData) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-5 shadow-2xl">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-lg">
                    🕵️‍♂️
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white mb-2">
                        Profil hráče
                    </h1>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Pro zobrazení osobních statistik, úspěšnosti v Detektivním výslechu a sbírky odznaků se prosím přihlas přes Google.
                    </p>
                </div>
                <div className="pt-2">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>Přejít na hlavní stranu a přihlásit se</span>
                    </Link>
                </div>
            </div>
        )
    }

    return <UserProfileView data={profileData} />
}

export default function ProfilePage() {
    return (
        <main className="w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
            {/* Navigační zpětný odkaz */}
            <div className="flex items-center justify-between gap-3">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Zpět do hry</span>
                </Link>

                <div className="flex items-center gap-2">
                    <Link
                        href="/vyslech"
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition"
                    >
                        Detektivní výslech →
                    </Link>
                </div>
            </div>

            <Suspense
                fallback={
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-400" />
                        <p className="text-xs">Načítám profil hráče a odznaky...</p>
                    </div>
                }
            >
                <ProfileContent />
            </Suspense>
        </main>
    )
}
