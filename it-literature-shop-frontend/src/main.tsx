// src/main.tsx (Perbaikan)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/cartcontext'; // <-- 1. IMPORT CartProvider

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider> {/* <-- 2. BUNGKUS DI SINI */}
        <App />
      </CartProvider> {/* <-- 3. BUNGKUS DI SINI */}
    </AuthProvider>
  </React.StrictMode>,
)
