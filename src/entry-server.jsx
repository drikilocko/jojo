import React from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'
import { I18nProvider } from './i18n/I18n.jsx'

// Utilisé uniquement au build pour pré-générer le HTML (voir scripts/prerender.mjs)
export function render() {
  return renderToString(
    <React.StrictMode>
      <I18nProvider><App /></I18nProvider>
    </React.StrictMode>
  )
}
