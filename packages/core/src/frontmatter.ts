import * as yaml from 'js-yaml';
import * as TOML from '@iarna/toml';
import { PostMetadata, FrontMatterFormat, DateFormat, MeddlerConfig } from './types';

/**
 * Format a date string according to the configured format.
 */
export function formatDate(dateStr: string | null, format: DateFormat): string | null {
  if (!dateStr) return null;

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    switch (format) {
      case 'iso8601':
        return d.toISOString();
      case 'yyyy-mm-dd':
        return d.toISOString().split('T')[0];
      case 'unix':
        return String(Math.floor(d.getTime() / 1000));
      default:
        return d.toISOString();
    }
  } catch {
    return dateStr;
  }
}

/**
 * Build a front matter data object from post metadata and config.
 */
export function buildFrontMatterData(
  metadata: PostMetadata,
  config: MeddlerConfig
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  data.title = metadata.title;

  if (metadata.subtitle) {
    data.subtitle = metadata.subtitle;
  }

  const formattedDate = formatDate(metadata.date, config.frontMatter.dateFormat);
  if (formattedDate) {
    data.date = formattedDate;
  }

  data.slug = metadata.slug;

  if (metadata.canonicalUrl) {
    data.canonical_url = metadata.canonicalUrl;
  }

  if (metadata.author) {
    data.author = metadata.author;
  }

  data.medium_id = metadata.mediumId;
  data.draft = metadata.draft;
  if (metadata.tags && metadata.tags.length > 0) {
    data.tags = metadata.tags;
  }

  if (config.images.extractFeatured && metadata.image) {
    data.image = metadata.image;
    if (metadata.imageCaption) {
      data.image_caption = metadata.imageCaption;
    }
  }

  if (metadata.type === 'response') {
    data.type = 'response';
  }

  if (config.frontMatter.injectEarnings && metadata.earnings !== null) {
    data.earnings = metadata.earnings;
  }

  // Merge extra fields from config
  for (const [key, value] of Object.entries(config.frontMatter.extraFields)) {
    data[key] = value;
  }

  return data;
}

/**
 * Serialize a front matter data object to the configured format string.
 */
export function generateFrontMatter(
  metadata: PostMetadata,
  config: MeddlerConfig
): string {
  if (config.format === 'none') return '';

  const data = buildFrontMatterData(metadata, config);

  switch (config.format) {
    case 'yaml':
      return serializeYAML(data);
    case 'toml':
      return serializeTOML(data);
    case 'json':
      return serializeJSON(data);
    default:
      return serializeYAML(data);
  }
}

function serializeYAML(data: Record<string, unknown>): string {
  // Use custom schema to prevent automatic date parsing
  const customSchema = yaml.DEFAULT_SCHEMA.extend([
    new yaml.Type('tag:yaml.org,2002:str', {
      kind: 'scalar',
      construct: (data) => data,
    }),
  ]);

  const yamlStr = yaml.dump(data, {
    lineWidth: -1,
    quotingType: '"',
    forceQuotes: false,
    noRefs: true,
    sortKeys: false,
    schema: customSchema,
  }).trim();

  return `---\n${yamlStr}\n---`;
}

function serializeTOML(data: Record<string, unknown>): string {
  // TOML stringify requires specific types; convert date strings etc.
  const tomlData = prepareForTOML(data);
  const tomlStr = TOML.stringify(tomlData as any).trim();
  return `+++\n${tomlStr}\n+++`;
}

function serializeJSON(data: Record<string, unknown>): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Prepare data for TOML serialization (TOML is strict about types).
 */
function prepareForTOML(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = prepareForTOML(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}
