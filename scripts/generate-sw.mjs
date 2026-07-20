import { mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const temporaryDirectory = resolve('.workbox-tmp')
mkdirSync(temporaryDirectory, { recursive: true })
process.env.TMPDIR = temporaryDirectory
const { generateSW } = await import('workbox-build')

const result = await generateSW({
  mode: 'development',
  globDirectory: 'dist',
  globPatterns: ['**/*.{js,css,html,svg}'],
  swDest: 'dist/sw.js',
  navigateFallback: 'index.html',
  cleanupOutdatedCaches: true,
  clientsClaim: true,
  skipWaiting: true,
})

for (const warning of result.warnings) console.warn(warning)
console.log(`Offline cache: ${result.count} files, ${result.size} bytes`)
rmSync(temporaryDirectory, { recursive: true, force: true })
