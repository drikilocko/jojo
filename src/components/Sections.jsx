import { useState } from 'react'
import NetworkMap from './NetworkMap.jsx'
import { useI18n } from '../i18n/I18n.jsx'

const img = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`

const Arrow = () => (
  <svg viewBox="0 0 24 24" className="ico"><path d="M7 17 17 7M9 7h8v8" /></svg>
)

/* ---------- Partenaires ---------- */
export function Partners() {
  const { t } = useI18n()
  const names = ['MAERSK LINE', 'CMA CGM', 'DHL Global', 'MSC', 'Bolloré', 'Hapag-Lloyd']
  return (
    <section className="partners">
      <p>{t.partners.trust}</p>
      <div className="partners-row">
        {names.map((n) => <span key={n}>{n}</span>)}
      </div>
    </section>
  )
}

/* ---------- Services ---------- */
const servicePhotos = [
  'photo-1494412574643-ff11b0a5c1c3',
  'photo-1436491865332-7a61a109cc05',
  'photo-1601584115197-04ecc0da31d7',
  'photo-1586528116311-ad8dd3c8310d',
]

export function Services() {
  const { t } = useI18n()
  return (
    <section className="section" id="services">
      <div className="section-head">
        <span className="eyebrow">{t.services.eyebrow}</span>
        <h2>{t.services.title}</h2>
        <p>{t.services.lead}</p>
      </div>
      <div className="services-grid">
        {t.services.items.map((service, i) => (
          <article key={service.title} className="service-card">
            <img src={img(servicePhotos[i], 700)} alt={service.title} loading="lazy" decoding="async" />
            <div className="service-body">
              <h3>{service.title}</h3>
              <p>{service.desc}</p>
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
  const { t } = useI18n()
  return (
    <section className="dark" id="apropos">
      <div className="dark-inner">
        <div className="about-photo">
          <img src={img('photo-1605745341112-85968b19335b', 900)} alt={t.about.photoAlt} loading="lazy" />
          <div className="about-badge">
            <strong>24/7</strong>
            <span>{t.about.badgeLabel}</span>
          </div>
        </div>
        <div className="about-text">
          <h2><span className="accent">{t.about.titleAccent}</span> {t.about.titleRest}</h2>
          <p>{t.about.text}</p>
          <div className="about-actions">
            <a href="#contact" className="btn btn-orange">{t.about.cta}</a>
            <a href="#services" className="btn btn-ghost">{t.about.more}</a>
          </div>
        </div>
      </div>
      <div className="stats">
        {t.about.stats.map(({ value, label }) => (
          <div key={label}><strong>{value}</strong><span>{label}</span></div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Atouts ---------- */
export function Features() {
  const { t } = useI18n()
  const icons = [
    'M3 7h18M3 12h18M3 17h18',
    'M4 5h16v11H4zM8 20h8',
    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  ]
  return (
    <section className="section features" id="technologie">
      <div className="features-text">
        <span className="eyebrow">{t.features.eyebrow}</span>
        <h2>{t.features.title}</h2>
        <p>{t.features.text}</p>
        <ul>
          {t.features.items.map((item, i) => (
            <li key={item}>
              <span className="feat-ico"><svg viewBox="0 0 24 24"><path d={icons[i]} /></svg></span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="features-photo">
        <img src={img('photo-1578575437130-527eed3abbec', 900)} alt={t.features.photoAlt} loading="lazy" />
      </div>
    </section>
  )
}

/* ---------- Réseau : carte pleine largeur, Togo + connexions (NetworkMap.jsx) ---------- */
export function Network() {
  const { t } = useI18n()
  return (
    <section className="section network" id="solutions">
      <div className="section-head">
        <span className="eyebrow">{t.network.eyebrow}</span>
        <h2>{t.network.title}</h2>
      </div>
      <NetworkMap />
    </section>
  )
}

/* ---------- Contact ---------- */
export function Contact() {
  const { t } = useI18n()
  const [sent, setSent] = useState(false)
  return (
    <section className="section contact" id="contact">
      <div>
        <span className="eyebrow">{t.contact.eyebrow}</span>
        <h2>{t.contact.title}</h2>
        <p>{t.contact.lead}</p>
        <ul className="contact-list">
          <li>📍 {t.contact.address}</li>
          <li>📞 +000 000 000 000</li>
          <li>✉️ contact@ntcl.com</li>
        </ul>
      </div>
      <form className="contact-form" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
        <div className="row">
          <input required placeholder={t.contact.name} aria-label={t.contact.name} />
          <input required type="email" placeholder={t.contact.email} aria-label={t.contact.email} />
        </div>
        <div className="row">
          <input placeholder={t.contact.from} aria-label={t.contact.from} />
          <input placeholder={t.contact.to} aria-label={t.contact.to} />
        </div>
        <textarea rows="4" placeholder={t.contact.goods} aria-label={t.contact.goods} />
        <button className="btn btn-orange" type="submit">{sent ? t.contact.sent : t.contact.send}</button>
      </form>
    </section>
  )
}

/* ---------- Footer ---------- */
export function Footer() {
  const { t } = useI18n()
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <div className="logo dark-logo"><strong>NTCL</strong><small>LOGISTIC &amp; TRANSPORT</small></div>
          <p>{t.footer.tagline}</p>
        </div>
        <div>
          <h4>{t.footer.servicesTitle}</h4>
          {t.services.items.map((service) => <a key={service.title} href="#services">{service.title}</a>)}
        </div>
        <div>
          <h4>{t.footer.companyTitle}</h4>
          <a href="#apropos">{t.footer.about}</a>
          <a href="#solutions">{t.footer.network}</a>
          <a href="#contact">{t.footer.contact}</a>
        </div>
      </div>
      <div className="footer-giant" aria-hidden="true">NTCL</div>
      <p className="copy">© {new Date().getFullYear()} NTCL Logistic &amp; Transport. {t.footer.rights}</p>
    </footer>
  )
}
