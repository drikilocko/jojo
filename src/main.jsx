import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { I18nProvider } from './i18n/I18n.jsx'
import './styles.css'
import './flight.css'

const root = document.getElementById('root')
const app = (
  <React.StrictMode>
    <I18nProvider><App /></I18nProvider>
  </React.StrictMode>
)

// En production, le HTML est pré-généré au build (scripts/prerender.mjs) :
// la page s'affiche avant le JavaScript, puis React s'y raccroche (hydratation).
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, app)
else ReactDOM.createRoot(root).render(app)
