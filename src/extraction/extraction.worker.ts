/// <reference lib="webworker" />

import { extractFromRgba, REFERENCE_HEIGHT, REFERENCE_WIDTH } from './core'

interface Request {
  id: string
  file: File
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const { id, file } = event.data
  try {
    const bitmap = await createImageBitmap(file)
    const expectedRatio = REFERENCE_WIDTH / REFERENCE_HEIGHT
    const ratio = bitmap.width / bitmap.height
    if (Math.abs(ratio - expectedRatio) > 0.01) {
      throw new Error(`Nieobsługiwane proporcje ${bitmap.width}×${bitmap.height}`)
    }
    const warnings: string[] = []
    if (bitmap.width !== REFERENCE_WIDTH || bitmap.height !== REFERENCE_HEIGHT) {
      warnings.push(`Obraz przeskalowano z ${bitmap.width}×${bitmap.height} do 1280×800`)
    }
    const canvas = new OffscreenCanvas(REFERENCE_WIDTH, REFERENCE_HEIGHT)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Przeglądarka nie udostępniła Canvas 2D')
    context.drawImage(bitmap, 0, 0, REFERENCE_WIDTH, REFERENCE_HEIGHT)
    bitmap.close()
    const pixels = context.getImageData(0, 0, REFERENCE_WIDTH, REFERENCE_HEIGHT)
    const result = extractFromRgba(pixels.data, file.name, warnings)
    self.postMessage({ id, result })
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) })
  }
}

export {}
