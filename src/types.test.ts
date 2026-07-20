import { describe, expect, it } from 'vitest'
import { APP_VERSION, createEmptyProject, upgradeProject } from './types'

describe('project upgrades', () => {
  it('updates the previous unconfirmed default price', () => {
    const project = createEmptyProject()
    project.appVersion = '1.0.4'
    project.settings.pricePlnPerM3 = 0.12
    project.settings.priceConfirmed = false

    const upgraded = upgradeProject(project)

    expect(upgraded.appVersion).toBe(APP_VERSION)
    expect(upgraded.settings.pricePlnPerM3).toBe(0.08)
  })

  it('preserves a confirmed project price', () => {
    const project = createEmptyProject()
    project.appVersion = '1.0.4'
    project.settings.pricePlnPerM3 = 0.12
    project.settings.priceConfirmed = true

    expect(upgradeProject(project).settings.pricePlnPerM3).toBe(0.12)
  })
})
