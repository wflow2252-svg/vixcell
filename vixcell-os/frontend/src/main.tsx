import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Offline-bundled fonts + Google Material Symbols (no CDN — desktop app must work offline)
import '@fontsource-variable/inter'
import '@fontsource-variable/cairo'
import 'material-symbols/rounded.css'

import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
