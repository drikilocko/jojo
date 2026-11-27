// Vérifie qu'une ou plusieurs traductions ont exactement la même structure que fr.js
// (mêmes clés, mêmes longueurs de listes, aucun texte vide).
//   node scripts/check-i18n.mjs            → toutes les langues présentes
//   node scripts/check-i18n.mjs en ar      → seulement celles-ci
import { readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/i18n')
const load = async (code) => (await import(pathToFileURL(resolve(dir, `${code}.js`)).href)).default
const fr = await load('fr')
const codes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(dir).filter((f) => /^[a-z]{2}\.js$/.test(f) && f !== 'fr.js').map((f) => f.slice(0, 2))

const problems = []
const walk = (ref, val, path, code) => {
  if (Array.isArray(ref)) {
    if (!Array.isArray(val)) return problems.push(`${code}: ${path} doit être une liste`)
    if (val.length !== ref.length) problems.push(`${code}: ${path} a ${val.length} éléments au lieu de ${ref.length}`)
    ref.forEach((r, i) => walk(r, val[i], `${path}[${i}]`, code))
  } else if (ref && typeof ref === 'object') {
    if (!val || typeof val !== 'object') return problems.push(`${code}: ${path} manquant`)
    for (const k of Object.keys(ref)) walk(ref[k], val[k], path ? `${path}.${k}` : k, code)
    for (const k of Object.keys(val)) if (!(k in ref)) problems.push(`${code}: clé en trop ${path ? path + '.' : ''}${k}`)
  } else if (typeof val !== 'string' || !val.trim()) {
    problems.push(`${code}: ${path} vide ou manquant`)
  }
}
for (const code of codes) walk(fr, await load(code), '', code)
if (problems.length) { console.error(problems.join('\n')); process.exit(1) }
console.log(`✓ ${codes.join(', ')} : structure identique à fr.js`)
