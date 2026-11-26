import { useEffect, useRef } from 'react'
import { MAP } from '../data/networkMap.js'
import '../network.css'

/*
  Carte du réseau : le Togo (siège, Lomé) en orange, et des flèches de connexion animées
  vers chaque agence. Pleine largeur, sur le fond de la page.

  Performance (la carte ne doit jamais ramer) :
  - Les pays sont une image SVG statique (public/img/world-map.svg), chargée à l'approche.
  - Le SVG du dessus (Togo, arcs, flèches, villes) ne s'anime qu'une fois, à l'arrivée
    (tracé des arcs), puis il ne bouge plus : il n'est plus jamais redessiné.
  - Les effets en boucle (lueurs qui voyagent sur les arcs, pulsation de Lomé) sont de petits
    éléments HTML animés par la carte graphique (transform / opacity uniquement),
    et sont mis en pause dès que la carte n'est plus à l'écran.
  Pour changer les villes : scripts/build-map.mjs, puis `node scripts/build-map.mjs`.
*/

const [, vbTop, vbW, vbH] = MAP.viewBox.split(' ').map(Number)
const [hx, hy] = MAP.hub.pos

// arc courbe (Bézier quadratique) du siège vers une ville, bombé vers le haut
const arcs = MAP.cities.map((c, i) => {
  const [x, y] = c.pos
  const dx = x - hx
  const dy = y - hy
  const d = Math.hypot(dx, dy)
  let nx = -dy / d
  let ny = dx / d
  if (ny > 0) { nx = -nx; ny = -ny } // toujours bombé vers le haut
  const lift = Math.min(d * 0.3, 140)
  const cx = (hx + x) / 2 + nx * lift
  const cy = (hy + y) / 2 + ny * lift
  const angle = (Math.atan2(y - cy, x - cx) * 180) / Math.PI // direction d'arrivée (pour la flèche)
  const left = x < hx - 20
  const d0 = `M${hx},${hy} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x},${y}`
  // trajet de la lueur : points de la courbe → @keyframes en transform (animé par la carte graphique)
  const N = 18
  const frames = Array.from({ length: N + 1 }, (_, k) => {
    const t = k / N
    const u = 1 - t
    const px = u * u * hx + 2 * u * t * cx + t * t * x
    const py = u * u * hy + 2 * u * t * cy + t * t * y - vbTop
    const op = t < 0.08 ? t / 0.08 : t > 0.88 ? (1 - t) / 0.12 : 1
    return `${(t * 100).toFixed(1)}%{transform:translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0);opacity:${op.toFixed(2)}}`
  }).join('')
  return { ...c, i, x, y, d: d0, angle, left, keyframes: `@keyframes nmTravel${i}{${frames}}` }
})
const travelCss = arcs.map((a) => a.keyframes).join('')

export default function NetworkMap() {
  const ref = useRef(null)
  const fx = useRef(null)

  useEffect(() => {
    const el = ref.current
    // calque des effets : dessiné à 1000 px de large puis mis à l'échelle (transform, pas de mise en page)
    const fit = () => fx.current.style.setProperty('--k', (el.clientWidth / vbW).toFixed(5))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    if (!('IntersectionObserver' in window)) { el.classList.add('is-live', 'is-onscreen'); return () => ro.disconnect() }
    // 1) première arrivée à l'écran : tracé des arcs ; 2) effets en boucle actifs seulement à l'écran
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.classList.add('is-live')
      el.classList.toggle('is-onscreen', e.isIntersecting)
    }, { threshold: 0.15 })
    io.observe(el)
    return () => { io.disconnect(); ro.disconnect() }
  }, [])

  return (
    <div className="nm" ref={ref}>
      <div className="nm-stage" style={{ aspectRatio: `${vbW} / ${vbH}` }}>
        <img className="nm-world" src="/img/world-map.svg" alt="" width={vbW} height={vbH}
          loading="lazy" decoding="async" />
        <svg className="nm-svg" viewBox={MAP.viewBox} role="img"
          aria-label={`Réseau NTCL : siège à Lomé (Togo), connexions vers ${MAP.cities.map((c) => c.city).join(', ')}`}>
          <path className="nm-togo" d={MAP.togo} />
          {arcs.map((a) => (
            <g key={a.city} className="nm-link" style={{ '--i': a.i }}>
              <path className="nm-arc-base" d={a.d} />
              <path className="nm-arc" d={a.d} pathLength="1" />
              <g className="nm-end" transform={`translate(${a.x} ${a.y})`}>
                <circle className="nm-dot" r="3.2" />
                <path className="nm-arrow" d="M0,0 L-9,-4.2 L-7,0 L-9,4.2 Z" transform={`rotate(${a.angle.toFixed(1)}) translate(-5 0)`} />
                <text className="nm-label" x={a.left ? -9 : 9} y="-7" textAnchor={a.left ? 'end' : 'start'}>
                  <tspan className="nm-city">{a.city}</tspan>
                  <tspan className="nm-country" x={a.left ? -9 : 9} dy="12">{a.country}</tspan>
                </text>
              </g>
            </g>
          ))}
          <g transform={`translate(${hx} ${hy})`}>
            <circle className="nm-hub-dot" r="4.4" />
            <text className="nm-label nm-hub-label" x="-11" y="16" textAnchor="end">
              <tspan className="nm-city">Lomé</tspan>
              <tspan className="nm-country" x="-11" dy="12">Togo · Siège</tspan>
            </text>
          </g>
        </svg>

        {/* effets en boucle, animés par la carte graphique */}
        <div className="nm-fx" ref={fx} aria-hidden="true" style={{ height: vbH }}>
          <style>{travelCss}</style>
          {arcs.map((a) => (
            <span key={a.city} className="nm-pulse" style={{ animationName: `nmTravel${a.i}`, '--i': a.i }} />
          ))}
          <span className="nm-ring" style={{ left: hx, top: hy - vbTop }} />
          <span className="nm-ring nm-ring-2" style={{ left: hx, top: hy - vbTop }} />
        </div>
      </div>

      {/* mobile : les villes en liste (les étiquettes de la carte seraient trop petites) */}
      <ul className="nm-legend">
        <li className="nm-legend-hub"><b>Lomé</b> Togo · Siège</li>
        {MAP.cities.map((c) => <li key={c.city}><b>{c.city}</b> {c.country}</li>)}
      </ul>
    </div>
  )
}
