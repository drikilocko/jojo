import { createContext, useContext, useEffect, useState } from 'react'
import fr from './fr.js'
import en from './en.js'
import es from './es.js'
import pt from './pt.js'
import zh from './zh.js'

const translations = { fr, en, es, pt, zh }
const languages = [
  ['fr', 'Français'],
  ['en', 'English'],
  ['es', 'Español'],
  ['pt', 'Português'],
  ['zh', '中文'],
]
const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState('fr')

  useEffect(() => {
    const saved = window.localStorage.getItem('ntcl-language')
    if (saved && Object.hasOwn(translations, saved)) setLanguage(saved)
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    document.title = translations[language].meta.title
    const description = document.querySelector('meta[name="description"]')
    if (description) description.content = translations[language].meta.description
    window.localStorage.setItem('ntcl-language', language)
  }, [language])

  return (
    <I18nContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) throw new Error('useI18n must be used within I18nProvider')
  return context
}

export function LanguageSelect() {
  const { language, setLanguage, t } = useI18n()
  return (
    <label className="language-select">
      <span className="sr-only">{t.nav.language}</span>
      <select value={language} onChange={(event) => setLanguage(event.target.value)}>
        {languages.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
      </select>
    </label>
  )
}
