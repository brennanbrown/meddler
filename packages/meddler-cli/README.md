# meddler-cli

![Meddler Screenshot](../../screenshot.jpg)

Ⓜ️ Convert your Medium export to Markdown with front matter for Hugo, Eleventy, Jekyll, Astro, and more.

This is the convenience package for [Meddler](https://meddler.fyi). It wraps `@berryhouse/meddler` so you can install with a simple name.

## Installation

```bash
npm install -g meddler-cli
```

## Usage

```bash
# Convert with default settings
meddler convert medium-export.zip

# Specify output directory
meddler convert medium-export.zip -o my-site

# Use a preset
meddler convert medium-export.zip --preset eleventy

# See all options
meddler --help
```

For full documentation, see the [Meddler README](https://github.com/brennanbrown/meddler#readme).

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

## License

AGPL-3.0-or-later - see [LICENSE](../../LICENSE) file for details.
