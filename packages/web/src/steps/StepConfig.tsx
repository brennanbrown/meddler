import { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, ArrowRight, ArrowLeft, Plus, Trash2, Eye } from 'lucide-react'
import type { ConfigState, ParsedPost } from '../store'
import { previewPost } from '../engine'

interface Props {
  state: any
}

function Section({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
        <span className="font-medium text-sm">{title}</span>
        {open ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  )
}

function Radio({ name, value, checked, onChange, label, desc }: {
  name: string; value: string; checked: boolean; onChange: () => void; label: string; desc?: string
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange}
        className="mt-1 accent-green-600" />
      <div>
        <span className="text-sm font-medium group-hover:text-green-600 transition-colors">{label}</span>
        {desc && <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>}
      </div>
    </label>
  )
}

function Toggle({ checked, onChange, label, desc }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="mt-1 accent-green-600 rounded" />
      <div>
        <span className="text-sm group-hover:text-green-600 transition-colors">{label}</span>
        {desc && <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>}
      </div>
    </label>
  )
}

const TARGET_PRESETS: Record<string, Partial<ConfigState>> = {
  generic: { format: 'yaml', embedsMode: 'raw_html' },
  hugo: { format: 'toml', embedsMode: 'shortcodes' },
  eleventy: { format: 'yaml', embedsMode: 'raw_html' },
  jekyll: { format: 'yaml', embedsMode: 'raw_html' },
  astro: { format: 'yaml', embedsMode: 'raw_html' },
}

export default function StepConfig({ state }: Props) {
  const { config, updateConfig, posts, setStep } = state
  const [showPreview, setShowPreview] = useState(false)

  const applyTarget = (target: string) => {
    const preset = TARGET_PRESETS[target] || {}
    updateConfig({ target: target as any, ...preset })
  }

  const samplePost = useMemo(() => {
    const p = (posts as ParsedPost[]).find((p: ParsedPost) => p.selected && p.type === 'published')
    return p || (posts as ParsedPost[]).find((p: ParsedPost) => p.selected) || null
  }, [posts])

  const livePreview = useMemo(() => {
    if (!samplePost) return ''
    try { return previewPost(samplePost.html, samplePost.filename, config) }
    catch { return '// Error generating preview' }
  }, [samplePost, config])

  return (
    <div>
      <div className="card overflow-hidden">
        {/* Format & Target */}
        <Section title="Format & Target" defaultOpen={true}>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Front Matter Format</p>
              <div className="space-y-2">
                <Radio name="format" value="yaml" checked={config.format === 'yaml'} onChange={() => updateConfig({ format: 'yaml' })} label="YAML (---)" desc="Most widely supported" />
                <Radio name="format" value="toml" checked={config.format === 'toml'} onChange={() => updateConfig({ format: 'toml' })} label="TOML (+++)" desc="Preferred by Hugo" />
                <Radio name="format" value="json" checked={config.format === 'json'} onChange={() => updateConfig({ format: 'json' })} label="JSON" />
                <Radio name="format" value="none" checked={config.format === 'none'} onChange={() => updateConfig({ format: 'none' })} label="None (plain Markdown)" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Target SSG</p>
              <div className="space-y-2">
                {(['generic', 'hugo', 'eleventy', 'jekyll', 'astro'] as const).map(t => (
                  <Radio key={t} name="target" value={t} checked={config.target === t}
                    onChange={() => applyTarget(t)}
                    label={t === 'generic' ? 'Generic' : t === 'eleventy' ? 'Eleventy (11ty)' : t.charAt(0).toUpperCase() + t.slice(1)}
                    desc={t === 'generic' ? 'Works with any SSG' : t === 'hugo' ? 'Page bundles, TOML, shortcodes' : t === 'jekyll' ? '_posts/ with date prefix' : t === 'eleventy' ? '_data/ directory' : 'src/content/ directory'}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Output Format</p>
            <div className="flex gap-4">
              <Radio name="outputFormat" value="markdown" checked={config.outputFormat === 'markdown'} onChange={() => updateConfig({ outputFormat: 'markdown' })} label="Markdown" />
              <Radio name="outputFormat" value="html" checked={config.outputFormat === 'html'} onChange={() => updateConfig({ outputFormat: 'html' })} label="Cleaned HTML" />
              <Radio name="outputFormat" value="structured-json" checked={config.outputFormat === 'structured-json'} onChange={() => updateConfig({ outputFormat: 'structured-json' })} label="Structured JSON" />
            </div>
          </div>
        </Section>

        {/* Content Options */}
        <Section title="Content Options">
          <div className="space-y-3">
            <Toggle checked={config.includeDrafts} onChange={v => updateConfig({ includeDrafts: v })} label="Include draft posts" />
            <Toggle checked={config.includeResponses} onChange={v => updateConfig({ includeResponses: v })} label="Include responses/comments" desc="Short replies you wrote on other people's posts" />
            <Toggle checked={config.separateDrafts} onChange={v => updateConfig({ separateDrafts: v })} label="Separate drafts into their own folder" />
            <Toggle checked={config.extractFeatured} onChange={v => updateConfig({ extractFeatured: v })} label="Extract featured image to front matter" />
            <Toggle checked={config.removeFeaturedFromBody} onChange={v => updateConfig({ removeFeaturedFromBody: v })} label="Remove featured image from body" desc="Avoids duplication if your theme renders the front matter image" />
            <Toggle checked={config.injectEarnings} onChange={v => updateConfig({ injectEarnings: v })} label="Inject Partner Program earnings into front matter" />
          </div>
        </Section>

        {/* Image Handling */}
        <Section title="Image Handling">
          <div className="space-y-2">
            <Radio name="images" value="reference" checked={config.imagesMode === 'reference'} onChange={() => updateConfig({ imagesMode: 'reference' })}
              label="Keep Medium CDN URLs" desc="Fast but URLs may break over time" />
            <Radio name="images" value="download" checked={config.imagesMode === 'download'} onChange={() => updateConfig({ imagesMode: 'download' })}
              label="Download images locally" desc="Images fetched from Medium's CDN during export. Requires internet." />
          </div>
          {config.imagesMode === 'download' && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Note: Image downloading in the browser requires CORS access to Medium's CDN. Some images may fail. For reliable image downloading, use the Meddler CLI tool.
              </p>
            </div>
          )}
          <Toggle checked={config.perPostDirs} onChange={v => updateConfig({ perPostDirs: v })} label="Organize images per post" desc="images/post-slug/01.jpeg instead of flat" />
        </Section>

        {/* Embed Handling */}
        <Section title="Embed Handling" defaultOpen={false}>
          <div className="space-y-2">
            <Radio name="embeds" value="raw_html" checked={config.embedsMode === 'raw_html'} onChange={() => updateConfig({ embedsMode: 'raw_html' })}
              label="Raw HTML" desc="Preserves iframes for YouTube, Gists, etc." />
            <Radio name="embeds" value="shortcodes" checked={config.embedsMode === 'shortcodes'} onChange={() => updateConfig({ embedsMode: 'shortcodes' })}
              label="SSG shortcodes" desc="Auto-detects YouTube, Gist, Tweet embeds" />
            <Radio name="embeds" value="placeholders" checked={config.embedsMode === 'placeholders'} onChange={() => updateConfig({ embedsMode: 'placeholders' })}
              label="Placeholder links" desc="Most portable — plain Markdown links" />
          </div>
        </Section>

        {/* Supplementary Data */}
        <Section title="Supplementary Data" defaultOpen={false}>
          <div className="grid sm:grid-cols-2 gap-2">
            <Toggle checked={config.supplementary.bookmarks} onChange={v => updateConfig({ supplementary: { ...config.supplementary, bookmarks: v } })} label="Bookmarks (reading list)" />
            <Toggle checked={config.supplementary.claps} onChange={v => updateConfig({ supplementary: { ...config.supplementary, claps: v } })} label="Claps (liked posts)" />
            <Toggle checked={config.supplementary.highlights} onChange={v => updateConfig({ supplementary: { ...config.supplementary, highlights: v } })} label="Highlights (quotes)" />
            <Toggle checked={config.supplementary.interests} onChange={v => updateConfig({ supplementary: { ...config.supplementary, interests: v } })} label="Interests (tags & topics)" />
            <Toggle checked={config.supplementary.lists} onChange={v => updateConfig({ supplementary: { ...config.supplementary, lists: v } })} label="Lists (curated collections)" />
            <Toggle checked={config.supplementary.earnings} onChange={v => updateConfig({ supplementary: { ...config.supplementary, earnings: v } })} label="Earnings data" />
            <Toggle checked={config.supplementary.socialGraph} onChange={v => updateConfig({ supplementary: { ...config.supplementary, socialGraph: v } })} label="Social graph (following)" />
            <Toggle checked={config.supplementary.profile} onChange={v => updateConfig({ supplementary: { ...config.supplementary, profile: v } })} label="Profile / author data" />
            <Toggle checked={config.supplementary.sessions} onChange={v => updateConfig({ supplementary: { ...config.supplementary, sessions: v } })} label="Sessions & IP history" desc="Privacy-sensitive" />
            <Toggle checked={config.supplementary.blocks} onChange={v => updateConfig({ supplementary: { ...config.supplementary, blocks: v } })} label="Blocked users" desc="Private moderation data" />
          </div>
        </Section>

        {/* Advanced */}
        <Section title="Advanced" defaultOpen={false}>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Section Breaks</p>
              <div className="flex gap-4">
                <Radio name="sectionBreaks" value="hr" checked={config.sectionBreaks === 'hr'} onChange={() => updateConfig({ sectionBreaks: 'hr' })} label="Horizontal rule (---)" />
                <Radio name="sectionBreaks" value="none" checked={config.sectionBreaks === 'none'} onChange={() => updateConfig({ sectionBreaks: 'none' })} label="None" />
                <Radio name="sectionBreaks" value="spacing" checked={config.sectionBreaks === 'spacing'} onChange={() => updateConfig({ sectionBreaks: 'spacing' })} label="Extra spacing" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Date Format</p>
              <div className="flex gap-4">
                <Radio name="dateFormat" value="iso8601" checked={config.dateFormat === 'iso8601'} onChange={() => updateConfig({ dateFormat: 'iso8601' })} label="ISO 8601" desc="2016-03-25T05:53:26.260Z" />
                <Radio name="dateFormat" value="yyyy-mm-dd" checked={config.dateFormat === 'yyyy-mm-dd'} onChange={() => updateConfig({ dateFormat: 'yyyy-mm-dd' })} label="Date only" desc="2016-03-25" />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Extra Front Matter Fields</p>
              {config.extraFields.map((field: { key: string; value: string }, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input className="input-base flex-1" placeholder="key" value={field.key}
                    onChange={e => { const f = [...config.extraFields]; f[i] = { ...f[i], key: e.target.value }; updateConfig({ extraFields: f }) }} />
                  <input className="input-base flex-1" placeholder="value" value={field.value}
                    onChange={e => { const f = [...config.extraFields]; f[i] = { ...f[i], value: e.target.value }; updateConfig({ extraFields: f }) }} />
                  <button onClick={() => { const f = [...config.extraFields]; f.splice(i, 1); updateConfig({ extraFields: f }) }}
                    className="p-1.5 text-zinc-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => updateConfig({ extraFields: [...config.extraFields, { key: '', value: '' }] })}
                className="text-xs text-green-600 hover:underline inline-flex items-center gap-1 mt-1"><Plus size={12} /> Add field</button>
            </div>
          </div>
        </Section>
      </div>

      {/* Live Preview */}
      <div className="mt-6">
        <button onClick={() => setShowPreview(!showPreview)}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-green-600 transition-colors mb-3">
          <Eye size={16} />
          {showPreview ? 'Hide' : 'Show'} live preview
        </button>
        {showPreview && samplePost && (
          <div className="card overflow-hidden">
            <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
              <span>Preview: {samplePost.title}</span>
              <span className="text-zinc-400">{config.outputFormat === 'markdown' ? '.md' : config.outputFormat === 'html' ? '.html' : '.json'}</span>
            </div>
            <pre className="p-4 text-xs leading-relaxed overflow-x-auto max-h-96 bg-zinc-950 text-green-400 font-mono">
              {livePreview.slice(0, 3000)}{livePreview.length > 3000 ? '\n\n... (truncated)' : ''}
            </pre>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button onClick={() => setStep('preview')} className="btn-secondary">
          <ArrowLeft size={16} />
          Back
        </button>
        <button onClick={() => setStep('export')} className="btn-primary">
          Export
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
