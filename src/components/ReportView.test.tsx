import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ReportView } from './ReportView'
import { createEmptyProject, type LeakItem } from '../types'

function item(id: string, sourceDb: number): LeakItem {
  return {
    id,
    filename: `Default_26070711${id}00.jpg`,
    imageBlob: new Blob(),
    folder: 'Default',
    capturedAt: '2026-07-07T11:33:47',
    extractedLeakQ: 8,
    extractedSourceDb: sourceDb,
    extractedDistanceM: 1.2,
    leakQ: 8,
    sourceDb,
    distanceM: 1.2,
    confidence: 1,
    extractionWarnings: [],
    included: true,
    location: 'Hala A',
    description: 'Punkt testowy',
    notes: 'Uwagi trwałe',
  }
}

describe('report rendering', () => {
  it('renders one report section per included photo with persistent note inputs', () => {
    const project = createEmptyProject()
    project.items = [item('01', 109), item('02', 39)]
    const html = renderToStaticMarkup(
      <ReportView project={project} onGlobalNotes={() => undefined} onItemNotes={() => undefined} />,
    )
    expect((html.match(/class="report-item print-page"/g) ?? [])).toHaveLength(2)
    expect((html.match(/class="report-summary print-page"/g) ?? [])).toHaveLength(1)
    expect(html.indexOf('report-summary print-page')).toBeLessThan(html.indexOf('report-item print-page'))
    expect(html).toContain('Źródło z kamery')
    expect(html).toContain('Szacowany koszt roczny')
    expect(html).toContain('Estymacja na podstawie LeakQ')
    expect(html).toContain('Estymacja na podstawie dB')
    expect(html).toContain('Zestawienie pozycji i kosztów')
    expect(html).toContain('(PLN/rok)')
    expect(html).toContain('Nagłówki i stopki')
    expect(html).toContain('Odczyt nie jest korygowany względem odległości')
    expect(html).toContain('Uwagi trwałe')
    expect(html).toContain('Każde zdjęcie jest liczone jako osobna nieszczelność')
  })
})
