// Pré-génère le HTML de la page dans dist/index.html après le build.
// → le titre, la photo et le texte s'affichent avant même que le JavaScript soit chargé (meilleur FCP / LCP).
import { readFileSync, writeFileSync, rmSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ssrEntry = resolve(root, 'dist-ssr/entry-server.js')
const htmlFile = resolve(root, 'dist/index.html')

const { render } = await import(pathToFileURL(ssrEntry).href)
const html = readFileSync(htmlFile, 'utf8')
if (!html.includes('<div id="root"></div>')) throw new Error('Point de montage #root introuvable dans dist/index.html')

writeFileSync(htmlFile, html.replace('<div id="root"></div>', `<div id="root">${render()}</div>`))
rmSync(resolve(root, 'dist-ssr'), { recursive: true, force: true })
console.log('✓ HTML pré-généré dans dist/index.html')
