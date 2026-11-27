import { useEffect, useRef, useState } from 'react'
import { lenis } from '../lib/smoothScroll.js'
import { LanguageSelect, useI18n } from '../i18n/I18n.jsx'
import '../header.css'

/*
  Header global « réapparaît au scroll vers le haut ».
  - Caché tant que la section 1 (.flight, qui a son propre header) est à l'écran.
  - Au-delà : visible quand on remonte, caché quand on descend.
  - Rendu identique serveur / client (caché au départ) : pas d'accès à window pendant le rendu.
  - Dans le callback de scroll : aucune lecture de layout, seulement des valeurs en cache.
*/
const DELTA = 6 // px de mouvement minimum (scroll natif) avant de changer d'état : évite le scintillement

export default function SiteHeader() {
  const { t } = useI18n()
  const [shown, setShown] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const shownRef = useRef(false)
  const root = useRef(null)
  const links = [
    [t.nav.services, 'services'], [t.nav.solutions, 'solutions'],
    [t.nav.about, 'apropos'], [t.nav.contact, 'contact'],
  ]

  useEffect(() => {
    let limit = 0 // hauteur de .flight (en cache)
    const measure = () => {
      const fl = document.querySelector('.flight')
      limit = fl ? fl.offsetHeight : window.innerHeight
    }
    measure()
    // caché = hors du parcours clavier / lecteurs d'écran (posé ici, pas au rendu : même HTML serveur / client)
    root.current.inert = true

    const set = (v) => {
      if (shownRef.current === v) return
      shownRef.current = v
      root.current.inert = !v
      setShown(v)
      if (!v) setMenuOpen(false)
    }

    // état selon la position et le sens du défilement
    const update = (y, dir) => {
      if (y <= limit) return set(false)
      if (dir < 0) set(true)
      else if (dir > 0) set(false)
    }

    let off
    if (lenis) {
      const onLenis = (l) => update(l.scroll, l.direction)
      lenis.on('scroll', onLenis)
      off = () => lenis.off('scroll', onLenis)
    } else {
      let lastY = window.scrollY
      const onScroll = () => {
        const y = window.scrollY
        const d = y - lastY
        if (Math.abs(d) < DELTA && y > limit) return
        lastY = y
        update(y, Math.sign(d))
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      off = () => window.removeEventListener('scroll', onScroll)
    }

    window.addEventListener('resize', measure)
    return () => {
      off()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div className={`site-header${shown ? ' is-shown' : ''}`} ref={root}>
      <nav className="sh-nav" aria-label={t.nav.mainNav}>
        <a href="#accueil" className="sh-logo" aria-label={t.nav.home}>
          <span className="sh-logo-mark" aria-hidden="true" />
          NTCL
        </a>
        <ul className="sh-links">
          {links.map(([l, id]) => <li key={id}><a href={`#${id}`}>{l}</a></li>)}
        </ul>
        <LanguageSelect />
        <a href="#contact" className="sh-cta">{t.nav.cta}</a>
        <button
          className="sh-burger" type="button" aria-label={t.nav.menu}
          aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}
        >
          <span /><span />
        </button>
      </nav>

      {menuOpen && (
        <div className="sh-menu" onClick={() => setMenuOpen(false)}>
          {links.map(([l, id]) => <a key={id} href={`#${id}`}>{l}</a>)}
          <a href="#contact" className="sh-menu-cta">{t.nav.cta}</a>
        </div>
      )}
    </div>
  )
}
