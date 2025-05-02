// Polyfill for the 'global' object used by dfinity libraries
window.global = window;

import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthContextProvider } from './contexts/useAuthContext/index.tsx'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthContextProvider>
      <App />
    </AuthContextProvider>
  </React.StrictMode>,
)
