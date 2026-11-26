import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/*
  Défilement doux sur tout le site (Lenis).
  - Molette / pavé tactile : lissés.
  - Tactile (mobile) : défilement natif du téléphone, le plus fluide et le plus économe.
  - « Mouvement réduit » activé dans le système : pas de lissage (lenis = null).
  Une seule boucle requestAnimationFrame pour Lenis ; les animations liées au scroll
  s'abonnent à lenis.on('scroll') et se calculent dans la même frame.
*/
const isBrowser = typeof window !== 'undefined' // (pré-génération du HTML au build : pas de window)
const reduced = isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const lenis = !isBrowser || reduced
  ? null
  : new Lenis({
      lerp: 0.1,            // inertie : plus petit = plus doux, plus grand = plus vif
      wheelMultiplier: 1,
      smoothWheel: true,
      syncTouch: false,     // mobile : scroll natif
      anchors: true,        // liens #ancre défilés en douceur
      autoRaf: true,
    })

/** Aller à une position (px) ou un élément, sans animation si `immediate`. */
export function scrollToY(y, immediate = true) {
  if (lenis) lenis.scrollTo(y, { immediate, force: true })
  else window.scrollTo(0, y)
}

export const stopScroll = () => lenis?.stop()
export const startScroll = () => lenis?.start()
