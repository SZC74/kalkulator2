import { GLYPH_TEMPLATES } from './templates'
import type { ExtractionResult } from '../types'

export const REFERENCE_WIDTH = 1280
export const REFERENCE_HEIGHT = 800

type FieldName = 'leakQ' | 'sourceDb' | 'distanceM'
type Box = readonly [number, number, number, number]

const FIELD_BOXES: Record<FieldName, Box> = {
  leakQ: [325, 38, 441, 69],
  sourceDb: [457, 38, 573, 69],
  distanceM: [589, 38, 706, 69],
}

interface Component {
  box: [number, number, number, number]
  pixels: Array<[number, number]>
}

function popcount(value: bigint): number {
  let count = 0
  let remaining = value
  while (remaining) {
    remaining &= remaining - 1n
    count += 1
  }
  return count
}

function componentsForField(rgba: Uint8ClampedArray, field: FieldName): Component[] {
  const [left, top, right, bottom] = FIELD_BOXES[field]
  const width = right - left
  const height = bottom - top
  const foreground = new Uint8Array(width * height)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const source = ((top + y) * REFERENCE_WIDTH + left + x) * 4
      const red = rgba[source]
      const green = rgba[source + 1]
      const blue = rgba[source + 2]
      const min = Math.min(red, green, blue)
      const max = Math.max(red, green, blue)
      if (min >= 175 && max - min <= 35) foreground[y * width + x] = 1
    }
  }

  const found: Component[] = []
  for (let seed = 0; seed < foreground.length; seed += 1) {
    if (!foreground[seed]) continue
    foreground[seed] = 0
    const queue = [seed]
    const pixels: Array<[number, number]> = []
    let minX = width
    let minY = height
    let maxX = 0
    let maxY = 0
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor]
      const x = index % width
      const y = Math.floor(index / width)
      pixels.push([x, y])
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
      for (let ny = Math.max(0, y - 1); ny <= Math.min(height - 1, y + 1); ny += 1) {
        for (let nx = Math.max(0, x - 1); nx <= Math.min(width - 1, x + 1); nx += 1) {
          const neighbor = ny * width + nx
          if (foreground[neighbor]) {
            foreground[neighbor] = 0
            queue.push(neighbor)
          }
        }
      }
    }
    const box: [number, number, number, number] = [minX, minY, maxX + 1, maxY + 1]
    if (
      pixels.length >= 3 &&
      box[2] < 100 &&
      !(box[0] === 0 && box[3] - box[1] > 25)
    ) {
      found.push({ box, pixels })
    }
  }

  found.sort((a, b) => a.box[0] - b.box[0])
  if (field === 'sourceDb') return found.filter((component) => component.box[0] < 61)
  if (field === 'distanceM') return found.filter((component) => component.box[0] < 65)
  return found
}

function normalizedMask(component: Component): bigint | null {
  const [x0, y0, x1, y1] = component.box
  const width = x1 - x0
  const height = y1 - y0
  if (height <= 4) return null

  const source = new Uint8Array(width * height)
  for (const [x, y] of component.pixels) source[(y - y0) * width + x - x0] = 1
  const scale = Math.min(12 / width, 16 / height)
  const targetWidth = Math.max(1, Math.round(width * scale))
  const targetHeight = Math.max(1, Math.round(height * scale))
  const canvas = new Uint8Array(14 * 18)
  const offsetX = Math.floor((14 - targetWidth) / 2)
  const offsetY = Math.floor((18 - targetHeight) / 2)
  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(height - 1, Math.floor(((y + 0.5) * height) / targetHeight))
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(width - 1, Math.floor(((x + 0.5) * width) / targetWidth))
      canvas[(offsetY + y) * 14 + offsetX + x] = source[sourceY * width + sourceX]
    }
  }
  let result = 0n
  for (const bit of canvas) result = (result << 1n) | BigInt(bit)
  return result
}

function classify(component: Component): { character: string; confidence: number; margin: number } {
  const mask = normalizedMask(component)
  if (mask === null) return { character: '.', confidence: 1, margin: 252 }
  const classes = Object.entries(GLYPH_TEMPLATES).map(([digit, templates]) => ({
    digit,
    distance: Math.min(...templates.map((template) => popcount(mask ^ template))),
  }))
  classes.sort((a, b) => a.distance - b.distance)
  const best = classes[0]
  if (best.distance > 75) throw new Error(`Nierozpoznany znak (${best.distance}/252)`)
  return {
    character: best.digit,
    confidence: Math.max(0, 1 - best.distance / 252),
    margin: classes[1].distance - best.distance,
  }
}

function readField(
  rgba: Uint8ClampedArray,
  field: FieldName,
): { value: number; confidence: number; warnings: string[] } {
  const components = componentsForField(rgba, field)
  if (!components.length) throw new Error(`Nie znaleziono cyfr w polu ${field}`)
  const classified = components.map(classify)
  const text = classified.map((result) => result.character).join('')
  if (!/^\d+(?:\.\d+)?$/.test(text)) throw new Error(`Nieprawidłowy odczyt ${field}: ${text}`)
  const warnings = classified
    .filter((result) => result.character !== '.' && result.margin < 8)
    .map(() => `Niska jednoznaczność cyfry w polu ${field}`)
  return {
    value: Number(text),
    confidence: Math.min(...classified.map((result) => result.confidence)),
    warnings,
  }
}

export function parseIi500Filename(filename: string): { folder: string; capturedAt: string } {
  const match = filename.match(/^(.+)_(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:_[^.]*)?\.jpe?g$/i)
  if (!match) throw new Error('Nazwa pliku nie pasuje do wzoru Folder_RRMMDDggmmss.jpg')
  const [, folder, yy, month, day, hour, minute, second] = match
  const year = 2000 + Number(yy)
  const date = new Date(year, Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    throw new Error('Nieprawidłowa data w nazwie pliku')
  }
  // The camera filename contains local wall-clock time and no time-zone data.
  // Store it without a Z suffix so the browser does not shift the displayed hour.
  return { folder, capturedAt: `${year}-${month}-${day}T${hour}:${minute}:${second}` }
}

export function extractFromRgba(
  rgba: Uint8ClampedArray,
  filename: string,
  extraWarnings: string[] = [],
): ExtractionResult {
  if (rgba.length !== REFERENCE_WIDTH * REFERENCE_HEIGHT * 4) {
    throw new Error('Silnik wymaga obrazu przeskalowanego do 1280×800')
  }
  const leakQ = readField(rgba, 'leakQ')
  const sourceDb = readField(rgba, 'sourceDb')
  const distanceM = readField(rgba, 'distanceM')
  if (!(distanceM.value > 0 && distanceM.value <= 20)) {
    throw new Error(`Niewiarygodna odległość: ${distanceM.value} m`)
  }
  const parsed = parseIi500Filename(filename)
  return {
    ...parsed,
    leakQ: leakQ.value,
    sourceDb: sourceDb.value,
    distanceM: distanceM.value,
    confidence: Math.min(leakQ.confidence, sourceDb.confidence, distanceM.confidence),
    warnings: [...new Set([...extraWarnings, ...leakQ.warnings, ...sourceDb.warnings, ...distanceM.warnings])],
  }
}
