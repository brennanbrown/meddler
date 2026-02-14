# Ⓜ️ Meddler

[![npm version](https://img.shields.io/npm/v/meddler-cli)](https://www.npmjs.com/package/meddler-cli)
[![Netlify Status](https://api.netlify.com/api/v1/badges/34515bd4-e7ec-47d9-9907-0909d121c913/deploy-status)](https://app.netlify.com/projects/meddler/deploys)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://opensource.org/licenses/AGPL-3.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue)](https://www.typescriptlang.org/)

Ⓜ️ Convert your Medium export to Markdown with front matter for Hugo, Eleventy, Jekyll, Astro, and more.

Meddler helps you reclaim your content from Medium and convert it to static site generator formats. It preserves your posts, drafts, responses, and supplementary data while adding rich metadata like earnings, reading time, and tags.

📖 **[View CLI Documentation](https://meddler.fyi/docs.html)** — Complete reference for all command-line options and configuration.

![Meddler Screenshot](screenshot.jpg)

## Features

- **Multiple Output Formats**: Markdown, HTML, JSON
- **SSG Support**: Hugo, Eleventy, Jekyll, Astro with automatic presets
- **Rich Front Matter**: YAML, TOML, or JSON with comprehensive metadata
- **Content Options**: Preserve or remove images, embeds, footnotes
- **Supplementary Data**: Export profile, publications, lists, bookmarks, claps, earnings
- **Privacy-First**: Web version runs entirely in your browser
- **CLI & Web**: Use command-line or web interface

## Installation

### CLI (Recommended for power users)

```bash
npm install -g meddler-cli
```

### Web (No installation required)

Visit [meddler.fyi](https://meddler.fyi) to use the web version directly in your browser.

## Quick Start

### CLI

```bash
# Convert with default settings (Hugo + YAML + Markdown)
meddler convert medium-export.zip

# Specify output directory
meddler convert medium-export.zip -o my-site

# Use Eleventy preset
meddler convert medium-export.zip --preset eleventy

# Custom configuration
meddler convert medium-export.zip \
  --front-matter toml \
  --target astro \
  --format html \
  --include-drafts \
  --include-responses
```

### Web

1. Go to [meddler.fyi](https://meddler.fyi)
2. Drag and drop your Medium export ZIP file
3. Configure your conversion settings
4. Download the converted ZIP

## What Gets Converted

### Content
- ✅ Published posts
- ✅ Drafts (optional)
- ✅ Responses (optional)
- ✅ Images (downloaded or referenced)
- ✅ Embeds (preserved or cleaned)

### Metadata
- ✅ Title, subtitle, slug
- ✅ Publication date and last modified
- ✅ Tags and topics
- ✅ Reading time
- ✅ Word count
- ✅ Earnings data (from Partner Program)
- ✅ Author information

### Supplementary Data
- ✅ Author profile
- ✅ Publications
- ✅ Lists
- ✅ Bookmarks
- ✅ Claps
- ✅ Followers/following data

## Configuration

### Front Matter Formats

**YAML** (default):
```yaml
---
title: "My Post"
date: "2024-01-01"
tags: ["tag1", "tag2"]
earnings: 12.34
---
```

**TOML**:
```toml
+++
title = "My Post"
date = "2024-01-01"
tags = ["tag1", "tag2"]
earnings = 12.34
+++
```

**JSON**:
```json
{
  "title": "My Post",
  "date": "2024-01-01",
  "tags": ["tag1", "tag2"],
  "earnings": 12.34
}
```

### SSG Presets

| SSG | Front Matter | Date Format | Content Dir | Notes |
|-----|--------------|-------------|-------------|-------|
| Hugo | YAML | `2006-01-02` | `content/posts` | Default |
| Eleventy | YAML | `YYYY-MM-DD` | `posts` | |
| Jekyll | YAML | `YYYY-MM-DD` | `_posts` | |
| Astro | YAML | `YYYY-MM-DD` | `src/content/blog` | |

## Advanced Options

### CLI Flags

```bash
# Output format
--format markdown|html|json

# Front matter
--front-matter yaml|toml|json

# Target SSG
--target hugo|eleventy|jekyll|astro

# Content filtering
--include-drafts      # Include draft posts
--include-responses   # Include response posts
--exclude-images       # Don't process images
--embed-mode preserve|clean|remove

# Supplementary data
--supplementary all|profile|publications|lists|bookmarks|claps|earnings|none

# Advanced
--date-format "YYYY-MM-DD"
--slug-format "lowercase"
--add-reading-time
--add-word-count
--section-breaks "###"
```

### Configuration File

Create `.meddlerrc.json` in your project:

```json
{
  "frontMatter": "yaml",
  "target": "hugo",
  "format": "markdown",
  "includeDrafts": true,
  "includeResponses": false,
  "embedMode": "preserve",
  "supplementary": ["profile", "earnings"],
  "dateFormat": "2006-01-02",
  "addReadingTime": true,
  "addWordCount": true,
  "imageMode": "download",
  "extraFields": {
    "author": "{{author.name}}",
    "locale": "en-US"
  }
}
```

## Web Interface

The web version provides the same functionality as the CLI with a user-friendly interface:

- **Step 1**: Upload your Medium export (ZIP or folder)
- **Step 2**: Preview posts, filter, and select what to convert
- **Step 3**: Configure all options with live preview
- **Step 4**: Export with progress tracking

All processing happens in your browser - your files never leave your device.

## Output Structure

```
output/
├── content/
│   ├── posts/
│   │   ├── 2024-01-01_my-post.md
│   │   └── 2024-01-02-another-post.md
│   └── drafts/
│       └── draft-post.md
├── data/
│   ├── author.json
│   ├── publications.json
│   └── earnings.json
└── images/
    ├── image1.jpg
    └── image2.png
```

## Development

```bash
# Clone repository
git clone https://github.com/brennanbrown/meddler.git
cd meddler

# Install dependencies
npm install

# Build all packages
npm run build

# Run CLI
npm run dev

# Run web app
npm run dev -w packages/web
```

## License

AGPL-3.0-or-later - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) and submit a Pull Request.

## Acknowledgments

- Built with [cheerio](https://cheerio.js.org/) for HTML parsing
- Markdown conversion via [turndown](https://github.com/domchristie/turndown)
- Inspired by the need to own your content
- Thanks to Medium for providing export functionality

## Disclaimer

Meddler is not affiliated with, endorsed by, or connected to Medium in any way. This is an independent tool created to help users export and migrate their content from Medium.

## About

Meddler is a  [Berry House](https://berryhouse.ca) project created by [Brennan Kenneth Brown](https://brennan.day).

If you find Meddler useful and want to support projects like this, please consider [donating on Ko-fi](https://ko-fi.com/brennan).

## Support

- [Documentation](https://github.com/brennanbrown/meddler/wiki)
- [Report Issues](https://github.com/brennanbrown/meddler/issues)
- [Discussions](https://github.com/brennanbrown/meddler/discussions)

---

**Reclaim your words. Own your content. Build your site.**
