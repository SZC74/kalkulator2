/** @vitest-environment jsdom */

import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '../types'
import { SettingsPanel } from './SettingsPanel'

afterEach(cleanup)

describe('SettingsPanel', () => {
  it('allows a price to be entered with a decimal comma and commits it on blur', () => {
    const onChange = vi.fn()
    const view = render(<SettingsPanel settings={DEFAULT_SETTINGS} onChange={onChange} />)
    const input = view.getByLabelText('Cena sprężonego powietrza') as HTMLInputElement

    fireEvent.change(input, { target: { value: '' } })
    fireEvent.change(input, { target: { value: '0,35' } })

    expect(input.value).toBe('0,35')
    expect(onChange).not.toHaveBeenCalled()

    fireEvent.blur(input)

    expect(onChange).toHaveBeenCalledWith({ ...DEFAULT_SETTINGS, pricePlnPerM3: 0.35 })
  })

  it('restores the previous price when the entered value is invalid', () => {
    const onChange = vi.fn()
    const view = render(<SettingsPanel settings={DEFAULT_SETTINGS} onChange={onChange} />)
    const input = view.getByLabelText('Cena sprężonego powietrza') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'abc' } })
    fireEvent.blur(input)

    expect(input.value).toBe('0,12')
    expect(onChange).not.toHaveBeenCalled()
  })
})
