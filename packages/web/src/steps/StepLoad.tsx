import { useState, useRef, useCallback } from 'react'
import { Upload, FolderOpen, AlertCircle, Loader2, Lock, HelpCircle } from 'lucide-react'
import { readUploadedFiles, validateExport, analyzeExport } from '../engine'

interface Props {
  state: any
}

export default function StepLoad({ state }: Props) {
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const zipInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(async (fileList: FileList) => {
    setLoading(true)
    setError(null)
    setWarning(null)

    try {
      const files = await readUploadedFiles(fileList)

      if (files.size === 0) {
        setError('No HTML files found. Make sure you uploaded a valid Medium export.')
        setLoading(false)
        return
      }

      const validation = validateExport(files)
      if (!validation.valid) {
        setError(validation.message)
        setLoading(false)
        return
      }
      if (validation.warning) {
        setWarning(validation.warning)
      }

      const { summary, posts } = analyzeExport(files)
      state.setFiles(files)
      state.setSummary(summary)
      state.setPosts(posts)
      state.setStep('preview')
    } catch (err: any) {
      setError(err.message || 'Failed to process the export. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [state])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files)
    }
  }, [processFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragging(false)
  }, [])

  return (
    <div className="max-w-lg mx-auto">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`card p-12 text-center transition-all cursor-pointer ${
          dragging
            ? 'border-green-500 bg-green-50 dark:bg-green-950/20 shadow-lg shadow-green-500/10'
            : 'hover:border-zinc-300 dark:hover:border-zinc-700'
        } ${loading ? 'pointer-events-none opacity-60' : ''}`}
        onClick={() => zipInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload Medium export"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={40} className="text-green-600 animate-spin" />
            <p className="text-lg font-medium">Analyzing your export...</p>
            <p className="text-sm text-zinc-500">This may take a moment for large exports.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              dragging ? 'bg-green-100 dark:bg-green-900/40' : 'bg-zinc-100 dark:bg-zinc-800'
            }`}>
              <Upload size={28} className={dragging ? 'text-green-600' : 'text-zinc-400'} />
            </div>
            <div>
              <p className="text-lg font-medium">Drag & drop your Medium export here</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">.zip file or use the buttons below</p>
            </div>
          </div>
        )}
      </div>

      {/* File inputs */}
      <input
        ref={zipInputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />
      <input
        ref={folderInputRef}
        type="file"
        {...({ webkitdirectory: 'true' } as any)}
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />

      <div className="flex gap-3 mt-4 justify-center">
        <button
          onClick={(e) => { e.stopPropagation(); zipInputRef.current?.click() }}
          disabled={loading}
          className="btn-secondary text-sm"
        >
          <Upload size={16} />
          Upload .zip
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click() }}
          disabled={loading}
          className="btn-secondary text-sm"
        >
          <FolderOpen size={16} />
          Upload folder
        </button>
      </div>

      {/* Warning */}
      {warning && (
        <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3" role="status">
          <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">{warning}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 flex items-start gap-3" role="alert">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Privacy notice */}
      <div className="mt-8 flex items-start gap-3 text-xs text-zinc-400 dark:text-zinc-500">
        <Lock size={14} className="mt-0.5 shrink-0" />
        <p>Your files never leave your browser. All processing happens locally on your device. No data is sent to any server.</p>
      </div>

      {/* Help link */}
      <div className="mt-4 text-center">
        <a
          href="https://help.medium.com/hc/en-us/articles/115004745787-Export-your-account-data"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-green-600 transition-colors"
        >
          <HelpCircle size={14} />
          How to export your Medium data
        </a>
      </div>
    </div>
  )
}
