/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App'

afterEach(cleanup)

describe('new report workflow', () => {
  it('offers export, discard and cancel choices', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: 'Rozpocznij nowy raport' }))

    expect(screen.getByRole('dialog', { name: 'Co zrobić z bieżącym raportem?' })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Eksportuj i rozpocznij' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Rozpocznij bez eksportu' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
