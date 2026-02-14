# Eleventy Integration Guide

This guide covers using Meddler with Eleventy (11ty) and addresses common issues.

## Quick Start

```bash
# Basic Eleventy export
meddler convert export.zip -t eleventy -o site

# Eleventy with unquoted dates and local image paths
meddler convert export.zip -t eleventy -o site \
  --unquoted-dates \
  --rewrite-image-urls \
  --image-base-url "/images"
```

## Eleventy-Specific Options

### Unquoted Dates

Eleventy handles dates better when they're not quoted as strings:

```yaml
# Default (quoted)
date: "2025-12-28T00:00:00.000Z"

# With --unquoted-dates
date: 2025-12-28T00:00:00.000Z
```

### Image URL Rewriting

Convert Medium CDN URLs to local paths for better performance:

```yaml
# Default (CDN URL)
image: https://cdn-images-1.medium.com/max/2560/1*abc123.jpeg

# With --rewrite-image-urls
image: /images/my-post/1*abc123.jpeg
```

## Eleventy Configuration

### `.eleventy.js`

```javascript
module.exports = function(eleventyConfig) {
  // Add support for front matter date parsing
  eleventyConfig.addGlobalData('layout', 'layouts/post.njk');
  
  // Passthrough for images
  eleventyConfig.addPassthroughCopy('images');
  
  return {
    dir: {
      input: 'site',
      output: '_site',
      layouts: '_layouts',
      includes: '_includes',
      data: '_data'
    },
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk'
  };
};
```

### Post Layout (`_layouts/post.njk`)

```njk
---
layout: layouts/base.njk
---

<article>
  <header>
    <h1>{{ title }}</h1>
    {% if subtitle %}
      <h2>{{ subtitle }}</h2>
    {% endif %}
    <time datetime="{{ date | htmlDateString }}">{{ date | readableDate }}</time>
    {% if canonical_url %}
      <a href="{{ canonical_url }}" rel="canonical">View original</a>
    {% endif %}
  </header>
  
  {% if image %}
    <img src="{{ image }}" alt="{{ image_caption | default: '' }}">
  {% endif %}
  
  <div class="content">
    {{ content }}
  </div>
</article>
```

## Handling Drafts

Drafts lack several fields. Options:

### 1. Exclude drafts from build

```javascript
// .eleventy.js
eleventyConfig.addCollection('posts', function(collection) {
  return collection.getFilteredByGlob('posts/*.md')
    .filter(item => !item.data.draft);
});
```

### 2. Provide defaults in directory data

Create `_data/drafts.json`:

```json
{
  "author": "Your Name",
  "date": "draft",
  "canonical_url": null,
  "image": null,
  "image_caption": null
}
```

## Image Path Resolution

Posts reference images as relative paths:

```markdown
![](images/my-post/01.jpeg)
```

### Eleventy Build Strategy

1. **Download images with Meddler**:
   ```bash
   meddler convert export.zip -t eleventy --images download
   ```

2. **Passthrough copy** (in `.eleventy.js`):
   ```javascript
   eleventyConfig.addPassthroughCopy('images');
   ```

3. **Custom path rewriting** (if needed):
   ```javascript
   eleventyConfig.addTransform('markdown', function(content, outputPath) {
     // Rewrite image paths if needed
     return content.replace(/!\[([^\]]*)\]\(images\//g, '![$1](/images/');
   });
   ```

## Canonical URLs

Keep Medium URLs as canonical or switch to your domain:

```html
<!-- Keep Medium canonical -->
<link rel="canonical" href="{{ canonical_url }}">

<!-- Switch to your domain -->
<link rel="canonical" href="{{ page.url | absoluteUrl }}">
```

## Complete Example

```bash
# Export for Eleventy with all optimizations
meddler convert medium-export.zip \
  --target eleventy \
  --format yaml \
  --output-format markdown \
  --images download \
  --unquoted-dates \
  --rewrite-image-urls \
  --image-base-url "/images" \
  --earnings \
  --supplementary
```

This creates:
- Posts with unquoted dates (Eleventy-friendly)
- Local image paths instead of CDN URLs
- Downloaded images in `/images/<slug>/` structure
- YAML front matter compatible with Eleventy
- Supplementary data in `_data/` directory

## Troubleshooting

### Dates not parsing
Use `--unquoted-dates` flag for better Eleventy compatibility.

### Images not loading
1. Ensure images are downloaded: `--images download`
2. Add passthrough copy: `eleventyConfig.addPassthroughCopy('images')`
3. Check image paths in markdown match your directory structure.

### Drafts missing fields
Either exclude drafts from collections or provide defaults in directory data files.
