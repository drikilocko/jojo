// Génère la carte du réseau (à relancer seulement si l'on change de villes ou de style) :
//   node scripts/build-map.mjs
// → public/img/world-map.svg   : les pays (image statique, chargée à l'approche de la section)
// → src/data/networkMap.js     : Togo + coordonnées projetées des villes (petit, dans le code)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// pays en précision 110m (fichier léger) ; le Togo seul en 50m pour un contour net
const load = (res) => {
  const w = JSON.parse(readFileSync(resolve(root, `node_modules/world-atlas/countries-${res}.json`), 'utf8'))
  return feature(w, w.objects.countries).features.filter((f) => f.properties.name !== 'Antarctica') // pas d'Antarctique
}
const countries = load('110m')
const togoHd = load('50m').find((f) => f.properties.name === 'Togo')

const W = 1000
const projection = geoNaturalEarth1().fitWidth(W, { type: 'FeatureCollection', features: countries })
const path = geoPath(projection).digits(1)
const [[, y0], [, y1]] = path.bounds({ type: 'FeatureCollection', features: countries })
const top = Math.floor(y0) - 6
const H = Math.ceil(y1 - y0) + 12

const others = countries.filter((f) => f.properties.name !== 'Togo')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${top} ${W} ${H}">` +
  `<path fill="#e8edf2" stroke="#ffffff" stroke-width="0.6" stroke-linejoin="round" d="${others.map((f) => path(f)).join('')}"/></svg>`
writeFileSync(resolve(root, 'public/img/world-map.svg'), svg)

const pt = (lon, lat) => projection([lon, lat]).map((v) => Math.round(v * 10) / 10)
const hub = { city: 'Lomé', country: 'Togo', pos: pt(1.2255, 6.1375) }
const cities = [
  { city: 'Kinshasa', country: 'RD Congo', pos: pt(15.27, -4.44) },
  { city: 'Douala', country: 'Cameroun', pos: pt(9.70, 4.05) },
  { city: 'Anvers', country: 'Belgique', pos: pt(4.40, 51.22) },
  { city: 'Dubaï', country: 'Émirats arabes unis', pos: pt(55.27, 25.20) },
  { city: 'Shanghai', country: 'Chine', pos: pt(121.47, 31.23) },
  { city: 'Houston', country: 'États-Unis', pos: pt(-95.37, 29.76) },
]
mkdirSync(resolve(root, 'src/data'), { recursive: true })
writeFileSync(resolve(root, 'src/data/networkMap.js'),
  `// Généré par scripts/build-map.mjs — ne pas modifier à la main.\n` +
  `export const MAP = ${JSON.stringify({ viewBox: `0 ${top} ${W} ${H}`, togo: path(togoHd), hub, cities })}\n`)
console.log('✓ carte générée', { viewBox: `0 ${top} ${W} ${H}`, hub: hub.pos })
