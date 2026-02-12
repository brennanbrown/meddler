# Meddler — Specification Sheet

> **Meddler** is a command-line tool that converts a Medium data export (`.zip` archive of HTML files) into clean, portable formats — primarily Markdown with YAML front matter — so users can migrate their content to independent websites powered by static site generators like Hugo, Eleventy, Jekyll, Astro, and others.

---

## Table of Contents

1. [Motivation](#1-motivation)
2. [Medium Export Anatomy](#2-medium-export-anatomy)
3. [Input Specification](#3-input-specification)
4. [Output Formats](#4-output-formats)
5. [Post Conversion Pipeline](#5-post-conversion-pipeline)
6. [Metadata Extraction](#6-metadata-extraction)
7. [Content Transformation Rules](#7-content-transformation-rules)
8. [Image Handling](#8-image-handling)
9. [Supplementary Data Conversion](#9-supplementary-data-conversion)
10. [Configuration](#10-configuration)
11. [CLI Interface](#11-cli-interface)
12. [Output Directory Structure](#12-output-directory-structure)
13. [Edge Cases & Special Handling](#13-edge-cases--special-handling)
14. [Target SSG Compatibility](#14-target-ssg-compatibility)
15. [Technical Requirements](#15-technical-requirements)
16. [Glossary](#16-glossary)

---

## 1. Motivation

Medium provides a GDPR-compliant data export in the form of a `.zip` archive containing HTML files. While this preserves content, the format is:

- **Not portable** — files are single-page HTML documents with inline CSS and Medium-specific class names.
- **Not SSG-ready** — no YAML/TOML/JSON front matter, no clean Markdown body.
- **Noisy** — includes Medium's presentation layer (`graf--`, `section--`, `markup--` CSS classes), making content reuse difficult.
- **Scattered** — metadata like publish date, canonical URL, subtitle, and author are embedded in the HTML footer and header, not structured as data.

Meddler bridges this gap, giving writers a one-command path from Medium to their own independent website.

---

## 2. Medium Export Anatomy

A Medium data export is a `.zip` archive with a SHA-256 hash in its folder name. Once extracted, it follows this structure:

```
medium-export-<hash>/
├── README.html              # Export overview and folder descriptions
├── ips.html                  # IP address login history
├── blocks/                   # Blocked users
│   └── blocked-users-NNNN.html
├── bookmarks/                # Bookmarked posts (by others)
│   └── bookmarks-NNNN.html
├── claps/                    # Posts the user clapped for
│   └── claps-NNNN.html
├── highlights/               # Text passages the user highlighted
│   └── highlights-NNNN.html
├── interests/                # User interest signals
│   ├── publications.html     # Publications of interest
│   ├── tags.html             # Tags of interest
│   ├── topics.html           # Topics of interest
│   └── writers.html          # Writers of interest
├── lists/                    # User-created reading lists
│   └── <ListName>-<id>.html
├── partner-program/          # Partner Program earnings per post
│   └── posts-NNNN.html
├── posts/                    # ★ User's own posts (published + drafts)
│   ├── YYYY-MM-DD_<Slug>-<postId>.html   # Published posts
│   └── draft_<Slug>-<postId>.html         # Draft posts
├── profile/                  # User profile data
│   ├── about.html            # Bio / about page
│   ├── profile.html          # Account info, connected accounts, membership
│   └── publications.html     # Publications where user is editor/writer
├── pubs-following/           # Publications the user follows
│   └── pubs-following-NNNN.html
├── sessions/                 # Login session history (user agents, timestamps)
│   └── sessions-NNNN.html
├── topics-following/         # Topics the user follows
│   └── topics-following-NNNN.html
├── twitter/                  # X/Twitter friends also on Medium
│   └── suggested-friends-NNNN.html
└── users-following/          # Users the user follows
    └── users-following-NNNN.html
```

### 2.1 Pagination Convention

Several directories use a `NNNN` (zero-padded, 4-digit) pagination suffix when data spans multiple pages (e.g., `claps-0001.html`, `claps-0002.html`). Meddler MUST aggregate all pages within a directory into a single logical dataset.

### 2.2 File Categories

| Category | Directory | Content Priority | Description |
|---|---|---|---|
| **Posts** | `posts/` | **Primary** | The user's own writing — the core conversion target. |
| **Profile** | `profile/` | Secondary | Author identity data useful for site-wide config. |
| **Partner Program** | `partner-program/` | Secondary | Earnings metadata that can enrich post front matter. |
| **Social Graph** | `blocks/`, `users-following/`, `pubs-following/`, `topics-following/`, `twitter/` | Supplementary | Social connections; useful for blogroll generation. |
| **Activity** | `bookmarks/`, `claps/`, `highlights/` | Supplementary | Reading activity; useful for "recommended reading" pages. |
| **Interests** | `interests/` | Supplementary | Tags/topics/publications/writers of interest. |
| **Lists** | `lists/` | Supplementary | Curated reading lists. |
| **Account** | `sessions/`, `ips.html` | Low / Privacy | Login history; generally excluded from conversion. |

---

## 3. Input Specification

### 3.1 Accepted Input

- A **directory path** pointing to an extracted Medium export folder.
- Alternatively, a **`.zip` file path** — Meddler should extract it to a temporary directory automatically.

### 3.2 Export Detection

Meddler MUST validate the input by checking for:

1. Presence of `README.html` at the root.
2. Presence of a `posts/` subdirectory.
3. The `README.html` containing the string `"Archive for"` or the `h-card` microformat class.

If validation fails, Meddler MUST exit with a clear error message.

### 3.3 Encoding

All Medium export files use `UTF-8` encoding (`<meta http-equiv="Content-Type" content="text/html; charset=utf-8">`). Meddler MUST read and write all files as UTF-8.

---

## 4. Output Formats

Meddler MUST support the following output formats, selectable via CLI flag:

### 4.1 Markdown + YAML Front Matter (Default)

The primary output format. Each post becomes a `.md` file with YAML front matter.

```markdown
---
title: "Being a Better Lifehacker"
subtitle: "Improving the craft without letting go of the genre."
date: 2016-03-25T05:53:26.260Z
slug: being-a-better-lifehacker
canonical_url: https://medium.com/@brennanbrown/being-a-better-lifehacker-ece7c6688e68
author: Brennan Kenneth Brown
medium_id: ece7c6688e68
draft: false
tags: []
---

While I definitely think it's healthy for people to have dialogues...
```

### 4.2 Markdown + TOML Front Matter

Same as above but with TOML `+++` delimiters (preferred by Hugo).

```markdown
+++
title = "Being a Better Lifehacker"
subtitle = "Improving the craft without letting go of the genre."
date = 2016-03-25T05:53:26.260Z
slug = "being-a-better-lifehacker"
draft = false
+++
```

### 4.3 Markdown + JSON Front Matter

Front matter as a JSON object between `{` and `}` delimiters on the first lines.

### 4.4 Plain Markdown (No Front Matter)

Clean Markdown with no metadata block. The title is rendered as an `# H1` heading at the top of the file.

### 4.5 Raw HTML (Cleaned)

Stripped of Medium's inline CSS and boilerplate, but kept as semantic HTML. Useful for CMS imports that accept HTML.

### 4.6 Structured JSON

Each post as a JSON object with `metadata` and `content` (as Markdown or HTML) fields. Useful for headless CMS or API-driven sites.

```json
{
  "metadata": {
    "title": "Being a Better Lifehacker",
    "date": "2016-03-25T05:53:26.260Z",
    "slug": "being-a-better-lifehacker",
    "draft": false
  },
  "content": "While I definitely think..."
}
```

---

## 5. Post Conversion Pipeline

Each file in `posts/` goes through the following stages:

```
┌─────────────┐    ┌──────────────┐    ┌────────────────┐    ┌──────────────┐    ┌────────────┐
│  Parse HTML  │───▶│  Extract     │───▶│  Transform     │───▶│  Generate    │───▶│  Write     │
│  (DOM tree)  │    │  Metadata    │    │  Body → MD     │    │  Front Matter│    │  Output    │
└─────────────┘    └──────────────┘    └────────────────┘    └──────────────┘    └────────────┘
```

### 5.1 Stage 1: Parse HTML

- Parse the HTML file into a DOM tree.
- Identify the document type based on structure:
  - **Published post**: `<article class="h-entry">` with a `<footer>` containing `<time class="dt-published">` and a `p-canonical` link.
  - **Draft post**: `<article class="h-entry">` with a `<footer>` containing `"View original."` link and no `dt-published` timestamp with author.
  - **Comment/Response**: A published post where the body content is very short (typically 1–3 `<p>` elements, no headings, no images) and the title is conversational (starts with common response patterns).

### 5.2 Stage 2: Extract Metadata

See [Section 6 — Metadata Extraction](#6-metadata-extraction).

### 5.3 Stage 3: Transform Body

See [Section 7 — Content Transformation Rules](#7-content-transformation-rules).

### 5.4 Stage 4: Generate Front Matter

Assemble metadata into the chosen front matter format (YAML, TOML, JSON, or none).

### 5.5 Stage 5: Write Output

Write the combined front matter + body to the output directory using the configured naming convention.

---

## 6. Metadata Extraction

All metadata is extracted from the HTML structure of each post file. No external API calls are made.

### 6.1 Post Metadata Fields

| Field | Source | Required | Notes |
|---|---|---|---|
| `title` | `<h1 class="p-name">` in `<header>` | Yes | Also duplicated as `<h3 class="graf--title">` in the body; use the `<h1>` version. |
| `subtitle` | `<section data-field="subtitle" class="p-summary">` | No | May be empty. |
| `date` | `<time class="dt-published" datetime="...">` in `<footer>` | Yes* | ISO 8601 format. *Absent for drafts. |
| `slug` | Derived from filename: `YYYY-MM-DD_<Slug>-<postId>.html` → extract `<Slug>` portion, convert to lowercase kebab-case. | Yes | |
| `canonical_url` | `<a class="p-canonical" href="...">` in `<footer>` | No | Present only for published posts. |
| `author` | `<a class="p-author h-card">` in `<footer>` | Yes* | Display name. *Absent for drafts. |
| `author_username` | Extracted from the author link `href` (e.g., `/@brennanbrown` → `brennanbrown`) | No | |
| `medium_id` | Last segment of the canonical URL or filename (e.g., `ece7c6688e68`) | Yes | The unique Medium post identifier. |
| `draft` | `true` if filename starts with `draft_`; `false` otherwise. | Yes | |
| `tags` | Not present in the export HTML. | — | Will be an empty array `[]` by default. See [Section 10](#10-configuration) for tag inference options. |
| `image` | First `<img>` in the body section (featured/hero image). | No | URL string; see [Section 8](#8-image-handling). |
| `image_caption` | `<figcaption>` text associated with the first image. | No | |

### 6.2 Filename Parsing

Published post filenames follow the pattern:
```
YYYY-MM-DD_<Title-Slug>-<12-char-hex-id>.html
```

Draft post filenames follow the pattern:
```
draft_<Title-Slug>-<12-char-hex-id>.html
```

Examples:
- `2016-03-25_Being-a-Better-Lifehacker-ece7c6688e68.html`
  - Date: `2016-03-25`
  - Slug: `being-a-better-lifehacker`
  - Medium ID: `ece7c6688e68`
- `draft_The-Great-Writing-Pivot--Why-I-m-Completely-Changing-How-I-Write-Online-ad0ea1c7a4f3.html`
  - Draft: `true`
  - Slug: `the-great-writing-pivot-why-im-completely-changing-how-i-write-online`
  - Medium ID: `ad0ea1c7a4f3`

**Note:** The Medium ID at the end of the filename is a variable-length hexadecimal string (commonly 12 characters, but can be shorter, e.g., `95a6b38004f`). The ID is always the last hyphen-separated segment before `.html`. Meddler MUST parse from the end of the filename to reliably extract the ID.

### 6.3 Profile Metadata (Site-Wide)

Extracted from `profile/profile.html` and `profile/about.html`:

| Field | Source |
|---|---|
| `display_name` | `<h3 class="p-name">` or `<b>Display name:</b>` value |
| `username` | `<a class="u-url">` href (e.g., `@brennanbrown`) |
| `email` | `<b>Email address:</b>` value |
| `medium_user_id` | `<b>Medium user ID:</b>` value |
| `avatar_url` | `<img class="u-photo">` src |
| `bio` | Full text content of `profile/about.html` body section |
| `created_at` | `<b>Created at:</b>` value |
| `connected_accounts` | Twitter handle, Facebook info from the "Connected accounts" section |
| `membership_date` | Text after "Became a Medium member at" |

### 6.4 Partner Program Earnings

Extracted from `partner-program/posts-NNNN.html`. Each `<li>` contains:
- Post link (with Medium ID extractable from the href)
- Post title (link text)
- Earnings amount (text after ` - $`)

Meddler SHOULD create a lookup map of `medium_id → earnings` and optionally inject an `earnings` field into post front matter.

---

## 7. Content Transformation Rules

The body content lives inside `<section data-field="body" class="e-content">`. Within this, Medium nests content in a deep structure:

```
<section class="section section--body">
  <div class="section-content">
    <div class="section-inner sectionLayout--insetColumn">
      <!-- actual content elements here -->
    </div>
  </div>
</section>
```

Meddler MUST unwrap these container elements and convert the inner content elements to Markdown.

### 7.1 Element-to-Markdown Mapping

| Medium HTML | Markdown Output | Notes |
|---|---|---|
| `<h3 class="graf--h3 graf--title">` | *(skip)* | Duplicate of the `<h1>` title; do not repeat in body. |
| `<h4 class="graf--h4 graf--subtitle">` | *(skip)* | Duplicate of the subtitle; do not repeat in body. |
| `<h3 class="graf--h3">` (non-title) | `### Heading` | Subheadings within the body. |
| `<h4 class="graf--h4">` (non-subtitle) | `#### Heading` | Sub-subheadings within the body. |
| `<p class="graf--p">` | Paragraph text with blank line separation | |
| `<strong>` / `<b>` | `**bold**` | |
| `<em>` / `<i>` | `*italic*` | |
| `<a class="markup--anchor">` | `[text](url)` | |
| `<blockquote>` | `> quoted text` | May be nested; handle recursively. |
| `<pre class="graf--pre">` | ` ```\ncode\n``` ` | Fenced code block. |
| `<code>` (inline) | `` `code` `` | |
| `<figure class="graf--figure">` | `![caption](image_url)` | See [Section 8](#8-image-handling). |
| `<figcaption>` | Used as alt text for the image. | |
| `<ul>` / `<ol>` / `<li>` | `- item` / `1. item` | Preserve nesting levels. |
| `<hr>` / `<hr class="section-divider">` | `---` | Only emit between sections, not at top/bottom. |
| `<div class="graf--mixtapeEmbed">` | `[**Title**\n*Description*](url)` | Medium "embed card" for linked articles. |
| `<figure class="graf--iframe">` | `<iframe src="..."></iframe>` or a placeholder `[Embedded content](url)` | Gists, YouTube, tweets, etc. See [Section 7.3](#73-embedded-content). |
| `<span class="graf-dropCap">` | Just the letter (no special formatting) | Medium's drop-cap styling; discard the styling. |
| `<div class="section-divider">` | *(skip or `---`)* | Medium section breaks. |

### 7.2 Special Text Handling

- **HTML entities**: Decode all entities (e.g., `&#39;` → `'`, `&mdash;` → `—`, `&amp;` → `&`).
- **Smart quotes**: Preserve Unicode smart quotes as-is.
- **Line breaks**: Medium sometimes uses `<br>` within paragraphs; convert to Markdown line breaks (two trailing spaces or `\n`).
- **Multiple sections**: A single post can have multiple `<section class="section--body">` elements. Join them with `---` horizontal rules or simply concatenate, depending on user configuration.

### 7.3 Embedded Content

Medium posts frequently embed external content via iframes. Common types:

| Embed Type | Identification | Recommended Output |
|---|---|---|
| **YouTube** | iframe src contains `youtube.com` | Hugo/Eleventy shortcode or raw `<iframe>` |
| **Twitter/X** | iframe src contains `twitter.com` or `platform.twitter.com` | Shortcode or `<blockquote>` |
| **GitHub Gist** | iframe src contains `gist.github.com` | Shortcode or `<script src="...">` tag |
| **CodePen** | iframe src contains `codepen.io` | Shortcode or `<iframe>` |
| **Medium article** | `<div class="graf--mixtapeEmbed">` with `medium.com` link | `[**Title** — *Description*](url)` |
| **Generic iframe** | Any other iframe | Preserve as raw HTML `<iframe>` block |

Meddler SHOULD provide an option to output embeds as:
1. **Raw HTML** (default) — preserves functionality.
2. **SSG shortcodes** — e.g., `{{< youtube "id" >}}` for Hugo.
3. **Placeholder links** — `[Embedded content](url)` for maximum portability.

### 7.4 Content Cleanup

Meddler MUST strip the following from converted content:

- All Medium-specific CSS classes (`graf--p`, `markup--anchor`, `sectionLayout--insetColumn`, etc.)
- Inline `<style>` blocks
- The `<header>` and `<footer>` elements (metadata is extracted separately)
- Empty `<div>` and `<section>` wrapper elements
- `data-*` attributes
- The `section-divider` `<hr>` elements that appear at the top of every section (these are structural, not content)
- `id` and `name` attributes on content elements (Medium's unique element IDs like `name="4e9b"`)

---

## 8. Image Handling

Medium hosts images on `cdn-images-1.medium.com`. These URLs are volatile — they may break over time or become paywalled.

### 8.1 Image URL Patterns

Medium uses two URL patterns in exports:

1. **Direct image**: `https://cdn-images-1.medium.com/max/<width>/<image-id>`
2. **Proxy image**: `https://cdn-images-1.medium.com/proxy/<quality>*<original-url>`

### 8.2 Image Handling Modes

| Mode | Flag | Behavior |
|---|---|---|
| **Reference** (default) | `--images=reference` | Keep original Medium CDN URLs as-is. Fast but fragile. |
| **Download** | `--images=download` | Download all images to a local `images/` directory. Rewrite URLs to relative paths. |
| **Download + Optimize** | `--images=optimize` | Download, then optimize (resize, compress) for web. Requires optional dependency (e.g., `sharp`). |

### 8.3 Downloaded Image Naming

When downloading, images SHOULD be named:
```
images/<post-slug>/<sequential-index>.<ext>
```

Example: `images/being-a-better-lifehacker/01.jpeg`

### 8.4 Featured Image

The first `<figure>` in a post's body is typically the hero/featured image. Meddler SHOULD:

1. Extract it as a separate `image` field in front matter.
2. Optionally remove it from the body content to avoid duplication (configurable).

### 8.5 Image Metadata

Medium's `<img>` tags include useful `data-*` attributes:

- `data-image-id` — Medium's internal image identifier
- `data-width` / `data-height` — Original image dimensions

Meddler SHOULD preserve dimensions as part of the Markdown image syntax or in front matter when available.

---

## 9. Supplementary Data Conversion

Beyond posts, Meddler SHOULD convert supplementary data into useful formats for the target site.

### 9.1 Bookmarks → Reading List

**Source**: `bookmarks/bookmarks-NNNN.html`

**Structure**: `<ul>` of `<li>` elements, each containing:
- `<a class="h-cite" href="...">` — link to the bookmarked post
- `<time class="dt-published">` — date bookmarked

**Output**: A single `bookmarks.md` or `bookmarks.json` file with:
```yaml
- title: "Article Title"
  url: "https://medium.com/p/..."
  date_bookmarked: "2026-01-30T00:34:00Z"
```

### 9.2 Claps → Liked Posts

**Source**: `claps/claps-NNNN.html`

**Structure**: `<ul>` of `<li class="h-entry">` elements containing:
- Clap count prefix (e.g., `+1 —`)
- `<a class="h-cite u-like-of" href="...">` — link and title
- `<time class="dt-published">` — date of clap

**Output**: `claps.json` or `claps.md`:
```yaml
- title: "Article Title"
  url: "https://medium.com/p/..."
  claps: 1
  date: "2015-01-12T06:00:00Z"
```

### 9.3 Highlights → Quotes Collection

**Source**: `highlights/highlights-NNNN.html`

**Structure**: `<ul>` of `<li class="h-entry">` elements containing:
- `<time class="dt-published">` — date highlighted
- `<p>` with `<span class="markup--highlight">` — the highlighted text

**Output**: `highlights.md` or `highlights.json`:
```yaml
- quote: "Learning a game is like learning a language..."
  date: "2015-05-11T06:50:00Z"
```

### 9.4 Interests → Tag/Topic Data

**Source**: `interests/tags.html`, `interests/topics.html`, `interests/publications.html`, `interests/writers.html`

**Structure**: Ordered or unordered lists of `<a>` links.

**Output**: `interests.json`:
```json
{
  "tags": ["Advice", "Content Creation", "AI", ...],
  "topics": ["Artificial Intelligence", "Productivity", ...],
  "publications": ["TDS Archive", "Dabbler", ...],
  "writers": ["@username1", "@username2", ...]
}
```

### 9.5 Lists → Curated Collections

**Source**: `lists/<ListName>-<id>.html`

**Structure**: `<article class="h-entry">` with:
- `<h1 class="p-name">` — list name
- `<section data-field="lists">` containing `<ul>` of `<li data-field="post">` with links

**Output**: One `.md` or `.json` file per list:
```yaml
---
title: "Writing"
date: 2025-12-16T05:47:57.506Z
---
- [The Artisan Writer in the Age of AI](https://medium.com/p/26af8e564695)
- [Five Reasons You Should Make Your Own Notebooks](https://medium.com/p/d87fff981678)
```

### 9.6 Partner Program → Earnings Data

**Source**: `partner-program/posts-NNNN.html`

**Structure**: `<ul>` of `<li class="h-entry">` with:
- `<a href="...">` — post link and title
- ` - $<amount>` — earnings string

**Output**: `earnings.json` and/or injection into post front matter as an `earnings` field:
```json
[
  {"title": "Gen-Z love dumb phones...", "medium_id": "f31062d103b4", "earnings": 586},
  {"title": "omg.lol is the Internet We Need", "medium_id": "3538199d5dea", "earnings": 392}
]
```

### 9.7 Social Graph → Blogroll / Following

**Source**: `users-following/`, `pubs-following/`, `topics-following/`

**Structure**: `<ul>` of `<li>` with `<a>` links to Medium profiles/publications/topics.

**Output**: `following.json`:
```json
{
  "users": ["@kassandrawrites", "@zulie", ...],
  "publications": ["A Village for Grown-Ups", "Music For Thought", ...],
  "topics": ["Money", "Freelancing", "Creativity", ...]
}
```

Optionally generate a `blogroll.md` or OPML file from followed publications.

### 9.8 Profile → Site Configuration

**Source**: `profile/profile.html`, `profile/about.html`, `profile/publications.html`

**Output**: `author.json` and/or a ready-to-use SSG config snippet:

```yaml
# Hugo config snippet
params:
  author:
    name: "Brennan Kenneth Brown"
    username: "brennanbrown"
    email: "brennankbrown@outlook.com"
    bio: "Multi-disciplinary writer and JAMstack developer..."
    avatar: "https://cdn-images-1.medium.com/proxy/1*aoju3D8qrFIj2T06hTseQA.png"
    social:
      twitter: "brennankbrown"
```

### 9.9 Excluded Data

The following are **not converted by default** (but are preserved in the output as raw copies if `--include-all` is specified):

| Source | Reason |
|---|---|
| `sessions/` | Login session data — privacy-sensitive, not useful for a blog. |
| `ips.html` | IP address history — privacy-sensitive. |
| `blocks/` | Blocked users — private moderation data. |
| `twitter/suggested-friends-NNNN.html` | Platform-specific social graph; low value. |

---

## 10. Configuration

Meddler supports configuration via CLI flags, a config file (`.meddler.yml`), or both (CLI flags override the config file).

### 10.1 Configuration File (`.meddler.yml`)

```yaml
# Input/Output
input: ./medium-export/
output: ./output/
format: yaml          # yaml | toml | json | plain | html | structured-json

# Posts
include_drafts: true
include_responses: false   # Short comments/replies on other posts
separate_drafts: true      # Put drafts in a separate directory

# Front Matter
front_matter:
  extra_fields:
    layout: post
    type: blog
  date_format: iso8601     # iso8601 | yyyy-mm-dd | unix
  inject_earnings: true    # Add earnings from partner-program data

# Images
images:
  mode: download           # reference | download | optimize
  output_dir: images       # Relative to each post or global
  per_post_dirs: true      # images/<slug>/ or flat images/
  extract_featured: true   # Pull first image into front matter
  remove_featured_from_body: false

# Embeds
embeds:
  mode: raw_html           # raw_html | shortcodes | placeholders
  shortcode_format: hugo   # hugo | eleventy | jekyll

# Content
content:
  section_breaks: hr       # hr | none | spacing
  drop_caps: strip         # strip | preserve

# Supplementary Data
supplementary:
  bookmarks: true
  claps: true
  highlights: true
  interests: true
  lists: true
  earnings: true
  social_graph: true
  profile: true
  blogroll_format: opml    # opml | json | md | none

# SSG Target
target: hugo               # hugo | eleventy | jekyll | astro | generic
```

### 10.2 Response/Comment Detection

Medium exports include short responses to other people's posts alongside full articles. Meddler SHOULD detect these by:

1. **Filename heuristic**: Titles that begin with common response patterns (e.g., "Interesting piece", "I appreciate the idea", "Great article").
2. **Content length**: Body has ≤ 3 paragraph elements and no subheadings, images, or embeds.
3. **Absence of a `graf--title`**: Responses often lack a proper title heading in the body.

Users can choose to include, exclude, or separate responses via config.

---

## 11. CLI Interface

```
meddler <input-path> [options]

ARGUMENTS:
  <input-path>              Path to extracted Medium export folder or .zip file

OPTIONS:
  -o, --output <dir>        Output directory (default: ./meddler-output/)
  -f, --format <fmt>        Front matter format: yaml, toml, json, plain, html,
                            structured-json (default: yaml)
  -t, --target <ssg>        Target SSG: hugo, eleventy, jekyll, astro, generic
                            (default: generic)
  --drafts                  Include draft posts (default: true)
  --no-drafts               Exclude draft posts
  --responses               Include short responses/comments (default: false)
  --images <mode>           Image handling: reference, download, optimize
                            (default: reference)
  --embeds <mode>           Embed handling: raw_html, shortcodes, placeholders
                            (default: raw_html)
  --earnings                Inject partner program earnings into front matter
  --supplementary           Convert supplementary data (bookmarks, claps, etc.)
  --no-supplementary        Skip supplementary data conversion
  --include-all             Include all data including sessions, IPs, blocks
  --config <file>           Path to config file (default: .meddler.yml)
  --dry-run                 Preview what would be generated without writing files
  --verbose                 Verbose logging output
  --version                 Show version
  --help                    Show help
```

### 11.1 Example Commands

```bash
# Basic conversion with defaults
meddler ./medium-export/

# Hugo-ready output with downloaded images
meddler ./medium-export/ -t hugo --images download -o ./content/posts/

# Eleventy output, YAML front matter, include everything
meddler ./medium-export/ -t eleventy --supplementary --earnings

# Dry run to preview
meddler ./medium-export/ --dry-run --verbose

# From a zip file
meddler ~/Downloads/medium-export-abc123.zip -o ./my-blog/content/
```

---

## 12. Output Directory Structure

### 12.1 Default (`generic` target)

```
meddler-output/
├── posts/
│   ├── being-a-better-lifehacker.md
│   ├── anti-medium.md
│   └── ...
├── drafts/                          # If separate_drafts is true
│   ├── the-great-writing-pivot.md
│   └── ...
├── images/                          # If images mode is download/optimize
│   ├── being-a-better-lifehacker/
│   │   └── 01.jpeg
│   └── ...
├── data/                            # Supplementary data
│   ├── author.json
│   ├── bookmarks.json
│   ├── claps.json
│   ├── highlights.json
│   ├── interests.json
│   ├── lists/
│   │   ├── writing.json
│   │   └── ...
│   ├── earnings.json
│   ├── following.json
│   └── publications.json
└── meddler-report.json              # Conversion summary/report
```

### 12.2 Hugo Target

```
meddler-output/
├── content/
│   ├── posts/
│   │   ├── being-a-better-lifehacker/
│   │   │   ├── index.md              # Page bundle
│   │   │   └── images/
│   │   │       └── 01.jpeg
│   │   └── ...
│   └── drafts/
├── data/
│   ├── author.json
│   └── ...
└── static/
    └── images/                        # If not using page bundles
```

### 12.3 Eleventy Target

```
meddler-output/
├── posts/
│   ├── being-a-better-lifehacker.md
│   └── ...
├── _data/
│   ├── author.json
│   ├── bookmarks.json
│   └── ...
├── images/
│   └── ...
└── posts.json                         # Collection metadata
```

### 12.4 Jekyll Target

```
meddler-output/
├── _posts/
│   ├── 2016-03-25-being-a-better-lifehacker.md    # Jekyll date-prefix convention
│   └── ...
├── _drafts/
│   ├── the-great-writing-pivot.md
│   └── ...
├── _data/
│   ├── author.yml
│   └── ...
└── assets/
    └── images/
```

### 12.5 Astro Target

```
meddler-output/
├── src/
│   └── content/
│       └── posts/
│           ├── being-a-better-lifehacker.md
│           └── ...
├── public/
│   └── images/
└── src/
    └── data/
        ├── author.json
        └── ...
```

---

## 13. Edge Cases & Special Handling

### 13.1 Duplicate Titles

Multiple posts may share the same slug. Meddler MUST detect collisions and append the Medium ID:
```
being-a-better-lifehacker.md
being-a-better-lifehacker-abc123def456.md
```

### 13.2 Empty Drafts

Some draft files may have a title but no body content. Meddler SHOULD still generate a file with front matter and an empty body, logging a warning.

### 13.3 Very Short Posts (Responses/Comments)

Posts with 1–3 short paragraphs and no headings are likely responses to other articles. Meddler SHOULD:
- Classify them separately.
- Default to excluding them (configurable via `--responses`).
- If included, add `type: response` to front matter.

### 13.4 Malformed HTML

Medium's export HTML is machine-generated and generally well-formed, but edge cases exist:
- Unclosed tags inside `<pre>` blocks.
- Nested `<section>` elements.
- Malformed `<ul>` with missing closing tags (observed in `lists/` files: `<ul>` instead of `</ul>`).

Meddler MUST use a lenient HTML parser (e.g., `cheerio`, `jsdom`, or `BeautifulSoup`) that handles malformed markup gracefully.

### 13.5 Unicode and Special Characters

- Post titles may contain smart quotes, em dashes, and other Unicode characters.
- Filenames derived from slugs MUST be sanitized to filesystem-safe characters.
- Front matter string values containing colons, quotes, or newlines MUST be properly escaped/quoted.

### 13.6 Pagination Aggregation

Directories like `claps/`, `bookmarks/`, `highlights/`, and `sessions/` paginate data across multiple `NNNN`-suffixed files. Meddler MUST:
1. Discover all files matching the pattern `<name>-NNNN.html`.
2. Parse each file and aggregate results into a single dataset.
3. Deduplicate entries if necessary.

### 13.7 Image CDN Failures

When downloading images (`--images=download`):
- Medium CDN URLs may return 403/404 errors.
- Meddler SHOULD retry once, log the failure, and leave the original URL as a fallback.
- A summary of failed downloads MUST be included in `meddler-report.json`.

### 13.8 Posts with Multiple Sections

Medium posts can have multiple `<section class="section--body">` blocks, sometimes with different layouts (`sectionLayout--insetColumn`, `sectionLayout--outsetColumn`, `sectionLayout--fullWidth`). Meddler SHOULD:
- Flatten all sections into a single Markdown document.
- Optionally insert `---` between sections.
- Ignore layout-specific classes (these are presentation-only).

---

## 14. Target SSG Compatibility

### 14.1 Hugo

| Feature | Implementation |
|---|---|
| Front matter | TOML (`+++`) or YAML (`---`) |
| Date format | ISO 8601 |
| Draft support | `draft: true` in front matter |
| Image bundles | Page bundles with `index.md` + co-located images |
| Embeds | Shortcodes: `{{< youtube "id" >}}`, `{{< gist "user" "id" >}}`, `{{< tweet "id" >}}` |
| Taxonomy | `tags` and `categories` arrays in front matter |
| Data files | `data/*.json` or `data/*.yaml` |

### 14.2 Eleventy (11ty)

| Feature | Implementation |
|---|---|
| Front matter | YAML (`---`) or JSON |
| Date format | ISO 8601 or `YYYY-MM-DD` |
| Draft support | Custom `draft: true` field + collection filter |
| Images | Flat directory or per-post |
| Embeds | Paired shortcodes or raw HTML (passthrough) |
| Tags | `tags` array in front matter |
| Data files | `_data/*.json` (global data) |

### 14.3 Jekyll

| Feature | Implementation |
|---|---|
| Front matter | YAML (`---`) |
| Filename convention | `YYYY-MM-DD-slug.md` in `_posts/` |
| Draft support | Files in `_drafts/` (no date prefix) |
| Images | `assets/images/` |
| Embeds | Liquid includes or raw HTML |
| Tags/Categories | `tags` and `categories` in front matter |
| Data files | `_data/*.yml` |

### 14.4 Astro

| Feature | Implementation |
|---|---|
| Front matter | YAML (`---`) with content collections schema |
| Content path | `src/content/posts/` |
| Draft support | `draft: true` in front matter |
| Images | `public/images/` |
| Embeds | MDX components or raw HTML |
| Data files | `src/data/*.json` |

---

## 15. Technical Requirements

### 15.1 Runtime

- **Language**: TypeScript / Node.js (recommended) or Python
- **Minimum Node.js version**: 18.x LTS
- **No external API calls** — all conversion is offline from the local export files

### 15.2 Key Dependencies

| Purpose | Recommended Package |
|---|---|
| HTML parsing | `cheerio` (Node) or `BeautifulSoup4` (Python) |
| Markdown generation | `turndown` (Node) or custom DOM walker |
| YAML serialization | `js-yaml` (Node) or `PyYAML` (Python) |
| TOML serialization | `@iarna/toml` (Node) or `toml` (Python) |
| Image downloading | `node-fetch` / `got` (Node) or `requests` (Python) |
| Image optimization | `sharp` (Node) — optional |
| CLI framework | `commander` / `yargs` (Node) or `click` (Python) |
| ZIP extraction | `adm-zip` / `extract-zip` (Node) or `zipfile` (Python) |
| File system | `fs-extra` (Node) or `pathlib` (Python) |

### 15.3 Performance Targets

- Convert 400 posts in < 10 seconds (without image downloading).
- Image downloading should be parallelized (configurable concurrency, default 5).
- Memory usage should stay under 512 MB for exports with up to 1,000 posts.

### 15.4 Error Handling

- **Fail gracefully**: Never crash on a single malformed file. Log the error and continue.
- **Report file**: Generate `meddler-report.json` summarizing:
  - Total posts found (published / drafts / responses)
  - Successfully converted count
  - Skipped files (with reasons)
  - Image download failures
  - Warnings (e.g., duplicate slugs, empty content)

---

## 16. Glossary

| Term | Definition |
|---|---|
| **Medium Export** | A `.zip` archive downloaded from Medium's "Download your information" settings page, containing all user data as HTML files. |
| **Post** | A published article or story written by the user on Medium. |
| **Draft** | An unpublished post, identifiable by the `draft_` prefix in its filename. |
| **Response** | A short comment or reply written on another user's post; exported as a post file but typically only 1–3 paragraphs. |
| **Front Matter** | Structured metadata block at the top of a Markdown file, delimited by `---` (YAML), `+++` (TOML), or `{}`  (JSON). |
| **Slug** | A URL-friendly version of a post title (e.g., `being-a-better-lifehacker`). |
| **Medium ID** | A hexadecimal identifier unique to each Medium post (e.g., `ece7c6688e68`). |
| **Graf** | Medium's internal term for a content block (paragraph, heading, image, etc.), reflected in CSS classes like `graf--p`, `graf--h3`. |
| **Mixtape Embed** | Medium's card-style embed for linking to other articles, rendered as `<div class="graf--mixtapeEmbed">`. |
| **Page Bundle** | Hugo's convention of co-locating a post's Markdown and assets in a single directory with `index.md`. |
| **SSG** | Static Site Generator — a tool that builds HTML websites from source files (Markdown, templates, data). |
| **OPML** | Outline Processor Markup Language — an XML format for exchanging lists of web feeds, used for blogrolls. |
| **h-entry / h-card** | Microformat classes used by Medium in its HTML export for posts (`h-entry`) and profile data (`h-card`). |
| **Partner Program** | Medium's monetization program that pays writers based on member reading time. |
