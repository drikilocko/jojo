import React from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.jsx'

// Utilisé uniquement au build pour pré-générer le HTML (voir scripts/prerender.mjs)
export function render() {
  return renderToString(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
