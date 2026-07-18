import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { EmbeddedAuthProvider } from '@/components/auth/embedded-auth-provider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <EmbeddedAuthProvider><App /></EmbeddedAuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
