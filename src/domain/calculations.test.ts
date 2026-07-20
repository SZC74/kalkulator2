import { describe, expect, it } from 'vitest'
import { calculateItem, inverseLogFormula } from './calculations'
import { DEFAULT_SETTINGS, type LeakItem } from '../types'

const baseItem: LeakItem = {
  id: 'test',
  filename: 'Default_260707115004.jpg',
  imageBlob: new Blob(),
  folder: 'Default',
  capturedAt: '2026-07-07T11:50:04.000Z',
  extractedLeakQ: 1,
  extractedSourceDb: 39,
  extractedDistanceM: 0.5,
  leakQ: 1,
  sourceDb: 39,
  distanceM: 0.5,
  confidence: 1,
  extractionWarnings: [],
  included: true,
  location: '',
  description: '',
  notes: '',
}

describe('calculations', () => {
  it('inverts the configured logarithmic equation', () => {
    expect(inverseLogFormula(1, 2.3432, -4.1653)).toBeCloseTo(9.069, 2)
  })

  it('uses raw source dB and never distance-normalizes it', () => {
    const near = calculateItem(baseItem, DEFAULT_SETTINGS)
    const far = calculateItem({ ...baseItem, distanceM: 1.4 }, DEFAULT_SETTINGS)
    expect(near.qDbLMin).toBe(far.qDbLMin)
    expect(near.qDbLMin).toBeCloseTo(inverseLogFormula(39, 19.847, 11.324), 8)
  })

  it('calculates annual volume and cost', () => {
    const result = calculateItem(baseItem, DEFAULT_SETTINGS)
    expect(result.annualM3LeakQ).toBeCloseTo((result.qLeakQLMin * 60 * 8760) / 1000, 8)
    expect(result.annualCostLeakQ).toBeCloseTo(result.annualM3LeakQ * DEFAULT_SETTINGS.pricePlnPerM3, 8)
  })
})
