import { useEffect, useRef, useState } from 'react'
import { lenis, scrollToY, startScroll, stopScroll } from '../lib/smoothScroll.js'
import { LanguageSelect, useI18n } from '../i18n/I18n.jsx'

/*
  Section 1 — Héro → Survol → À propos (la page défile ensuite normalement)
  1. Départ : le héro (titre, bouton, texte) sur la photo — port sur grand écran, bateau sur mobile.
  (Les étapes 2 et 3 sont lancées par un coup de scroll et se jouent toutes seules ; depuis
   « À propos », un scroll vers le haut rejoue l'animation à l'envers jusqu'au héro.)
  2. L'avion géant entre par le bas, bien droit. Le header est repoussé, la photo zoome,
     et un halo de ciel s'épanouit sous l'avion jusqu'à recouvrir la photo.
  3. L'avion se pose au centre : le bloc « À propos » apparaît autour, le header revient.
  4. Ensuite, scroll normal (Lenis) : fondu crème → blanc, puis la suite du site.

  Fluidité : uniquement transform / opacity — aucun filtre ni masque animé, aucune lecture
  de mise en page pendant l'animation.
*/

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const ease = (t) => 0.5 - Math.cos(Math.PI * t) / 2                       // sinus : doux
const easeCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // départ et arrivée très lents
// vol de l'avion : démarre en douceur (vitesse nulle), atteint son pic au premier tiers puis plane
// longuement jusqu'à l'arrêt — dérivée 12t(1−t)² : aucune discontinuité de vitesse, dans un sens
// comme dans l'autre (au retour, il démarre encore plus doucement et ralentit en sortant)
const easeFlight = (t) => 1 - Math.pow(1 - t, 3) * (1 + 3 * t)
const seg = (p, start, len, fn = ease) => fn(clamp((p - start) / len))
const lerp = (a, b, t) => a + (b - a) * t

const PLANE_STRETCH = 1.15 // avion étiré en hauteur (plus élancé à l'œil)
const PLANE_RATIO = (1425 / 1414) * PLANE_STRETCH // hauteur affichée / largeur
const BG_SCALE = 1.14 // photo agrandie au repos
const BG_ZOOM = 0.22  // zoom ajouté quand l'avion apparaît
const MOBILE = 820
const P_INTRO = 0.45     // progression jouée automatiquement (jusqu'à l'apparition du texte)
const INTRO_MS = 3400        // durée de l'aller automatique (grand écran) — courte : la page ne paraît pas bloquée
const INTRO_MS_MOBILE = 2400 // le défilement tactile est plus court que sur grand écran
const BACK_RATIO = 0.8       // le retour est un peu plus rapide que l'aller

// Largeur finale de l'avion posé (même formule que --about-plane en CSS)
const finalPlaneWidth = (vw, vh) => (vw > MOBILE ? Math.min(vw * 0.34, vh * 0.56) : Math.min(vw * 0.8, vh * 0.4))
const restOffset = (vh, mobile) => (mobile ? vh * 0.12 : vh * 0.03) // avion posé : décalage sous le centre

// hébergés sur le site (aucune connexion externe dans le héro)
const avatars = ['/img/avatars/men-32.webp', '/img/avatars/women-44.webp', '/img/avatars/men-75.webp']

export default function Flight() {
  const { t } = useI18n()
  const root = useRef(null)
  const sea = useRef(null)
  const vignette = useRef(null)
  const bloom = useRef(null)
  const cream = useRef(null)
  const clouds = useRef(null)
  const plane = useRef(null)
  const shadow = useRef(null)
  const nav = useRef(null)
  const hero = useRef(null)
  const about = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const links = [
    [t.nav.services, 'services'], [t.nav.solutions, 'solutions'],
    [t.nav.about, 'apropos'], [t.nav.contact, 'contact'],
  ]

  useEffect(() => {
    const el = root.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let lastP = -1

    // ---------- mesures mises en cache (relues seulement au redimensionnement) ----------
    // → aucune lecture de mise en page pendant l'animation (pas de « layout thrashing »)
    const m = { vw: 0, vh: 0, mobile: false, top: 0, range: 1, w0: 1, seaH: 0 }
    const outEls = Array.from(hero.current.querySelectorAll('[data-out]'))
    const measure = () => {
      m.vw = window.innerWidth
      m.vh = window.innerHeight
      m.mobile = m.vw <= MOBILE
      m.top = el.offsetTop
      m.range = Math.max(1, el.offsetHeight - m.vh)
      m.w0 = plane.current.offsetWidth
      m.seaH = sea.current.offsetHeight
      // mobile : les chiffres encadrent le nez de l'avion posé
      const fw = finalPlaneWidth(m.vw, m.vh)
      const planeTop = m.vh / 2 + restOffset(m.vh, m.mobile) - (fw * PLANE_RATIO) / 2
      about.current.style.setProperty('--specs-top', `${Math.round(planeTop + 6)}px`)
      about.current.style.setProperty('--nose-gap', `${Math.round(fw * 0.2)}px`)
    }
    const scrollProgress = () => clamp((window.scrollY - m.top) / m.range)

    const render = (p) => {
      if (p === lastP) return
      lastP = p
      const { vw, vh, mobile, w0 } = m

      // ---- phases ----
      // Un seul geste continu : au même instant (p = 0) l'avion décolle du bas de l'écran, les textes
      // du héro glissent vers la gauche et le header s'efface. Les textes accompagnent le premier
      // tiers du vol (ils ont disparu quand l'avion atteint sa pleine vitesse), puis l'avion plane
      // jusqu'à sa place en rétrécissant, et « À propos » apparaît.
      // Au retour, la même courbe à l'envers : les textes reviennent pendant que l'avion sort.
      //   phase              aller (p)        rôle
      //   avion (a)          0    → 0,34      montée, pic de vitesse vers 0,11
      //   textes (o)         0    → 0,124     cascade de 4 éléments (pas de 0,008)
      //   header (push)      0    → 0,09
      //   rétrécit (b)       0,20 → 0,40      il se pose
      //   « À propos » (c)   0,33 → 0,45
      const a = seg(p, 0, 0.34, easeFlight)
      const b = seg(p, 0.20, 0.20)            // …et rétrécit pendant qu'il ralentit : il se pose
      const c = seg(p, 0.33, 0.12)            // « À propos » apparaît
      const g = seg(p, 0.04, 0.32, easeCubic) // le halo de ciel s'épanouit sous l'avion
      const photoOut = seg(p, 0.10, 0.28)     // la photo se fond dans le crème
      const creamIn = seg(p, 0.24, 0.16)      // dégradé crème final

      // ---- 1. photo ----
      const zoom = BG_SCALE + BG_ZOOM * a
      sea.current.style.opacity = (1 - photoOut).toFixed(3)
      if (!mobile) {
        sea.current.style.transform = `scale(${zoom.toFixed(4)})`
      } else {
        const pan = Math.max(0, m.seaH - vh)
        sea.current.style.transform =
          `translate3d(-50%, ${(-pan * (1 - a)).toFixed(1)}px, 0) scale(${zoom.toFixed(4)})`
      }


      // ---- 3. avion : bien droit, entre par le bas → centre → se pose ----
      const h0 = w0 * PLANE_RATIO
      const scale = lerp(1, finalPlaneWidth(vw, vh) / w0, b)
      const h = h0 * scale
      const restY = restOffset(vh, mobile)
      // une seule trajectoire vers la position finale : pas de retour en arrière pendant l'atterrissage
      const y = lerp(vh / 2 + h0 / 2 + 20, restY, a)
      plane.current.style.transform =
        `translate3d(-50%, calc(-50% + ${y.toFixed(1)}px), 0) scale(${scale.toFixed(4)}, ${(scale * PLANE_STRETCH).toFixed(4)})`
      const planeVis = p > 0 ? 'visible' : 'hidden'
      plane.current.style.visibility = planeVis
      shadow.current.style.visibility = planeVis

      // ombre : décalée en vol, se resserre sous l'avion posé
      const offX = lerp(vw * 0.05, w0 * scale * 0.035, b)
      const offY = lerp(vh * 0.14, h * 0.035, b)
      shadow.current.style.transform =
        `translate3d(calc(-50% + ${offX.toFixed(1)}px), calc(-50% + ${(y + offY).toFixed(1)}px), 0) scale(${(scale * lerp(0.8, 1, b)).toFixed(4)}, ${(scale * lerp(0.8, 1, b) * PLANE_STRETCH).toFixed(4)})`
      shadow.current.style.opacity = lerp(0.65, 0.3, b).toFixed(3)

      // ---- 4. halo de ciel : naît sous l'avion, suit son centre, puis recouvre tout ----
      // (disque de 50vmax agrandi ×6 : calque GPU 36× plus léger qu'un disque de 300vmax — un dégradé flou n'y perd rien)
      const bloomY = Math.max(y, 0) * (1 - b) + h0 * 0.12 * (1 - a)
      bloom.current.style.transform =
        `translate3d(-50%, calc(-50% + ${bloomY.toFixed(1)}px), 0) scale(${(6 * (0.02 + 0.98 * g)).toFixed(4)})`
      // jamais exactement 0 (0,001 = invisible) : ces calques restent prêts sur le GPU, sinon leur
      // première peinture en plein vol coûte une frame et fait saccader l'avion
      cream.current.style.opacity = Math.max(0.001, creamIn).toFixed(3)
      clouds.current.style.opacity = Math.max(0.001, creamIn * 0.6).toFixed(3) // nuages discrets
      vignette.current.style.opacity = (1 - seg(p, 0.03, 0.25)).toFixed(3)

      // ---- héro : chaque élément sort vers la gauche, en cascade, quand l'avion démarre ----
      let heroGone = true
      outEls.forEach((node, i) => {
        // aller : badge → titre → boutons → texte sortent ; retour : ils reviennent dans le même ordre
        const order = dir > 0 ? i : outEls.length - 1 - i
        // même fenêtre dans les deux sens : à l'aller ils partent avec l'avion, au retour ils
        // reviennent pendant qu'il sort (et sont en place juste après sa sortie de l'écran)
        const o = seg(p, order * 0.008, 0.10)
        if (o < 1) heroGone = false
        node.style.transform = `translate3d(${(-o * Math.min(vw * 0.5, 640)).toFixed(1)}px, 0, 0)`
        node.style.opacity = (1 - o).toFixed(3)
      })
      // textes sortis : aussitôt non cliquables (sans coût de rendu) ; masqués seulement une fois
      // « À propos » atteint — basculer la visibilité en plein vol coûte une frame (saccade de l'avion)
      hero.current.style.pointerEvents = heroGone ? 'none' : ''
      hero.current.style.visibility = heroGone && p >= P_INTRO ? 'hidden' : ''

      // ---- 5. header : repoussé quand l'avion apparaît, revient (sombre) sur le crème ----
      const push = seg(p, 0, 0.09) * (1 - c)
      nav.current.style.transform = `translate3d(0, ${(-140 * push).toFixed(1)}%, 0)`
      nav.current.style.opacity = (1 - push).toFixed(3)
      nav.current.style.pointerEvents = push > 0.5 ? 'none' : ''
      el.classList.toggle('is-cream', b > 0.6)

      // ---- 6. « À propos » ----
      about.current.style.setProperty('--in', c.toFixed(3))

      about.current.style.pointerEvents = c > 0.5 ? '' : 'none'
    }

    // ---------- Trois états ----------
    //  'hero'    : page bloquée sur le héro, on attend un coup de scroll vers le bas
    //  'playing' : l'animation se joue toute seule (aller ou retour), en répondant aux gestes
    //  'scroll'  : « À propos » affiché, la page défile normalement (Lenis)
    let mode = 'hero'
    let alive = true
    let animRaf = 0
    let animP = 0
    let goalP = 0
    let dir = 1          // sens de l'animation : 1 = aller, -1 = retour
    let speed = 1
    let speedGoal = 1    // la vitesse rejoint cette valeur en douceur (jamais de saut)
    let last = 0
    let started = 0
    let atTopSince = 0
    let touchY = null

    const lock = () => { stopScroll(); scrollToY(m.top) }
    const unlock = () => startScroll()

    // ---- scroll (suite) : rendu direct à chaque frame Lenis, sans lissage supplémentaire ----
    const pFromScroll = () => P_INTRO
    const onScroll = () => {
      if (mode !== 'scroll') {
        // barre de défilement tirée pendant le héro / l'animation : retour en haut
        // (et sur le héro, cela compte comme un coup de scroll vers le bas)
        if (Math.abs(window.scrollY - m.top) > 1) {
          scrollToY(m.top)
          if (mode === 'hero') down()
        }
        return
      }
      // on retient depuis quand la page est tout en haut (pour le retour vers le héro)
      if (window.scrollY - m.top > 1) atTopSince = 0
      else if (!atTopSince) atTopSince = performance.now()
    }
    // page tout en haut (« À propos » affiché) : un scroll vers le haut enchaîne directement sur le
    // retour de l'avion, sans pause ni effet « collant »
    const atTop = () => window.scrollY - m.top <= 1

    // ---- animation automatique, dans les deux sens ----
    // Lancée par un geste de scroll, elle se joue toute seule (aller ≈ 3,4 s, retour ≈ 2,7 s).
    // Elle répond à chaque geste pour que la page ne paraisse jamais « bloquée » :
    //  - scroll dans le même sens → elle accélère en douceur ;
    //  - scroll dans l'autre sens → elle fait demi-tour aussitôt.
    const arrive = () => {
      if (goalP >= P_INTRO) {
        mode = 'scroll'   // « À propos » : la page se débloque tout de suite
        atTopSince = performance.now()
        unlock()
      } else {
        mode = 'hero'     // retour terminé : un scroll vers le bas relance l'aller
      }
    }
    let vP = 0 // vitesse signée de la progression (par ms) : freine et repart en douceur au demi-tour
    const animTick = () => {
      if (!alive) return
      // horloge réelle (et non l'horodatage de la frame) : si une frame est servie en retard,
      // l'avion est quand même dessiné là où il doit être à l'instant de l'affichage — pas d'à-coup
      const now = performance.now()
      const dt = Math.min(now - last, 50)
      last = now
      speed += (speedGoal - speed) * (1 - Math.pow(0.92, dt / 16.7)) // accélération progressive
      const sign = goalP > animP ? 1 : -1
      const dur = (m.mobile ? INTRO_MS_MOBILE : INTRO_MS) * (sign > 0 ? 1 : BACK_RATIO)
      const wanted = sign * (P_INTRO / dur) * speed
      vP += (wanted - vP) * (1 - Math.pow(0.86, dt / 16.7)) // la vitesse rejoint la cible sans saut
      animP = clamp(animP + vP * dt, 0, P_INTRO)
      const reached = (sign > 0 && animP >= goalP) || (sign < 0 && animP <= goalP)
      if (reached && Math.sign(vP) === sign) { animP = goalP; vP = 0 }
      render(animP)
      if (animP === goalP && vP === 0) arrive()
      else animRaf = requestAnimationFrame(animTick)
    }
    const playTo = (to) => {
      const turning = mode === 'playing' // demi-tour en cours de route
      cancelAnimationFrame(animRaf)
      if (mode === 'scroll') animP = P_INTRO
      // la courbe ne change qu'au départ d'un état de repos : un demi-tour reste parfaitement continu
      if (!turning) { dir = to > animP ? 1 : -1; lastP = -1; speed = speedGoal = 1; vP = 0 }
      else speedGoal = 1.2 // (vP est conservé : l'avion freine puis repart dans l'autre sens)
      mode = 'playing'
      goalP = to
      lock()
      started = last = performance.now()
      animRaf = requestAnimationFrame(animTick)
    }

    // ---- gestes ----
    const forward = () => {
      if (mode === 'hero') playTo(P_INTRO)
      else if (mode === 'playing') {
        if (goalP === 0) playTo(P_INTRO)                                     // demi-tour
        else if (performance.now() - started > 250) speedGoal = Math.min(2.4, speedGoal + 0.35) // accélère
      }
    }
    const backward = () => {
      if (mode === 'scroll' && atTop()) playTo(0)
      else if (mode === 'playing') {
        if (goalP === P_INTRO) playTo(0)                                     // demi-tour
        else if (performance.now() - started > 250) speedGoal = Math.min(2.4, speedGoal + 0.35)
      }
    }
    const down = () => forward() // (barre de défilement tirée sur le héro)

    const onWheel = (e) => {
      const dy = Math.abs(e.deltaY) < 3 ? 0 : e.deltaY // ignore les micro-mouvements du pavé tactile
      if (mode === 'scroll' && dy < 0 && atTop()) backward() // en haut d'« À propos » : retour immédiat
      else if (mode !== 'scroll') { if (dy > 0) forward(); else if (dy < 0) backward() }
      if (mode !== 'scroll') e.preventDefault()
    }

    const DOWN_KEYS = ['ArrowDown', 'PageDown', ' ', 'Spacebar', 'End']
    const UP_KEYS = ['ArrowUp', 'PageUp', 'Home']
    const onKey = (e) => {
      if (DOWN_KEYS.includes(e.key) && mode !== 'scroll') { e.preventDefault(); forward() }
      else if (UP_KEYS.includes(e.key) && (mode !== 'scroll' || atTop())) { e.preventDefault(); backward() }
    }

    // tactile : doigt vers le haut = descendre, doigt vers le bas = remonter
    let touchLastY = 0
    const onTouchStart = (e) => { touchY = touchLastY = e.touches[0].clientY }
    const onTouchMove = (e) => {
      if (touchY === null) return
      const y = e.touches[0].clientY
      const step = y - touchLastY
      touchLastY = y
      if (mode === 'scroll' && step > 0 && atTop()) { touchY = y; backward() }
      if (mode !== 'scroll') {
        e.preventDefault()
        const total = y - touchY
        if (total < -14) { touchY = y; forward() }
        else if (total > 14) { touchY = y; backward() }
      }
    }
    // un lien du menu (#services…) cliqué pendant le héro : on sort du mode bloqué et on y va
    const onAnchor = (e) => {
      const link = e.target.closest('a[href^="#"]')
      if (!link || mode === 'scroll') return
      const id = link.getAttribute('href')
      if (id === '#accueil' || id === '#') return
      const dest = document.querySelector(id)
      if (!dest) return
      e.preventDefault()
      e.stopPropagation()
      cancelAnimationFrame(animRaf)
      mode = 'scroll'
      dir = 1
      lastP = -1
      render(P_INTRO)
      unlock()
      if (lenis) lenis.scrollTo(dest, { duration: 1.4 })
      else dest.scrollIntoView({ behavior: 'smooth' })
    }

    const onResize = () => {
      measure()
      lastP = -1
      if (mode === 'hero') render(0)
      else if (mode === 'scroll') { render(P_INTRO); onScroll() }
    }

    // ---- démarrage ----
    // avion + ombre décodés dès qu'ils sont chargés : pas d'à-coup à la première image de l'animation
    ;[plane.current, shadow.current].forEach((img) => img.decode?.().catch(() => {}))
    measure()
    if (reduced || window.scrollY - m.top > 2) {
      // mouvement réduit, ou page rechargée plus bas : directement en mode scroll
      mode = 'scroll'
      render(pFromScroll())
    } else {
      lock() // la page attend le premier coup de scroll
      render(0)
    }
    if (!reduced) {
      window.addEventListener('wheel', onWheel, { passive: false })
      window.addEventListener('keydown', onKey)
      window.addEventListener('touchstart', onTouchStart, { passive: true })
      window.addEventListener('touchmove', onTouchMove, { passive: false })
    }
    document.addEventListener('click', onAnchor, true)
    if (lenis) lenis.on('scroll', onScroll)
    else window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    // polices chargées après coup : les hauteurs peuvent changer
    document.fonts?.ready.then(() => alive && onResize())

    return () => {
      alive = false
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('click', onAnchor, true)
      if (lenis) lenis.off('scroll', onScroll)
      else window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(animRaf)
      unlock()
    }
  }, [])

  return (
    <header className="flight" id="accueil" ref={root}>
      <div className="flight-stage">
        <picture>
          {/* grand écran : port de nuit — mobile : bateau en portrait */}
          {/* AVIF d'abord (≈ 2× plus léger), WebP en secours */}
          <source media="(min-width: 821px)" type="image/avif" sizes="100vw"
            srcSet="/img/port-1280.avif 1280w, /img/port-1920.avif 1920w, /img/port-2560.avif 2560w" />
          <source media="(min-width: 821px)" type="image/webp" sizes="100vw"
            srcSet="/img/port-1280.webp 1280w, /img/port-1920.webp 1920w, /img/port-2560.webp 2560w" />
          <source type="image/avif" sizes="max(100vw, 66.667vh)"
            srcSet="/img/bateau-640.avif 640w, /img/bateau-960.avif 960w" />
          <img ref={sea} className="fl-sea" alt="" fetchpriority="high"
            sizes="max(100vw, 66.667vh)"
            srcSet="/img/bateau-640.webp 640w, /img/bateau-960.webp 960w"
            src="/img/bateau-960.webp" />
        </picture>
        <div ref={vignette} className="fl-vignette" aria-hidden="true" />
        <div ref={bloom} className="fl-bloom" aria-hidden="true" />
        <div ref={cream} className="fl-cream" aria-hidden="true" />
        <div ref={clouds} className="fl-clouds" aria-hidden="true" />
        <img ref={shadow} className="fl-shadow" src="/img/avion-ombre.webp" alt="" decoding="async" fetchpriority="low" />
        <img ref={plane} className="fl-plane" src="/img/avion.webp" alt="" decoding="async" fetchpriority="low" width="1414" height="1425" />

        <div className="fl-strip">
          {/* À propos — allégé */}
          <section ref={about} className="fl-about" aria-label={t.intro.aria}>
            <div className="fla-left">
              <p className="fla-kicker">{t.intro.kicker}<span className="fla-kicker-brand"> NTCL</span></p>
              <h2 className="fla-giant">NTCL</h2>
              <dl className="fla-specs">
                {t.intro.specs.map(({ label, value }) => (
                  <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
                ))}
              </dl>
            </div>
            <div className="fla-right">
              <h3 className="fla-title">{t.intro.title}</h3>
              <p className="fla-text">{t.intro.text}</p>
            </div>
            <a href="#contact" className="fla-btn">{t.intro.cta}</a>
          </section>

        </div>

        {/* Héro */}
        <div ref={hero} className="fl-hero">
          <div className="flh-main">
            <span className="flh-badge" data-out>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /></svg>
              {t.hero.badge}
            </span>
            <h1 className="flh-title" data-out>{t.hero.titleLine1}<br />{t.hero.titleLine2Start}<strong>{t.hero.titleLine2Strong}</strong></h1>
            <div className="flh-actions" data-out>
              <a href="#contact" className="flh-btn">{t.hero.cta}</a>
              <div className="flh-proof">
                <div className="flh-avatars">
                  {avatars.map((src) => <img key={src} src={src} alt="" width="30" height="30" decoding="async" fetchpriority="low" />)}
                </div>
                <span>{t.hero.proofLine1}<br />{t.hero.proofLine2}</span>
              </div>
            </div>
          </div>
          <p className="flh-text" data-out>{t.hero.text}</p>
        </div>

        <nav className="fl-nav" ref={nav}>
          <a href="#accueil" className="fl-logo" aria-label={t.nav.home}>
            <span className="fl-logo-mark" aria-hidden="true" />
            NTCL
          </a>
          <ul className="fl-links" aria-label={t.nav.mainNav}>
            {links.map(([l, id]) => <li key={id}><a href={`#${id}`}>{l}</a></li>)}
          </ul>
          <LanguageSelect />
          <a href="#contact" className="fl-navcta">{t.nav.cta}</a>
          <button className="burger" type="button" aria-label={t.nav.menu}
            aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span />
          </button>
        </nav>

        {menuOpen && (
          <div className="mobile-menu" onClick={() => setMenuOpen(false)}>
            {links.map(([l, id]) => <a key={id} href={`#${id}`}>{l}</a>)}
          </div>
        )}
      </div>
    </header>
  )
}
