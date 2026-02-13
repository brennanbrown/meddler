import { useState, useMemo } from 'react'
import { Search, FileText, FilePen, MessageSquare, ChevronRight, User, Calendar, Mail, CheckSquare, Square, ArrowRight } from 'lucide-react'
import type { ParsedPost } from '../store'

interface Props {
  state: any
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      <div className="text-zinc-500 dark:text-zinc-400">{icon}</div>
      <div>
        <p className="text-xl font-bold leading-tight">{value}</p>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
    </div>
  )
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch {
    return d
  }
}

function formatFullDate(d: string | null): string {
  if (!d) return 'No date'
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return d
  }
}

export default function StepPreview({ state }: Props) {
  const { summary, posts, setPosts } = state
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'response'>('all')
  const [previewPost, setPreviewPost] = useState<ParsedPost | null>(null)

  const filtered = useMemo(() => {
    let list = posts as ParsedPost[]
    if (filter !== 'all') list = list.filter((p: ParsedPost) => p.type === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((p: ParsedPost) => p.title.toLowerCase().includes(q))
    }
    return list
  }, [posts, filter, search])

  const selectedCount = (posts as ParsedPost[]).filter((p: ParsedPost) => p.selected).length

  const togglePost = (idx: number) => {
    const updated = [...posts] as ParsedPost[]
    const realIdx = (posts as ParsedPost[]).indexOf(filtered[idx])
    if (realIdx >= 0) {
      updated[realIdx] = { ...updated[realIdx], selected: !updated[realIdx].selected }
      setPosts(updated)
    }
  }

  const selectAll = () => setPosts((posts as ParsedPost[]).map((p: ParsedPost) => ({ ...p, selected: true })))
  const deselectAll = () => setPosts((posts as ParsedPost[]).map((p: ParsedPost) => ({ ...p, selected: false })))
  const selectPublished = () => setPosts((posts as ParsedPost[]).map((p: ParsedPost) => ({ ...p, selected: p.type === 'published' || p.type === 'draft' })))

  if (!summary) return null

  return (
    <div>
      {/* Profile summary */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          {summary.avatarUrl && (
            <img src={summary.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
          )}
          <div>
            <h2 className="text-lg font-bold">{summary.authorName || 'Unknown Author'}</h2>
            <div className="flex items-center gap-3 text-sm text-zinc-500">
              {summary.username && <span className="flex items-center gap-1"><User size={13} />@{summary.username}</span>}
              {summary.createdAt && <span className="flex items-center gap-1"><Calendar size={13} />{summary.createdAt}</span>}
              {summary.email && <span className="flex items-center gap-1 hidden sm:flex"><Mail size={13} />{summary.email}</span>}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={<FileText size={20} />} value={summary.publishedCount} label="Published" />
          <StatCard icon={<FilePen size={20} />} value={summary.draftCount} label="Drafts" />
          <StatCard icon={<MessageSquare size={20} />} value={summary.responseCount} label="Responses" />
        </div>

        {summary.dateRange.earliest && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-4 text-center">
            Date range: {formatDate(summary.dateRange.earliest)} → {formatDate(summary.dateRange.latest)}
          </p>
        )}

        {/* Supplementary data indicators */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {summary.bookmarkPages > 0 && <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">📑 Bookmarks</span>}
          {summary.clapPages > 0 && <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">👏 Claps</span>}
          {summary.highlightPages > 0 && <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">💡 Highlights</span>}
          {summary.listCount > 0 && <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">📋 Lists</span>}
          {summary.hasEarnings && <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">💰 Earnings</span>}
          {summary.hasSocialGraph && <span className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">👥 Following</span>}
        </div>
      </div>

      {/* Post browser */}
      <div className="card">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base w-full pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {(['all', 'published', 'draft', 'response'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  filter === f
                    ? 'bg-green-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {f === 'all' ? `All (${posts.length})` :
                 f === 'published' ? `Published (${summary.publishedCount})` :
                 f === 'draft' ? `Drafts (${summary.draftCount})` :
                 `Responses (${summary.responseCount})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs">
            <span className="text-zinc-500">{selectedCount} selected</span>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <button onClick={selectAll} className="text-green-600 hover:underline">Select all</button>
            <button onClick={deselectAll} className="text-green-600 hover:underline">Deselect all</button>
            <button onClick={selectPublished} className="text-green-600 hover:underline">Published + drafts only</button>
          </div>
        </div>

        {/* Post list */}
        <div className="max-h-[28rem] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {filtered.map((post: ParsedPost, i: number) => (
            <div
              key={post.filename}
              className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group"
            >
              <button onClick={() => togglePost(i)} className="shrink-0 text-zinc-500 dark:text-zinc-400 hover:text-green-600">
                {post.selected ? <CheckSquare size={18} className="text-green-600" /> : <Square size={18} />}
              </button>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setPreviewPost(post)}>
                <p className="text-sm font-medium truncate">{post.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatFullDate(post.date)}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    post.type === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                    post.type === 'draft' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                    'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                  }`}>
                    {post.type}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">No posts match your search.</div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setPreviewPost(null)}>
          <div className="card max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{previewPost.title}</h3>
              <button onClick={() => setPreviewPost(null)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-sm">Close</button>
            </div>
            {previewPost.subtitle && <p className="text-sm text-zinc-500 italic mb-3">{previewPost.subtitle}</p>}
            <div className="flex gap-2 mb-4 text-xs text-zinc-500 dark:text-zinc-400">
              {previewPost.date && <span>{formatFullDate(previewPost.date)}</span>}
              <span className="capitalize">{previewPost.type}</span>
              <span>ID: {previewPost.mediumId}</span>
            </div>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: (() => {
                  const bodyMatch = previewPost.html.match(/<section data-field="body"[^>]*>([\s\S]*?)<\/section>\s*<footer/)
                  return bodyMatch ? bodyMatch[1] : '<p class="text-zinc-400">No body content</p>'
                })()
              }}
            />
          </div>
        </div>
      )}

      {/* Next button */}
      <div className="mt-6 flex justify-end">
        <button onClick={() => state.setStep('config')} className="btn-primary">
          Configure export
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
