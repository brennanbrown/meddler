import * as cheerio from 'cheerio'
import JSZip from 'jszip'
import {
  extractMetadata,
  convertBody,
  generateFrontMatter,
  parseProfile,
  parseAbout,
  parsePublications,
  parseBookmarks,
  parseClaps,
  parseHighlights,
  parseList,
  parseEarnings,
  parseFollowing,
  parseInterests,
  MeddlerConfig,
  DEFAULT_CONFIG as CORE_DEFAULTS,
  PostMetadata,
  ImageRef,
} from '@berryhouse/core'
import type { ParsedPost, ExportSummary, ConfigState, ConversionProgress, LogEntry } from './store'

/**
 * Read uploaded files (from zip or folder) into a Map<path, content>.
 */
export async function readUploadedFiles(fileList: FileList): Promise<Map<string, string>> {
  const files = new Map<string, string>()
  const firstFile = fileList[0]

  if (firstFile && firstFile.name.endsWith('.zip')) {
    const zip = new JSZip()
    const loaded = await zip.loadAsync(firstFile)
    const entries = Object.entries(loaded.files)

    for (const [path, zipEntry] of entries) {
      if (zipEntry.dir) continue
      if (!path.endsWith('.html')) continue
      const content = await zipEntry.async('string')
      // Strip only the top-level hash directory (first segment)
      const parts = path.split('/')
      if (parts.length === 1) {
        // Root-level file (like README.html)
        files.set(parts[0], content)
      } else {
        // Check if first segment is a hash directory (looks like a hex hash)
        const firstSegment = parts[0]
        if (/^[a-f0-9]{10,}$/.test(firstSegment)) {
          parts.shift() // Remove hash directory
        }
        const normalized = parts.join('/')
        files.set(normalized, content)
      }
    }
  } else {
    // Folder upload
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (!file.name.endsWith('.html')) continue
      const relativePath = (file as any).webkitRelativePath || file.name
      // Strip top-level directory
      const normalized = relativePath.replace(/^[^/]+\//, '')
      const content = await file.text()
      files.set(normalized, content)
    }
  }

  return files
}

/**
 * Validate the uploaded files form a Medium export.
 */
export function validateExport(files: Map<string, string>): { valid: boolean; message: string; warning?: string } {
  if (files.size === 0) {
    return { valid: false, message: "No HTML files found. Make sure you're uploading a Medium export ZIP or folder." }
  }

  if (!files.has('README.html')) {
    return { valid: false, message: "This doesn't look like a Medium export. No README.html found." }
  }

  const postFiles = Array.from(files.keys()).filter(k => k.startsWith('posts/'))
  if (postFiles.length === 0) {
    // Check if there's any supplementary data at all
    const hasSupplementary = Array.from(files.keys()).some(k =>
      k.startsWith('profile/') || k.startsWith('bookmarks/') || k.startsWith('claps/') ||
      k.startsWith('lists/') || k.startsWith('partner-program/') || k.startsWith('interests/')
    )
    if (hasSupplementary) {
      return { valid: true, message: '', warning: 'No posts found in this export. Only supplementary data (profile, bookmarks, etc.) will be available.' }
    }
    return { valid: false, message: "This export doesn't contain any posts or supplementary data." }
  }

  return { valid: true, message: '' }
}

/**
 * Analyze the export and return a summary + parsed post list.
 */
export function analyzeExport(files: Map<string, string>): { summary: ExportSummary; posts: ParsedPost[] } {
  const posts: ParsedPost[] = []

  // Parse profile
  let authorName: string | null = null
  let username: string | null = null
  let email: string | null = null
  let createdAt: string | null = null
  let avatarUrl: string | null = null

  const profileHtml = files.get('profile/profile.html')
  if (profileHtml) {
    const profile = parseProfile(profileHtml)
    authorName = profile.displayName
    username = profile.username
    email = profile.email
    createdAt = profile.createdAt
    avatarUrl = profile.avatarUrl
  }

  // If no profile, try README
  if (!authorName) {
    const readme = files.get('README.html')
    if (readme) {
      const match = readme.match(/Archive for ([^<]+)/)
      if (match) authorName = match[1].trim()
    }
  }

  // Parse posts
  const postFiles = Array.from(files.keys()).filter(k => k.startsWith('posts/') && k.endsWith('.html'))

  let earliest: string | null = null
  let latest: string | null = null

  for (const path of postFiles) {
    const html = files.get(path)!
    const filename = path.replace('posts/', '')
    const meta = extractMetadata(html, filename)

    const isResponse = meta.type === 'response'
    const isDraft = meta.draft

    posts.push({
      filename,
      title: meta.title,
      subtitle: meta.subtitle,
      date: meta.date,
      slug: meta.slug,
      mediumId: meta.mediumId,
      isDraft,
      isResponse,
      type: meta.type,
      selected: isDraft || !isResponse,
      html,
    })

    if (meta.date) {
      if (!earliest || meta.date < earliest) earliest = meta.date
      if (!latest || meta.date > latest) latest = meta.date
    }
  }

  // Sort by date desc, drafts at end
  posts.sort((a, b) => {
    if (a.isDraft && !b.isDraft) return 1
    if (!a.isDraft && b.isDraft) return -1
    if (a.date && b.date) return b.date.localeCompare(a.date)
    if (a.date) return -1
    return 1
  })

  // Count supplementary data
  const countDir = (prefix: string) =>
    Array.from(files.keys()).filter(k => k.startsWith(prefix) && k.endsWith('.html')).length

  const summary: ExportSummary = {
    authorName,
    username,
    email,
    createdAt,
    avatarUrl,
    publishedCount: posts.filter(p => p.type === 'published').length,
    draftCount: posts.filter(p => p.type === 'draft').length,
    responseCount: posts.filter(p => p.type === 'response').length,
    dateRange: { earliest, latest },
    bookmarkPages: countDir('bookmarks/'),
    clapPages: countDir('claps/'),
    highlightPages: countDir('highlights/'),
    listCount: countDir('lists/'),
    hasEarnings: countDir('partner-program/') > 0,
    hasSocialGraph: countDir('users-following/') > 0 || countDir('pubs-following/') > 0,
  }

  return { summary, posts }
}

/**
 * Build a MeddlerConfig from the web ConfigState.
 */
function buildCoreConfig(config: ConfigState): MeddlerConfig {
  return {
    ...CORE_DEFAULTS,
    input: '',
    output: '',
    format: config.format,
    outputFormat: config.outputFormat,
    target: config.target,
    includeDrafts: config.includeDrafts,
    includeResponses: config.includeResponses,
    separateDrafts: config.separateDrafts,
    frontMatter: {
      extraFields: Object.fromEntries(config.extraFields.filter(f => f.key).map(f => [f.key, f.value])),
      dateFormat: config.dateFormat,
      injectEarnings: config.injectEarnings,
    },
    images: {
      mode: config.imagesMode,
      outputDir: 'images',
      perPostDirs: config.perPostDirs,
      extractFeatured: config.extractFeatured,
      removeFeaturedFromBody: config.removeFeaturedFromBody,
    },
    embeds: {
      mode: config.embedsMode,
      shortcodeFormat: config.target,
    },
    content: {
      sectionBreaks: config.sectionBreaks,
      dropCaps: 'strip',
    },
    supplementary: {
      bookmarks: config.supplementary.bookmarks,
      claps: config.supplementary.claps,
      highlights: config.supplementary.highlights,
      interests: config.supplementary.interests,
      lists: config.supplementary.lists,
      earnings: config.supplementary.earnings,
      socialGraph: config.supplementary.socialGraph,
      profile: config.supplementary.profile,
      blogrollFormat: 'none',
    },
    includeAll: false,
    verbose: false,
  }
}

/**
 * Get output path for a given post and config.
 */
function getOutputPath(meta: PostMetadata, config: ConfigState): string {
  const ext = config.outputFormat === 'structured-json' ? 'json' : config.outputFormat === 'html' ? 'html' : 'md'
  const slug = meta.slug || meta.mediumId

  switch (config.target) {
    case 'hugo': {
      const dir = meta.draft && config.separateDrafts ? 'content/drafts' : 'content/posts'
      return `${dir}/${slug}/index.${ext}`
    }
    case 'jekyll': {
      if (meta.draft && config.separateDrafts) return `_drafts/${slug}.${ext}`
      let datePrefix = '0000-00-00'
      if (meta.date) {
        const parsed = new Date(meta.date)
        if (!isNaN(parsed.getTime())) {
          datePrefix = parsed.toISOString().split('T')[0]
        }
      }
      return `_posts/${datePrefix}-${slug}.${ext}`
    }
    case 'eleventy': {
      const dir = meta.draft && config.separateDrafts ? 'drafts' : 'posts'
      return `${dir}/${slug}.${ext}`
    }
    case 'astro': {
      const dir = meta.draft && config.separateDrafts ? 'src/content/drafts' : 'src/content/posts'
      return `${dir}/${slug}.${ext}`
    }
    default: {
      const dir = meta.draft && config.separateDrafts ? 'drafts' : 'posts'
      return `${dir}/${slug}.${ext}`
    }
  }
}

function getDataDir(target: string): string {
  switch (target) {
    case 'hugo': return 'data'
    case 'jekyll': return '_data'
    case 'eleventy': return '_data'
    case 'astro': return 'src/data'
    default: return 'data'
  }
}

/**
 * Download an image via browser fetch, returning the binary data or null on failure.
 */
async function downloadImageBlob(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok) return null
    return await response.arrayBuffer()
  } catch {
    return null
  }
}

function collectHtmlFromDir(files: Map<string, string>, prefix: string): string[] {
  return Array.from(files.entries())
    .filter(([k]) => k.startsWith(prefix) && k.endsWith('.html'))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)
}

/**
 * Run the full conversion and return a ZIP blob.
 */
export async function runConversion(
  files: Map<string, string>,
  selectedPosts: ParsedPost[],
  config: ConfigState,
  onProgress: (p: Partial<ConversionProgress>) => void,
): Promise<{ zipBlob: Blob; report: any }> {
  const coreConfig = buildCoreConfig(config)
  const zip = new JSZip()
  const log: LogEntry[] = []
  const errors: any[] = []
  const warnings: any[] = []
  let postsConverted = 0
  let draftsConverted = 0
  let responsesIncluded = 0
  let imagesDownloaded = 0
  let imagesFailed = 0
  const allImages: ImageRef[] = []

  // Build earnings map
  let earningsMap = new Map<string, number>()
  if (config.injectEarnings) {
    const earningsHtml = collectHtmlFromDir(files, 'partner-program/')
    if (earningsHtml.length > 0) {
      const entries = parseEarnings(earningsHtml)
      for (const e of entries) {
        if (e.mediumId) earningsMap.set(e.mediumId, e.earnings)
      }
    }
  }

  const total = selectedPosts.length
  onProgress({ phase: 'converting', current: 0, total, log: [] })

  // Convert posts
  for (let i = 0; i < selectedPosts.length; i++) {
    const post = selectedPosts[i]
    try {
      const meta = extractMetadata(post.html, post.filename)

      if (earningsMap.has(meta.mediumId)) {
        meta.earnings = earningsMap.get(meta.mediumId)!
      }

      const { markdown, images } = convertBody(post.html, coreConfig, meta.slug)
      if (coreConfig.images.mode !== 'reference') {
        allImages.push(...images)
      }
      const frontMatter = generateFrontMatter(meta, coreConfig)

      let outputContent: string
      if (config.outputFormat === 'markdown') {
        outputContent = frontMatter ? `${frontMatter}\n\n${markdown}\n` : `# ${meta.title}\n\n${markdown}\n`
      } else if (config.outputFormat === 'html') {
        const $ = cheerio.load(post.html)
        $('style').remove()
        const body = $('section[data-field="body"]').html() || ''
        outputContent = `<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><title>${meta.title}</title></head>\n<body><article><h1>${meta.title}</h1>${body}</article></body></html>`
      } else {
        outputContent = JSON.stringify({ metadata: meta, content: markdown }, null, 2)
      }

      const outputPath = getOutputPath(meta, config)
      zip.file(outputPath, outputContent)

      if (meta.draft) draftsConverted++
      else if (meta.type === 'response') responsesIncluded++
      else postsConverted++

      log.push({ type: 'info', message: `✓ ${meta.slug}` })
    } catch (err: any) {
      log.push({ type: 'error', message: `✗ ${post.filename}: ${err.message}` })
      errors.push({ file: post.filename, message: err.message })
    }

    if (i % 10 === 0 || i === selectedPosts.length - 1) {
      onProgress({ phase: 'converting', current: i + 1, total, currentFile: post.slug, log: [...log] })
      await new Promise(r => setTimeout(r, 0)) // yield to UI
    }
  }

  // Download images if configured
  if (coreConfig.images.mode !== 'reference' && allImages.length > 0) {
    // Deduplicate by originalUrl to avoid fetching the same image twice
    const uniqueImages = new Map<string, ImageRef>()
    for (const img of allImages) {
      if (img.localPath && !uniqueImages.has(img.originalUrl)) {
        uniqueImages.set(img.originalUrl, img)
      }
    }

    const imgTotal = uniqueImages.size
    log.push({ type: 'info', message: `Downloading ${imgTotal} images...` })
    onProgress({ phase: 'images', current: 0, total: imgTotal, log: [...log] })

    let imgIdx = 0
    for (const [url, img] of uniqueImages) {
      const data = await downloadImageBlob(url)
      if (data && img.localPath) {
        zip.file(img.localPath, data)
        imagesDownloaded++
      } else {
        imagesFailed++
        warnings.push({ file: url, message: 'Image download failed (CORS or network error)' })
      }
      imgIdx++
      if (imgIdx % 5 === 0 || imgIdx === imgTotal) {
        onProgress({ phase: 'images', current: imgIdx, total: imgTotal, currentFile: `${imagesDownloaded} downloaded, ${imagesFailed} failed`, log: [...log] })
        await new Promise(r => setTimeout(r, 0))
      }
    }

    log.push({ type: 'info', message: `✓ ${imagesDownloaded} images downloaded${imagesFailed > 0 ? `, ${imagesFailed} failed` : ''}` })
  }

  // Supplementary data
  onProgress({ phase: 'supplementary', current: 0, total: 0, log: [...log] })
  let supplementaryFiles = 0
  const dataDir = getDataDir(config.target)

  if (config.supplementary.profile) {
    try {
      const profileHtml = files.get('profile/profile.html')
      const aboutHtml = files.get('profile/about.html')
      const pubsHtml = files.get('profile/publications.html')
      let profileData: any = {}
      if (profileHtml) profileData = parseProfile(profileHtml)
      if (aboutHtml) profileData.bio = parseAbout(aboutHtml)
      zip.file(`${dataDir}/author.json`, JSON.stringify(profileData, null, 2))
      supplementaryFiles++
      if (pubsHtml) {
        zip.file(`${dataDir}/publications.json`, JSON.stringify(parsePublications(pubsHtml), null, 2))
        supplementaryFiles++
      }
    } catch (err: any) {
      warnings.push({ file: 'profile/', message: err.message })
    }
  }

  if (config.supplementary.bookmarks) {
    const htmls = collectHtmlFromDir(files, 'bookmarks/')
    if (htmls.length > 0) {
      zip.file(`${dataDir}/bookmarks.json`, JSON.stringify(parseBookmarks(htmls), null, 2))
      supplementaryFiles++
    }
  }

  if (config.supplementary.claps) {
    const htmls = collectHtmlFromDir(files, 'claps/')
    if (htmls.length > 0) {
      zip.file(`${dataDir}/claps.json`, JSON.stringify(parseClaps(htmls), null, 2))
      supplementaryFiles++
    }
  }

  if (config.supplementary.highlights) {
    const htmls = collectHtmlFromDir(files, 'highlights/')
    if (htmls.length > 0) {
      zip.file(`${dataDir}/highlights.json`, JSON.stringify(parseHighlights(htmls), null, 2))
      supplementaryFiles++
    }
  }

  if (config.supplementary.interests) {
    const readFile = (path: string) => files.get(path)
    const interests = parseInterests({
      tags: readFile('interests/tags.html'),
      topics: readFile('interests/topics.html'),
      publications: readFile('interests/publications.html'),
      writers: readFile('interests/writers.html'),
    })
    const hasInterests = interests.tags.length > 0 || interests.topics.length > 0 ||
      interests.publications.length > 0 || interests.writers.length > 0
    if (hasInterests) {
      zip.file(`${dataDir}/interests.json`, JSON.stringify(interests, null, 2))
      supplementaryFiles++
    }
  }

  if (config.supplementary.lists) {
    const listFiles = Array.from(files.entries()).filter(([k]) => k.startsWith('lists/') && k.endsWith('.html'))
    for (const [path, html] of listFiles) {
      const fname = path.replace('lists/', '').replace('.html', '.json')
      zip.file(`${dataDir}/lists/${fname}`, JSON.stringify(parseList(html, path), null, 2))
      supplementaryFiles++
    }
  }

  if (config.supplementary.earnings) {
    const htmls = collectHtmlFromDir(files, 'partner-program/')
    if (htmls.length > 0) {
      zip.file(`${dataDir}/earnings.json`, JSON.stringify(parseEarnings(htmls), null, 2))
      supplementaryFiles++
    }
  }

  if (config.supplementary.socialGraph) {
    const users = collectHtmlFromDir(files, 'users-following/')
    const pubs = collectHtmlFromDir(files, 'pubs-following/')
    const topics = collectHtmlFromDir(files, 'topics-following/')
    if (users.length > 0 || pubs.length > 0 || topics.length > 0) {
      zip.file(`${dataDir}/following.json`, JSON.stringify(parseFollowing(users, pubs, topics), null, 2))
      supplementaryFiles++
    }
  }

  log.push({ type: 'info', message: `✓ ${supplementaryFiles} supplementary data files` })

  // Build report
  const report = {
    generatedAt: new Date().toISOString(),
    tool: 'meddler-web',
    version: '1.0.2',
    config: { format: config.format, outputFormat: config.outputFormat, target: config.target },
    summary: {
      postsFound: total,
      postsConverted,
      draftsConverted,
      responsesIncluded,
      imagesDownloaded,
      imagesFailed,
      supplementaryFiles,
    },
    warnings,
    errors,
  }
  zip.file('meddler-report.json', JSON.stringify(report, null, 2))

  // Generate zip
  onProgress({ phase: 'zipping', current: 0, total: 0, log: [...log] })
  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })

  log.push({ type: 'info', message: `✓ ZIP generated (${(zipBlob.size / 1024 / 1024).toFixed(1)} MB)` })
  onProgress({ phase: 'done', current: total, total, log: [...log], report, zipBlob, zipSize: zipBlob.size })

  return { zipBlob, report }
}

/**
 * Generate a live preview of a single post with the current config.
 */
export function previewPost(html: string, filename: string, config: ConfigState): string {
  const coreConfig = buildCoreConfig(config)
  const meta = extractMetadata(html, filename)
  const { markdown } = convertBody(html, coreConfig, meta.slug)
  const frontMatter = generateFrontMatter(meta, coreConfig)
  if (frontMatter) {
    return `${frontMatter}\n\n${markdown}`
  }
  return `# ${meta.title}\n\n${markdown}`
}
