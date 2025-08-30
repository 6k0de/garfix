import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeEffect } from './utils/ThemeEffect.tsx'
import './i18n.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <>
      <ThemeEffect />
      <App />
    </>
  </StrictMode>
)
