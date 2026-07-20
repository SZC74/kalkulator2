import { useEffect, useState } from 'react'
import type { ProjectSettings } from '../types'

interface Props {
  settings: ProjectSettings
  onChange: (settings: ProjectSettings) => void
}

interface DecimalInputProps {
  ariaLabel: string
  value: number
  onCommit: (value: number) => void
  inputMode?: 'decimal' | 'numeric'
  minimum?: number
}

function displayNumber(value: number) {
  return String(value).replace('.', ',')
}

function DecimalInput({ ariaLabel, value, onCommit, inputMode = 'decimal', minimum }: DecimalInputProps) {
  const [draft, setDraft] = useState(() => displayNumber(value))

  useEffect(() => setDraft(displayNumber(value)), [value])

  const commit = () => {
    const parsed = Number(draft.trim().replace(',', '.'))
    if (!Number.isFinite(parsed) || (minimum !== undefined && parsed < minimum)) {
      setDraft(displayNumber(value))
      return
    }
    onCommit(parsed)
    setDraft(displayNumber(parsed))
  }

  return (
    <input
      aria-label={ariaLabel}
      type="text"
      inputMode={inputMode}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur()
        if (event.key === 'Escape') {
          setDraft(displayNumber(value))
          event.currentTarget.blur()
        }
      }}
    />
  )
}

export function SettingsPanel({ settings, onChange }: Props) {
  const patch = (change: Partial<ProjectSettings>) => onChange({ ...settings, ...change })

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
            <DecimalInput
              ariaLabel="Cena sprężonego powietrza"
              value={settings.pricePlnPerM3}
              minimum={0}
              onCommit={(pricePlnPerM3) => patch({ pricePlnPerM3 })}
            />
            <span>PLN/m³</span>
          </div>
        </label>
        <label className="field">
          <span>Czas pracy</span>
          <div className="input-suffix">
            <DecimalInput
              ariaLabel="Czas pracy"
              inputMode="numeric"
              value={settings.operatingHoursPerYear}
              minimum={0}
              onCommit={(operatingHoursPerYear) => patch({ operatingHoursPerYear })}
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
        <div className="formula-reference">
          <strong>Postać ogólna równań kalibracyjnych</strong>
          <code>LeakQ = a × ln(Qv) + b</code>
          <code>dB = a × ln(Qv) + b</code>
          <p>Program wyznacza przepływ ze wzoru: Qv = exp((wartość - b) / a), gdzie Qv jest podane w L/min.</p>
        </div>
        <div className="formula-grid">
          <label className="field">
            <span>LeakQ: współczynnik a</span>
            <DecimalInput
              ariaLabel="LeakQ: współczynnik a"
              value={settings.leakQFormula.a}
              onCommit={(a) => patch({ leakQFormula: { ...settings.leakQFormula, a } })}
            />
          </label>
          <label className="field">
            <span>LeakQ: współczynnik b</span>
            <DecimalInput
              ariaLabel="LeakQ: współczynnik b"
              value={settings.leakQFormula.b}
              onCommit={(b) => patch({ leakQFormula: { ...settings.leakQFormula, b } })}
            />
          </label>
          <label className="field">
            <span>dB: współczynnik a</span>
            <DecimalInput
              ariaLabel="dB: współczynnik a"
              value={settings.dbFormula.a}
              onCommit={(a) => patch({ dbFormula: { ...settings.dbFormula, a } })}
            />
          </label>
          <label className="field">
            <span>dB: współczynnik b</span>
            <DecimalInput
              ariaLabel="dB: współczynnik b"
              value={settings.dbFormula.b}
              onCommit={(b) => patch({ dbFormula: { ...settings.dbFormula, b } })}
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
