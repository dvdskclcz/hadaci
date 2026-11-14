'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  HelpCircle,
  X,
  Sparkles,
  Trophy,
  Lightbulb,
  Bot,
  Search,
  ShieldAlert,
  FolderArchive,
  ArrowRight,
  Activity,
  Key,
} from 'lucide-react'

export default function RulesModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'riddle' | 'vyslech'>('riddle')

  useEffect(() => {
    setMounted(true)
    const seen = localStorage.getItem('hadaci_rules_seen')
    if (!seen) {
      setIsOpen(true)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    localStorage.setItem('hadaci_rules_seen', 'true')
  }

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[85dvh] flex flex-col text-left">
        {/* Křížek pro zavření */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition"
          aria-label="Zavřít"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hlavička */}
        <div className="flex items-center gap-3 mb-3 pr-6 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xl shrink-0">
            🕵️‍♂️
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Jak hrát Hádače?</h3>
            <p className="text-xs text-slate-400">Trénuj hlavu, hledej indicie, sbírej body</p>
          </div>
        </div>

        {/* Přepínač herních módů */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('riddle')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'riddle'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Denní hádanka</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vyslech')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'vyslech'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Detektivní výslech</span>
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80">
              Nové
            </span>
          </button>
        </div>

        {/* Rolovací obsah podle vybrané záložky */}
        <div className="space-y-3 overflow-y-auto pr-1 text-xs text-slate-300 leading-relaxed min-h-0 flex-1">
          {activeTab === 'riddle' ? (
            <>
              {/* 1. Stopy a obtížnost */}
              <div className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block mb-0.5">5 až 10 postupných stop</strong>
                  Hledáme českou osobnost, dílo, vynález či fenomén. Začínáš nejtěžší stopou, obtížnost poznáš podle štítku (Klasika / Střední / Velká výzva).
                </div>
              </div>

              {/* 2. Bodování, pokuty a garantované minimum */}
              <div className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60">
                <Trophy className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block mb-0.5">Férové bodování (strop 100 b.)</strong>
                  Vyřešení na 1. stopu = 100 bodů. Každá další odkrytá stopa snižuje základní hodnotu a každý špatný tip stojí 5 bodů. Za úspěšné vyluštění ale vždy získáš minimálně 5 bodů!
                </div>
              </div>

              {/* 3. AI souboj */}
              <div className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60">
                <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block mb-0.5">Změř síly s umělou inteligencí</strong>
                  Kopíruj indicie jako prompt do ChatGPT, Gemini či Claude. Po uhádnutí označ, zda jsi luštil čistou hlavou, nebo s pomocí AI.
                </div>
              </div>

              {/* Info box o Šuplíku */}
              <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center leading-normal">
                💡 Nová hádanka vychází o půlnoci. Pokud vyčerpáš všechny pokusy, hádanka se zamkne do <strong>Šuplíku</strong> pro pozdější dořešení.
              </div>
            </>
          ) : (
            <>
              {/* Výslech 1: Kladení zjišťovacích otázek */}
              <div className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60">
                <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block mb-0.5">Platné zjišťovací otázky (ANO / NE)</strong>
                  Začínáš pouze s jednou úvodní nápovědou a uzavřeným vyšetřovacím spisem. Ptej se na vlastnosti, historii a podstatu pojmu. AI vyšetřovatel ověří každý dotaz proti spisu a odpoví bez spoilerů.
                </div>
              </div>

              {/* Výslech 2: Pre-filtr otázek bez penalizace */}
              <div className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block mb-0.5">Férový pre-filtr (0 b. penalizace)</strong>
                  Otázky obsahující vylučovací volbu <em>„nebo / či“</em> (např. <em>„Je to muž nebo žena?“</em>) a meta-otázky na pravopis (počet písmen, slabik, počáteční písmeno, rýmy) jsou zablokovány s vysvětlením. <strong>Nestojí tě žádné body</strong> ani pokus z limitu.
                </div>
              </div>

              {/* Výslech 3: Bodování a limity */}
              <div className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60">
                <Activity className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block mb-0.5">Taktické bodování (limit 20 otázek)</strong>
                  Začínáš se <strong>100 body</strong>. Každá otázka s odpovědí <strong>ANO</strong> nebo <strong>NE</strong> stojí <strong>4 body</strong>, <strong>NELZE OVĚŘIT</strong> jen <strong>2 body</strong>. Chybný finální tip stojí <strong>15 bodů</strong> (máš max. 3 pokusy na tip). Vyřešení na 1. pokus se započítává do Mistrovské série!
                </div>
              </div>

              {/* Výslech 4: Šuplík a odveta */}
              <div className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60">
                <FolderArchive className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 block mb-0.5">Odložení do Šuplíku a odveta</strong>
                  Pokud vyčerpáš 20 otázek nebo 3 tipy, tajenka zůstává skrytá a spis putuje do Šuplíku. Odtud si můžeš <strong>kdykoliv spustit odvetu</strong> – dostaneš nových 20 otázek a hraje se o 50 bodů.
                </div>
              </div>

              {/* Odkaz přímo na Výslech */}
              <div className="pt-1">
                <Link
                  href="/vyslech"
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <span>Přejít na Detektivní výslech</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Spodní tlačítko */}
        <div className="pt-3.5 border-t border-slate-800 mt-4 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className={`w-full py-2.5 rounded-xl text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'vyslech'
                ? 'bg-cyan-500 hover:bg-cyan-400'
                : 'bg-amber-400 hover:bg-amber-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Rozumím, jdu do akce!</span>
          </button>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      {/* Tlačítko otazníku v horní liště */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-amber-400 transition shrink-0"
        title="Jak hrát Hádače"
        aria-label="Pravidla hry"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Vykreslení modálního okna mimo lištu přímo do body */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  )
}
