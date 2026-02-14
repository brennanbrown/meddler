import { useAppState, Step } from './store'
import { Sun, Moon, Check } from 'lucide-react'
import StepLoad from './steps/StepLoad'
import StepPreview from './steps/StepPreview'
import StepConfig from './steps/StepConfig'
import StepExport from './steps/StepExport'

const STEPS: { key: Step; label: string }[] = [
  { key: 'load', label: 'Load' },
  { key: 'preview', label: 'Preview' },
  { key: 'config', label: 'Configure' },
  { key: 'export', label: 'Export' },
]

function stepIndex(s: Step) {
  return STEPS.findIndex(st => st.key === s)
}

export default function App() {
  const state = useAppState()
  const currentIdx = stepIndex(state.step)

  return (
    <div className={state.darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-50/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">Ⓜ️</span>
              <span className="font-bold text-lg tracking-tight">Meddler</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1 hidden sm:inline">Medium Export Converter</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/docs.html"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Docs
              </a>
              <button
                onClick={state.toggleDarkMode}
                className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {state.darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        {/* Step indicator */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <nav className="flex items-center justify-center gap-0" aria-label="Progress">
            {STEPS.map((s, i) => {
              const isDone = i < currentIdx
              const isActive = i === currentIdx
              const isClickable = isDone

              return (
                <div key={s.key} className="flex items-center">
                  <button
                    onClick={() => isClickable && state.setStep(s.key)}
                    disabled={!isClickable && !isActive}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-green-700 text-white shadow-lg shadow-green-700/20'
                        : isDone
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 cursor-default'
                    }`}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    {isDone ? <Check size={14} /> : <span className="w-5 h-5 flex items-center justify-center text-xs">{i + 1}</span>}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`w-8 sm:w-16 h-0.5 mx-1 rounded ${
                      i < currentIdx ? 'bg-green-600' : 'bg-zinc-200 dark:bg-zinc-700'
                    }`} />
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-4 pb-24">
          {state.step === 'load' && <StepLoad state={state} />}
          {state.step === 'preview' && <StepPreview state={state} />}
          {state.step === 'config' && <StepConfig state={state} />}
          {state.step === 'export' && <StepExport state={state} />}
        </main>

        {/* Footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <p>Your files never leave your browser. 100% client-side processing.</p>
          <p className="mt-1">
            🍓 A <a href="https://berryhouse.ca" className="underline hover:text-zinc-700 dark:hover:text-zinc-200" target="_blank" rel="noopener noreferrer">Berry House</a> project by <a href="https://brennan.day" className="underline hover:text-zinc-700 dark:hover:text-zinc-200" target="_blank" rel="noopener noreferrer">Brennan Kenneth Brown</a>
          </p>
          <p className="mt-1">
            <a href="https://github.com/brennanbrown/meddler" className="underline hover:text-zinc-700 dark:hover:text-zinc-200" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            {' · '}
            <a href="https://ko-fi.com/brennan" className="underline hover:text-zinc-700 dark:hover:text-zinc-200" target="_blank" rel="noopener noreferrer">
              Support Meddler
            </a>
            {' · '}
            AGPL-3.0 License
          </p>
          <p className="mt-1 text-xs">
            Not affiliated with Medium
          </p>
        </footer>
      </div>
    </div>
  )
}
