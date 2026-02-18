import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { BrowserRouter as Router } from 'react-router-dom'
import { SharedDataProvider } from './hooks/useSharedData'

ReactDOM.createRoot(document.getElementById('root')).render(
     <React.StrictMode>
          <SharedDataProvider>
               <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <App />
               </Router>
          </SharedDataProvider>
     </React.StrictMode>,
)

const appVersion = (import.meta.env && import.meta.env.VITE_APP_VERSION) || 'dev'
if (typeof window !== 'undefined') {
  try {
    const key = 'sw_cleanup_version'
    const last = window.localStorage.getItem(key)
    if (last !== appVersion) {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(rs => {
          rs.forEach(r => {
            try {
              r.unregister()
            } catch (e) {
              const noop = () => {}
              noop(e)
            }
          })
        }).catch((e) => {
          const noop = () => {}
          noop(e)
        })
      }
      if ('caches' in window) {
        window.caches.keys().then(keys => {
          keys.forEach(k => {
            try {
              window.caches.delete(k)
            } catch (e) {
              const noop = () => {}
              noop(e)
            }
          })
        }).catch((e) => {
          const noop = () => {}
          noop(e)
        })
      }
      window.localStorage.setItem(key, appVersion)
    }
  } catch (e) {
    const noop = () => {}
    noop(e)
  }
}
