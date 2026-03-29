import { useState, useEffect, useRef } from 'react'
import { Sun, Moon, Menu, X } from 'lucide-react'
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash'
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml'
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json'
import toml from 'react-syntax-highlighter/dist/esm/languages/prism/toml'

SyntaxHighlighter.registerLanguage('bash', bash)
SyntaxHighlighter.registerLanguage('yaml', yaml)
SyntaxHighlighter.registerLanguage('json', json)
SyntaxHighlighter.registerLanguage('toml', toml)

const NAV_ITEMS = [
  { id: 'quick-start', label: 'Quick Start', depth: 0 },
  { id: 'command-reference', label: 'Command Reference', depth: 0 },
  { id: 'meddler-convert', label: 'convert', depth: 1 },
  { id: 'meddler-validate', label: 'validate', depth: 1 },
  { id: 'meddler-info', label: 'info', depth: 1 },
  { id: 'target-ssg-presets', label: 'SSG Presets', depth: 0 },
  { id: 'front-matter-formats', label: 'Front Matter', depth: 0 },
  { id: 'image-handling', label: 'Images', depth: 0 },
  { id: 'date-formats', label: 'Dates', depth: 0 },
  { id: 'advanced-configuration', label: 'Advanced', depth: 0 },
  { id: 'troubleshooting', label: 'Troubleshooting', depth: 0 },
  { id: 'examples', label: 'Examples', depth: 0 },
  { id: 'tips', label: 'Tips', depth: 0 },
]

function Code({ lang, children }: { lang: string; children: string }) {
  const [dark, setDark] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const update = () => setDark(document.documentElement.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const copy = () => {
    navigator.clipboard.writeText(children.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative group mb-4 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm">
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{lang}</span>
        <button
          onClick={copy}
          className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors px-2 py-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={lang === 'bash' ? 'bash' : lang === 'yaml' ? 'yaml' : lang === 'toml' ? 'toml' : lang === 'json' ? 'json' : lang}
        style={dark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.85rem',
          lineHeight: '1.6',
          padding: '1.25rem 1.25rem',
        }}
        wrapLongLines={true}
      >
        {children.trim()}
      </SyntaxHighlighter>
    </div>
  )
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded text-sm font-mono text-green-700 dark:text-green-400">
      {children}
    </code>
  )
}

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="mb-6 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-50 dark:bg-zinc-800/80 border-b border-zinc-200 dark:border-zinc-700">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionHeading({ id, level, children }: { id: string; level: 2 | 3 | 4; children: React.ReactNode }) {
  const Tag = `h${level}` as 'h2' | 'h3' | 'h4'
  const cls =
    level === 2
      ? 'text-2xl font-bold mt-10 mb-4 text-zinc-900 dark:text-zinc-50 scroll-mt-20'
      : level === 3
      ? 'text-lg font-semibold mt-7 mb-3 text-zinc-800 dark:text-zinc-100 scroll-mt-20'
      : 'text-base font-semibold mt-5 mb-2 text-zinc-700 dark:text-zinc-200 uppercase tracking-wide text-xs scroll-mt-20'

  return (
    <Tag id={id} className={cls}>
      <a href={`#${id}`} className="group">
        {children}
        <span className="ml-2 opacity-0 group-hover:opacity-40 transition-opacity text-zinc-400">#</span>
      </a>
    </Tag>
  )
}

export default function Docs() {
  const [darkMode, setDarkMode] = useState(false)
  const [activeId, setActiveId] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = saved !== null ? saved === 'true' : prefersDark
    setDarkMode(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('darkMode', String(next))
  }

  useEffect(() => {
    const onScroll = () => {
      const ids = NAV_ITEMS.map(n => n.id)
      let current = ''
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= 120) current = id
      }
      setActiveId(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMobileNavOpen(false)
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">

        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-50/80 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl flex-shrink-0">Ⓜ️</span>
              <span className="font-bold text-lg tracking-tight flex-shrink-0">Meddler</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1 hidden sm:inline flex-shrink-0">CLI Documentation</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile nav toggle */}
              <button
                onClick={() => setMobileNavOpen(o => !o)}
                className="lg:hidden p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Toggle navigation"
              >
                {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              <a
                href="/"
                className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors hidden sm:inline"
              >
                ← App
              </a>
              <button
                onClick={toggleDark}
                className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>

          {/* Mobile nav dropdown */}
          {mobileNavOpen && (
            <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-md px-4 py-3 max-h-64 overflow-y-auto">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Contents</p>
              <ul className="space-y-0.5">
                {NAV_ITEMS.map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollTo(item.id)}
                      className={`w-full text-left text-sm py-1.5 px-2 rounded transition-colors ${
                        item.depth === 1 ? 'pl-5' : ''
                      } ${
                        activeId === item.id
                          ? 'text-green-700 dark:text-green-400 font-medium bg-green-50 dark:bg-green-950/30'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      {item.depth === 1 && <span className="text-zinc-400 mr-1">·</span>}
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </header>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="lg:grid lg:grid-cols-4 lg:gap-10">

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block lg:col-span-1">
              <nav className="sticky top-24">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Contents</p>
                <ul className="space-y-0.5 text-sm">
                  {NAV_ITEMS.map(item => (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollTo(item.id)}
                        className={`w-full text-left py-1.5 px-2.5 rounded-lg transition-colors ${
                          item.depth === 1 ? 'pl-5' : ''
                        } ${
                          activeId === item.id
                            ? 'text-green-700 dark:text-green-400 font-medium bg-green-50 dark:bg-green-950/30'
                            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        {item.depth === 1 && <span className="text-zinc-300 dark:text-zinc-600 mr-1.5">·</span>}
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Main Content */}
            <main ref={contentRef} className="lg:col-span-3 min-w-0">
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">
                  Meddler CLI Docs
                </h1>
                <p className="text-lg text-zinc-500 dark:text-zinc-400">
                  Complete reference for all command-line options and configuration.
                </p>
              </div>

              {/* Quick Start */}
              <SectionHeading id="quick-start" level={2}>Quick Start</SectionHeading>
              <Code lang="bash">{`# Basic conversion
meddler convert export.zip

# Advanced Eleventy setup
meddler convert export.zip \\
  --target eleventy \\
  --format yaml \\
  --images download \\
  --unquoted-dates \\
  --rewrite-image-urls`}</Code>

              {/* Command Reference */}
              <SectionHeading id="command-reference" level={2}>Command Reference</SectionHeading>

              <SectionHeading id="meddler-convert" level={3}><InlineCode>meddler convert</InlineCode></SectionHeading>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">Convert a Medium export to static site generator formats.</p>
              <Code lang="bash">meddler convert &lt;input-path&gt; [options]</Code>

              <SectionHeading id="convert-arguments" level={4}>Arguments</SectionHeading>
              <ul className="mb-5 space-y-1 text-zinc-600 dark:text-zinc-400">
                <li><InlineCode>&lt;input-path&gt;</InlineCode> — Path to extracted Medium export folder or <InlineCode>.zip</InlineCode> file</li>
              </ul>

              <SectionHeading id="output-options" level={4}>Output Options</SectionHeading>
              <Table
                headers={['Option', 'Short', 'Description', 'Default']}
                rows={[
                  [<InlineCode>--output &lt;dir&gt;</InlineCode>, <InlineCode>-o</InlineCode>, 'Output directory', <InlineCode>./meddler-output</InlineCode>],
                  [<InlineCode>--dry-run</InlineCode>, '—', 'Preview without writing files', <InlineCode>false</InlineCode>],
                ]}
              />

              <SectionHeading id="front-matter-options" level={4}>Front Matter Options</SectionHeading>
              <Table
                headers={['Option', 'Description', 'Default']}
                rows={[
                  [<InlineCode>--format &lt;fmt&gt;</InlineCode>, <span>Format: <InlineCode>yaml</InlineCode>, <InlineCode>toml</InlineCode>, <InlineCode>json</InlineCode>, <InlineCode>none</InlineCode></span>, <InlineCode>yaml</InlineCode>],
                  [<InlineCode>--output-format &lt;fmt&gt;</InlineCode>, <span>Output: <InlineCode>markdown</InlineCode>, <InlineCode>html</InlineCode>, <InlineCode>structured-json</InlineCode></span>, <InlineCode>markdown</InlineCode>],
                  [<InlineCode>--target &lt;ssg&gt;</InlineCode>, <span>SSG: <InlineCode>generic</InlineCode>, <InlineCode>hugo</InlineCode>, <InlineCode>eleventy</InlineCode>, <InlineCode>jekyll</InlineCode>, <InlineCode>astro</InlineCode></span>, <InlineCode>generic</InlineCode>],
                  [<InlineCode>--earnings</InlineCode>, 'Inject partner program earnings', <InlineCode>false</InlineCode>],
                  [<InlineCode>--unquoted-dates</InlineCode>, 'Output dates without quotes (Eleventy)', <InlineCode>false</InlineCode>],
                  [<InlineCode>--rewrite-image-urls</InlineCode>, 'Rewrite Medium CDN URLs to local paths', <InlineCode>false</InlineCode>],
                  [<InlineCode>--image-base-url &lt;url&gt;</InlineCode>, 'Base URL for rewritten images', <InlineCode>/images</InlineCode>],
                ]}
              />

              <SectionHeading id="content-options" level={4}>Content Options</SectionHeading>
              <Table
                headers={['Option', 'Description', 'Default']}
                rows={[
                  [<InlineCode>--drafts</InlineCode>, 'Include draft posts', <InlineCode>true</InlineCode>],
                  [<InlineCode>--no-drafts</InlineCode>, 'Exclude draft posts', <InlineCode>false</InlineCode>],
                  [<InlineCode>--responses</InlineCode>, 'Include short responses/comments', <InlineCode>false</InlineCode>],
                ]}
              />

              <SectionHeading id="image-options" level={4}>Image Options</SectionHeading>
              <Table
                headers={['Option', 'Description', 'Default']}
                rows={[
                  [<InlineCode>--images &lt;mode&gt;</InlineCode>, <span>Mode: <InlineCode>reference</InlineCode>, <InlineCode>download</InlineCode>, <InlineCode>optimize</InlineCode></span>, <InlineCode>reference</InlineCode>],
                ]}
              />

              <SectionHeading id="embed-options" level={4}>Embed Options</SectionHeading>
              <Table
                headers={['Option', 'Description', 'Default']}
                rows={[
                  [<InlineCode>--embeds &lt;mode&gt;</InlineCode>, <span>Mode: <InlineCode>raw_html</InlineCode>, <InlineCode>shortcodes</InlineCode>, <InlineCode>placeholders</InlineCode></span>, <InlineCode>raw_html</InlineCode>],
                ]}
              />

              <SectionHeading id="data-options" level={4}>Data Options</SectionHeading>
              <Table
                headers={['Option', 'Description', 'Default']}
                rows={[
                  [<InlineCode>--supplementary</InlineCode>, 'Convert supplementary data', <InlineCode>true</InlineCode>],
                  [<InlineCode>--no-supplementary</InlineCode>, 'Skip supplementary data', <InlineCode>false</InlineCode>],
                  [<InlineCode>--include-all</InlineCode>, 'Include all data (sessions, IPs, blocks)', <InlineCode>false</InlineCode>],
                ]}
              />

              <SectionHeading id="other-options" level={4}>Other Options</SectionHeading>
              <Table
                headers={['Option', 'Description', 'Default']}
                rows={[
                  [<InlineCode>--verbose</InlineCode>, 'Verbose logging output', <InlineCode>false</InlineCode>],
                ]}
              />

              <SectionHeading id="meddler-validate" level={3}><InlineCode>meddler validate</InlineCode></SectionHeading>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">Validate a Medium export without converting.</p>
              <Code lang="bash">meddler validate &lt;input-path&gt;</Code>

              <SectionHeading id="meddler-info" level={3}><InlineCode>meddler info</InlineCode></SectionHeading>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">Show information about a Medium export.</p>
              <Code lang="bash">meddler info &lt;input-path&gt;</Code>

              {/* SSG Presets */}
              <SectionHeading id="target-ssg-presets" level={2}>Target SSG Presets</SectionHeading>
              <p className="mb-5 text-zinc-600 dark:text-zinc-400">Each SSG target applies specific defaults optimised for that platform.</p>

              <SectionHeading id="preset-hugo" level={3}>Hugo</SectionHeading>
              <Code lang="bash">meddler convert export.zip --target hugo</Code>
              <ul className="mb-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>Front matter: <InlineCode>toml</InlineCode> (Hugo's preferred format)</li>
                <li>Embeds: <InlineCode>shortcodes</InlineCode> (Hugo shortcode format)</li>
                <li>Output: Page bundles — <InlineCode>content/posts/slug/index.md</InlineCode></li>
              </ul>

              <SectionHeading id="preset-jekyll" level={3}>Jekyll</SectionHeading>
              <Code lang="bash">meddler convert export.zip --target jekyll</Code>
              <ul className="mb-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>Front matter: <InlineCode>yaml</InlineCode></li>
                <li>Output: <InlineCode>_posts/YYYY-MM-DD-slug.md</InlineCode> (date-prefixed)</li>
                <li>Drafts: <InlineCode>_drafts/slug.md</InlineCode></li>
              </ul>

              <SectionHeading id="preset-eleventy" level={3}>Eleventy</SectionHeading>
              <Code lang="bash">meddler convert export.zip --target eleventy</Code>
              <ul className="mb-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>Front matter: <InlineCode>yaml</InlineCode></li>
                <li>Output: <InlineCode>posts/slug.md</InlineCode></li>
                <li>Drafts: <InlineCode>drafts/slug.md</InlineCode></li>
              </ul>
              <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Recommended Eleventy flags:</p>
              <Code lang="bash">--unquoted-dates --rewrite-image-urls --image-base-url "/images"</Code>

              <SectionHeading id="preset-astro" level={3}>Astro</SectionHeading>
              <Code lang="bash">meddler convert export.zip --target astro</Code>
              <ul className="mb-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>Front matter: <InlineCode>yaml</InlineCode></li>
                <li>Output: <InlineCode>src/content/posts/slug.md</InlineCode></li>
              </ul>

              <SectionHeading id="preset-generic" level={3}>Generic</SectionHeading>
              <Code lang="bash">meddler convert export.zip --target generic</Code>
              <ul className="mb-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>Front matter: <InlineCode>yaml</InlineCode></li>
                <li>Output: <InlineCode>posts/slug.md</InlineCode></li>
              </ul>

              {/* Front Matter Formats */}
              <SectionHeading id="front-matter-formats" level={2}>Front Matter Formats</SectionHeading>

              <SectionHeading id="fmt-yaml" level={3}>YAML (Default)</SectionHeading>
              <Code lang="yaml">{`---
title: "My Post"
date: "2025-12-28T00:00:00.000Z"
slug: my-post
canonical_url: https://medium.com/@user/my-post
author: Author Name
medium_id: abc123def456
draft: false
tags: []
---`}</Code>

              <SectionHeading id="fmt-toml" level={3}>TOML</SectionHeading>
              <Code lang="toml">{`+++
title = "My Post"
date = 2025-12-28T00:00:00.000Z
slug = "my-post"
canonical_url = "https://medium.com/@user/my-post"
author = "Author Name"
medium_id = "abc123def456"
draft = false
tags = []
+++`}</Code>

              <SectionHeading id="fmt-json" level={3}>JSON</SectionHeading>
              <Code lang="json">{`{
  "title": "My Post",
  "date": "2025-12-28T00:00:00.000Z",
  "slug": "my-post",
  "canonical_url": "https://medium.com/@user/my-post",
  "author": "Author Name",
  "medium_id": "abc123def456",
  "draft": false,
  "tags": []
}`}</Code>

              {/* Image Handling */}
              <SectionHeading id="image-handling" level={2}>Image Handling</SectionHeading>

              <SectionHeading id="img-reference" level={3}>Reference Mode (Default)</SectionHeading>
              <p className="mb-3 text-zinc-600 dark:text-zinc-400">Keep Medium CDN URLs in front matter; images are not downloaded.</p>
              <Code lang="yaml">image: https://cdn-images-1.medium.com/max/2560/1*abc123.jpeg</Code>

              <SectionHeading id="img-download" level={3}>Download Mode</SectionHeading>
              <p className="mb-3 text-zinc-600 dark:text-zinc-400">Download all images locally.</p>
              <Code lang="bash">meddler convert export.zip --images download</Code>
              <ul className="mb-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>Images saved to <InlineCode>images/&lt;slug&gt;/</InlineCode></li>
                <li>Front matter still references CDN URLs</li>
                <li>Markdown uses local paths: <InlineCode>![](images/&lt;slug&gt;/filename.jpg)</InlineCode></li>
              </ul>

              <SectionHeading id="img-optimize" level={3}>Optimize Mode</SectionHeading>
              <p className="mb-3 text-zinc-600 dark:text-zinc-400">Download and optimise images (requires external tools).</p>
              <Code lang="bash">meddler convert export.zip --images optimize</Code>

              {/* Date Formats */}
              <SectionHeading id="date-formats" level={2}>Date Formats</SectionHeading>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">Control how dates are formatted in front matter:</p>
              <Table
                headers={['Format', 'Example', 'Description']}
                rows={[
                  [<InlineCode>iso8601</InlineCode>, <InlineCode>2025-12-28T14:30:00.000Z</InlineCode>, 'ISO 8601 with time'],
                  [<InlineCode>yyyy-mm-dd</InlineCode>, <InlineCode>2025-12-28</InlineCode>, 'Date only'],
                  [<InlineCode>unix</InlineCode>, <InlineCode>1735398600</InlineCode>, 'Unix timestamp'],
                ]}
              />
              <Code lang="bash">meddler convert export.zip --format yaml --frontMatter.dateFormat yyyy-mm-dd</Code>

              {/* Advanced Configuration */}
              <SectionHeading id="advanced-configuration" level={2}>Advanced Configuration</SectionHeading>

              <SectionHeading id="config-file" level={3}>Configuration File</SectionHeading>
              <p className="mb-3 text-zinc-600 dark:text-zinc-400">Create <InlineCode>.meddlerrc.json</InlineCode> in your project root:</p>
              <Code lang="json">{`{
  "format": "yaml",
  "target": "eleventy",
  "outputFormat": "markdown",
  "includeDrafts": true,
  "includeResponses": false,
  "separateDrafts": true,
  "frontMatter": {
    "extraFields": {
      "category": "blog",
      "lang": "en"
    },
    "dateFormat": "iso8601",
    "injectEarnings": false,
    "unquotedDates": false,
    "rewriteImageUrls": false,
    "imageBaseUrl": "/images"
  },
  "images": {
    "mode": "download",
    "outputDir": "assets/images",
    "perPostDirs": true,
    "extractFeatured": true,
    "removeFeaturedFromBody": false
  },
  "embeds": {
    "mode": "shortcodes",
    "shortcodeFormat": "hugo"
  },
  "content": {
    "sectionBreaks": "hr",
    "dropCaps": "strip"
  },
  "supplementary": {
    "bookmarks": true,
    "claps": true,
    "highlights": true,
    "interests": true,
    "lists": true,
    "earnings": true,
    "socialGraph": true,
    "profile": true,
    "blogrollFormat": "opml"
  }
}`}</Code>

              <SectionHeading id="extra-fields" level={3}>Extra Front Matter Fields</SectionHeading>
              <p className="mb-3 text-zinc-600 dark:text-zinc-400">Add custom fields to all posts:</p>
              <Code lang="bash">meddler convert export.zip --extraFields category:blog --extraFields lang:en</Code>

              {/* Troubleshooting */}
              <SectionHeading id="troubleshooting" level={2}>Troubleshooting</SectionHeading>

              <SectionHeading id="common-issues" level={3}>Common Issues</SectionHeading>

              <div className="space-y-4 mb-6">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Export not found</p>
                  <Code lang="bash">meddler validate path/to/export</Code>
                </div>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Images not downloading</p>
                  <ul className="space-y-1 text-zinc-600 dark:text-zinc-400 text-sm">
                    <li>Check internet connection</li>
                    <li>Verify Medium CDN URLs are accessible</li>
                    <li>Try <InlineCode>--verbose</InlineCode> for detailed error messages</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Date parsing issues</p>
                  <ul className="space-y-1 text-zinc-600 dark:text-zinc-400 text-sm">
                    <li>Use <InlineCode>--unquoted-dates</InlineCode> for Eleventy</li>
                    <li>Check <InlineCode>--frontMatter.dateFormat</InlineCode> setting</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Permission denied</p>
                  <ul className="space-y-1 text-zinc-600 dark:text-zinc-400 text-sm">
                    <li>Check output directory permissions</li>
                    <li>Use <InlineCode>sudo</InlineCode> only if necessary</li>
                  </ul>
                </div>
              </div>

              <SectionHeading id="verbose-output" level={3}>Verbose Output</SectionHeading>
              <p className="mb-3 text-zinc-600 dark:text-zinc-400">Get detailed conversion information:</p>
              <Code lang="bash">meddler convert export.zip --verbose</Code>
              <ul className="mb-5 space-y-1.5 text-zinc-600 dark:text-zinc-400">
                <li>Files being processed</li>
                <li>Image download status</li>
                <li>Warnings and errors</li>
                <li>Conversion statistics</li>
              </ul>

              {/* Examples */}
              <SectionHeading id="examples" level={2}>Examples</SectionHeading>

              <SectionHeading id="ex-blog" level={3}>Basic Blog Migration</SectionHeading>
              <Code lang="bash">{`meddler convert medium-export.zip \\
  --target jekyll \\
  --output my-blog \\
  --images download`}</Code>

              <SectionHeading id="ex-eleventy" level={3}>Eleventy Setup</SectionHeading>
              <Code lang="bash">{`meddler convert medium-export.zip \\
  --target eleventy \\
  --unquoted-dates \\
  --rewrite-image-urls \\
  --image-base-url "/assets/images" \\
  --images download \\
  --earnings`}</Code>

              <SectionHeading id="ex-hugo" level={3}>Hugo with Custom Fields</SectionHeading>
              <Code lang="bash">{`meddler convert medium-export.zip \\
  --target hugo \\
  --extraFields category:tech \\
  --extraFields featured:true \\
  --frontMatter.dateFormat yyyy-mm-dd`}</Code>

              <SectionHeading id="ex-minimal" level={3}>Minimal Export</SectionHeading>
              <Code lang="bash">{`meddler convert medium-export.zip \\
  --format none \\
  --no-supplementary \\
  --no-drafts`}</Code>

              {/* Tips */}
              <SectionHeading id="tips" level={2}>Tips</SectionHeading>
              <ol className="space-y-3 mb-8">
                {[
                  ['Always validate first', <>Run <InlineCode>meddler validate</InlineCode> before converting</>],
                  ['Use dry-run', <>Test options with <InlineCode>--dry-run</InlineCode> before full conversion</>],
                  ['Preserve original', 'Keep your Medium export as a backup'],
                  ['Check output', 'Verify converted files look as expected'],
                  ['Iterate', 'Adjust options and re-run as needed'],
                ].map(([title, desc], i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400 text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      <strong className="text-zinc-800 dark:text-zinc-200">{title}</strong> — {desc}
                    </span>
                  </li>
                ))}
              </ol>

              {/* Footer */}
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-8 mt-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                <p>Your files never leave your browser. 100% client-side processing.</p>
                <p className="mt-1">
                  🍓 A{' '}
                  <a href="https://berryhouse.ca" className="underline hover:text-zinc-700 dark:hover:text-zinc-200" target="_blank" rel="noopener noreferrer">
                    Berry House
                  </a>{' '}
                  project by{' '}
                  <a href="https://brennan.day" className="underline hover:text-zinc-700 dark:hover:text-zinc-200" target="_blank" rel="noopener noreferrer">
                    Brennan Kenneth Brown
                  </a>
                </p>
                <p className="mt-1">
                  <a href="https://github.com/brennanbrown/meddler" className="underline hover:text-zinc-700 dark:hover:text-zinc-200" target="_blank" rel="noopener noreferrer">GitHub</a>
                  {' · '}
                  <a href="https://ko-fi.com/brennan" className="underline hover:text-zinc-700 dark:hover:text-zinc-200" target="_blank" rel="noopener noreferrer">Support Meddler</a>
                  {' · '}
                  AGPL-3.0 License
                </p>
                <p className="mt-1">Not affiliated with Medium</p>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
