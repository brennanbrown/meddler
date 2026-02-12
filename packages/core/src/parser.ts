import * as cheerio from 'cheerio';
import { PostMetadata, PostType } from './types';

/**
 * Parse a Medium post filename to extract date, slug, and Medium ID.
 *
 * Published: YYYY-MM-DD_<Title-Slug>-<hex-id>.html
 * Draft:     draft_<Title-Slug>-<hex-id>.html
 */
export function parseFilename(filename: string): {
  date: string | null;
  slug: string;
  mediumId: string;
  isDraft: boolean;
} {
  const base = filename.replace(/\.html$/, '');
  const isDraft = base.startsWith('draft_');

  let remainder: string;
  let date: string | null = null;

  if (isDraft) {
    remainder = base.slice('draft_'.length);
  } else {
    // Extract YYYY-MM-DD prefix
    const dateMatch = base.match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
    if (dateMatch) {
      date = dateMatch[1];
      remainder = dateMatch[2];
    } else {
      remainder = base;
    }
  }

  // The Medium ID is the last hyphen-separated segment (variable-length hex)
  const lastHyphen = remainder.lastIndexOf('-');
  let mediumId: string;
  let rawSlug: string;

  if (lastHyphen !== -1) {
    mediumId = remainder.slice(lastHyphen + 1);
    rawSlug = remainder.slice(0, lastHyphen);
  } else {
    mediumId = remainder;
    rawSlug = remainder;
  }

  // Convert slug: replace hyphens sequences, lowercase, strip non-url chars
  const slug = rawSlug
    .replace(/--+/g, '-') // collapse double hyphens (Medium uses -- for special chars)
    .replace(/-s-/g, 's-') // possessives like "I-s-" → "Is-"
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    || mediumId || 'untitled'; // fallback if slug ends up empty

  return { date, slug, mediumId, isDraft };
}

/**
 * Detect whether a post is a short response/comment based on content heuristics.
 */
export function detectResponse($: cheerio.CheerioAPI): boolean {
  const body = $('section[data-field="body"]');
  if (body.length === 0) return false;

  const paragraphs = body.find('p.graf--p, p[class*="graf--p"]');
  const headings = body.find('h3:not(.graf--title), h4:not(.graf--subtitle), h2');
  const images = body.find('figure.graf--figure, img.graf-image');

  // Response heuristic: ≤ 3 paragraphs, no subheadings, no images
  if (paragraphs.length > 3) return false;
  if (headings.length > 0) return false;
  if (images.length > 0) return false;

  // Check total text length
  const textLength = body.text().trim().length;
  if (textLength > 500) return false;

  return true;
}

/**
 * Extract all metadata from a Medium post HTML string.
 */
export function extractMetadata(
  html: string,
  filename: string
): PostMetadata {
  const $ = cheerio.load(html);
  const parsed = parseFilename(filename);

  // Title from <h1 class="p-name">
  const title = $('h1.p-name').text().trim() ||
    $('title').text().trim() ||
    'Untitled';

  // Subtitle from <section data-field="subtitle">
  const subtitle = $('section[data-field="subtitle"]').text().trim();

  // Date from <time class="dt-published"> in footer
  const timeEl = $('footer time.dt-published');
  let date = parsed.date;
  if (timeEl.length > 0) {
    const datetime = timeEl.attr('datetime');
    if (datetime) {
      date = datetime;
    }
  }

  // Canonical URL from <a class="p-canonical">
  const canonicalEl = $('a.p-canonical');
  const canonicalUrl = canonicalEl.length > 0 ? canonicalEl.attr('href') || null : null;

  // Author from <a class="p-author h-card">
  const authorEl = $('a.p-author');
  const author = authorEl.length > 0 ? authorEl.text().trim() : null;
  let authorUsername: string | null = null;
  if (authorEl.length > 0) {
    const href = authorEl.attr('href') || '';
    const match = href.match(/@([^/]+)/);
    if (match) {
      authorUsername = match[1];
    }
  }

  // Featured image: first <img> in body section
  const bodySection = $('section[data-field="body"]');
  const firstFigure = bodySection.find('figure').first();
  const firstImg = firstFigure.find('img').first();
  const image = firstImg.length > 0 ? (firstImg.attr('src') || null) : null;
  const imageCaption = firstFigure.find('figcaption').text().trim() || null;

  // Detect post type
  const isDraft = parsed.isDraft;
  const isResponse = !isDraft && detectResponse($);
  const type: PostType = isDraft ? 'draft' : isResponse ? 'response' : 'published';

  return {
    title,
    subtitle,
    date,
    slug: parsed.slug,
    canonicalUrl,
    author,
    authorUsername,
    mediumId: parsed.mediumId,
    draft: isDraft,
    tags: [],
    image,
    imageCaption,
    type,
    earnings: null,
    filename,
  };
}

/**
 * Extract all image references from a post's HTML body.
 */
export function extractImages(html: string): {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  dataImageId: string | null;
}[] {
  const $ = cheerio.load(html);
  const images: {
    url: string;
    alt: string;
    width: number | null;
    height: number | null;
    dataImageId: string | null;
  }[] = [];

  $('section[data-field="body"] img').each((_, el) => {
    const $el = $(el);
    const src = $el.attr('src');
    if (!src) return;

    const alt = $el.closest('figure').find('figcaption').text().trim() ||
      $el.attr('alt') || '';
    const width = $el.attr('data-width') ? parseInt($el.attr('data-width')!, 10) : null;
    const height = $el.attr('data-height') ? parseInt($el.attr('data-height')!, 10) : null;
    const dataImageId = $el.attr('data-image-id') || null;

    images.push({ url: src, alt, width, height, dataImageId });
  });

  return images;
}
