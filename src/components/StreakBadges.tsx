'use client'

import { useState, useEffect } from 'react'
import { getUserStreaksAction } from '@/app/actions/game'
import ProfileModal from '@/components/ProfileModal'

interface StreakBadgesProps {
  dailyStreak?: number
  solveStreak?: number
}

export function StreakBadges({ dailyStreak: propDaily, solveStreak: propSolve }: StreakBadgesProps) {
  const [dailyStreak, setDailyStreak] = useState<number>(propDaily ?? 0)
  const [solveStreak, setSolveStreak] = useState<number>(propSolve ?? 0)
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  useEffect(() => {
    if (propDaily !== undefined && propSolve !== undefined) {
      setDailyStreak(propDaily)
      setSolveStreak(propSolve)
      return
    }

    getUserStreaksAction().then((data) => {
      if (data) {
        setDailyStreak(data.dailyStreak)
        setSolveStreak(data.solveStreak)
      }
    })
  }, [propDaily, propSolve])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsProfileOpen(true)}
        className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold shrink-0 cursor-pointer hover:opacity-90 transition text-left"
        title="Klikni pro statistiky a odznaky"
      >
        {/* Denní kalendářní série */}
        <div 
          className="flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0"
          title="Denní série (dny v řadě) – klikni pro profil"
        >
          <span>🔥</span>
          <span>{dailyStreak}</span>
        </div>

        {/* Mistrovská série bez zaváhání */}
        <div 
          className="flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0"
          title="Mistrovská série (uhodnuté hádanky za sebou) – klikni pro profil"
        >
          <span>🎯</span>
          <span>{solveStreak}</span>
        </div>
      </button>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  )
}

export default StreakBadges


