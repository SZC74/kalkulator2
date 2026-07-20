import { useEffect, useRef, useState } from 'react'
import './App.css'
import type { AppStep, LeakItem, ProjectData, ProjectSettings } from './types'
import { createEmptyProject, upgradeProject } from './types'
import { extractFile } from './extraction/client'
import { deleteProject, loadMostRecentProject, saveProject } from './persistence/database'
import { createProjectArchive, downloadBlob, importProjectArchive } from './persistence/archive'
import { ReviewPanel } from './components/ReviewPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { ReportView } from './components/ReportView'

const steps: Array<{ id: AppStep; number: string; label: string }> = [
  { id: 'import', number: '01', label: 'Import zdjęć' },
  { id: 'review', number: '02', label: 'Weryfikacja' },
  { id: 'settings', number: '03', label: 'Ustawienia' },
  { id: 'report', number: '04', label: 'Raport' },
]

function App() {
  const [project, setProject] = useState<ProjectData>(() => createEmptyProject())
  const [step, setStep] = useState<AppStep>('import')
  const [ready, setReady] = useState(false)
  const [processing, setProcessing] = useState({ active: false, done: 0, total: 0 })
  const [errors, setErrors] = useState<string[]>([])
  const [savedState, setSavedState] = useState<'saved' | 'saving' | 'error'>('saved')
  const [newReportDialogOpen, setNewReportDialogOpen] = useState(false)
  const imageInput = useRef<HTMLInputElement>(null)
  const projectInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadMostRecentProject()
      .then((stored) => stored && setProject(upgradeProject(stored)))
      .catch(() => setSavedState('error'))
      .finally(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready) return
    setSavedState('saving')
    const timer = window.setTimeout(() => {
      const updated = { ...project, updatedAt: new Date().toISOString() }
      saveProject(updated)
        .then(() => setSavedState('saved'))
        .catch(() => setSavedState('error'))
    }, 700)
    return () => window.clearTimeout(timer)
  }, [project, ready])

  const updateProject = (change: Partial<ProjectData>) => {
    setProject((current) => ({ ...current, ...change, updatedAt: new Date().toISOString() }))
  }

  const addFiles = async (incoming: FileList | File[]) => {
    const files = Array.from(incoming).filter((file) => /\.jpe?g$/i.test(file.name))
    if (!files.length) {
      setErrors(['Wybierz pliki JPG utworzone przez kamerę Fluke ii500.'])
      return
    }
    const existing = new Set(project.items.map((item) => `${item.filename}:${item.imageBlob.size}`))
    const unique = files.filter((file) => !existing.has(`${file.name}:${file.size}`))
    if (!unique.length) {
      setErrors(['Wszystkie wybrane zdjęcia są już w projekcie.'])
      return
    }
    setErrors([])
    setProcessing({ active: true, done: 0, total: unique.length })
    const additions: LeakItem[] = []
    const extractionErrors: string[] = []
    for (const file of unique) {
      try {
        const result = await extractFile(file)
        additions.push({
          id: crypto.randomUUID(),
          filename: file.name,
          imageBlob: file,
          folder: result.folder,
          capturedAt: result.capturedAt,
          extractedLeakQ: result.leakQ,
          extractedSourceDb: result.sourceDb,
          extractedDistanceM: result.distanceM,
          leakQ: result.leakQ,
          sourceDb: result.sourceDb,
          distanceM: result.distanceM,
          confidence: result.confidence,
          extractionWarnings: result.warnings,
          included: true,
          location: result.folder.toLocaleLowerCase('pl') === 'default' ? '' : result.folder,
          description: '',
          notes: '',
        })
      } catch (error) {
        extractionErrors.push(`${file.name}: ${error instanceof Error ? error.message : String(error)}`)
      }
      setProcessing((current) => ({ ...current, done: current.done + 1 }))
    }
    setProject((current) => ({
      ...current,
      items: [...current.items, ...additions].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)),
      updatedAt: new Date().toISOString(),
    }))
    setErrors(extractionErrors)
    setProcessing({ active: false, done: unique.length, total: unique.length })
    if (additions.length) setStep('review')
  }

  const updateItem = (id: string, change: Partial<LeakItem>) => {
    updateProject({ items: project.items.map((item) => (item.id === id ? { ...item, ...change } : item)) })
  }

  const removeItem = (id: string) => updateProject({ items: project.items.filter((item) => item.id !== id) })

  const startNewReport = async () => {
    try {
      await deleteProject(project.id)
    } catch {
      setSavedState('error')
    }
    setProject(createEmptyProject())
    setErrors([])
    setStep('import')
    setNewReportDialogOpen(false)
  }

  const clearProject = async () => {
    if (!window.confirm('Usunąć bieżący projekt i jego zdjęcia z tej przeglądarki?')) return
    await deleteProject(project.id)
    setProject(createEmptyProject())
    setErrors([])
    setStep('import')
  }

  const exportProject = async () => {
    const blob = await createProjectArchive(project)
    const filename = `${project.name.replace(/[^\p{L}\p{N}._-]+/gu, '_') || 'projekt-ii500'}.ii500.zip`
    downloadBlob(blob, filename)
  }

  const exportAndStartNewReport = async () => {
    try {
      await exportProject()
      await startNewReport()
    } catch (error) {
      setErrors([`Nie udało się wyeksportować projektu: ${error instanceof Error ? error.message : String(error)}`])
      setNewReportDialogOpen(false)
    }
  }

  const importProject = async (file: File) => {
    try {
      const imported = await importProjectArchive(file)
      setProject(upgradeProject({ ...imported, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }))
      setErrors([])
      setStep(imported.items.length ? 'review' : 'import')
    } catch (error) {
      setErrors([error instanceof Error ? error.message : String(error)])
    }
  }

  if (!ready) return <div className="loading-screen"><div className="brand-mark">ii</div><p>Otwieranie projektu…</p></div>

  return (
    <div className="app-shell">
      <header className="app-header no-print">
        <button className="brand" type="button" onClick={() => setStep('import')}>
          <span className="brand-mark">ii</span>
          <span><strong>ii500 Report</strong><small>lokalny audyt nieszczelności</small></span>
        </button>
        <div className="header-project">
          <label>
            <span>Nazwa projektu</span>
            <input value={project.name} onChange={(event) => updateProject({ name: event.target.value })} />
          </label>
        </div>
        <div className="header-actions">
          <span className="save-status">{savedState === 'saving' ? 'Zapisywanie…' : savedState === 'error' ? 'Błąd zapisu' : 'Zapisano lokalnie'}</span>
          <button className="secondary-button" type="button" onClick={exportProject} disabled={!project.items.length}>Eksportuj projekt</button>
          <button className="icon-button" type="button" onClick={() => projectInput.current?.click()} title="Importuj projekt">↥</button>
          <input ref={projectInput} hidden type="file" accept=".zip,.ii500" onChange={(event) => event.target.files?.[0] && importProject(event.target.files[0])} />
        </div>
      </header>

      <div className="app-body">
        <aside className="step-nav no-print">
          <div className="step-list">
            {steps.map((entry) => (
              <button key={entry.id} className={step === entry.id ? 'active' : ''} type="button" onClick={() => setStep(entry.id)} disabled={entry.id !== 'import' && !project.items.length}>
                <span>{entry.number}</span><strong>{entry.label}</strong>
                {entry.id === 'review' && project.items.length > 0 && <b>{project.items.length}</b>}
              </button>
            ))}
          </div>
          <div className="side-actions">
            <button className="text-button" type="button" onClick={() => setNewReportDialogOpen(true)}>Rozpocznij nowy raport</button>
            <button className="text-button danger" type="button" onClick={clearProject}>Usuń dane lokalne</button>
          </div>
        </aside>

        <section className="main-workspace">
          {errors.length > 0 && <div className="error-banner no-print"><strong>Nie wszystkie pliki zostały przetworzone</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}

          {step === 'import' && (
            <section className="workspace-panel import-panel">
              <div className="section-title">
                <div><span className="eyebrow">Krok 1</span><h1>Dodaj zdjęcia z kamery</h1><p>Wybierz pliki JPG skopiowane z pamięci kamery. Nie zmieniaj ich nazw.</p></div>
                {project.items.length > 0 && <div className="count-chip">{project.items.length} w projekcie</div>}
              </div>
              <div
                className={`drop-zone ${processing.active ? 'processing' : ''}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => { event.preventDefault(); addFiles(event.dataTransfer.files) }}
              >
                <div className="drop-illustration"><span>JPG</span><i /></div>
                <h2>{processing.active ? 'Odczytywanie ekranów…' : 'Przeciągnij zdjęcia tutaj'}</h2>
                <p>lub wybierz kilka plików z dysku</p>
                {processing.active ? (
                  <div className="progress-block"><div className="progress-track"><span style={{ width: `${(processing.done / processing.total) * 100}%` }} /></div><strong>{processing.done} / {processing.total}</strong></div>
                ) : (
                  <button className="primary-button" type="button" onClick={() => imageInput.current?.click()}>Wybierz zdjęcia</button>
                )}
                <input ref={imageInput} hidden type="file" accept="image/jpeg,.jpg,.jpeg" multiple onChange={(event) => event.target.files && addFiles(event.target.files)} />
              </div>
              <div className="import-facts">
                <div><span>01</span><strong>Przetwarzanie lokalne</strong><p>Zdjęcia są analizowane wyłącznie w tej przeglądarce.</p></div>
                <div><span>02</span><strong>Oryginalne nazwy</strong><p>Nazwa pliku zawiera informacje potrzebne do odczytu daty i folderu.</p></div>
                <div><span>03</span><strong>Automatyczny odczyt</strong><p>Program odczytuje pomiary i dane zapisane przez kamerę.</p></div>
              </div>
              {project.items.length > 0 && <button className="next-button" type="button" onClick={() => setStep('review')}>Przejdź do weryfikacji <span>→</span></button>}
            </section>
          )}

          {step === 'review' && <ReviewPanel items={project.items} onUpdate={updateItem} onRemove={removeItem} />}
          {step === 'settings' && <SettingsPanel settings={project.settings} onChange={(settings: ProjectSettings) => updateProject({ settings })} />}
          {step === 'report' && <ReportView project={project} onGlobalNotes={(globalNotes) => updateProject({ globalNotes })} onItemNotes={(id, notes) => updateItem(id, { notes })} />}

          {step !== 'import' && step !== 'report' && (
            <div className="workspace-footer no-print">
              <button className="secondary-button" type="button" onClick={() => setStep(step === 'review' ? 'import' : 'review')}>Wstecz</button>
              <button className="primary-button" type="button" onClick={() => setStep(step === 'review' ? 'settings' : 'report')}>{step === 'review' ? 'Ustawienia raportu' : 'Pokaż raport'} <span>→</span></button>
            </div>
          )}
        </section>
      </div>
      {newReportDialogOpen && (
        <div className="dialog-backdrop no-print">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="new-report-title">
            <span className="eyebrow">Nowy raport</span>
            <h2 id="new-report-title">Co zrobić z bieżącym raportem?</h2>
            <p>Rozpoczęcie nowego raportu wyczyści bieżący obszar roboczy i usunie jego lokalną kopię z tej przeglądarki.</p>
            <div className="dialog-actions">
              <button className="primary-button" type="button" onClick={exportAndStartNewReport} disabled={!project.items.length}>Eksportuj i rozpocznij</button>
              <button className="secondary-button danger-outline" type="button" onClick={startNewReport}>Rozpocznij bez eksportu</button>
              <button className="text-button dialog-cancel" type="button" onClick={() => setNewReportDialogOpen(false)}>Anuluj</button>
            </div>
            {!project.items.length && <small>Ten raport nie zawiera zdjęć, dlatego eksport jest niedostępny.</small>}
          </section>
        </div>
      )}
    </div>
  )
}

export default App
