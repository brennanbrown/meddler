# @brennanbrown/meddler

![Meddler Screenshot](../../screenshot.jpg)

Command-line interface for converting Medium exports to static site generator formats.

## Installation

```bash
# Easy install
npm install -g meddler-cli

# Or install the scoped package directly
npm install -g @brennanbrown/meddler
```

## Usage

```bash
meddler <input-path> [options]
```

`<input-path>` can be a Medium export `.zip` file or an already-extracted export directory. Meddler validates the export automatically before converting.

### Basic Conversion

```bash
# Convert with default settings (generic target + YAML front matter + Markdown)
meddler medium-export.zip

# Specify output directory
meddler medium-export.zip -o my-site

# Convert an unzipped export folder
meddler /path/to/medium-export/

# Preview without writing any files
meddler medium-export.zip --dry-run
```

### SSG Targets

```bash
meddler medium-export.zip --target hugo
meddler medium-export.zip --target eleventy
meddler medium-export.zip --target jekyll
meddler medium-export.zip --target astro
meddler medium-export.zip --target generic   # Default
```

Each target applies sensible defaults (e.g. Hugo switches to TOML front matter and shortcode embeds) and uses a conventional directory layout for that SSG.

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `-o, --output <dir>` | `./meddler-output` | Output directory |
| `-f, --format <fmt>` | `yaml` | Front matter format: `yaml`, `toml`, `json`, `none` |
| `--output-format <fmt>` | `markdown` | Output format: `markdown`, `html`, `structured-json` |
| `-t, --target <ssg>` | `generic` | Target SSG: `generic`, `hugo`, `eleventy`, `jekyll`, `astro` |
| `--drafts` / `--no-drafts` | include | Include or exclude draft posts |
| `--responses` | `false` | Include short responses/comments |
| `--images <mode>` | `reference` | Image handling: `reference`, `download`, `optimize` |
| `--embeds <mode>` | `raw_html` | Embed handling: `raw_html`, `shortcodes`, `placeholders` |
| `--earnings` | `false` | Inject partner program earnings into front matter |
| `--unquoted-dates` | `false` | Output dates without quotes (Eleventy compatibility) |
| `--rewrite-image-urls` | `false` | Rewrite Medium CDN URLs to local paths |
| `--image-base-url <url>` | `/images` | Base URL for rewritten images |
| `--supplementary` / `--no-supplementary` | include | Convert supplementary data (bookmarks, claps, etc.) |
| `--include-all` | `false` | Include all data including sessions, IPs, blocks |
| `--dry-run` | `false` | Preview what would be generated without writing files |
| `--verbose` | `false` | Verbose logging output |
| `-h, --help` | - | Show help |
| `-V, --version` | - | Show version |

## Examples

### Eleventy Setup

```bash
meddler medium-export.zip \
  --target eleventy \
  --format yaml \
  --images download \
  --unquoted-dates \
  --rewrite-image-urls \
  --image-base-url "/assets/images"
```

### Hugo with Shortcodes

```bash
meddler medium-export.zip \
  --target hugo \
  --embeds shortcodes \
  --images download
```

### Minimal Export

```bash
meddler medium-export.zip \
  --format none \
  --no-supplementary \
  --no-drafts
```

## Output Structure

Output layout follows the conventions of the selected target. For the default `generic` target:

```
meddler-output/
├── posts/
│   ├── my-post.md
│   └── another-post.md
├── drafts/
│   └── draft-post.md
├── data/
│   ├── author.json
│   ├── publications.json
│   ├── bookmarks.json
│   ├── claps.json
│   ├── highlights.json
│   ├── interests.json
│   ├── earnings.json
│   ├── following.json
│   └── lists/
├── images/
│   └── <slug>/
└── meddler-report.json
```

Other targets use their conventional layouts — e.g. Jekyll writes `_posts/YYYY-MM-DD-slug.md` and `_drafts/`, Hugo writes page bundles under `content/posts/<slug>/index.md`, Astro writes `src/content/posts/`.

## Front Matter

Generated front matter includes `title`, `subtitle`, `date`, `slug`, `canonical_url`, `author`, `medium_id`, `draft`, `tags`, `image`, and `image_caption` where available. Dates are emitted in ISO 8601. Use `--earnings` to add Partner Program earnings, and `--format none` to omit front matter entirely.

## Error Handling

The CLI validates the export before converting and provides detailed error messages:

- **Invalid export**: no `README.html` found in the export
- **No posts**: the export doesn't contain any posts — only supplementary data is processed
- **Image failures**: counted in `meddler-report.json` without aborting the run

## Tips

1. **Backup your export**: Always keep the original Medium export
2. **Test with dry-run**: Use `--dry-run` to preview output
3. **Use a target**: Start with `--target`, then customise with flags
4. **Check output**: Review `meddler-report.json` for warnings and errors
5. **Handle images**: Choose `download` for self-contained sites or `reference` for external hosting

## Troubleshooting

### Large Exports

For exports with many posts (>1000), consider:
- Using `--images reference` if images are hosted elsewhere
- Increasing Node.js memory: `export NODE_OPTIONS="--max-old-space-size=4096"`

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
      - run: meddler medium-export.zip --target hugo
      - uses: actions/upload-artifact@v2
        with:
          name: site
          path: meddler-output/
```

### Makefile

```makefile
.PHONY: convert clean

convert:
	meddler medium-export.zip --target hugo

clean:
	rm -rf meddler-output

deploy: clean convert
	# Your deployment commands here
```

## License

AGPL-3.0-or-later - see [LICENSE](../../LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) and submit a Pull Request.

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
