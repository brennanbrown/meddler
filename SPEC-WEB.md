# Meddler Web — GUI Specification Sheet

> **Meddler Web** is a lightweight, static, client-side web application that provides a visual interface for converting Medium data exports into clean, portable formats. It runs entirely in the browser — no server, no uploads to third parties — making it private, fast, and hostable anywhere (GitHub Pages, Netlify, Vercel, or even opened as a local HTML file).

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Architecture Overview](#2-architecture-overview)
3. [User Flow](#3-user-flow)
4. [UI Layout & Screens](#4-ui-layout--screens)
5. [File Input Handling](#5-file-input-handling)
6. [Export Analysis & Preview](#6-export-analysis--preview)
7. [Configuration Panel](#7-configuration-panel)
8. [Conversion Engine](#8-conversion-engine)
9. [Output & Download](#9-output--download)
10. [Accessibility & Responsiveness](#10-accessibility--responsiveness)
11. [Technical Stack](#11-technical-stack)
12. [Performance & Constraints](#12-performance--constraints)
13. [Privacy & Security](#13-privacy--security)
14. [Deployment](#14-deployment)
15. [Relationship to Meddler CLI](#15-relationship-to-meddler-cli)

---

## 1. Design Philosophy

### 1.1 Core Principles

- **Zero backend** — All processing happens client-side in the browser via JavaScript/WASM. No files leave the user's machine.
- **Single-page app** — One HTML page with progressive disclosure. No routing, no page reloads.
- **Accessible by default** — Keyboard-navigable, screen-reader friendly, respects `prefers-reduced-motion` and `prefers-color-scheme`.
- **Works offline** — Once loaded, the app functions without an internet connection (except for optional image downloading, which requires network access to Medium's CDN).
- **No account required** — No sign-up, no tracking, no analytics. Open the page and use it.

### 1.2 Target Users

Writers and bloggers who:
- Have little to no command-line experience.
- Want to migrate their Medium content to Hugo, Eleventy, Jekyll, Astro, or another SSG.
- Need a quick, visual way to preview and configure their export before committing to a format.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│                                                          │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │  UI Layer │──▶│  Conversion  │──▶│  ZIP Generation │  │
│  │  (React)  │   │  Engine      │   │  & Download     │  │
│  └──────────┘   │  (shared w/  │   │  (JSZip /        │  │
│       │         │   CLI core)  │   │   StreamSaver)   │  │
│       │         └──────────────┘   └─────────────────┘  │
│       │                │                                 │
│       ▼                ▼                                 │
│  ┌──────────┐   ┌──────────────┐                        │
│  │  File     │   │  Web Workers │                        │
│  │  System   │   │  (parallel   │                        │
│  │  Access   │   │   parsing)   │                        │
│  │  API      │   └──────────────┘                        │
│  └──────────┘                                            │
└──────────────────────────────────────────────────────────┘
```

### 2.1 Key Constraint

The entire application MUST be deployable as static files (HTML, CSS, JS). No server-side code, no serverless functions, no databases. This ensures:
- Free hosting on any static host.
- Full privacy — files never leave the browser.
- No CORS issues for local file processing.

---

## 3. User Flow

The application follows a **linear wizard pattern** with 4 steps. Users can navigate back to any completed step.

```
┌─────────┐     ┌─────────────┐     ┌───────────┐     ┌──────────┐
│ 1. LOAD │────▶│ 2. PREVIEW  │────▶│ 3. CONFIG │────▶│ 4. EXPORT│
│  Upload  │     │  Analyze &  │     │  Select    │     │  Convert │
│  export  │     │  display    │     │  options   │     │  & save  │
└─────────┘     └─────────────┘     └───────────┘     └──────────┘
     ◀──────────────────────────────────────────────────────▶
                     (free navigation between steps)
```

### 3.1 Step 1 — Load Export

User uploads their Medium export via drag-and-drop or file picker.

### 3.2 Step 2 — Preview & Analyze

Meddler parses the export and shows a summary: post count, drafts, responses, date range, profile info, supplementary data available. Users can browse and preview individual posts.

### 3.3 Step 3 — Configure

User selects output format, target SSG, image handling, which content to include/exclude, and other options from the CLI spec.

### 3.4 Step 4 — Export

Conversion runs in the browser. Progress is shown. User downloads a `.zip` of the converted output.

---

## 4. UI Layout & Screens

### 4.1 Global Layout

```
┌──────────────────────────────────────────────────┐
│  ◉ Meddler                            [☀/🌙]    │  ← Top bar: logo, dark mode toggle
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─── Step Indicator ─────────────────────────┐  │
│  │  ● Load  ──  ○ Preview  ──  ○ Config  ──  │  │
│  │  ○ Export                                  │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─── Main Content Area ─────────────────────┐  │
│  │                                            │  │
│  │         (varies by active step)            │  │
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─── Footer ────────────────────────────────┐  │
│  │  [← Back]                      [Next →]   │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

### 4.2 Screen 1: Load Export

```
┌────────────────────────────────────────────────────┐
│                                                    │
│         ┌──────────────────────────────┐           │
│         │                              │           │
│         │   📂  Drag & drop your       │           │
│         │       Medium export here     │           │
│         │                              │           │
│         │   (.zip file or folder)      │           │
│         │                              │           │
│         │   ─── or ───                 │           │
│         │                              │           │
│         │   [ Browse Files ]           │           │
│         │                              │           │
│         └──────────────────────────────┘           │
│                                                    │
│   🔒 Your files never leave your browser.          │
│      All processing happens locally.               │
│                                                    │
│   ℹ️  How to export your Medium data →             │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Behaviors:**
- Accept `.zip` files via drag-and-drop or `<input type="file">`.
- Accept folder uploads via `<input type="file" webkitdirectory>` for extracted exports.
- Show a loading spinner while parsing.
- Validate the export (check for `README.html` and `posts/` directory).
- On invalid input, show an inline error: *"This doesn't look like a Medium export. Expected a folder containing README.html and a posts/ directory."*

### 4.3 Screen 2: Preview & Analyze

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  Export Summary                                    │
│  ──────────────────────────────────────────────    │
│  👤 Brennan Kenneth Brown (@brennanbrown)          │
│  📅 Account created: Nov 20, 2013                  │
│  📧 brennankbrown@outlook.com                      │
│                                                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐     │
│  │ 📝 337     │ │ 📄 61      │ │ 💬 ~142    │     │
│  │ Published  │ │ Drafts     │ │ Responses  │     │
│  └────────────┘ └────────────┘ └────────────┘     │
│                                                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐     │
│  │ 📑 4 pages │ │ 👏 18 pgs  │ │ 💡 3 pages │     │
│  │ Bookmarks  │ │ Claps      │ │ Highlights │     │
│  └────────────┘ └────────────┘ └────────────┘     │
│                                                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐     │
│  │ 📋 3       │ │ 💰 Yes     │ │ 👥 Social  │     │
│  │ Lists      │ │ Earnings   │ │ Graph      │     │
│  └────────────┘ └────────────┘ └────────────┘     │
│                                                    │
│  Date Range: Dec 2015 → Feb 2026                   │
│                                                    │
│  ── Post Browser ──────────────────────────────    │
│                                                    │
│  🔍 [Search posts...]          [Filter ▾]         │
│                                                    │
│  ┌──────────────────────────────────────────┐      │
│  │ ☑ Being a Better Lifehacker              │      │
│  │   Mar 25, 2016 · Published               │      │
│  │                                          │      │
│  │ ☑ Anti-Medium                            │      │
│  │   Mar 20, 2016 · Published               │      │
│  │                                          │      │
│  │ ☐ Interesting piece!                     │      │
│  │   Dec 2, 2015 · Response                 │      │
│  │                                          │      │
│  │ ☑ The Great Writing Pivot...             │      │
│  │   No date · Draft                        │      │
│  │                                          │      │
│  │          ... (scrollable list) ...       │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  [Select All]  [Deselect All]  [Invert]            │
│  [Select Published Only]  [Select Drafts Only]     │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Behaviors:**
- Parse all files in the export immediately after upload.
- Show profile info extracted from `profile/profile.html`.
- Count and categorize posts (published, drafts, responses).
- Detect responses using the heuristics from CLI SPEC Section 10.2 (short body, conversational title, no headings/images).
- Post browser allows per-post selection/deselection via checkboxes.
- Search filters by title (client-side, instant).
- Filter dropdown: All, Published, Drafts, Responses.
- Clicking a post title opens a **preview panel** (slide-out or modal) showing:
  - Title, subtitle, date, canonical URL.
  - Rendered HTML preview of the post body (using the original Medium HTML, stripped of boilerplate CSS).
  - Metadata that will be extracted.

### 4.4 Screen 3: Configure

The configuration panel maps directly to the options in `SPEC.md` Section 10. Options are organized into collapsible groups.

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  Output Settings                                   │
│  ──────────────────────────────────────────────    │
│                                                    │
│  ▼ Format & Target                                 │
│  ┌──────────────────────────────────────────┐      │
│  │  Front Matter Format                     │      │
│  │  ○ YAML (---)     ● recommended          │      │
│  │  ○ TOML (+++)                            │      │
│  │  ○ JSON                                  │      │
│  │  ○ None (plain Markdown)                 │      │
│  │                                          │      │
│  │  Target SSG                              │      │
│  │  ┌──────────────────────────────┐        │      │
│  │  │ ▾ Generic (works anywhere)   │        │      │
│  │  │   Hugo                       │        │      │
│  │  │   Eleventy (11ty)            │        │      │
│  │  │   Jekyll                     │        │      │
│  │  │   Astro                      │        │      │
│  │  └──────────────────────────────┘        │      │
│  │                                          │      │
│  │  Output Format                           │      │
│  │  ○ Markdown + front matter               │      │
│  │  ○ Cleaned HTML                          │      │
│  │  ○ Structured JSON                       │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  ▼ Content Options                                 │
│  ┌──────────────────────────────────────────┐      │
│  │  ☑ Include draft posts                   │      │
│  │  ☐ Include responses/comments            │      │
│  │  ☑ Separate drafts into own folder       │      │
│  │  ☑ Extract featured image to front matter│      │
│  │  ☐ Remove featured image from body       │      │
│  │  ☑ Inject partner program earnings       │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  ▼ Image Handling                                  │
│  ┌──────────────────────────────────────────┐      │
│  │  ○ Keep Medium CDN URLs (fast, fragile)  │      │
│  │  ○ Download images locally               │      │
│  │                                          │      │
│  │  ☑ Organize images per post              │      │
│  │    images/<slug>/01.jpeg                 │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  ▼ Embed Handling                                  │
│  ┌──────────────────────────────────────────┐      │
│  │  ○ Raw HTML (preserves iframes)          │      │
│  │  ○ SSG shortcodes (auto-detected)        │      │
│  │  ○ Placeholder links (most portable)     │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  ▼ Supplementary Data                              │
│  ┌──────────────────────────────────────────┐      │
│  │  ☑ Bookmarks (reading list)              │      │
│  │  ☑ Claps (liked posts)                   │      │
│  │  ☑ Highlights (quotes)                   │      │
│  │  ☑ Interests (tags & topics)             │      │
│  │  ☑ Lists (curated collections)           │      │
│  │  ☑ Earnings data                         │      │
│  │  ☑ Social graph (following)              │      │
│  │  ☑ Profile / author data                 │      │
│  │  ☐ Sessions & IP history                 │      │
│  │  ☐ Blocked users                         │      │
│  │                                          │      │
│  │  Supplementary format                    │      │
│  │  ○ JSON   ○ YAML   ○ Markdown            │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  ▼ Advanced                                        │
│  ┌──────────────────────────────────────────┐      │
│  │  Section breaks:  ○ Horizontal rule      │      │
│  │                   ○ None                  │      │
│  │                   ○ Extra spacing         │      │
│  │                                          │      │
│  │  Date format:  ○ ISO 8601                │      │
│  │                ○ YYYY-MM-DD              │      │
│  │                                          │      │
│  │  Extra front matter fields:              │      │
│  │  ┌────────────────────────────────┐      │      │
│  │  │ layout: post                   │      │      │
│  │  │ type: blog                     │      │      │
│  │  │ (add key: value pairs)         │      │      │
│  │  └────────────────────────────────┘      │      │
│  │  [ + Add field ]                         │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  ── Live Preview ──────────────────────────────    │
│  Shows a sample converted post with current        │
│  settings applied. Updates in real time.            │
│                                                    │
│  ┌──────────────────────────────────────────┐      │
│  │ ---                                      │      │
│  │ title: "Being a Better Lifehacker"       │      │
│  │ subtitle: "Improving the craft..."       │      │
│  │ date: 2016-03-25T05:53:26.260Z           │      │
│  │ slug: being-a-better-lifehacker          │      │
│  │ draft: false                             │      │
│  │ layout: post                             │      │
│  │ type: blog                               │      │
│  │ earnings: 0                              │      │
│  │ ---                                      │      │
│  │                                          │      │
│  │ While I definitely think it's healthy... │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Behaviors:**
- All options have sensible defaults matching the CLI spec defaults.
- Selecting a **Target SSG** auto-adjusts related options:
  - Hugo → TOML front matter, page bundle directories, Hugo shortcodes.
  - Eleventy → YAML front matter, `_data/` directory.
  - Jekyll → YAML front matter, `YYYY-MM-DD-slug.md` naming, `_posts/`/`_drafts/`.
  - Astro → YAML front matter, `src/content/` directory.
  - Generic → YAML front matter, flat structure.
- **Live preview** at the bottom shows one sample post converted with the current settings. It updates as options change (debounced ~300ms).
- Image "Download locally" option shows an info note: *"Images will be fetched from Medium's CDN during export. This requires internet access and may take a few minutes for large exports."*
- The "Image optimize" mode from the CLI spec is **not available** in the web version (would require server-side processing or heavy WASM dependencies). A tooltip explains this.
- Extra front matter fields use a key-value pair editor with add/remove buttons.
- All configuration state is persisted to `localStorage` so it survives page reloads.

### 4.5 Screen 4: Export

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  Ready to Export                                   │
│  ──────────────────────────────────────────────    │
│                                                    │
│  Summary:                                          │
│  • 337 published posts                             │
│  • 61 drafts                                       │
│  • Format: Markdown + YAML front matter            │
│  • Target: Hugo (page bundles)                     │
│  • Images: Download locally                        │
│  • Supplementary data: 8 files                     │
│                                                    │
│  Estimated output: ~2.4 MB (excluding images)      │
│                                                    │
│          [ ⬇ Start Export ]                        │
│                                                    │
│  ── Progress ──────────────────────────────────    │
│                                                    │
│  Converting posts...                               │
│  ████████████████████░░░░░░░░░░  214 / 398         │
│                                                    │
│  ✓ Metadata extracted                              │
│  ✓ 214 posts converted                             │
│  ⟳ Downloading images... (38 / 127)                │
│  ○ Supplementary data                              │
│  ○ Generating ZIP                                  │
│                                                    │
│  ── Log ───────────────────────────────────────    │
│  ┌──────────────────────────────────────────┐      │
│  │ ⚠ Skipped: "Interesting piece!" (respo-  │      │
│  │   nse, excluded by config)               │      │
│  │ ⚠ Image download failed: cdn-images-1..  │      │
│  │   /max/800/1*abc.jpg (404)               │      │
│  │ ✓ being-a-better-lifehacker.md           │      │
│  │ ✓ anti-medium.md                         │      │
│  │         ... (scrollable log) ...         │      │
│  └──────────────────────────────────────────┘      │
│                                                    │
│  ── Complete ──────────────────────────────────    │
│                                                    │
│  ✅ Export complete!                                │
│                                                    │
│  📊 Report:                                        │
│  • 335 posts converted successfully                │
│  • 2 posts skipped (see log)                       │
│  • 61 drafts converted                             │
│  • 127 images downloaded (3 failed)                │
│  • 8 supplementary data files generated            │
│                                                    │
│         [ ⬇ Download ZIP (14.7 MB) ]              │
│         [ 📋 Download Report (JSON) ]              │
│                                                    │
│         [ ↩ Start Over ]                           │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Behaviors:**
- "Start Export" button kicks off the conversion.
- Progress bar updates in real time as posts are processed.
- Conversion runs in a **Web Worker** to keep the UI responsive.
- Log panel streams messages (info, warnings, errors) as they occur. Scrolls to bottom automatically.
- Image downloads (if enabled) run in parallel with configurable concurrency (default 5) and show separate progress.
- On completion, the output is assembled into a `.zip` file in memory using JSZip.
- "Download ZIP" triggers a browser download of the generated `.zip`.
- "Download Report" provides the `meddler-report.json` separately.
- "Start Over" resets the app to Step 1 (with a confirmation dialog if the user hasn't downloaded yet).

---

## 5. File Input Handling

### 5.1 Input Methods

| Method | API | Notes |
|---|---|---|
| **Drag & drop `.zip`** | `ondrop` + `File` API | Most common path. |
| **File picker `.zip`** | `<input type="file" accept=".zip">` | Fallback for drag-and-drop. |
| **Folder upload** | `<input type="file" webkitdirectory>` | For already-extracted exports. Non-standard but widely supported (Chrome, Edge, Firefox). |
| **File System Access API** | `showDirectoryPicker()` | Modern API for folder access. Progressive enhancement — use if available, hide if not. |

### 5.2 ZIP Extraction

- Use **JSZip** to extract `.zip` files in the browser.
- Build an in-memory virtual file system (a `Map<string, Uint8Array>` or similar) from the extracted contents.
- Strip the top-level hash-named directory (e.g., `medium-export-<hash>/`) so paths are relative to the export root.
- Handle nested ZIP edge cases (Medium has changed export formats over time).

### 5.3 Folder Upload

- When using `webkitdirectory` or `showDirectoryPicker()`, iterate the `FileList` or directory handle to build the same virtual file system.
- Normalize paths (strip the upload root directory name).

### 5.4 Validation

After building the virtual file system, validate:

1. `README.html` exists at root → confirms this is a Medium export.
2. `posts/` directory exists → confirms there is content to convert.
3. At least one `.html` file exists in `posts/`.

**Error states:**

| Condition | Message |
|---|---|
| Not a `.zip` and not a folder | "Please upload a .zip file or use folder upload." |
| ZIP contains no `README.html` | "This doesn't look like a Medium export. No README.html found." |
| ZIP contains no `posts/` directory | "This export doesn't contain any posts." |
| ZIP is empty or corrupt | "The file appears to be empty or corrupted." |
| ZIP is too large (>500 MB) | "This export is very large. For best results, use the Meddler CLI tool." |

### 5.5 Memory Management

Medium exports are typically 1–50 MB. For very large exports:
- Parse files lazily — only fully parse a post's HTML when it's needed (preview or conversion).
- During the initial scan, only read filenames and extract lightweight metadata (title from `<title>` tag, date from filename).
- Release parsed DOM trees after conversion to avoid holding the entire export in memory twice.

---

## 6. Export Analysis & Preview

### 6.1 Initial Scan

On upload, perform a fast scan that:

1. Lists all files and directories.
2. Counts posts by type (published/draft/response) using filename patterns.
3. Extracts profile info from `profile/profile.html` (lightweight parse).
4. Counts supplementary data files per category.
5. Determines date range from published post filenames.

This scan should complete in < 1 second for a typical export (~400 posts).

### 6.2 Post Classification

Each file in `posts/` is classified as:

| Type | Detection | Default Selection |
|---|---|---|
| **Published** | Filename matches `YYYY-MM-DD_*.html` and body has substantial content | ☑ Selected |
| **Draft** | Filename starts with `draft_` | ☑ Selected |
| **Response** | Published post with ≤ 3 `<p>` elements, no headings, no images, and short total text length (< 280 chars) | ☐ Deselected |

### 6.3 Post Preview Panel

When a user clicks a post title in the browser list, a slide-out panel or modal shows:

- **Rendered preview**: The post body HTML rendered in a sandboxed container with clean styling (not Medium's inline CSS).
- **Metadata table**: Title, subtitle, date, slug, canonical URL, Medium ID, word count, image count.
- **Converted preview**: A toggle to show the Markdown output with current configuration applied.
- **Selection toggle**: Include/exclude this specific post.

### 6.4 Search & Filter

- **Search**: Client-side fuzzy search on post titles. Instant results as the user types.
- **Filter chips**: Published | Drafts | Responses — toggle to show/hide each category.
- **Sort**: By date (newest/oldest) or by title (A–Z).
- **Bulk actions**: Select All, Deselect All, Invert Selection, Select Published Only, Select Drafts Only.

---

## 7. Configuration Panel

The configuration panel (Screen 3) exposes the same options as the CLI `SPEC.md` Section 10, organized into collapsible accordion sections for progressive disclosure.

### 7.1 Option Groups

| Group | Options | Default |
|---|---|---|
| **Format & Target** | Front matter format (YAML/TOML/JSON/None), Target SSG (Generic/Hugo/Eleventy/Jekyll/Astro), Output format (Markdown/HTML/JSON) | YAML, Generic, Markdown |
| **Content** | Include drafts, Include responses, Separate drafts folder, Extract featured image, Remove featured image from body, Inject earnings | ☑,☐,☑,☑,☐,☑ |
| **Images** | Mode (Reference/Download), Per-post directories | Reference, ☑ |
| **Embeds** | Mode (Raw HTML/Shortcodes/Placeholders) | Raw HTML |
| **Supplementary Data** | Toggle each: bookmarks, claps, highlights, interests, lists, earnings, social graph, profile, sessions, blocks. Supplementary format (JSON/YAML/MD). | All on except sessions & blocks. JSON. |
| **Advanced** | Section breaks (HR/None/Spacing), Date format (ISO/YYYY-MM-DD), Extra front matter fields (key-value editor) | HR, ISO 8601, empty |

### 7.2 SSG Presets

When the user selects a Target SSG, a preset is applied that adjusts multiple options at once. The user can still override individual options after applying a preset.

| Preset | Front Matter | File Naming | Directory Structure | Embeds |
|---|---|---|---|---|
| **Generic** | YAML | `<slug>.md` | `posts/`, `drafts/`, `data/` | Raw HTML |
| **Hugo** | TOML | `index.md` (page bundle) | `content/posts/<slug>/`, `data/` | Hugo shortcodes |
| **Eleventy** | YAML | `<slug>.md` | `posts/`, `_data/` | Raw HTML |
| **Jekyll** | YAML | `YYYY-MM-DD-<slug>.md` | `_posts/`, `_drafts/`, `_data/` | Raw HTML |
| **Astro** | YAML | `<slug>.md` | `src/content/posts/`, `src/data/` | Raw HTML |

Applying a preset shows a brief toast: *"Applied Hugo preset. You can customize individual settings below."*

### 7.3 Live Preview

A collapsible "Live Preview" section at the bottom of the config panel shows a single sample post converted with the current settings. It:

- Picks the first selected published post as the sample.
- Re-renders on any option change (debounced 300ms).
- Shows the raw Markdown output in a syntax-highlighted code block.
- Helps the user verify front matter format, field names, and content structure before committing.

### 7.4 Persistence

All configuration state MUST be saved to `localStorage` under a namespaced key (`meddler-config`). When the user returns or refreshes:
- Config is restored.
- A subtle notification: *"Restored your previous settings."* with a dismiss/reset link.

### 7.5 Import/Export Config

- **Export config**: Download current settings as `.meddler.yml` (the same format the CLI uses).
- **Import config**: Upload a `.meddler.yml` file to populate the GUI options.

This creates interoperability between the GUI and CLI versions.

---

## 8. Conversion Engine

### 8.1 Shared Core

The conversion logic (HTML parsing, metadata extraction, Markdown generation) MUST be implemented as a **shared library** that can be used by both:
- The CLI tool (Node.js, imported as a module).
- The web app (bundled for browser, run in a Web Worker).

This avoids duplicating conversion logic between the two tools.

### 8.2 Web Worker Architecture

Conversion MUST run in a **Web Worker** to prevent blocking the UI thread.

```
Main Thread                     Web Worker
─────────────                   ──────────
                                
sendMessage({                   onmessage = (e) => {
  type: 'convert',               const { files, config } = e.data;
  files: [...],                   for (const file of files) {
  config: {...}                     const result = convert(file, config);
})                                  postMessage({
     │                                type: 'progress',
     │◀─── progress messages ───      post: result
     │                              });
     │                              }
     │◀─── completion ──────────    postMessage({ type: 'done', report });
     ▼                            }
update UI
```

**Messages from Worker → Main:**
- `{ type: 'progress', current, total, post }` — per-post progress update.
- `{ type: 'warning', message, file }` — non-fatal warning.
- `{ type: 'error', message, file }` — per-file error (continues processing).
- `{ type: 'done', report, files }` — conversion complete with report and output files.

### 8.3 Image Download in Browser

When `images: download` is selected:

1. For each image URL found in posts, the Worker sends a message to the Main thread requesting the download (Workers can use `fetch` directly, but this allows progress tracking on the main thread).
2. Images are fetched via `fetch()` from Medium's CDN.
3. Downloaded image `Blob`s are stored in memory and included in the final ZIP.
4. CORS note: Medium's CDN (`cdn-images-1.medium.com`) typically serves images with permissive CORS headers. If a fetch fails due to CORS, log a warning and keep the original URL.

**Concurrency**: Limit to 5 parallel image fetches to avoid overwhelming the browser and Medium's CDN.

### 8.4 ZIP Generation

Use **JSZip** to assemble the output:

1. Create the directory structure matching the selected SSG target.
2. Add each converted `.md` (or `.html` / `.json`) file.
3. Add downloaded image `Blob`s (if applicable).
4. Add supplementary data files.
5. Add `meddler-report.json`.
6. Generate the ZIP as a `Blob`.

For very large outputs (>100 MB), consider using **StreamSaver.js** to stream the ZIP directly to disk instead of holding it entirely in memory.

---

## 9. Output & Download

### 9.1 Download Mechanism

| Output Size | Method |
|---|---|
| < 100 MB | Generate `Blob`, create `URL.createObjectURL()`, trigger `<a download>` click. |
| ≥ 100 MB | Use StreamSaver.js to write a `ReadableStream` directly to a file via the Service Worker download trick. |

### 9.2 Output ZIP Structure

The ZIP filename should be: `meddler-export-<target>-<timestamp>.zip`

Example: `meddler-export-hugo-2026-02-12.zip`

The internal structure matches the SSG-specific layouts defined in `SPEC.md` Section 12.

### 9.3 Report File

Every export includes `meddler-report.json`:

```json
{
  "generated_at": "2026-02-12T10:13:00Z",
  "tool": "meddler-web",
  "version": "1.0.0",
  "config": { ... },
  "summary": {
    "posts_found": 398,
    "posts_converted": 335,
    "drafts_converted": 61,
    "responses_skipped": 142,
    "images_downloaded": 127,
    "images_failed": 3,
    "supplementary_files": 8
  },
  "warnings": [...],
  "errors": [...]
}
```

---

## 10. Accessibility & Responsiveness

### 10.1 Accessibility Requirements

| Requirement | Implementation |
|---|---|
| **Keyboard navigation** | All interactive elements focusable and operable via keyboard. Tab order follows visual order. |
| **Screen readers** | ARIA labels on all controls. Step indicator uses `aria-current="step"`. Progress bar uses `role="progressbar"` with `aria-valuenow`. |
| **Color contrast** | Minimum 4.5:1 contrast ratio for all text (WCAG AA). |
| **Focus indicators** | Visible focus rings on all interactive elements. |
| **Reduced motion** | Respect `prefers-reduced-motion`: disable animations, transitions, and progress bar shimmer. |
| **Dark mode** | Support `prefers-color-scheme` and a manual toggle. |
| **Error messaging** | Errors linked to their controls via `aria-describedby`. Use `role="alert"` for inline errors. |
| **Drag & drop** | Always provide a button alternative (file picker) alongside drag-and-drop. |

### 10.2 Responsive Design

| Breakpoint | Layout |
|---|---|
| **≥ 1024px** (Desktop) | Full layout as wireframed. Post browser and config panel side by side where space allows. |
| **768–1023px** (Tablet) | Single column. Stat cards wrap to 2-per-row. |
| **< 768px** (Mobile) | Single column. Collapsible config groups default to collapsed. Post preview opens as a full-screen modal instead of a slide-out panel. |

The app SHOULD be fully usable on mobile, but the primary target is desktop/tablet (users are migrating content — likely at a desk).

---

## 11. Technical Stack

### 11.1 Recommended Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | React (or Preact for smaller bundle) | Component model fits the wizard pattern. Wide ecosystem. |
| **Styling** | Tailwind CSS | Utility-first, small bundle with purge, easy dark mode. |
| **UI Components** | shadcn/ui | Accessible, composable, Tailwind-native. |
| **Icons** | Lucide React | Lightweight, consistent icon set. |
| **Build** | Vite | Fast dev server, optimized production build, handles Web Workers natively. |
| **HTML Parsing** | linkedom or a Turndown-compatible parser | `cheerio` is too heavy for browser; `linkedom` is a lightweight DOM implementation. Alternatively, use the browser's native `DOMParser`. |
| **Markdown Generation** | Turndown (browser build) | Battle-tested HTML-to-Markdown converter. |
| **YAML/TOML Serialization** | js-yaml, @iarna/toml | Same as CLI for consistency. |
| **ZIP Generation** | JSZip | Mature, works in browser, supports streaming. |
| **Large Downloads** | StreamSaver.js | For outputs > 100 MB. |
| **Syntax Highlighting** | Shiki or Prism (for live preview code blocks) | |
| **State Management** | React Context + useReducer or Zustand | Lightweight; no need for Redux-scale state. |

### 11.2 Bundle Size Target

The total production JavaScript bundle SHOULD be **< 200 KB** (gzipped), excluding optional large dependencies. Lazy-load:
- Turndown (loaded when conversion starts).
- JSZip (loaded when ZIP generation begins).
- TOML serializer (loaded only if TOML is selected).

### 11.3 Browser Support

| Browser | Minimum Version |
|---|---|
| Chrome / Edge | 90+ |
| Firefox | 90+ |
| Safari | 15+ |

The app MUST gracefully degrade if `showDirectoryPicker()` is not available (hide the folder-pick option, keep drag-and-drop and file picker).

---

## 12. Performance & Constraints

### 12.1 Performance Targets

| Operation | Target | Notes |
|---|---|---|
| Initial scan (400 posts) | < 2 seconds | Filename parsing + lightweight HTML title extraction. |
| Full conversion (400 posts, no images) | < 15 seconds | Running in a Web Worker. |
| Full conversion (400 posts, with image download) | < 5 minutes | Depends on network; 5 concurrent fetches. |
| ZIP generation (50 MB output) | < 10 seconds | JSZip compression. |
| UI responsiveness during conversion | No frame drops | Web Worker ensures main thread stays free. |

### 12.2 Memory Constraints

- **Target**: Stay under **512 MB** of browser memory for exports with up to 1,000 posts.
- **Strategy**:
  - Parse and convert posts one at a time in the Worker (don't hold all parsed DOMs simultaneously).
  - Stream converted files into JSZip incrementally.
  - Release image `Blob`s after adding them to the ZIP.

### 12.3 Size Limits

| Limit | Value | Behavior |
|---|---|---|
| Max ZIP input size | 500 MB | Show warning + suggest CLI tool. |
| Max post count | 5,000 | Show warning but allow proceeding. |
| Max single file size | 10 MB | Skip with warning (likely a corrupt file). |

---

## 13. Privacy & Security

### 13.1 Privacy Guarantees

- **No data transmission**: Zero network requests except for optional image downloads from Medium's CDN. No analytics, no telemetry, no error reporting.
- **No server**: The app is entirely static. There is no backend to receive data.
- **No third-party scripts**: No Google Analytics, no tracking pixels, no social widgets.
- **Local storage only**: Config is saved to `localStorage`. No cookies.

### 13.2 Security

- **Content Security Policy**: Deploy with a strict CSP header:
  ```
  default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  img-src 'self' blob: https://cdn-images-1.medium.com;
  connect-src https://cdn-images-1.medium.com;
  worker-src 'self' blob:;
  ```
- **Sandboxed preview**: Post HTML previews MUST be rendered in a sandboxed `<iframe>` with `sandbox="allow-same-origin"` to prevent any embedded scripts from executing.
- **Input sanitization**: Although Medium export HTML is machine-generated, always sanitize before rendering in the DOM (use DOMPurify or equivalent).

---

## 14. Deployment

### 14.1 Build Output

The production build produces a set of static files:
```
dist/
├── index.html
├── assets/
│   ├── main-[hash].js
│   ├── main-[hash].css
│   ├── worker-[hash].js
│   └── ...
├── favicon.ico
└── og-image.png
```

### 14.2 Hosting Options

| Host | How | Cost |
|---|---|---|
| **GitHub Pages** | Push `dist/` to `gh-pages` branch or use GitHub Actions. | Free |
| **Netlify** | Connect repo, set build command to `npm run build`, publish dir to `dist/`. | Free tier |
| **Vercel** | Connect repo, auto-detected as Vite/React project. | Free tier |
| **Local file** | Open `dist/index.html` directly in a browser. | Free |
| **Self-hosted** | Serve `dist/` from any static file server (nginx, caddy, etc.). | Varies |

### 14.3 Custom Domain

The recommended deployment URL is `meddler.tools` or similar. The site should include:
- A landing section (above the fold) explaining what Meddler does.
- The app itself (embedded or on the same page below the fold / via "Get Started" button).
- A link to the CLI tool's GitHub repo for power users.

### 14.4 Offline Support (Optional)

Register a **Service Worker** to cache the app shell for offline use. Once the page is loaded once, users can use it without internet (except for image downloads).

---

## 15. Relationship to Meddler CLI

### 15.1 Shared Conversion Core

The conversion engine (HTML parsing, metadata extraction, Markdown generation, content transformation) SHOULD be a **shared TypeScript package** used by both:

```
meddler/
├── packages/
│   ├── core/           # Shared conversion library
│   │   ├── src/
│   │   │   ├── parser.ts
│   │   │   ├── converter.ts
│   │   │   ├── metadata.ts
│   │   │   └── ...
│   │   └── package.json
│   ├── cli/            # CLI tool (Node.js)
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   └── web/            # Web GUI (browser)
│       ├── src/
│       │   ├── App.tsx
│       │   ├── worker.ts
│       │   └── ...
│       └── package.json
└── package.json        # Monorepo root (pnpm workspaces / npm workspaces)
```

### 15.2 Feature Parity

| Feature | CLI | Web | Notes |
|---|---|---|---|
| All output formats | ✓ | ✓ | |
| All SSG targets | ✓ | ✓ | |
| Image reference mode | ✓ | ✓ | |
| Image download mode | ✓ | ✓ | Browser uses `fetch()` |
| Image optimize mode | ✓ | ✗ | Requires `sharp`; not viable in browser |
| Config file `.meddler.yml` | ✓ | Import/Export | Web can import/export but uses GUI as primary |
| Supplementary data | ✓ | ✓ | |
| Per-post selection | ✗ | ✓ | Web advantage — visual selection |
| Post preview | ✗ | ✓ | Web advantage — rendered preview |
| Live config preview | ✗ | ✓ | Web advantage |
| Batch/scripting | ✓ | ✗ | CLI advantage |
| Very large exports (>500 MB) | ✓ | ⚠ | Web shows warning, suggests CLI |
| OPML blogroll generation | ✓ | ✓ | |

### 15.3 Config Interoperability

The `.meddler.yml` config format is the bridge between CLI and Web:
- **Web → CLI**: User configures in the GUI, exports `.meddler.yml`, uses it with the CLI for batch processing or automation.
- **CLI → Web**: User has an existing `.meddler.yml`, imports it into the GUI to visualize or tweak settings.
