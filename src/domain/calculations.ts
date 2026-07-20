import type { CalculatedItem, LeakItem, ProjectSettings } from '../types'

export function inverseLogFormula(index: number, a: number, b: number): number {
  return Math.exp((index - b) / a)
}

export function calculateItem(item: LeakItem, settings: ProjectSettings): CalculatedItem {
  const qLeakQLMin = inverseLogFormula(
    item.leakQ,
    settings.leakQFormula.a,
    settings.leakQFormula.b,
  )
  // Deliberately use the raw source dB value. Distance is informational only.
  const qDbLMin = inverseLogFormula(item.sourceDb, settings.dbFormula.a, settings.dbFormula.b)
  const annualM3LeakQ = (qLeakQLMin * 60 * settings.operatingHoursPerYear) / 1000
  const annualM3Db = (qDbLMin * 60 * settings.operatingHoursPerYear) / 1000
  const warnings = [...item.extractionWarnings]

  if (item.leakQ < settings.validLeakQRange[0] || item.leakQ > settings.validLeakQRange[1]) {
    warnings.push('LeakQ jest poza skonfigurowanym zakresem kalibracji.')
  }
  if (item.sourceDb < settings.validDbRange[0] || item.sourceDb > settings.validDbRange[1]) {
    warnings.push('Poziom dB z kamery jest poza skonfigurowanym zakresem kalibracji.')
  }
  const smaller = Math.min(qLeakQLMin, qDbLMin)
  const ratio = smaller > 0 ? Math.max(qLeakQLMin, qDbLMin) / smaller : Number.POSITIVE_INFINITY
  if (ratio >= settings.estimatorDisagreementRatio) {
    warnings.push(`Estymatory przepływu różnią się ${ratio.toFixed(1)}×. Wynik wymaga oceny technicznej.`)
  }
  if (!item.location.trim()) {
    warnings.push('Brak lokalizacji. Folder „Default” nie jest traktowany jako lokalizacja.')
  }

  return {
    qLeakQLMin,
    qDbLMin,
    annualM3LeakQ,
    annualM3Db,
    annualCostLeakQ: annualM3LeakQ * settings.pricePlnPerM3,
    annualCostDb: annualM3Db * settings.pricePlnPerM3,
    warnings: [...new Set(warnings)],
  }
}

export function formatNumber(value: number, decimals = 1): string {
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}
