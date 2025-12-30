import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { BrowserRouter as Router } from 'react-router-dom'
import { SharedDataProvider } from './hooks/useSharedData'

ReactDOM.createRoot(document.getElementById('root')).render(
     <React.StrictMode>
          <SharedDataProvider>
               <Router>
                    <App />
               </Router>
          </SharedDataProvider>
     </React.StrictMode>,
)
