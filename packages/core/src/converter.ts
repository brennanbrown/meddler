import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import TurndownService from 'turndown';
import { MeddlerConfig, ImageRef, EmbedMode } from './types';

/**
 * Create a configured Turndown instance for Medium HTML → Markdown conversion.
 */
export function createTurndownService(config: MeddlerConfig): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    emDelimiter: '*',
    strongDelimiter: '**',
    hr: '---',
  });

  // Medium drop cap: just output the letter
  td.addRule('dropCap', {
    filter: (node) => {
      return node.nodeName === 'SPAN' &&
        node.classList.contains('graf-dropCap');
    },
    replacement: (content) => content,
  });

  // Medium section dividers: skip the structural ones
  td.addRule('sectionDivider', {
    filter: (node) => {
      return node.nodeName === 'HR' &&
        node.classList.contains('section-divider');
    },
    replacement: () => '',
  });

  // Medium mixtape embeds (linked article cards)
  td.addRule('mixtapeEmbed', {
    filter: (node) => {
      return node.nodeName === 'DIV' &&
        (node.classList.contains('graf--mixtapeEmbed') ||
         node.className.includes('mixtapeEmbed'));
    },
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const anchor = el.querySelector('a');
      if (!anchor) return '';
      const href = anchor.getAttribute('href') || '';
      const strong = el.querySelector('strong');
      const em = el.querySelector('em');
      const title = strong ? strong.textContent || '' : '';
      const desc = em ? em.textContent || '' : '';
      if (title && desc) {
        return `\n[**${title}** — *${desc}*](${href})\n`;
      }
      if (title) {
        return `\n[**${title}**](${href})\n`;
      }
      return `\n[${anchor.textContent || href}](${href})\n`;
    },
  });

  // Handle embeds based on config
  addEmbedRules(td, config);

  return td;
}

/**
 * Add embed-handling rules based on the configured embed mode.
 */
function addEmbedRules(td: TurndownService, config: MeddlerConfig): void {
  const mode = config.embeds.mode;

  td.addRule('iframeEmbed', {
    filter: 'iframe',
    replacement: (_content, node) => {
      const el = node as HTMLIFrameElement;
      const src = el.getAttribute('src') || '';

      if (mode === 'placeholders') {
        return `\n[Embedded content](${src})\n`;
      }

      if (mode === 'shortcodes') {
        const shortcode = detectShortcode(src, config.embeds.shortcodeFormat);
        if (shortcode) return `\n${shortcode}\n`;
      }

      // raw_html (default) or shortcode fallback
      const width = el.getAttribute('width') || '100%';
      const height = el.getAttribute('height') || '400';
      return `\n<iframe src="${src}" width="${width}" height="${height}" frameborder="0"></iframe>\n`;
    },
  });
}

/**
 * Detect and generate SSG shortcodes for known embed types.
 */
function detectShortcode(src: string, target: string): string | null {
  // YouTube
  const ytMatch = src.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (ytMatch) {
    const id = ytMatch[1];
    if (target === 'hugo') return `{{< youtube "${id}" >}}`;
    return `{% youtube "${id}" %}`;
  }

  // GitHub Gist
  const gistMatch = src.match(/gist\.github\.com\/([^/]+)\/([a-f0-9]+)/);
  if (gistMatch) {
    const [, user, id] = gistMatch;
    if (target === 'hugo') return `{{< gist "${user}" "${id}" >}}`;
    return `<script src="https://gist.github.com/${user}/${id}.js"></script>`;
  }

  // Twitter/X
  const tweetMatch = src.match(/twitter\.com\/[^/]+\/status\/(\d+)/);
  if (tweetMatch) {
    const id = tweetMatch[1];
    if (target === 'hugo') return `{{< tweet "${id}" >}}`;
    return `{% tweet "${id}" %}`;
  }

  return null;
}

/**
 * Convert a Medium post's HTML body to Markdown.
 *
 * Returns the Markdown body string and a list of image references found.
 */
export function convertBody(
  html: string,
  config: MeddlerConfig,
  slug: string
): { markdown: string; images: ImageRef[] } {
  const $ = cheerio.load(html);
  const body = $('section[data-field="body"]');

  if (body.length === 0) {
    return { markdown: '', images: [] };
  }

  // Collect images before transformation
  const images: ImageRef[] = [];
  let imageIndex = 0;

  body.find('img').each((_i: number, el: AnyNode) => {
    const $el = $(el);
    const src = $el.attr('src');
    if (!src) return;

    const figure = $el.closest('figure');
    const alt = figure.find('figcaption').text().trim() || $el.attr('alt') || '';
    const width = $el.attr('data-width') ? parseInt($el.attr('data-width')!, 10) : null;
    const height = $el.attr('data-height') ? parseInt($el.attr('data-height')!, 10) : null;
    const dataImageId = $el.attr('data-image-id') || null;

    let localPath: string | null = null;
    if (config.images.mode !== 'reference') {
      const ext = guessImageExtension(src);
      if (config.images.perPostDirs) {
        localPath = `${config.images.outputDir}/${slug}/${String(imageIndex + 1).padStart(2, '0')}.${ext}`;
      } else {
        localPath = `${config.images.outputDir}/${slug}-${String(imageIndex + 1).padStart(2, '0')}.${ext}`;
      }
    }

    images.push({ originalUrl: src, localPath, alt, width, height, dataImageId });
    imageIndex++;
  });

  // Remove the title <h3> (duplicate of <h1>)
  body.find('h3.graf--title').remove();
  // Remove the subtitle <h4> (duplicate of subtitle section)
  body.find('h4.graf--subtitle').remove();

  // Optionally remove featured image from body
  if (config.images.extractFeatured && config.images.removeFeaturedFromBody) {
    body.find('figure').first().remove();
  }

  // Remove structural section-divider <hr> elements at the top of sections
  body.find('div.section-divider').remove();

  // If download mode, rewrite image src attributes to local paths
  if (config.images.mode !== 'reference') {
    let idx = 0;
    body.find('img').each((_i: number, el: AnyNode) => {
      const $el = $(el);
      if (images[idx] && images[idx].localPath) {
        $el.attr('src', images[idx].localPath!);
      }
      idx++;
    });
  }

  // Extract all content from the body, handling complex layouts
  let htmlContent = '';
  
  // Strategy 1: Try to extract content from all .section-inner divs in order
  const allInners = body.find('.section-inner');
  if (allInners.length > 0) {
    const parts: string[] = [];
    allInners.each((_i: number, inner: AnyNode) => {
      const content = $(inner).html();
      if (content && content.trim()) {
        parts.push(content);
      }
    });
    
    // Add section breaks between different sections if requested
    const separator = config.content.sectionBreaks === 'hr' ? '<hr>' :
      config.content.sectionBreaks === 'spacing' ? '<br><br>' : '';
    htmlContent = parts.join(separator);
  }
  
  // Strategy 2: Fallback to section-based extraction
  if (!htmlContent) {
    const sections = body.find('section.section--body');
    if (sections.length > 0) {
      const parts: string[] = [];
      sections.each((_i: number, section: AnyNode) => {
        // Try multiple selectors to find content
        let sectionContent = '';
        
        // Try .section-inner first
        const inners = $(section).find('.section-inner');
        if (inners.length > 0) {
          inners.each((_j: number, inner: AnyNode) => {
            sectionContent += $(inner).html() || '';
          });
        } else {
          // Fallback to .section-content or the section itself
          const content = $(section).find('.section-content');
          sectionContent = content.html() || $(section).html() || '';
        }
        
        if (sectionContent.trim()) {
          parts.push(sectionContent);
        }
      });

      const separator = config.content.sectionBreaks === 'hr' ? '<hr>' :
        config.content.sectionBreaks === 'spacing' ? '<br><br>' : '';
      htmlContent = parts.join(separator);
    }
  }
  
  // Strategy 3: Last resort - use entire body
  if (!htmlContent) {
    htmlContent = body.html() || '';
  }

  // Convert HTML to Markdown
  const td = createTurndownService(config);
  let markdown = td.turndown(htmlContent);

  // Clean up excessive blank lines
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.trim();

  return { markdown, images };
}

/**
 * Guess image file extension from a URL.
 */
function guessImageExtension(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('.png')) return 'png';
  if (lower.includes('.gif')) return 'gif';
  if (lower.includes('.webp')) return 'webp';
  if (lower.includes('.svg')) return 'svg';
  return 'jpeg';
}
