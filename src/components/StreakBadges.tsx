'use client'

import { useState, useEffect } from 'react'
import { getUserStreaksAction } from '@/app/actions/game'

interface StreakBadgesProps {
  dailyStreak?: number
  solveStreak?: number
}

export function StreakBadges({ dailyStreak: propDaily, solveStreak: propSolve }: StreakBadgesProps) {
  const [dailyStreak, setDailyStreak] = useState<number>(propDaily ?? 0)
  const [solveStreak, setSolveStreak] = useState<number>(propSolve ?? 0)

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
    <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold">
      {/* Denní kalendářní série */}
      <div 
        className="flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20"
        title="Denní série (dny v řadě)"
      >
        <span>🔥</span>
        <span>{dailyStreak}</span>
      </div>

      {/* Mistrovská série bez zaváhání */}
      <div 
        className="flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        title="Mistrovská série (uhodnuté hádanky za sebou)"
      >
        <span>🎯</span>
        <span>{solveStreak}</span>
      </div>
    </div>
  )
}

export default StreakBadges

