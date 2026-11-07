export interface StreakUpdateInput {
  userId: string;
  isFirstAttempt: boolean;  // True pouze při 1. dokončení této hádanky
  isDailyRiddle: boolean;   // True pokud jde o dnešní hádanku, False pro Šuplík
  isSolved: boolean;        // True pokud hráč uhodl, False pokud prohrál
  todayDateStr: string;     // Formát "YYYY-MM-DD"
}

export function calculateNewStreaks(
  currentProfile: {
    daily_streak_current?: number | null;
    daily_streak_max?: number | null;
    last_daily_date?: string | null;
    solve_streak_current?: number | null;
    solve_streak_max?: number | null;
  },
  input: StreakUpdateInput
) {
  // Pokud to není první ostrý pokus, série se nemění
  if (!input.isFirstAttempt) {
    return null;
  }

  let daily_streak_current = currentProfile.daily_streak_current || 0;
  let daily_streak_max = currentProfile.daily_streak_max || 0;
  let last_daily_date = currentProfile.last_daily_date || null;
  let solve_streak_current = currentProfile.solve_streak_current || 0;
  let solve_streak_max = currentProfile.solve_streak_max || 0;

  // --- 1. MISTROVSKÁ SÉRIE (Solve Streak - platí pro live i Šuplík) ---
  if (input.isSolved) {
    solve_streak_current += 1;
    if (solve_streak_current > solve_streak_max) {
      solve_streak_max = solve_streak_current;
    }
  } else {
    // Neúspěch = nekompromisní pád na 0
    solve_streak_current = 0;
  }

  // --- 2. KALENDÁŘNÍ DENNÍ SÉRIE (Daily Streak - pouze pro live hádanku dne) ---
  if (input.isDailyRiddle) {
    if (!last_daily_date) {
      // První odehraný den vůbec
      daily_streak_current = 1;
      daily_streak_max = 1;
      last_daily_date = input.todayDateStr;
    } else if (last_daily_date !== input.todayDateStr) {
      // Zjistíme, zda byl poslední odehraný den přesně včera
      const lastDate = new Date(last_daily_date);
      const today = new Date(input.todayDateStr);
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Hrál včera -> šňůra pokračuje
        daily_streak_current += 1;
      } else {
        // Vynechal jeden a více dní -> restart na 1
        daily_streak_current = 1;
      }

      if (daily_streak_current > daily_streak_max) {
        daily_streak_max = daily_streak_current;
      }
      last_daily_date = input.todayDateStr;
    }
  }

  return {
    daily_streak_current,
    daily_streak_max,
    last_daily_date,
    solve_streak_current,
    solve_streak_max
  };
}

