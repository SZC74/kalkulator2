import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { extractFromRgba } from './core'

const fixtureDirectory = resolve(process.cwd(), '../upload')
const fixturesAvailable = existsSync(fixtureDirectory)

const expected: Record<string, [number, number, number]> = {
  'Default_260707113347.jpg': [8, 109, 1.2],
  'Default_260707113508.jpg': [8, 110, 1.2],
  'Default_260707113819.jpg': [8, 115, 1.4],
  'Default_260707113902.jpg': [8, 113, 1.4],
  'Default_260707113944.jpg': [8, 112, 1.1],
  'Default_260707115004.jpg': [1, 39, 0.5],
  'Default_260707115007.jpg': [1, 39, 0.4],
  'Default_260707115200.jpg': [1, 37, 1.2],
  'Default_260707115254.jpg': [6, 112, 1.0],
}

describe.skipIf(!fixturesAvailable)('ii500 extraction regression', () => {
  for (const [filename, values] of Object.entries(expected)) {
    it(`extracts ${filename}`, async () => {
      const { data, info } = await sharp(resolve(fixtureDirectory, filename))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
      expect([info.width, info.height, info.channels]).toEqual([1280, 800, 4])
      const result = extractFromRgba(new Uint8ClampedArray(data), filename)
      expect([result.leakQ, result.sourceDb, result.distanceM]).toEqual(values)
      expect(new Date(result.capturedAt).getHours()).toBe(Number(filename.slice(-10, -8)))
      expect(result.confidence).toBeGreaterThan(0.75)
    })
  }
})
