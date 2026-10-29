'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle, X, Sparkles, Trophy, Lightbulb, Bot } from 'lucide-react'

export default function RulesModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

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
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl relative max-h-[85dvh] flex flex-col text-left">
        {/* Křížek pro zavření */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition"
          aria-label="Zavřít"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hlavička – shrink-0 zaručí, že se nikdy nezmáčkne */}
        <div className="flex items-center gap-3 mb-4 pr-6 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-xl shrink-0">
            🕵️‍♂️
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Jak hrát Hádače?</h3>
            <p className="text-xs text-slate-400">Trénuj hlavu, hledej indicie, sbírej body</p>
          </div>
        </div>

        {/* Rolovací obsah – min-h-0 a flex-1 umožní čistý scroll na malých výškách */}
        <div className="space-y-3 overflow-y-auto pr-1 text-xs text-slate-300 leading-relaxed min-h-0 flex-1">
          <div className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block mb-0.5">5 postupných stop</strong>
              Hledáme českou osobnost, památku, vynález či fenomén. Začínáš s nejtěžší indicií.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60">
            <Trophy className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block mb-0.5">Čím méně nápověd, tím víc bodů</strong>
              Uhádnutí na 1. stopu = plný počet bodů. Každá odkrytá nápověda nebo špatný tip snižuje zisk.
            </div>
          </div>

          <div className="flex items-start gap-3 bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60">
            <Bot className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-100 block mb-0.5">Otestuj umělou inteligenci</strong>
              Kopíruj stopy jako prompt a zjisti, zda je ChatGPT, Gemini nebo Claude bystřejší než ty.
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
            💡 Nová hádanka vychází každý den o půlnoci. Neuhodnuté kousky najdeš v šuplíku.
          </div>
        </div>

        {/* Spodní tlačítko – shrink-0 zůstane vždy přilepené dole */}
        <div className="pt-3.5 border-t border-slate-800 mt-4 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Rozumím, jdu hádat!
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
        className="p-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-amber-400 transition"
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
