# @berryhouse/meddler

![Meddler Screenshot](../../screenshot.jpg)

Command-line interface for converting Medium exports to static site generator formats.

## Installation

```bash
# Easy install
npm install -g meddler-cli

# Or install the scoped package directly
npm install -g @berryhouse/meddler
```

## Usage

### Basic Conversion

```bash
# Convert with default settings (Hugo + YAML + Markdown)
meddler convert medium-export.zip

# Specify output directory
meddler convert medium-export.zip -o my-site

# Convert a folder (unzipped export)
meddler convert /path/to/medium-export/
```

### Presets

```bash
# Use specific SSG presets
meddler convert medium-export.zip --preset hugo      # Default
meddler convert medium-export.zip --preset eleventy
meddler convert medium-export.zip --preset jekyll
meddler convert medium-export.zip --preset astro
```

### Advanced Options

```bash
meddler convert medium-export.zip \
  --front-matter toml \
  --target astro \
  --format html \
  --include-drafts \
  --include-responses \
  --embed-mode clean \
  --supplementary all \
  --date-format "YYYY-MM-DD" \
  --add-reading-time \
  --add-word-count
```

## Commands

### `convert`

Convert a Medium export to static site format.

```bash
meddler convert <input> [options]
```

**Arguments:**
- `<input>` - Path to Medium export ZIP file or directory

**Options:**

| Option | Default | Description |
|--------|---------|-------------|
| `-o, --output` | `meddler-output` | Output directory |
| `--format` | `markdown` | Output format: `markdown`, `html`, `json` |
| `--front-matter` | `yaml` | Front matter format: `yaml`, `toml`, `json` |
| `--target` | `hugo` | Target SSG: `hugo`, `eleventy`, `jekyll`, `astro` |
| `--preset` | - | Use preset configuration |
| `--include-drafts` | `false` | Include draft posts |
| `--include-responses` | `false` | Include response posts |
| `--embed-mode` | `preserve` | Embed handling: `preserve`, `clean`, `remove` |
| `--image-mode` | `download` | Image handling: `download`, `reference` |
| `--supplementary` | `all` | Supplementary data to include |
| `--date-format` | - | Custom date format string |
| `--slug-format` | `lowercase` | Slug format: `lowercase`, `preserve` |
| `--add-reading-time` | `false` | Add reading time to front matter |
| `--add-word-count` | `false` | Add word count to front matter |
| `--section-breaks` | - | Section break marker |
| `--config` | `.meddlerrc.json` | Configuration file path |
| `--dry-run` | `false` | Show what would be converted |
| `--verbose` | `false` | Verbose output |
| `-h, --help` | - | Show help |
| `-v, --version` | - | Show version |

### `validate`

Validate a Medium export without converting.

```bash
meddler validate medium-export.zip
```

### `info`

Show information about a Medium export.

```bash
meddler info medium-export.zip
```

## Configuration File

Create `.meddlerrc.json` in your project directory:

```json
{
  "frontMatter": "yaml",
  "target": "hugo",
  "format": "markdown",
  "outputDir": "content",
  "includeDrafts": true,
  "includeResponses": false,
  "embedMode": "preserve",
  "imageMode": "download",
  "supplementary": ["profile", "earnings"],
  "dateFormat": "2006-01-02",
  "slugFormat": "lowercase",
  "addReadingTime": true,
  "addWordCount": true,
  "sectionBreaks": "###",
  "extraFields": {
    "author": "{{author.name}}",
    "locale": "en-US",
    "canonical_url": "{{url}}"
  }
}
```

### Field Templates

Use template variables in `extraFields`:

- `{{title}}` - Post title
- `{{slug}}` - Post slug
- `{{date}}` - Publication date
- `{{author.name}}` - Author display name
- `{{author.username}}` - Author username
- `{{url}}` - Original Medium URL
- `{{wordCount}}` - Word count
- `{{readingTime}}` - Reading time in minutes

## Presets

### Hugo

```json
{
  "target": "hugo",
  "frontMatter": "yaml",
  "format": "markdown",
  "dateFormat": "2006-01-02",
  "contentDir": "content/posts",
  "draftDir": "content/drafts"
}
```

### Eleventy

```json
{
  "target": "eleventy",
  "frontMatter": "yaml",
  "format": "markdown",
  "dateFormat": "YYYY-MM-DD",
  "contentDir": "posts",
  "draftDir": "drafts"
}
```

### Jekyll

```json
{
  "target": "jekyll",
  "frontMatter": "yaml",
  "format": "markdown",
  "dateFormat": "YYYY-MM-DD",
  "contentDir": "_posts",
  "draftDir": "_drafts"
}
```

### Astro

```json
{
  "target": "astro",
  "frontMatter": "yaml",
  "format": "markdown",
  "dateFormat": "YYYY-MM-DD",
  "contentDir": "src/content/blog",
  "draftDir": "src/content/drafts"
}
```

## Examples

### Convert with Custom Settings

```bash
meddler convert export.zip \
  --front-matter toml \
  --target astro \
  --format html \
  --include-drafts \
  --supplementary profile,earnings \
  --add-reading-time
```

### Use Configuration File

```bash
# Create config
cat > .meddlerrc.json << EOF
{
  "target": "eleventy",
  "includeDrafts": true,
  "addReadingTime": true
}
EOF

# Convert using config
meddler convert export.zip
```

### Dry Run

```bash
# Preview what will be converted
meddler validate export.zip --verbose
meddler convert export.zip --dry-run
```

## Output Structure

```
meddler-output/
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
└── meddler.log
```

## Error Handling

The CLI provides detailed error messages:

- **Invalid export**: "This doesn't look like a Medium export. No README.html found."
- **No posts**: "This export doesn't contain any posts."
- **Permission denied**: "Cannot write to output directory."
- **Corrupted file**: "Failed to read ZIP file."

## Tips

1. **Backup your export**: Always keep the original Medium export
2. **Test with dry-run**: Use `--dry-run` to preview changes
3. **Use presets**: Start with a preset, then customize
4. **Check output**: Review converted files before publishing
5. **Handle images**: Choose `download` for self-contained sites or `reference` for external hosting

## Troubleshooting

### Large Exports

For exports with many posts (>1000), consider:
- Using `--exclude-images` if images are hosted elsewhere
- Splitting conversion into batches
- Increasing Node.js memory: `node --max-old-space-size=4096 $(which meddler)`

### Memory Issues

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
meddler convert large-export.zip
```

### Performance

- SSD storage improves ZIP extraction speed
- More RAM helps with large exports
- Close other applications during conversion

## Integration

### GitHub Actions

```yaml
name: Convert Medium Export
on: [push]
jobs:
  convert:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install -g meddler-cli
      - run: meddler convert medium-export.zip --preset hugo
      - uses: actions/upload-artifact@v2
        with:
          name: site
          path: meddler-output/
```

### Makefile

```makefile
.PHONY: convert clean

convert:
	meddler convert medium-export.zip --preset hugo

clean:
	rm -rf meddler-output

deploy: clean convert
	# Your deployment commands here
```

## License

AGPL-3.0-or-later

## 🍓 About

Meddler is a 🍓 [Berry House](https://berryhouse.ca) project created by [Brennan Kenneth Brown](https://brennan.day).

If you find Meddler useful and want to support projects like this, please consider [donating on Ko-fi](https://ko-fi.com/brennan).
