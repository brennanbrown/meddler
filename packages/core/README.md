# @brennanbrown/core

Core library for parsing Medium exports and converting to static site generator formats. This package contains all the conversion logic used by both the CLI and web interfaces.

## 📦 Installation

```bash
npm install @brennanbrown/core
```

## 🚀 Usage

```typescript
import {
  extractMetadata,
  convertBody,
  generateFrontMatter,
  DEFAULT_CONFIG,
  type MeddlerConfig,
} from '@brennanbrown/core'

const config: MeddlerConfig = {
  ...DEFAULT_CONFIG,
  target: 'hugo',
  format: 'toml',
}

// For each post HTML file in the export's posts/ directory:
const metadata = extractMetadata(html, filename)
const { markdown, images } = convertBody(html, config, metadata.slug)
const frontMatter = generateFrontMatter(metadata, config)
const output = `${frontMatter}\n\n${markdown}\n`
```

## 🔧 API

### Types

```typescript
interface MeddlerConfig {
  input: string
  output: string
  format: 'yaml' | 'toml' | 'json' | 'none'
  outputFormat: 'markdown' | 'html' | 'structured-json'
  target: 'generic' | 'hugo' | 'eleventy' | 'jekyll' | 'astro'
  includeDrafts: boolean
  includeResponses: boolean
  separateDrafts: boolean
  frontMatter: {
    extraFields: Record<string, string>
    dateFormat: 'iso8601' | 'yyyy-mm-dd' | 'unix'
    injectEarnings: boolean
    unquotedDates: boolean
    rewriteImageUrls: boolean
    imageBaseUrl: string
  }
  images: {
    mode: 'reference' | 'download' | 'optimize'
    outputDir: string
    perPostDirs: boolean
    extractFeatured: boolean
    removeFeaturedFromBody: boolean
  }
  embeds: {
    mode: 'raw_html' | 'shortcodes' | 'placeholders'
    shortcodeFormat: SSGTarget
  }
  content: {
    sectionBreaks: 'hr' | 'none' | 'spacing'
    dropCaps: 'strip' | 'preserve'
  }
  supplementary: {
    bookmarks: boolean
    claps: boolean
    highlights: boolean
    interests: boolean
    lists: boolean
    earnings: boolean
    socialGraph: boolean
    profile: boolean
    blogrollFormat: 'opml' | 'json' | 'md' | 'none'
  }
  includeAll: boolean
  verbose: boolean
}
```

`DEFAULT_CONFIG` provides a complete default configuration — spread it and override what you need.

### Post Parsing & Conversion

#### `extractMetadata(html: string, filename: string): PostMetadata`

Extract post metadata (title, slug, date, tags, draft status, featured image, Medium ID) from a single Medium post HTML file.

```typescript
const metadata = extractMetadata(html, '2016-03-25_My-Post-abc123.html')
console.log(metadata.title, metadata.slug, metadata.draft)
```

#### `convertBody(html: string, config: MeddlerConfig, slug: string): { markdown: string; images: ImageRef[] }`

Convert a post's HTML body to Markdown. Returns the converted body plus the list of images found (with local paths when `images.mode` is `download` or `optimize`).

#### `createTurndownService(config: MeddlerConfig): TurndownService`

Build the underlying Turndown instance with Meddler's rules — exposed if you want to customise conversion.

### Front Matter

#### `generateFrontMatter(metadata: PostMetadata, config: MeddlerConfig): string`

Serialize front matter in the configured format (`yaml`/`toml`/`json`, or empty string for `none`).

#### `buildFrontMatterData(metadata: PostMetadata, config: MeddlerConfig): Record<string, unknown>`

Build the raw front matter object — useful if you want to add fields before serialising.

#### `formatDate(dateStr: string | null, format: DateFormat): string | null`

Format a date string as `iso8601`, `yyyy-mm-dd`, or `unix`.

### Supplementary Data Parsers

Each parser reads the corresponding HTML files from the export:

| Function | Source directory |
|----------|------------------|
| `parseProfile(html)` | `profile/profile.html` |
| `parseAbout(html)` | `profile/about.html` |
| `parsePublications(html)` | `profile/publications.html` |
| `parseBookmarks(htmlFiles)` | `bookmarks/` |
| `parseClaps(htmlFiles)` | `claps/` |
| `parseHighlights(htmlFiles)` | `highlights/` |
| `parseList(html, filename)` | `lists/*.html` |
| `parseEarnings(htmlFiles)` | `partner-program/` |
| `parseFollowing(users, pubs, topics)` | `users-following/`, `pubs-following/`, `topics-following/` |
| `parseInterests(files)` | `interests/` |

Functions taking `htmlFiles` accept an array of HTML strings (exports paginate these files).

## 🧪 Example

```typescript
import {
  extractMetadata,
  convertBody,
  generateFrontMatter,
  parseBookmarks,
  DEFAULT_CONFIG,
} from '@brennanbrown/core'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const config = { ...DEFAULT_CONFIG, target: 'jekyll' as const }
const postsDir = 'medium-export/posts'

for (const file of readdirSync(postsDir).filter(f => f.endsWith('.html'))) {
  const html = readFileSync(join(postsDir, file), 'utf-8')
  const metadata = extractMetadata(html, file)
  const { markdown } = convertBody(html, config, metadata.slug)
  const frontMatter = generateFrontMatter(metadata, config)
  console.log(`${metadata.slug}: ${frontMatter.length + markdown.length} bytes`)
}
```

## 📄 License

AGPL-3.0-or-later

## 🤝 Contributing

Contributions are welcome! Please read the main [Contributing Guide](../../CONTRIBUTING.md).

### Acknowledgments

- Built with [cheerio](https://cheerio.js.org/) for HTML parsing
- Markdown conversion via [turndown](https://github.com/domchristie/turndown)
- Inspired by the need to own your content
- Thanks to Medium for providing export functionality

## Disclaimer

Meddler is not affiliated with, endorsed by, or connected to Medium in any way. This is an independent tool created to help users export and migrate their content from Medium.

## About

Meddler is a  [Berry House](https://berryhouse.ca) project created by [Brennan Kenneth Brown](https://brennan.day).

If you find Meddler useful and want to support projects like this, please consider [donating on Ko-fi](https://ko-fi.com/brennan).

---

**The engine that powers Meddler.**
