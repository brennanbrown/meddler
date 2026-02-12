# Meddler Web

![Meddler Screenshot](../../screenshot.jpg)

Web interface for converting Medium exports to static site generator formats. Runs entirely in your browser - your files never leave your device.

## 🌐 Live Demo

Visit [meddler.fyi](https://meddler.fyi) to use the web version immediately.

## 🚀 Features

- **Privacy-First**: All processing happens in your browser
- **Drag & Drop**: Upload ZIP files or folders
- **Live Preview**: See how your posts will look before converting
- **Progress Tracking**: Real-time conversion progress
- **Full Configuration**: All CLI options available in UI
- **Dark Mode**: Automatic system preference detection
- **Responsive Design**: Works on desktop and mobile

## 🎯 How to Use

### Step 1: Upload

1. **Drag & Drop**: Drop your Medium export ZIP file onto the upload zone
2. **File Picker**: Click to browse and select your export
3. **Folder Upload**: Select an unzipped export folder

### Step 2: Preview & Select

1. **Author Profile**: View your Medium profile information
2. **Export Statistics**: See post counts, dates, and engagement metrics
3. **Post Browser**: 
   - Search posts by title or content
   - Filter by status (published/draft/response)
   - Select/deselect individual posts
   - Preview posts in a modal

### Step 3: Configure

1. **SSG Presets**: Quick settings for Hugo, Eleventy, Jekyll, Astro
2. **Content Options**:
   - Front matter format (YAML/TOML/JSON)
   - Output format (Markdown/HTML/JSON)
   - Include drafts and responses
   - Image handling (download/reference)
   - Embed handling (preserve/clean/remove)

3. **Advanced Settings**:
   - Date format customization
   - Slug formatting
   - Reading time and word count
   - Section breaks
   - Extra front matter fields
   - Supplementary data selection

4. **Live Preview**: See a sample post converted with your settings

### Step 4: Export

1. **Start Conversion**: Begin the conversion process
2. **Progress Tracking**: Watch real-time progress per post
3. **Conversion Log**: View detailed conversion messages
4. **Download**: Get your converted site as a ZIP file

## 📁 Output Structure

The generated ZIP contains:

```
meddler-export/
├── content/
│   ├── posts/
│   │   ├── 2024-01-01_my-post.md
│   │   └── 2024-01-02-another-post.md
│   └── drafts/
│       └── draft-post.md
├── data/
│   ├── author.json
│   ├── publications.json
│   ├── lists/
│   │   └── reading-list.json
│   └── earnings.json
├── images/
│   ├── image1.jpg
│   └── image2.png
└── meddler-report.json
```

## ⚙️ Configuration Options

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

| SSG | Front Matter | Date Format | Content Dir |
|-----|--------------|-------------|-------------|
| Hugo | YAML | `2006-01-02` | `content/posts` |
| Eleventy | YAML | `YYYY-MM-DD` | `posts` |
| Jekyll | YAML | `YYYY-MM-DD` | `_posts` |
| Astro | YAML | `YYYY-MM-DD` | `src/content/blog` |

### Content Options

- **Include Drafts**: Convert draft posts (default: off)
- **Include Responses**: Convert response posts (default: off)
- **Image Handling**: 
  - Download: Save images locally
  - Reference: Keep Medium URLs
- **Embed Handling**:
  - Preserve: Keep original embeds
  - Clean: Remove embed markup
  - Remove: Delete embeds entirely

### Supplementary Data

Choose what to export:
- **Author Profile**: Name, username, bio, avatar
- **Publications**: Your Medium publications
- **Lists**: Your curated reading lists
- **Bookmarks**: Saved posts
- **Claps**: Engagement data
- **Earnings**: Partner Program earnings

## 🔧 Advanced Features

### Custom Front Matter Fields

Add custom fields to front matter using templates:

```json
{
  "author": "{{author.name}}",
  "locale": "en-US",
  "canonical_url": "{{url}}",
  "featured": false
}
```

Available templates:
- `{{title}}` - Post title
- `{{slug}}` - Post slug
- `{{date}}` - Publication date
- `{{author.name}}` - Author display name
- `{{author.username}}` - Author username
- `{{url}}` - Original Medium URL
- `{{wordCount}}` - Word count
- `{{readingTime}}` - Reading time

### Date Formats

Use any valid date format string:
- `YYYY-MM-DD` - 2024-01-01
- `2006-01-02` - 2006-01-02 (Hugo)
- `MMMM DD, YYYY` - January 01, 2024

### Section Breaks

Customize section break markers:
- `###` - Markdown H3 (default)
- `---` - Horizontal rule
- `<!--more-->` - More tag

## 🔒 Privacy & Security

- **Client-side only**: All processing happens in your browser
- **No uploads**: Files never leave your device
- **No tracking**: No analytics or tracking
- **Open source**: Code is publicly auditable

## 🌍 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📱 Mobile Support

The web interface is fully responsive and works on:
- iOS Safari
- Chrome Mobile
- Firefox Mobile
- Samsung Internet

## 🚀 Performance

- **Large exports**: Handles exports with 1000+ posts
- **Memory efficient**: Streams files to avoid memory issues
- **Background processing**: Conversion doesn't block UI
- **Progressive loading**: Preview loads immediately

## 🐛 Troubleshooting

### Common Issues

**"This export doesn't contain any posts"**
- Ensure you're uploading a valid Medium export
- Check that the export contains a `posts/` directory
- Try re-downloading your export from Medium

**"File too large"**
- Large exports (>50MB) may take longer to process
- Consider excluding images if they're hosted elsewhere
- Use a modern browser with sufficient memory

**"Conversion failed"**
- Check browser console for error messages
- Ensure all files are HTML format
- Try refreshing and uploading again

### Browser Tips

1. **Use Chrome or Firefox** for best performance
2. **Close other tabs** when processing large exports
3. **Keep the tab active** during conversion
4. **Download immediately** after conversion

## 🔧 Development

### Local Development

```bash
# Clone repository
git clone https://github.com/brennanbrown/meddler.git
cd meddler

# Install dependencies
npm install

# Start development server
npm run dev -w packages/web

# Build for production
npm run build -w packages/web
```

### Architecture

```
packages/web/
├── src/
│   ├── steps/          # Wizard steps
│   │   ├── StepLoad.tsx
│   │   ├── StepPreview.tsx
│   │   ├── StepConfig.tsx
│   │   └── StepExport.tsx
│   ├── store.ts        # State management
│   ├── engine.ts       # Conversion logic
│   └── App.tsx         # Main application
├── public/             # Static assets
└── dist/              # Build output
```

### Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **JSZip** - ZIP file handling
- **Lucide React** - Icons

## 📄 License

AGPL-3.0-or-later

## 🤝 Contributing

Contributions are welcome! Please read the main [Contributing Guide](../../CONTRIBUTING.md).

### Web-Specific Contributions

- UI/UX improvements
- Mobile responsiveness
- Performance optimizations
- Accessibility enhancements
- Browser compatibility

## 🍓 About

Meddler is a 🍓 [Berry House](https://berryhouse.ca) project created by [Brennan Kenneth Brown](https://brennan.day).

If you find Meddler useful and want to support projects like this, please consider [donating on Ko-fi](https://ko-fi.com/brennan).

## 📞 Support

- 📖 [Documentation](https://github.com/brennanbrown/meddler/wiki)
- 🐛 [Report Issues](https://github.com/brennanbrown/meddler/issues)
- 💬 [Discussions](https://github.com/brennanbrown/meddler/discussions)

---

**Your content, your site, your way.**
