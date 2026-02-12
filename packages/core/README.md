# @berryhouse/core

Core library for parsing Medium exports and converting to static site generator formats. This package contains all the conversion logic used by both the CLI and web interfaces.

## 📦 Installation

```bash
npm install @berryhouse/core
```

## 🚀 Usage

```typescript
import { 
  readExport, 
  validateExport, 
  analyzeExport, 
  convertExport,
  buildConfig,
  type MeddlerConfig 
} from '@berryhouse/core'

// Read and validate export
const files = await readExport('medium-export.zip')
const validation = validateExport(files)
if (!validation.valid) {
  throw new Error(validation.message)
}

// Analyze the export
const analysis = analyzeExport(files)
console.log(`Found ${analysis.posts.length} posts`)

// Build configuration
const config: MeddlerConfig = buildConfig({
  target: 'hugo',
  frontMatter: 'yaml',
  format: 'markdown',
  includeDrafts: false,
  includeResponses: false
})

// Convert the export
const result = await convertExport(files, config)
console.log(`Converted ${result.posts.length} posts`)
```

## 🔧 API

### Types

```typescript
interface MeddlerConfig {
  target: 'hugo' | 'eleventy' | 'jekyll' | 'astro'
  frontMatter: 'yaml' | 'toml' | 'json'
  format: 'markdown' | 'html' | 'json'
  outputDir?: string
  includeDrafts?: boolean
  includeResponses?: boolean
  embedMode?: 'preserve' | 'clean' | 'remove'
  imageMode?: 'download' | 'reference'
  supplementary?: string[]
  dateFormat?: string
  slugFormat?: 'lowercase' | 'preserve'
  addReadingTime?: boolean
  addWordCount?: boolean
  sectionBreaks?: string
  extraFields?: Record<string, string>
}

interface ParsedPost {
  title: string
  slug: string
  content: string
  html: string
  frontMatter: Record<string, any>
  date: Date
  lastModified?: Date
  tags: string[]
  wordCount: number
  readingTime: number
  isDraft: boolean
  isResponse: boolean
  earnings?: number
  url?: string
}

interface ExportSummary {
  posts: ParsedPost[]
  author?: AuthorProfile
  publications?: Publication[]
  stats: {
    totalPosts: number
    publishedPosts: number
    draftPosts: number
    responsePosts: number
    totalWords: number
    dateRange: { earliest: Date; latest: Date }
  }
}
```

### Core Functions

#### `readExport(input: string | FileList): Promise<Map<string, string>>`

Read a Medium export from a ZIP file or directory.

```typescript
// From ZIP file
const files = await readExport('medium-export.zip')

// From FileList (browser)
const files = await readExport(fileList)
```

#### `validateExport(files: Map<string, string>): { valid: boolean; message: string }`

Validate that the files form a valid Medium export.

```typescript
const validation = validateExport(files)
if (!validation.valid) {
  console.error(validation.message)
}
```

#### `analyzeExport(files: Map<string, string>): ExportSummary`

Analyze a Medium export and return summary information.

```typescript
const summary = analyzeExport(files)
console.log(`Found ${summary.stats.totalPosts} posts`)
console.log(`Date range: ${summary.stats.dateRange.earliest} to ${summary.stats.dateRange.latest}`)
```

#### `buildConfig(options: Partial<MeddlerConfig>): MeddlerConfig`

Build a complete configuration with defaults.

```typescript
const config = buildConfig({
  target: 'hugo',
  includeDrafts: true
})
// Returns full config with Hugo defaults
```

#### `convertExport(files: Map<string, string>, config: MeddlerConfig): Promise<ConversionResult>`

Convert a Medium export to static site format.

```typescript
const result = await convertExport(files, config)
console.log(`Converted ${result.posts.length} posts`)
console.log(`Generated ${result.files.size} files`)
```

### Parsing Functions

#### `parsePost(html: string, config: MeddlerConfig): ParsedPost`

Parse a single Medium post HTML.

```typescript
const post = parsePost(html, config)
console.log(post.title)
console.log(post.tags)
```

#### `parseProfile(html: string): AuthorProfile`

Parse author profile from profile HTML.

```typescript
const author = parseProfile(html)
console.log(author.name, author.username)
```

#### `parsePublications(html: string): Publication[]`

Parse publications data.

```typescript
const publications = parsePublications(html)
console.log(`Found ${publications.length} publications`)
```

### Front Matter Generation

#### `generateFrontMatter(post: ParsedPost, config: MeddlerConfig): string`

Generate front matter string in specified format.

```typescript
const yaml = generateFrontMatter(post, config)
console.log(yaml)
// ---
// title: "My Post"
// date: "2024-01-01"
// ---
```

#### `convertBody(html: string, config: MeddlerConfig): string`

Convert HTML body to specified format.

```typescript
const markdown = convertBody(html, config)
const htmlOutput = convertBody(html, { ...config, format: 'html' })
```

### Supplementary Data

#### `parseEarnings(html: string): EarningsEntry[]`

Parse earnings data from partner program HTML.

```typescript
const earnings = parseEarnings(html)
console.log(`Found earnings for ${earnings.length} posts`)
```

#### `parseBookmarks(html: string): Bookmark[]`

Parse bookmark data.

```typescript
const bookmarks = parseBookmarks(html)
console.log(`Found ${bookmarks.length} bookmarks`)
```

#### `parseClaps(html: string): ClapEntry[]`

Parse clap data.

```typescript
const claps = parseClaps(html)
console.log(`Found ${claps.length} clap entries`)
```

## 🎯 Examples

### Basic Conversion

```typescript
import { readExport, validateExport, convertExport, buildConfig } from '@berryhouse/core'

async function convertMediumExport(zipPath: string) {
  // Read and validate
  const files = await readExport(zipPath)
  const validation = validateExport(files)
  if (!validation.valid) {
    throw new Error(validation.message)
  }

  // Configure
  const config = buildConfig({
    target: 'hugo',
    frontMatter: 'yaml',
    format: 'markdown',
    includeDrafts: true
  })

  // Convert
  const result = await convertExport(files, config)
  return result
}
```

### Custom Front Matter

```typescript
import { parsePost, generateFrontMatter, buildConfig } from '@berryhouse/core'

const config = buildConfig({
  target: 'hugo',
  extraFields: {
    author: '{{author.name}}',
    locale: 'en-US',
    featured: false
  }
})

const post = parsePost(html, config)
const frontMatter = generateFrontMatter(post, config)
```

### Analysis Only

```typescript
import { readExport, analyzeExport } from '@berryhouse/core'

async function analyzeExport(zipPath: string) {
  const files = await readExport(zipPath)
  const summary = analyzeExport(files)
  
  return {
    totalPosts: summary.stats.totalPosts,
    publishedPosts: summary.stats.publishedPosts,
    dateRange: summary.stats.dateRange,
    author: summary.author?.name
  }
}
```

### Browser Usage

```typescript
import { readUploadedFiles, validateExport, convertExport, buildConfig } from '@berryhouse/core'

async function handleFileUpload(fileList: FileList) {
  // Read uploaded files
  const files = await readUploadedFiles(fileList)
  
  // Validate
  const validation = validateExport(files)
  if (!validation.valid) {
    alert(validation.message)
    return
  }

  // Convert
  const config = buildConfig({ target: 'hugo' })
  const result = await convertExport(files, config)
  
  // Download ZIP
  const zip = new JSZip()
  for (const [path, content] of result.files) {
    zip.file(path, content)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, 'meddler-export.zip')
}
```

## 🔧 Configuration

### Presets

The library includes built-in presets for popular SSGs:

```typescript
import { PRESETS } from '@berryhouse/core'

// Hugo preset
const hugoConfig = PRESETS.hugo

// Eleventy preset
const eleventyConfig = PRESETS.eleventy

// Custom preset
const customConfig = { ...PRESETS.hugo, includeDrafts: true }
```

### Date Formats

Use any valid date format string:

```typescript
const config = buildConfig({
  dateFormat: 'YYYY-MM-DD'  // 2024-01-01
  // or
  dateFormat: '2006-01-02'  // 2006-01-02 (Hugo)
  // or
  dateFormat: 'MMMM DD, YYYY'  // January 01, 2024
})
```

### Field Templates

Use template variables in `extraFields`:

```typescript
const config = buildConfig({
  extraFields: {
    author: '{{author.name}}',
    username: '{{author.username}}',
    url: '{{url}}',
    wordCount: '{{wordCount}}',
    readingTime: '{{readingTime}}'
  }
})
```

## 🧪 Testing

```typescript
import { validateExport, analyzeExport } from '@berryhouse/core'

describe('Export Analysis', () => {
  it('should validate a correct export', () => {
    const files = new Map([
      ['README.html', '...'],
      ['posts/post1.html', '...']
    ])
    
    const validation = validateExport(files)
    expect(validation.valid).toBe(true)
  })

  it('should analyze export statistics', () => {
    const summary = analyzeExport(files)
    expect(summary.stats.totalPosts).toBeGreaterThan(0)
  })
})
```

## 📄 License

AGPL-3.0-or-later

## 🤝 Contributing

Contributions are welcome! Please read the main [Contributing Guide](../../CONTRIBUTING.md).

### Core-Specific Contributions

- Parser improvements
- New export format support
- Performance optimizations
- Bug fixes in conversion logic

## 🍓 About

Meddler is a 🍓 [Berry House](https://berryhouse.ca) project created by [Brennan Kenneth Brown](https://brennan.day).

If you find Meddler useful and want to support projects like this, please consider [donating on Ko-fi](https://ko-fi.com/brennan).

---

**The engine that powers Meddler.**
