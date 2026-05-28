import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.addEventListener('error', (e) => {
  console.error('Global error:', e.error?.message)
  document.getElementById('root')!.innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#F5F6F8;font-family:sans-serif;text-align:center">' +
    '<div><p style="font-size:32px;margin-bottom:12px">⚠</p>' +
    '<h1 style="font-size:18px;font-weight:700;color:#111827;margin-bottom:8px">Something went wrong</h1>' +
    '<p style="font-size:13px;color:#6B7280;margin-bottom:16px">' + e.error?.message + '</p>' +
    '<button onclick="location.reload()" style="padding:12px 24px;border-radius:12px;background:#E10600;color:white;font-size:13px;font-weight:500;border:none;cursor:pointer">Reload App</button></div></div>'
})

createRoot(document.getElementById('root')!).render(<App />)
