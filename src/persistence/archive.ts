import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import type { LeakItem, ProjectData } from '../types'

type StoredItem = Omit<LeakItem, 'imageBlob'> & { imagePath: string }
type StoredProject = Omit<ProjectData, 'items'> & { items: StoredItem[] }

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_')
}

export async function createProjectArchive(project: ProjectData): Promise<Blob> {
  const files: Record<string, Uint8Array> = {}
  const items: StoredItem[] = []
  for (const item of project.items) {
    const imagePath = `images/${item.id}-${safeName(item.filename)}`
    files[imagePath] = new Uint8Array(await item.imageBlob.arrayBuffer())
    const { imageBlob: _imageBlob, ...rest } = item
    items.push({ ...rest, imagePath })
  }
  const manifest: StoredProject = { ...project, items }
  files['project.json'] = strToU8(JSON.stringify(manifest, null, 2))
  const zipped = zipSync(files, { level: 6 })
  return new Blob([zipped.slice().buffer], { type: 'application/zip' })
}

export async function importProjectArchive(file: File): Promise<ProjectData> {
  const archive = unzipSync(new Uint8Array(await file.arrayBuffer()))
  const manifestBytes = archive['project.json']
  if (!manifestBytes) throw new Error('Archiwum nie zawiera pliku project.json')
  const manifest = JSON.parse(strFromU8(manifestBytes)) as StoredProject
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.items)) {
    throw new Error('Nieobsługiwana wersja projektu')
  }
  const items: LeakItem[] = manifest.items.map(({ imagePath, ...item }) => {
    const bytes = archive[imagePath]
    if (!bytes) throw new Error(`Brak obrazu ${imagePath}`)
    return { ...item, imageBlob: new Blob([bytes.slice().buffer], { type: 'image/jpeg' }) }
  })
  return { ...manifest, items }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
