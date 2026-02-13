import { useState, useCallback, useRef, useEffect } from 'react'
import { Download, RotateCcw, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { runConversion } from '../engine'
import type { ParsedPost, ConversionProgress, LogEntry } from '../store'

interface Props {
  state: any
}

export default function StepExport({ state }: Props) {
  const { files, posts, config, progress, setProgress, setStep, reset } = state
  const [showLog, setShowLog] = useState(false)

  const selectedPosts = (posts as ParsedPost[]).filter((p: ParsedPost) => p.selected)

  // Reset progress when config changes after a completed export
  const configRef = useRef(config)
  useEffect(() => {
    if (configRef.current !== config && (progress.phase === 'done' || progress.phase === 'error')) {
      setProgress({
        phase: 'idle',
        current: 0,
        total: 0,
        currentFile: '',
        log: [],
        report: null,
        zipBlob: null,
        zipSize: 0,
      })
    }
    configRef.current = config
  }, [config, progress.phase, setProgress])

  const startExport = useCallback(async () => {
    setProgress({
      phase: 'converting',
      current: 0,
      total: selectedPosts.length,
      currentFile: '',
      log: [],
      report: null,
      zipBlob: null,
      zipSize: 0,
    })

    try {
      await runConversion(files, selectedPosts, config, (p: Partial<ConversionProgress>) => {
        setProgress((prev: ConversionProgress) => ({ ...prev, ...p }))
      })
    } catch (err: any) {
      setProgress((prev: ConversionProgress) => ({
        ...prev,
        phase: 'error' as const,
        log: [...prev.log, { type: 'error' as const, message: `Fatal error: ${err.message}` }],
      }))
    }
  }, [files, selectedPosts, config, setProgress])

  const downloadZip = useCallback(() => {
    if (!progress.zipBlob) return
    const url = URL.createObjectURL(progress.zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meddler-export-${config.target}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [progress.zipBlob, config.target])

  const isIdle = progress.phase === 'idle'
  const isRunning = ['converting', 'images', 'supplementary', 'zipping'].includes(progress.phase)
  const isDone = progress.phase === 'done'
  const isError = progress.phase === 'error'
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="max-w-lg mx-auto">
      {/* Pre-export summary */}
      {isIdle && (
        <div className="card p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Ready to export</h2>
          <p className="text-sm text-zinc-500 mb-6">
            {selectedPosts.length} posts will be converted to {config.outputFormat} with {config.format} front matter, targeting {config.target === 'generic' ? 'generic SSG' : config.target}.
          </p>

          <div className="grid grid-cols-2 gap-3 text-left mb-6">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Posts</p>
              <p className="font-bold">{selectedPosts.filter((p: ParsedPost) => p.type === 'published').length} published</p>
              <p className="text-sm text-zinc-500">{selectedPosts.filter((p: ParsedPost) => p.isDraft).length} drafts</p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Output</p>
              <p className="font-bold capitalize">{config.target}</p>
              <p className="text-sm text-zinc-500">{config.format} / {config.outputFormat}</p>
            </div>
          </div>

          <button onClick={startExport} className="btn-primary w-full justify-center text-base py-3">
            <Download size={18} />
            Start Export
          </button>

          <button onClick={() => setStep('config')} className="mt-3 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            ← Back to settings
          </button>
        </div>
      )}

      {/* Progress */}
      {isRunning && (
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Loader2 size={24} className="text-green-600 animate-spin" />
            <div>
              <p className="font-medium">
                {progress.phase === 'converting' && 'Converting posts...'}
                {progress.phase === 'supplementary' && 'Processing supplementary data...'}
                {progress.phase === 'images' && 'Downloading images...'}
                {progress.phase === 'zipping' && 'Generating ZIP file...'}
              </p>
              <p className="text-sm text-zinc-500">{progress.currentFile}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-green-600 rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-right">
            {progress.current}/{progress.total} ({percent}%)
          </p>
        </div>
      )}

      {/* Done */}
      {isDone && (
        <div className="card p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Export Complete!</h2>

          {progress.report && (
            <div className="grid grid-cols-3 gap-3 text-center my-4">
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <p className="text-lg font-bold">{progress.report.summary.postsConverted}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Published</p>
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <p className="text-lg font-bold">{progress.report.summary.draftsConverted}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Drafts</p>
              </div>
              <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <p className="text-lg font-bold">{progress.report.summary.supplementaryFiles}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Data files</p>
              </div>
            </div>
          )}

          {progress.zipSize > 0 && (
            <p className="text-sm text-zinc-500 mb-4">
              ZIP size: {(progress.zipSize / 1024 / 1024).toFixed(1)} MB
            </p>
          )}

          <button onClick={downloadZip} className="btn-primary w-full justify-center text-base py-3 mb-3">
            <Download size={18} />
            Download ZIP
          </button>

          <div className="flex gap-2 justify-center mt-2">
            <button onClick={reset} className="btn-secondary text-sm">
              <RotateCcw size={14} />
              Start over
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="card p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Export Failed</h2>
          <p className="text-sm text-zinc-500 mb-4">Something went wrong during the conversion.</p>
          <div className="flex gap-2 justify-center">
            <button onClick={startExport} className="btn-primary text-sm">Try again</button>
            <button onClick={reset} className="btn-secondary text-sm">
              <RotateCcw size={14} />
              Start over
            </button>
          </div>
        </div>
      )}

      {/* Log */}
      {progress.log.length > 0 && (
        <div className="mt-4">
          <button onClick={() => setShowLog(!showLog)}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            {showLog ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showLog ? 'Hide' : 'Show'} conversion log ({progress.log.length})
          </button>
          {showLog && (
            <div className="mt-2 card max-h-64 overflow-y-auto p-3 font-mono text-xs space-y-0.5">
              {progress.log.map((entry: LogEntry, i: number) => (
                <div key={i} className={
                  entry.type === 'error' ? 'text-red-500' :
                  entry.type === 'warning' ? 'text-amber-500' :
                  'text-zinc-500'
                }>
                  {entry.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Back button when idle */}
      {isIdle && (
        <div className="mt-4 flex justify-start">
          <button onClick={() => setStep('config')} className="btn-secondary text-sm">
            <ArrowLeft size={14} />
            Back to settings
          </button>
        </div>
      )}
    </div>
  )
}
