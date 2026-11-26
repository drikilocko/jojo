import { useState } from 'react'
import NetworkMap from './NetworkMap.jsx'

const img = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="ico"><path d="M7 17 17 7M9 7h8v8" /></svg>
)

/* ---------- Partenaires ---------- */
export function Partners() {
  const names = ['MAERSK LINE', 'CMA CGM', 'DHL Global', 'MSC', 'Bolloré', 'Hapag-Lloyd']
  return (
    <section className="partners">
      <p>Ils nous font confiance</p>
      <div className="partners-row">
        {names.map((n) => <span key={n}>{n}</span>)}
      </div>
    </section>
  )
}

/* ---------- Services ---------- */
const services = [
  { title: 'Fret maritime', desc: 'FCL & LCL vers tous les grands ports, dédouanement inclus.', photo: 'photo-1494412574643-ff11b0a5c1c3' },
  { title: 'Fret aérien', desc: 'Envois express et urgents, porte-à-porte en 24 à 72 h.', photo: 'photo-1436491865332-7a61a109cc05' },
  { title: 'Transport routier', desc: 'Flotte de camions suivie par GPS pour la distribution régionale.', photo: 'photo-1601584115197-04ecc0da31d7' },
  { title: 'Entreposage', desc: 'Stockage sécurisé, préparation de commandes et gestion des stocks.', photo: 'photo-1586528116311-ad8dd3c8310d' },
]

export function Services() {
  return (
    <section className="section" id="services">
      <div className="section-head">
        <span className="eyebrow">Nos services</span>
        <h2>Solutions de transport &amp; logistique</h2>
        <p>Une offre complète, de la prise en charge jusqu'à la livraison finale.</p>
      </div>
      <div className="services-grid">
        {services.map((s) => (
          <article key={s.title} className="service-card">
            <img src={img(s.photo, 700)} alt={s.title} loading="lazy" decoding="async" />
            <div className="service-body">
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
            <span className="service-arrow"><Arrow /></span>
          </article>
        ))}
      </div>
    </section>
  )
}

/* ---------- Section sombre « #1 » ---------- */
export function About() {
  const stats = [['15+', "Années d'expérience"], ['120', 'Pays desservis'], ['20K+', 'Expéditions / an'], ['98%', 'Livraisons à l\'heure']]
  return (
    <section className="dark" id="apropos">
      <div className="dark-inner">
        <div className="about-photo">
          <img src={img('photo-1605745341112-85968b19335b', 900)} alt="Conteneurs au port" loading="lazy" />
          <div className="about-badge">
            <strong>24/7</strong>
            <span>Support client</span>
          </div>
        </div>
        <div className="about-text">
          <h2><span className="accent">#1</span> de la logistique et du transport de marchandises</h2>
          <p>
            NTCL accompagne les entreprises dans l'acheminement de leurs marchandises par
            mer, air et route. Notre réseau d'agents et nos outils digitaux garantissent
            des livraisons fiables, rapides et transparentes.
          </p>
          <div className="about-actions">
            <a href="#contact" className="btn btn-orange">Demander un devis</a>
            <a href="#services" className="btn btn-ghost">En savoir plus</a>
          </div>
        </div>
      </div>
      <div className="stats">
        {stats.map(([n, l]) => (
          <div key={l}><strong>{n}</strong><span>{l}</span></div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Atouts ---------- */
export function Features() {
  const items = [
    ['Réseau de transporteurs national et international', 'M3 7h18M3 12h18M3 17h18'],
    ['Plateforme logistique digitale tout-en-un', 'M4 5h16v11H4zM8 20h8'],
    ['Suivi des incidents et alertes en temps réel', 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2'],
  ]
  return (
    <section className="section features" id="technologie">
      <div className="features-text">
        <span className="eyebrow">Technologie</span>
        <h2>Propulser la logistique de votre entreprise</h2>
        <p>
          Planifiez vos expéditions, suivez vos conteneurs et pilotez vos coûts depuis
          un seul tableau de bord, en toute transparence.
        </p>
        <ul>
          {items.map(([t, d]) => (
            <li key={t}>
              <span className="feat-ico"><svg viewBox="0 0 24 24"><path d={d} /></svg></span>
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="features-photo">
        <img src={img('photo-1578575437130-527eed3abbec', 900)} alt="Porte-conteneurs" loading="lazy" />
      </div>
    </section>
  )
}

/* ---------- Réseau : carte pleine largeur, Togo + connexions (NetworkMap.jsx) ---------- */
export function Network() {
  return (
    <section className="section network" id="solutions">
      <div className="section-head">
        <span className="eyebrow">Notre réseau</span>
        <h2>Des agences et partenaires sur tous les continents</h2>
      </div>
      <NetworkMap />
    </section>
  )
}

/* ---------- Contact ---------- */
export function Contact() {
  const [sent, setSent] = useState(false)
  return (
    <section className="section contact" id="contact">
      <div>
        <span className="eyebrow">Contact</span>
        <h2>Parlons de votre prochaine expédition</h2>
        <p>Notre équipe vous répond sous 24 h avec un devis adapté.</p>
        <ul className="contact-list">
          <li>📍 Adresse de votre siège</li>
          <li>📞 +000 000 000 000</li>
          <li>✉️ contact@ntcl.com</li>
        </ul>
      </div>
      <form className="contact-form" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
        <div className="row">
          <input required placeholder="Nom complet" />
          <input required type="email" placeholder="E-mail" />
        </div>
        <div className="row">
          <input placeholder="Ville de départ" />
          <input placeholder="Ville d'arrivée" />
        </div>
        <textarea rows="4" placeholder="Décrivez votre marchandise" />
        <button className="btn btn-orange" type="submit">{sent ? 'Message envoyé ✓' : 'Envoyer la demande'}</button>
      </form>
    </section>
  )
}

/* ---------- Footer ---------- */
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <div className="logo dark-logo"><strong>NTCL</strong><small>LOGISTIC &amp; TRANSPORT</small></div>
          <p>Votre partenaire de confiance pour le transport et la logistique de marchandises.</p>
        </div>
        <div>
          <h4>Services</h4>
          <a href="#services">Fret maritime</a>
          <a href="#services">Fret aérien</a>
          <a href="#services">Transport routier</a>
          <a href="#services">Entreposage</a>
        </div>
        <div>
          <h4>Entreprise</h4>
          <a href="#apropos">À propos</a>
          <a href="#solutions">Notre réseau</a>
          <a href="#contact">Contact</a>
        </div>
      </div>
      <div className="footer-giant" aria-hidden="true">NTCL</div>
      <p className="copy">© {new Date().getFullYear()} NTCL Logistic &amp; Transport. Tous droits réservés.</p>
    </footer>
  )
}
