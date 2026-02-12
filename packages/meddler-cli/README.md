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

## 🍓 About

Meddler is a 🍓 [Berry House](https://berryhouse.ca) project created by [Brennan Kenneth Brown](https://brennan.day).

If you find Meddler useful, please consider [donating on Ko-fi](https://ko-fi.com/brennan).

## License

AGPL-3.0-or-later
