export type AppStep = 'import' | 'review' | 'settings' | 'report'

export interface CalibrationFormula {
  a: number
  b: number
}

export interface ProjectSettings {
  reportTitle: string
  company: string
  auditor: string
  pricePlnPerM3: number
  priceConfirmed: boolean
  operatingHoursPerYear: number
  calibrationConfirmed: boolean
  leakQFormula: CalibrationFormula
  dbFormula: CalibrationFormula
  validLeakQRange: [number, number]
  validDbRange: [number, number]
  estimatorDisagreementRatio: number
}

export interface ExtractionResult {
  folder: string
  capturedAt: string
  leakQ: number
  sourceDb: number
  distanceM: number
  confidence: number
  warnings: string[]
}

export interface LeakItem {
  id: string
  filename: string
  imageBlob: Blob
  folder: string
  capturedAt: string
  extractedLeakQ: number
  extractedSourceDb: number
  extractedDistanceM: number
  leakQ: number
  sourceDb: number
  distanceM: number
  confidence: number
  extractionWarnings: string[]
  included: boolean
  location: string
  description: string
  notes: string
}

export interface ProjectData {
  schemaVersion: 1
  appVersion: string
  id: string
  createdAt: string
  updatedAt: string
  name: string
  globalNotes: string
  settings: ProjectSettings
  items: LeakItem[]
}

export interface CalculatedItem {
  qLeakQLMin: number
  qDbLMin: number
  annualM3LeakQ: number
  annualM3Db: number
  annualCostLeakQ: number
  annualCostDb: number
  warnings: string[]
}

export const APP_VERSION = '1.0.7'

export const DEFAULT_SETTINGS: ProjectSettings = {
  reportTitle: 'Raport z badania nieszczelności instalacji sprężonego powietrza',
  company: '',
  auditor: '',
  pricePlnPerM3: 0.08,
  priceConfirmed: false,
  operatingHoursPerYear: 8760,
  calibrationConfirmed: false,
  leakQFormula: { a: 2.3432, b: -4.1653 },
  dbFormula: { a: 19.847, b: 11.324 },
  validLeakQRange: [1, 10],
  validDbRange: [30, 120],
  estimatorDisagreementRatio: 2,
}

export function upgradeProject(project: ProjectData): ProjectData {
  const usedPreviousUnconfirmedDefault =
    project.appVersion !== APP_VERSION &&
    !project.settings.priceConfirmed &&
    project.settings.pricePlnPerM3 === 0.12

  return {
    ...project,
    appVersion: APP_VERSION,
    settings: {
      ...project.settings,
      pricePlnPerM3: usedPreviousUnconfirmedDefault ? DEFAULT_SETTINGS.pricePlnPerM3 : project.settings.pricePlnPerM3,
    },
  }
}

export function createEmptyProject(): ProjectData {
  const now = new Date().toISOString()
  return {
    schemaVersion: 1,
    appVersion: APP_VERSION,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    name: `Badanie ${new Date().toLocaleDateString('pl-PL')}`,
    globalNotes: '',
    settings: structuredClone(DEFAULT_SETTINGS),
    items: [],
  }
}
