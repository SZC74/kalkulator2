import type { ExtractionResult } from '../types'

interface WorkerResponse {
  id: string
  result?: ExtractionResult
  error?: string
}

let worker: Worker | null = null
const pending = new Map<string, { resolve: (value: ExtractionResult) => void; reject: (error: Error) => void }>()

function getWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./extraction.worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const request = pending.get(event.data.id)
    if (!request) return
    pending.delete(event.data.id)
    if (event.data.error) request.reject(new Error(event.data.error))
    else if (event.data.result) request.resolve(event.data.result)
  }
  worker.onerror = (event) => {
    for (const request of pending.values()) request.reject(new Error(event.message || 'Błąd Web Workera'))
    pending.clear()
  }
  return worker
}

export function extractFile(file: File): Promise<ExtractionResult> {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID()
    pending.set(id, { resolve, reject })
    getWorker().postMessage({ id, file })
  })
}
