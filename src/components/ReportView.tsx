import type { LeakItem, ProjectData } from '../types'
import { calculateItem, formatNumber } from '../domain/calculations'
import { useObjectUrl } from '../hooks/useObjectUrl'

interface Props {
  project: ProjectData
  onGlobalNotes: (notes: string) => void
  onItemNotes: (id: string, notes: string) => void
}

function EstimateCard({ label, flow, annualM3, annualCost }: { label: string; flow: number; annualM3: number; annualCost: number }) {
  return (
    <article>
      <span className="estimate-label">{label}</span>
      <div className="estimate-cost">
        <small>Szacowany koszt roczny</small>
        <strong>{formatNumber(annualCost, 0)} PLN</strong>
        <b>na rok</b>
      </div>
      <div className="estimate-details">
        <div><span>Przepływ</span><strong>{formatNumber(flow, 1)} L/min</strong></div>
        <div><span>Roczna strata</span><strong>{formatNumber(annualM3, 0)} m³</strong></div>
      </div>
    </article>
  )
}

function ReportItem({ item, index, project, onNotes }: { item: LeakItem; index: number; project: ProjectData; onNotes: (notes: string) => void }) {
  const imageUrl = useObjectUrl(item.imageBlob)
  const calculation = calculateItem(item, project.settings)
  return (
    <section className="report-item print-page">
      <div className="report-item-heading">
        <span className="report-id">P{String(index + 1).padStart(3, '0')}</span>
        <div>
          <h2>{item.location || 'Brak lokalizacji'}</h2>
          <p>{item.description || 'Brak opisu'}</p>
        </div>
      </div>
      <img className="report-photo" src={imageUrl} alt={item.filename} />
      <div className="report-metrics">
        <div><span>Data i czas</span><strong>{new Date(item.capturedAt).toLocaleString('pl-PL')}</strong></div>
        <div><span>LeakQ</span><strong>{formatNumber(item.leakQ, 1)}</strong></div>
        <div><span>Źródło z kamery</span><strong>{formatNumber(item.sourceDb, 1)} dB</strong></div>
        <div><span>Odległość z kamery</span><strong>{formatNumber(item.distanceM, 2)} m</strong></div>
        <div><span>dB użyte w obliczeniu</span><strong>{formatNumber(item.sourceDb, 1)} dB</strong></div>
        <div><span>Plik</span><strong>{item.filename}</strong></div>
      </div>
      <div className="report-estimates">
        <EstimateCard label="Estymacja na podstawie LeakQ" flow={calculation.qLeakQLMin} annualM3={calculation.annualM3LeakQ} annualCost={calculation.annualCostLeakQ} />
        <EstimateCard label="Estymacja na podstawie dB" flow={calculation.qDbLMin} annualM3={calculation.annualM3Db} annualCost={calculation.annualCostDb} />
      </div>
      <label className="report-notes">
        <span>Uwagi do wydruku</span>
        <textarea value={item.notes} onChange={(event) => onNotes(event.target.value)} placeholder="Wpisz uwagi do tej pozycji" rows={3} />
      </label>
      {calculation.warnings.length > 0 && (
        <div className="report-warnings">
          <strong>Uwagi systemowe</strong>
          <ul>{calculation.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </div>
      )}
    </section>
  )
}

export function ReportView({ project, onGlobalNotes, onItemNotes }: Props) {
  const items = project.items.filter((item) => item.included)
  const calculations = items.map((item) => calculateItem(item, project.settings))
  const totals = calculations.reduce(
    (sum, item) => ({
      qLeakQ: sum.qLeakQ + item.qLeakQLMin,
      qDb: sum.qDb + item.qDbLMin,
      costLeakQ: sum.costLeakQ + item.annualCostLeakQ,
      costDb: sum.costDb + item.annualCostDb,
    }),
    { qLeakQ: 0, qDb: 0, costLeakQ: 0, costDb: 0 },
  )
  const globalWarnings = [
    !project.settings.calibrationConfirmed && 'Współczynniki kalibracji nie zostały potwierdzone z arkuszem źródłowym.',
    !project.settings.priceConfirmed && `Cena ${formatNumber(project.settings.pricePlnPerM3, 3)} PLN/m³ nie została potwierdzona.`,
    'Każde zdjęcie jest liczone jako osobna nieszczelność. Powtórne zdjęcia tego samego wycieku zwiększą sumy.',
  ].filter(Boolean) as string[]

  return (
    <div className="report-shell">
      <div className="report-toolbar no-print">
        <div className="report-toolbar-copy">
          <span className="eyebrow">Krok 4</span>
          <h2>Podgląd raportu</h2>
          <p>Uwagi wpisane w podglądzie pozostają zapisane w projekcie.</p>
          <div className="print-guidance">
            <strong>Przed zapisaniem raportu do PDF</strong>
            <p>W oknie drukowania wybierz „Więcej ustawień” → „Opcje” i wyłącz „Nagłówki i stopki”. Dzięki temu adres strony, data i numeracja przeglądarki nie pojawią się na wydruku.</p>
          </div>
        </div>
        <button className="primary-button" type="button" onClick={() => window.print()}>Drukuj / zapisz PDF</button>
      </div>
      <main className="report-document">
        <section className="report-cover">
          <div className="report-accent" />
          <span className="report-kicker">FLUKE ii500 · RAPORT LOKALNY</span>
          <h1>{project.settings.reportTitle}</h1>
          <div className="report-meta">
            <div><span>Organizacja</span><strong>{project.settings.company || 'Nie podano'}</strong></div>
            <div><span>Wykonał</span><strong>{project.settings.auditor || 'Nie podano'}</strong></div>
            <div><span>Wygenerowano</span><strong>{new Date().toLocaleString('pl-PL')}</strong></div>
          </div>
          <p className="report-intro">Utworzono {items.length} osobnych pozycji, po jednej dla każdego włączonego zdjęcia. Źródłowy poziom dB jest używany bez korekcji odległości.</p>
          <div className="report-total-grid">
            <article><span>Łącznie na podstawie LeakQ</span><strong>{formatNumber(totals.costLeakQ, 0)} PLN/rok</strong><p>{formatNumber(totals.qLeakQ, 1)} L/min</p></article>
            <article><span>Łącznie na podstawie dB</span><strong>{formatNumber(totals.costDb, 0)} PLN/rok</strong><p>{formatNumber(totals.qDb, 1)} L/min</p></article>
          </div>
          <div className="report-global-warnings"><strong>Ostrzeżenia globalne</strong><ul>{globalWarnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>
          <label className="report-notes global">
            <span>Uwagi ogólne</span>
            <textarea value={project.globalNotes} onChange={(event) => onGlobalNotes(event.target.value)} placeholder="Wpisz uwagi ogólne" rows={4} />
          </label>
        </section>
        <section className="report-summary print-page">
          <div className="report-section-heading">
            <span className="report-kicker">PODSUMOWANIE</span>
            <h2>Zestawienie pozycji i kosztów</h2>
            <p>Każdy wiersz odpowiada jednemu zdjęciu uwzględnionemu w raporcie.</p>
          </div>
          <table className="summary-table">
            <thead><tr><th>ID</th><th>Lokalizacja</th><th>LeakQ</th><th>dB</th><th>Koszt na podstawie LeakQ<br />(PLN/rok)</th><th>Koszt na podstawie dB<br />(PLN/rok)</th></tr></thead>
            <tbody>{items.map((item, index) => {
              const result = calculations[index]
              return <tr key={item.id}><td>P{String(index + 1).padStart(3, '0')}</td><td>{item.location || 'BRAK'}</td><td>{formatNumber(item.leakQ, 1)}</td><td>{formatNumber(item.sourceDb, 1)}</td><td>{formatNumber(result.annualCostLeakQ, 0)}</td><td>{formatNumber(result.annualCostDb, 0)}</td></tr>
            })}</tbody>
          </table>
        </section>
        {items.map((item, index) => <ReportItem key={item.id} item={item} index={index} project={project} onNotes={(notes) => onItemNotes(item.id, notes)} />)}
        <section className="report-method print-page">
          <h2>Założenia i metodyka</h2>
          <ul>
            <li>Cena: {formatNumber(project.settings.pricePlnPerM3, 3)} PLN/m³; czas pracy: {formatNumber(project.settings.operatingHoursPerYear, 0)} h/rok.</li>
            <li>LeakQ = {project.settings.leakQFormula.a}·ln(Qv) + ({project.settings.leakQFormula.b}).</li>
            <li>dB z kamery = {project.settings.dbFormula.a}·ln(Qv) + {project.settings.dbFormula.b}. Odczyt nie jest korygowany względem odległości.</li>
            <li>Każde zdjęcie jest niezależną pozycją i jest osobno doliczane do sum.</li>
            <li>Wartości są estymacją zależną od kalibracji i warunków akustycznych.</li>
          </ul>
          <p className="report-version">Wygenerowano w ii500 Report PWA v{project.appVersion}. Przetwarzanie wykonano lokalnie w przeglądarce.</p>
        </section>
      </main>
    </div>
  )
}
