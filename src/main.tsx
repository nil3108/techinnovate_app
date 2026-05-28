import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F6F8] flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <p className="text-4xl mb-3">⚠</p>
            <h1 className="text-lg font-bold text-[#111827] mb-2">Something went wrong</h1>
            <p className="text-[13px] text-[#6B7280] mb-4">The app encountered an unexpected error.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl bg-[#E10600] text-white text-[13px] font-medium">
              Reload App
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
