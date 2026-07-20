import type { LeakItem } from '../types'
import { useObjectUrl } from '../hooks/useObjectUrl'

interface Props {
  items: LeakItem[]
  onUpdate: (id: string, change: Partial<LeakItem>) => void
  onRemove: (id: string) => void
}

function PhotoCard({ item, index, onUpdate, onRemove }: { item: LeakItem; index: number } & Omit<Props, 'items'>) {
  const imageUrl = useObjectUrl(item.imageBlob)
  const lowConfidence = item.confidence < 0.8
  const updateNumber = (key: 'leakQ' | 'sourceDb' | 'distanceM', value: string) => {
    const parsed = Number(value.replace(',', '.'))
    if (Number.isFinite(parsed)) onUpdate(item.id, { [key]: parsed })
  }

  return (
    <article className={`review-card ${item.included ? '' : 'excluded'}`}>
      <div className="photo-column">
        <div className="photo-frame">
          <img src={imageUrl} alt={`Zdjęcie ${item.filename}`} />
          <span className="photo-id">P{String(index + 1).padStart(3, '0')}</span>
        </div>
        <div className="file-meta">
          <strong>{item.filename}</strong>
          <span>{new Date(item.capturedAt).toLocaleString('pl-PL')}</span>
        </div>
        <div className={`confidence ${lowConfidence ? 'low' : ''}`}>
          <span>Rozpoznanie</span>
          <strong>{Math.round(item.confidence * 100)}%</strong>
        </div>
      </div>

      <div className="review-fields">
        <div className="measurement-row">
          <label className="field compact">
            <span>LeakQ</span>
            <input value={item.leakQ} onChange={(event) => updateNumber('leakQ', event.target.value)} inputMode="decimal" />
            {item.leakQ !== item.extractedLeakQ && <small>Odczyt: {item.extractedLeakQ}</small>}
          </label>
          <label className="field compact">
            <span>Źródło dB</span>
            <input value={item.sourceDb} onChange={(event) => updateNumber('sourceDb', event.target.value)} inputMode="decimal" />
            {item.sourceDb !== item.extractedSourceDb && <small>Odczyt: {item.extractedSourceDb}</small>}
          </label>
          <label className="field compact">
            <span>Odległość</span>
            <div className="input-suffix">
              <input value={item.distanceM} onChange={(event) => updateNumber('distanceM', event.target.value)} inputMode="decimal" />
              <span>m</span>
            </div>
            {item.distanceM !== item.extractedDistanceM && <small>Odczyt: {item.extractedDistanceM}</small>}
          </label>
        </div>
        <div className="text-fields">
          <label className="field">
            <span>Lokalizacja</span>
            <input
              value={item.location}
              onChange={(event) => onUpdate(item.id, { location: event.target.value })}
              placeholder={item.folder === 'Default' ? 'Wpisz lokalizację' : item.folder}
            />
          </label>
          <label className="field">
            <span>Opis</span>
            <input value={item.description} onChange={(event) => onUpdate(item.id, { description: event.target.value })} placeholder="Np. szybkozłącze przy stanowisku" />
          </label>
          <label className="field wide">
            <span>Uwagi do raportu</span>
            <textarea value={item.notes} onChange={(event) => onUpdate(item.id, { notes: event.target.value })} placeholder="Działanie naprawcze, priorytet lub komentarz" rows={3} />
          </label>
        </div>
        {item.extractionWarnings.length > 0 && (
          <div className="inline-warning">{item.extractionWarnings.join(' ')}</div>
        )}
        <div className="card-actions">
          <label className="toggle-row">
            <input type="checkbox" checked={item.included} onChange={(event) => onUpdate(item.id, { included: event.target.checked })} />
            <span>Uwzględnij w raporcie i sumach</span>
          </label>
          <button className="text-button danger" type="button" onClick={() => onRemove(item.id)}>Usuń zdjęcie</button>
        </div>
      </div>
    </article>
  )
}

export function ReviewPanel({ items, onUpdate, onRemove }: Props) {
  return (
    <section className="workspace-panel">
      <div className="section-title">
        <div>
          <span className="eyebrow">Krok 2</span>
          <h2>Sprawdź odczyty</h2>
          <p>Każde zdjęcie jest osobną pozycją. Wartości zmienione ręcznie zachowują oryginalny odczyt.</p>
        </div>
        <div className="count-chip">{items.length} {items.length === 1 ? 'zdjęcie' : 'zdjęć'}</div>
      </div>
      <div className="review-list">
        {items.map((item, index) => (
          <PhotoCard key={item.id} item={item} index={index} onUpdate={onUpdate} onRemove={onRemove} />
        ))}
      </div>
    </section>
  )
}
