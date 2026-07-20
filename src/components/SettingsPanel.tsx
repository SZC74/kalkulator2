import type { ProjectSettings } from '../types'

interface Props {
  settings: ProjectSettings
  onChange: (settings: ProjectSettings) => void
}

export function SettingsPanel({ settings, onChange }: Props) {
  const patch = (change: Partial<ProjectSettings>) => onChange({ ...settings, ...change })
  const number = (value: string, fallback: number) => {
    const parsed = Number(value.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return (
    <section className="workspace-panel settings-panel">
      <div className="section-title">
        <div>
          <span className="eyebrow">Krok 3</span>
          <h2>Ustawienia raportu</h2>
          <p>Te wartości trafiają do obliczeń i do końcowego dokumentu.</p>
        </div>
      </div>

      <div className="form-grid">
        <label className="field wide">
          <span>Tytuł raportu</span>
          <input value={settings.reportTitle} onChange={(event) => patch({ reportTitle: event.target.value })} />
        </label>
        <label className="field">
          <span>Firma / zakład</span>
          <input value={settings.company} onChange={(event) => patch({ company: event.target.value })} placeholder="Nazwa zakładu" />
        </label>
        <label className="field">
          <span>Wykonał</span>
          <input value={settings.auditor} onChange={(event) => patch({ auditor: event.target.value })} placeholder="Imię i nazwisko" />
        </label>
        <label className="field">
          <span>Cena sprężonego powietrza</span>
          <div className="input-suffix">
            <input
              inputMode="decimal"
              value={settings.pricePlnPerM3}
              onChange={(event) => patch({ pricePlnPerM3: number(event.target.value, settings.pricePlnPerM3) })}
            />
            <span>PLN/m³</span>
          </div>
        </label>
        <label className="field">
          <span>Czas pracy</span>
          <div className="input-suffix">
            <input
              inputMode="numeric"
              value={settings.operatingHoursPerYear}
              onChange={(event) => patch({ operatingHoursPerYear: number(event.target.value, settings.operatingHoursPerYear) })}
            />
            <span>h/rok</span>
          </div>
        </label>
      </div>

      <label className="check-row emphasis">
        <input
          type="checkbox"
          checked={settings.priceConfirmed}
          onChange={(event) => patch({ priceConfirmed: event.target.checked })}
        />
        <span>
          <strong>Cena została sprawdzona</strong>
          Potwierdzam, że jest to aktualny koszt dla tego zakładu.
        </span>
      </label>

      <details className="advanced-settings">
        <summary>Ustawienia zaawansowane i kalibracja</summary>
        <p className="muted">Zmieniaj te wartości tylko na podstawie zatwierdzonego arkusza kalibracji.</p>
        <div className="formula-grid">
          <label className="field">
            <span>LeakQ: współczynnik a</span>
            <input
              value={settings.leakQFormula.a}
              onChange={(event) => patch({ leakQFormula: { ...settings.leakQFormula, a: number(event.target.value, settings.leakQFormula.a) } })}
            />
          </label>
          <label className="field">
            <span>LeakQ: współczynnik b</span>
            <input
              value={settings.leakQFormula.b}
              onChange={(event) => patch({ leakQFormula: { ...settings.leakQFormula, b: number(event.target.value, settings.leakQFormula.b) } })}
            />
          </label>
          <label className="field">
            <span>dB: współczynnik a</span>
            <input
              value={settings.dbFormula.a}
              onChange={(event) => patch({ dbFormula: { ...settings.dbFormula, a: number(event.target.value, settings.dbFormula.a) } })}
            />
          </label>
          <label className="field">
            <span>dB: współczynnik b</span>
            <input
              value={settings.dbFormula.b}
              onChange={(event) => patch({ dbFormula: { ...settings.dbFormula, b: number(event.target.value, settings.dbFormula.b) } })}
            />
          </label>
        </div>
        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.calibrationConfirmed}
            onChange={(event) => patch({ calibrationConfirmed: event.target.checked })}
          />
          <span>
            <strong>Kalibracja została potwierdzona</strong>
            Współczynniki porównano z arkuszem źródłowym.
          </span>
        </label>
      </details>
    </section>
  )
}
