export function calculateRiddleScore(
  totalHints: number,
  currentStep: number,
  wrongGuessesCount: number = 0
): number {
  const MAX_SCORE = 100
  const MIN_BASE = totalHints >= 7 ? 10 : 20
  const stepPenalty = Math.round((MAX_SCORE - MIN_BASE) / Math.max(1, totalHints - 1))

  const baseScore = Math.max(MIN_BASE, MAX_SCORE - (currentStep - 1) * stepPenalty)
  const calculated = baseScore - (wrongGuessesCount * 5)

  return Math.max(5, calculated)
}

export function getStepPenalty(totalHints: number): number {
  const MIN_BASE = totalHints >= 7 ? 10 : 20
  return Math.round((100 - MIN_BASE) / Math.max(1, totalHints - 1))
}

export function calculateDrawerScore(repairAttemptsCount: number): number {
  // První pokus při opravě = 50 bodů
  // Pokud se nepodaří ani napoprvé (2. a další pokus) = fixních 20 bodů
  return repairAttemptsCount === 0 ? 50 : 20
}


