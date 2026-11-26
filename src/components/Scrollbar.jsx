import { useEffect, useRef } from 'react'
import { lenis, scrollToY } from '../lib/smoothScroll.js'

/*
  Barre de défilement personnalisée : fine, posée par-dessus le contenu (pas de rail blanc),
  sans flèches. Elle s'élargit au survol et peut être tirée à la souris.
  La barre native est masquée dans flight.css.
*/
export default function Scrollbar() {
  const bar = useRef(null)
  const thumb = useRef(null)

  useEffect(() => {
    const doc = document.documentElement
    let raf = 0
    let hideTimer = 0
    let drag = null

    const update = () => {
      raf = 0
      const vh = window.innerHeight
      const total = doc.scrollHeight
      const h = Math.max(36, (vh / total) * vh)
      const max = total - vh
      const y = max > 0 ? (window.scrollY / max) * (vh - h) : 0
      thumb.current.style.height = `${h}px`
      thumb.current.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`
      bar.current.style.display = max > 0 ? '' : 'none'
    }
    const show = () => {
      bar.current.classList.add('is-active')
      clearTimeout(hideTimer)
      hideTimer = setTimeout(() => !drag && bar.current?.classList.remove('is-active'), 1200)
    }
    const onScroll = () => {
      show()
      if (!raf) raf = requestAnimationFrame(update)
    }

    const onDown = (e) => {
      e.preventDefault()
      drag = { y: e.clientY, scroll: window.scrollY }
      bar.current.classList.add('is-dragging', 'is-active')
      thumb.current.setPointerCapture(e.pointerId)
    }
    const onMove = (e) => {
      if (!drag) return
      const vh = window.innerHeight
      const total = doc.scrollHeight
      const h = Math.max(36, (vh / total) * vh)
      const ratio = (total - vh) / (vh - h)
      scrollToY(drag.scroll + (e.clientY - drag.y) * ratio)
    }
    const onUp = () => {
      drag = null
      bar.current.classList.remove('is-dragging')
      show()
    }

    const t = thumb.current
    t.addEventListener('pointerdown', onDown)
    t.addEventListener('pointermove', onMove)
    t.addEventListener('pointerup', onUp)
    t.addEventListener('pointercancel', onUp)
    // suit la position lissée de Lenis (même frame), sinon le scroll natif
    if (lenis) lenis.on('scroll', onScroll)
    else window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    const ro = new ResizeObserver(onScroll)
    ro.observe(document.body)
    update()

    return () => {
      t.removeEventListener('pointerdown', onDown)
      t.removeEventListener('pointermove', onMove)
      t.removeEventListener('pointerup', onUp)
      t.removeEventListener('pointercancel', onUp)
      if (lenis) lenis.off('scroll', onScroll)
      else window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      ro.disconnect()
      cancelAnimationFrame(raf)
      clearTimeout(hideTimer)
    }
  }, [])

  return (
    <div ref={bar} className="sbar" aria-hidden="true">
      <div ref={thumb} className="sbar-thumb" />
    </div>
  )
}
