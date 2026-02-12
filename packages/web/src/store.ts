import { useState, useCallback } from 'react'

export type Step = 'load' | 'preview' | 'config' | 'export'

export interface ParsedPost {
  filename: string
  title: string
  subtitle: string
  date: string | null
  slug: string
  mediumId: string
  isDraft: boolean
  isResponse: boolean
  type: 'published' | 'draft' | 'response'
  selected: boolean
  html: string
}

export interface ExportSummary {
  authorName: string | null
  username: string | null
  email: string | null
  createdAt: string | null
  avatarUrl: string | null
  publishedCount: number
  draftCount: number
  responseCount: number
  dateRange: { earliest: string | null; latest: string | null }
  bookmarkPages: number
  clapPages: number
  highlightPages: number
  listCount: number
  hasEarnings: boolean
  hasSocialGraph: boolean
}

export interface ConfigState {
  format: 'yaml' | 'toml' | 'json' | 'none'
  outputFormat: 'markdown' | 'html' | 'structured-json'
  target: 'generic' | 'hugo' | 'eleventy' | 'jekyll' | 'astro'
  includeDrafts: boolean
  includeResponses: boolean
  separateDrafts: boolean
  extractFeatured: boolean
  removeFeaturedFromBody: boolean
  injectEarnings: boolean
  imagesMode: 'reference' | 'download'
  perPostDirs: boolean
  embedsMode: 'raw_html' | 'shortcodes' | 'placeholders'
  sectionBreaks: 'hr' | 'none' | 'spacing'
  dateFormat: 'iso8601' | 'yyyy-mm-dd'
  extraFields: { key: string; value: string }[]
  supplementary: {
    bookmarks: boolean
    claps: boolean
    highlights: boolean
    interests: boolean
    lists: boolean
    earnings: boolean
    socialGraph: boolean
    profile: boolean
    sessions: boolean
    blocks: boolean
  }
  supplementaryFormat: 'json' | 'yaml' | 'md'
}

export interface ConversionProgress {
  phase: 'idle' | 'converting' | 'images' | 'supplementary' | 'zipping' | 'done' | 'error'
  current: number
  total: number
  currentFile: string
  log: LogEntry[]
  report: any | null
  zipBlob: Blob | null
  zipSize: number
}

export interface LogEntry {
  type: 'info' | 'warning' | 'error'
  message: string
}

export const DEFAULT_CONFIG: ConfigState = {
  format: 'yaml',
  outputFormat: 'markdown',
  target: 'generic',
  includeDrafts: true,
  includeResponses: false,
  separateDrafts: true,
  extractFeatured: true,
  removeFeaturedFromBody: false,
  injectEarnings: true,
  imagesMode: 'reference',
  perPostDirs: true,
  embedsMode: 'raw_html',
  sectionBreaks: 'hr',
  dateFormat: 'iso8601',
  extraFields: [],
  supplementary: {
    bookmarks: true,
    claps: true,
    highlights: true,
    interests: true,
    lists: true,
    earnings: true,
    socialGraph: true,
    profile: true,
    sessions: false,
    blocks: false,
  },
  supplementaryFormat: 'json',
}

export function useAppState() {
  const [step, setStep] = useState<Step>('load')
  const [files, setFiles] = useState<Map<string, string>>(new Map())
  const [posts, setPosts] = useState<ParsedPost[]>([])
  const [summary, setSummary] = useState<ExportSummary | null>(null)
  const [config, setConfig] = useState<ConfigState>(() => {
    try {
      const saved = localStorage.getItem('meddler-config')
      if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
    } catch {}
    return DEFAULT_CONFIG
  })
  const [progress, setProgress] = useState<ConversionProgress>({
    phase: 'idle',
    current: 0,
    total: 0,
    currentFile: '',
    log: [],
    report: null,
    zipBlob: null,
    zipSize: 0,
  })
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const updateConfig = useCallback((updates: Partial<ConfigState>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates }
      try { localStorage.setItem('meddler-config', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
  }, [])

  const goToStep = useCallback((s: Step) => {
    setStep(s)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const reset = useCallback(() => {
    setStep('load')
    setFiles(new Map())
    setPosts([])
    setSummary(null)
    setProgress({ phase: 'idle', current: 0, total: 0, currentFile: '', log: [], report: null, zipBlob: null, zipSize: 0 })
  }, [])

  return {
    step, setStep: goToStep,
    files, setFiles,
    posts, setPosts,
    summary, setSummary,
    config, updateConfig,
    progress, setProgress,
    darkMode, toggleDarkMode,
    reset,
  }
}
