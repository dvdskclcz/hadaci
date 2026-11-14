/**
 * Převede formát YYYY-MM-DD na české datum bez úvodních nul (např. 29. 10. 2026)
 */
export function formatCzechDate(dateString: string): string {
  if (!dateString) return ''

  // Pokud řetězec obsahuje čas, vezmeme jen část před mezerou / T
  const cleanDate = dateString.split('T')[0]
  const [year, month, day] = cleanDate.split('-')

  if (!year || !month || !day) return dateString

  // parseInt odstraní případné úvodní nuly (05 -> 5)
  return `${parseInt(day, 10)}. ${parseInt(month, 10)}. ${year}`
}

/**
 * Převede slug případu (např. "001-karel-capek") na bezpečný název bez spoileru (např. "Spis #001").
 */
export function formatCaseTitle(slug: string): string {
  if (!slug) return 'Spis'

  const match = slug.match(/^(\d+)/)
  if (match) {
    return `Spis #${match[1]}`
  }

  const anyNumberMatch = slug.match(/\b(\d+)\b/)
  if (anyNumberMatch) {
    return `Spis #${anyNumberMatch[1]}`
  }

  return 'Spis vyšetřování'
}

