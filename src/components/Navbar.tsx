import Link from 'next/link'
import { Trophy, HelpCircle, Archive } from 'lucide-react'
import NicknameEditor from '@/components/NicknameEditor'
import TopicSuggestionModal from '@/components/TopicSuggestionModal'
import RulesModal from '@/components/RulesModal'

export default function Navbar() {
    return (
        <header className="w-full max-w-2xl mx-auto py-4 px-4 flex items-center justify-between border-b border-slate-800/80 mb-6">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
                <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
                    <HelpCircle className="w-5 h-5" />
                </div>
                <span className="font-black text-xl tracking-tight text-white group-hover:text-amber-400 transition">
                    Hádači<span className="text-amber-400">.cz</span>
                </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
                <nav className="flex items-center gap-1 whitespace-nowrap">
                    <Link
                        href="/"
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition"
                    >
                        Hra
                    </Link>
                    <Link
                        href="/archiv"
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1"
                    >
                        <Archive className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Archiv</span>
                    </Link>
                    <Link
                        href="/zebricek"
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1"
                    >
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Žebříčky</span>
                    </Link>

                    {/* Pravidla hry */}
                    <RulesModal />

                    {/* Tlačítko pro tip */}
                    <TopicSuggestionModal variant="nav" />
                </nav>

                <div className="pl-2 border-l border-slate-800 shrink-0">
                    <NicknameEditor />
                </div>
            </div>
        </header>
    )
}