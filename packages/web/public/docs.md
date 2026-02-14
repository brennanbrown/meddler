---
title: CLI Documentation
layout: default
---

# Meddler CLI Documentation

Complete reference for all command-line options and configuration.

## Quick Start

```bash
# Basic conversion
meddler convert export.zip

# Advanced Eleventy setup
meddler convert export.zip \
  --target eleventy \
  --format yaml \
  --images download \
  --unquoted-dates \
  --rewrite-image-urls
```

## Command Reference

### `meddler convert`

Convert a Medium export to static site generator formats.

```bash
meddler convert <input-path> [options]
```

#### Arguments

- `<input-path>`: Path to extracted Medium export folder or .zip file

#### Output Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output <dir>` | `-o` | Output directory | `./meddler-output` |
| `--dry-run` | | Preview without writing files | `false` |

#### Front Matter Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format <fmt>` | Front matter format: `yaml`, `toml`, `json`, `none` | `yaml` |
| `--output-format <fmt>` | Output format: `markdown`, `html`, `structured-json` | `markdown` |
| `--target <ssg>` | Target SSG: `generic`, `hugo`, `eleventy`, `jekyll`, `astro` | `generic` |
| `--earnings` | Inject partner program earnings | `false` |
| `--unquoted-dates` | Output dates without quotes (Eleventy) | `false` |
| `--rewrite-image-urls` | Rewrite Medium CDN URLs to local paths | `false` |
| `--image-base-url <url>` | Base URL for rewritten images | `/images` |

#### Content Options

| Option | Description | Default |
|--------|-------------|---------|
| `--drafts` | Include draft posts | `true` |
| `--no-drafts` | Exclude draft posts | `false` |
| `--responses` | Include short responses/comments | `false` |

#### Image Options

| Option | Description | Default |
|--------|-------------|---------|
| `--images <mode>` | Image handling: `reference`, `download`, `optimize` | `reference` |

#### Embed Options

| Option | Description | Default |
|--------|-------------|---------|
| `--embeds <mode>` | Embed handling: `raw_html`, `shortcodes`, `placeholders` | `raw_html` |

#### Data Options

| Option | Description | Default |
|--------|-------------|---------|
| `--supplementary` | Convert supplementary data | `true` |
| `--no-supplementary` | Skip supplementary data | `false` |
| `--include-all` | Include all data (sessions, IPs, blocks) | `false` |

#### Other Options

| Option | Description | Default |
|--------|-------------|---------|
| `--verbose` | Verbose logging output | `false` |

### `meddler validate`

Validate a Medium export without converting.

```bash
meddler validate <input-path>
```

### `meddler info`

Show information about a Medium export.

```bash
meddler info <input-path>
```

## Target SSG Presets

Each SSG target applies specific defaults optimized for that platform.

### Hugo

```bash
meddler convert export.zip --target hugo
```

**Applied defaults:**
- Front matter: `toml` (Hugo's preferred format)
- Embeds: `shortcodes` (Hugo shortcode format)
- Output: Page bundles (`content/posts/slug/index.md`)

### Jekyll

```bash
meddler convert export.zip --target jekyll
```

**Applied defaults:**
- Front matter: `yaml`
- Output: `_posts/YYYY-MM-DD-slug.md` (date-prefixed)
- Drafts: `_drafts/slug.md` (if separate)

### Eleventy

```bash
meddler convert export.zip --target eleventy
```

**Applied defaults:**
- Front matter: `yaml`
- Output: `posts/slug.md`
- Drafts: `drafts/slug.md` (if separate)

**Recommended Eleventy flags:**
```bash
--unquoted-dates --rewrite-image-urls --image-base-url "/images"
```

### Astro

```bash
meddler convert export.zip --target astro
```

**Applied defaults:**
- Front matter: `yaml`
- Output: `src/content/posts/slug.md`

### Generic

```bash
meddler convert export.zip --target generic
```

**Applied defaults:**
- Front matter: `yaml`
- Output: `posts/slug.md`

## Front Matter Formats

### YAML (Default)

```yaml
---
title: "My Post"
date: "2025-12-28T00:00:00.000Z"
slug: my-post
canonical_url: https://medium.com/@user/my-post
author: Author Name
medium_id: abc123def456
draft: false
tags: []
---
```

### TOML

```toml
+++
title = "My Post"
date = 2025-12-28T00:00:00.000Z
slug = "my-post"
canonical_url = "https://medium.com/@user/my-post"
author = "Author Name"
medium_id = "abc123def456"
draft = false
tags = []
+++
```

### JSON

```json
{
  "title": "My Post",
  "date": "2025-12-28T00:00:00.000Z",
  "slug": "my-post",
  "canonical_url": "https://medium.com/@user/my-post",
  "author": "Author Name",
  "medium_id": "abc123def456",
  "draft": false,
  "tags": []
}
```

## Image Handling

### Reference Mode (Default)

Keep Medium CDN URLs in front matter, images not downloaded:

```yaml
image: https://cdn-images-1.medium.com/max/2560/1*abc123.jpeg
```

### Download Mode

Download all images locally:

```bash
meddler convert export.zip --images download
```

- Images saved to `images/<slug>/` directory
- Front matter still references CDN URLs
- Markdown uses local paths: `![](images/<slug>/filename.jpg)`

### Optimize Mode

Download and optimize images (requires external tools):

```bash
meddler convert export.zip --images optimize
```

## Date Formats

Control how dates are formatted in front matter:

| Format | Example | Description |
|--------|---------|-------------|
| `iso8601` | `2025-12-28T14:30:00.000Z` | ISO 8601 with time |
| `yyyy-mm-dd` | `2025-12-28` | Date only |
| `unix` | `1735398600` | Unix timestamp |

```bash
meddler convert export.zip --format yaml --frontMatter.dateFormat yyyy-mm-dd
```

## Advanced Configuration

### Configuration File

Create `.meddlerrc.json` in your project root:

```json
{
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
}
```

### Extra Front Matter Fields

Add custom fields to all posts:

```bash
meddler convert export.zip --extraFields category:blog --extraFields lang:en
```

Or via config file:

```json
{
  "frontMatter": {
    "extraFields": {
      "category": "blog",
      "lang": "en",
      "author_url": "https://mysite.com"
    }
  }
}
```

## Output Formats

### Markdown (Default)

Standard Markdown with front matter.

### HTML

Full HTML documents with embedded metadata.

### Structured JSON

JSON with separate metadata and content fields:

```json
{
  "metadata": { ... },
  "content": "# My Post\n\nContent here..."
}
```

## Supplementary Data

When enabled (`--supplementary`), Meddler converts:

- **Profile**: Author bio and social links → `_data/profile.json`
- **Bookmarks**: Saved posts → `_data/bookmarks.json`
- **Claps**: Clap history → `_data/claps.json`
- **Highlights**: Highlighted passages → `_data/highlights.json`
- **Interests**: Followed topics → `_data/interests.json`
- **Lists**: Reading/writing lists → `_data/lists/`
- **Earnings**: Partner program data → `_data/earnings.json`
- **Social Graph**: Following data → `_data/following.json`

## Troubleshooting

### Common Issues

**Export not found:**
```bash
meddler validate path/to/export
```

**Images not downloading:**
- Check internet connection
- Verify Medium CDN URLs are accessible
- Try `--verbose` for detailed error messages

**Date parsing issues:**
- Use `--unquoted-dates` for Eleventy
- Check `--frontMatter.dateFormat` setting

**Permission denied:**
- Check output directory permissions
- Use `sudo` only if necessary

### Verbose Output

Get detailed conversion information:

```bash
meddler convert export.zip --verbose
```

Shows:
- Files being processed
- Image download status
- Warnings and errors
- Conversion statistics

## Examples

### Basic Blog Migration

```bash
meddler convert medium-export.zip \
  --target jekyll \
  --output my-blog \
  --images download
```

### Eleventy Setup

```bash
meddler convert medium-export.zip \
  --target eleventy \
  --unquoted-dates \
  --rewrite-image-urls \
  --image-base-url "/assets/images" \
  --images download \
  --earnings
```

### Hugo with Custom Fields

```bash
meddler convert medium-export.zip \
  --target hugo \
  --extraFields category:tech \
  --extraFields featured:true \
  --frontMatter.dateFormat yyyy-mm-dd
```

### Minimal Export

```bash
meddler convert medium-export.zip \
  --format none \
  --no-supplementary \
  --no-drafts
```

## Tips

1. **Always validate first**: Run `meddler validate` before converting
2. **Use dry-run**: Test options with `--dry-run` before full conversion
3. **Preserve original**: Keep your Medium export as backup
4. **Check output**: Verify converted files look as expected
5. **Iterate**: Adjust options and re-run as needed
