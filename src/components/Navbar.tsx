'use client'

import Link from 'next/link'
import { Sparkles, Archive, Trophy } from 'lucide-react'
import ChangelogModal from '@/components/ChangelogModal'
import RulesModal from '@/components/RulesModal'
import TopicSuggestionModal from '@/components/TopicSuggestionModal'
import UserNav from '@/components/UserNav'
import NicknameEditor from '@/components/NicknameEditor'

export default function Navbar() {
  return (
    <header className="w-full border-b border-slate-900 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* LEVÁ ČÁST: Logo + rychlá navigace */}
        <div className="flex items-center gap-2 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 font-black text-base sm:text-lg">
            <span>🕵️‍♂️</span>
            <span className="tracking-tight text-white">
              Hádači<span className="text-amber-400">.cz</span>
            </span>
          </Link>

          {/* Odkazy – na mobilu jen ikony, na desktopu s textem */}
          <nav className="flex items-center gap-0.5 sm:gap-1.5 whitespace-nowrap">
            <Link
              href="/"
              title="Dnešní hra"
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Hra</span>
            </Link>

            <Link
              href="/archiv"
              title="Archiv a šuplík"
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition"
            >
              <Archive className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Archiv</span>
            </Link>

            <Link
              href="/zebricek"
              title="Síň slávy"
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden md:inline">Žebříčky</span>
            </Link>

            <TopicSuggestionModal variant="nav" />
          </nav>
        </div>

        {/* PRAVÁ ČÁST: Nástroje, Pravidla, Verze a Profil */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <RulesModal />

          <div className="hidden sm:block">
            <ChangelogModal />
          </div>

          <UserNav />

          <div className="hidden lg:block pl-2 border-l border-slate-800 shrink-0">
            <NicknameEditor />
          </div>
        </div>
      </div>
    </header>
  )
}
