import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Docs from './Docs'

console.log('docs-main.tsx: Starting render')

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Docs />
    </StrictMode>,
  )
  console.log('docs-main.tsx: Render successful')
} catch (error) {
  console.error('docs-main.tsx: Render failed', error)
  document.getElementById('root')!.innerHTML = `
    <div style="padding: 20px; color: red;">
      <h1>Error loading docs</h1>
      <pre>${error}</pre>
    </div>
  `
}
