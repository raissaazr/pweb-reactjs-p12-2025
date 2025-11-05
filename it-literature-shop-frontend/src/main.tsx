// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' // Asumsi Anda punya file CSS global
import { AuthProvider } from './contexts/authcontext'; // <-- IMPORT

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider> {/* <-- BUNGKUS DI SINI */}
      <App />
    </AuthProvider> {/* <-- BUNGKUS DI SINI */}
  </React.StrictMode>,
)