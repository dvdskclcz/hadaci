'use client'

import Link from 'next/link'
import { Sparkles, Archive, Trophy, Search } from 'lucide-react'
import ChangelogModal from '@/components/ChangelogModal'
import RulesModal from '@/components/RulesModal'
import TopicSuggestionModal from '@/components/TopicSuggestionModal'
import UserNav from '@/components/UserNav'
import NicknameEditor from '@/components/NicknameEditor'
import StreakBadges from '@/components/StreakBadges'

export default function Navbar() {
  return (
    <header className="w-full max-w-full overflow-x-hidden border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-2 lg:py-0 lg:h-14 flex flex-col lg:flex-row lg:items-center lg:justify-between">
        {/* 1. ŘÁDEK (na mobilu nahoře, na desktopu vlevo): Logo vlevo + hlavní navigace vpravo */}
        <div className="w-full lg:w-auto flex items-center justify-between gap-1.5 sm:gap-2 lg:gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 font-black text-base sm:text-lg shrink-0">
            <span>🕵️‍♂️</span>
            <span className="tracking-tight text-white">
              Hádači<span className="text-amber-400">.cz</span>
            </span>
          </Link>

          {/* Odkazy – na mobilu jen ikony s kompaktními rozestupy, na větších obrazovkách s textem */}
          <nav className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 whitespace-nowrap">
            <Link
              href="/"
              title="Dnešní hra"
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden md:inline">Hra</span>
            </Link>

            <Link
              href="/vyslech"
              title="Detektivní výslech"
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition shrink-0"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden md:inline">Výslech</span>
              <span className="hidden xl:inline text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                Nové
              </span>
            </Link>

            <Link
              href="/archiv"
              title="Archiv a šuplík"
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition shrink-0"
            >
              <Archive className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="hidden md:inline">Archiv</span>
            </Link>

            <Link
              href="/zebricek"
              title="Síň slávy"
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition shrink-0"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden md:inline">Žebříčky</span>
            </Link>

            <TopicSuggestionModal variant="nav" />
          </nav>
        </div>

        {/* 2. ŘÁDEK (na mobilu dole oddělen linkou, na desktopu vpravo): Nápověda, Verze, Série, Skóre, Profil */}
        <div className="w-full lg:w-auto flex items-center justify-between sm:justify-end gap-1 sm:gap-2 border-t border-slate-800/70 pt-2 mt-2 lg:border-t-0 lg:pt-0 lg:mt-0 shrink-0">
          <RulesModal />

          <ChangelogModal />

          <StreakBadges />

          <UserNav />

          <div className="hidden lg:block pl-2 border-l border-slate-800 shrink-0">
            <NicknameEditor />
          </div>
        </div>
      </div>
    </header>
  )
}
