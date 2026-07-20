import { describe, expect, it } from 'vitest'
import { createProjectArchive, importProjectArchive } from './archive'
import { createEmptyProject, type LeakItem } from '../types'

describe('project archive', () => {
  it('round-trips metadata and original image bytes', async () => {
    const project = createEmptyProject()
    const imageBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 1, 2, 3])
    const item: LeakItem = {
      id: 'photo-1',
      filename: 'Default_260707113347.jpg',
      imageBlob: new Blob([imageBytes], { type: 'image/jpeg' }),
      folder: 'Default',
      capturedAt: '2026-07-07T11:33:47',
      extractedLeakQ: 8,
      extractedSourceDb: 109,
      extractedDistanceM: 1.2,
      leakQ: 8,
      sourceDb: 109,
      distanceM: 1.2,
      confidence: 1,
      extractionWarnings: [],
      included: true,
      location: 'Hala A',
      description: 'Test',
      notes: 'Naprawić',
    }
    project.items = [item]
    const archive = await createProjectArchive(project)
    const restored = await importProjectArchive(new File([archive], 'test.ii500.zip'))
    expect(restored.items).toHaveLength(1)
    expect(restored.items[0].location).toBe('Hala A')
    expect(new Uint8Array(await restored.items[0].imageBlob.arrayBuffer())).toEqual(imageBytes)
  })
})
