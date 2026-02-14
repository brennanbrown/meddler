/** Configuration for Meddler conversion */
export interface MeddlerConfig {
  input: string;
  output: string;
  format: FrontMatterFormat;
  outputFormat: OutputFormat;
  target: SSGTarget;

  includeDrafts: boolean;
  includeResponses: boolean;
  separateDrafts: boolean;

  frontMatter: {
    extraFields: Record<string, string>;
    dateFormat: DateFormat;
    injectEarnings: boolean;
    unquotedDates: boolean;
    rewriteImageUrls: boolean;
    imageBaseUrl: string;
  };

  images: {
    mode: ImageMode;
    outputDir: string;
    perPostDirs: boolean;
    extractFeatured: boolean;
    removeFeaturedFromBody: boolean;
  };

  embeds: {
    mode: EmbedMode;
    shortcodeFormat: SSGTarget;
  };

  content: {
    sectionBreaks: SectionBreakMode;
    dropCaps: 'strip' | 'preserve';
  };

  supplementary: {
    bookmarks: boolean;
    claps: boolean;
    highlights: boolean;
    interests: boolean;
    lists: boolean;
    earnings: boolean;
    socialGraph: boolean;
    profile: boolean;
    blogrollFormat: 'opml' | 'json' | 'md' | 'none';
  };

  includeAll: boolean;
  verbose: boolean;
}

export type FrontMatterFormat = 'yaml' | 'toml' | 'json' | 'none';
export type OutputFormat = 'markdown' | 'html' | 'structured-json';
export type SSGTarget = 'generic' | 'hugo' | 'eleventy' | 'jekyll' | 'astro';
export type ImageMode = 'reference' | 'download' | 'optimize';
export type EmbedMode = 'raw_html' | 'shortcodes' | 'placeholders';
export type SectionBreakMode = 'hr' | 'none' | 'spacing';
export type DateFormat = 'iso8601' | 'yyyy-mm-dd' | 'unix';

export type PostType = 'published' | 'draft' | 'response';

/** Metadata extracted from a single Medium post HTML file */
export interface PostMetadata {
  title: string;
  subtitle: string;
  date: string | null;
  slug: string;
  canonicalUrl: string | null;
  author: string | null;
  authorUsername: string | null;
  mediumId: string;
  draft: boolean;
  tags: string[];
  image: string | null;
  imageCaption: string | null;
  type: PostType;
  earnings: number | null;
  filename: string;
}

/** A fully converted post */
export interface ConvertedPost {
  metadata: PostMetadata;
  frontMatter: string;
  body: string;
  outputPath: string;
  images: ImageRef[];
}

/** Reference to an image found in a post */
export interface ImageRef {
  originalUrl: string;
  localPath: string | null;
  alt: string;
  width: number | null;
  height: number | null;
  dataImageId: string | null;
}

/** Profile data extracted from profile/ directory */
export interface ProfileData {
  displayName: string | null;
  username: string | null;
  email: string | null;
  mediumUserId: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string | null;
  connectedAccounts: {
    twitter: string | null;
    twitterId: string | null;
    facebook: string | null;
    facebookId: string | null;
  };
  membershipDate: string | null;
}

/** Publications the user is editor/writer for */
export interface PublicationRole {
  name: string;
  url: string;
  role: 'editor' | 'writer';
  ownershipNote: string | null;
}

/** Bookmarked post entry */
export interface BookmarkEntry {
  title: string;
  url: string;
  dateBookmarked: string | null;
}

/** Clap entry */
export interface ClapEntry {
  title: string;
  url: string;
  claps: number;
  date: string | null;
}

/** Highlight entry */
export interface HighlightEntry {
  quote: string;
  date: string | null;
}

/** Reading list entry */
export interface ListData {
  name: string;
  date: string | null;
  listUrl: string | null;
  posts: { title: string; url: string }[];
}

/** Partner program earnings entry */
export interface EarningsEntry {
  title: string;
  url: string;
  mediumId: string;
  earnings: number;
}

/** Social following entry */
export interface FollowingData {
  users: { username: string; url: string }[];
  publications: { name: string; url: string }[];
  topics: { name: string; url: string }[];
}

/** Interest data */
export interface InterestsData {
  tags: { name: string; url: string }[];
  topics: { name: string; url: string }[];
  publications: { name: string; url: string }[];
  writers: { name: string; url: string }[];
}

/** Conversion report */
export interface ConversionReport {
  generatedAt: string;
  tool: string;
  version: string;
  config: Partial<MeddlerConfig>;
  summary: {
    postsFound: number;
    postsConverted: number;
    draftsConverted: number;
    responsesSkipped: number;
    responsesIncluded: number;
    imagesDownloaded: number;
    imagesFailed: number;
    supplementaryFiles: number;
  };
  warnings: ReportMessage[];
  errors: ReportMessage[];
}

export interface ReportMessage {
  file: string;
  message: string;
}

/** Default configuration */
export const DEFAULT_CONFIG: MeddlerConfig = {
  input: '',
  output: './meddler-output',
  format: 'yaml',
  outputFormat: 'markdown',
  target: 'generic',

  includeDrafts: true,
  includeResponses: false,
  separateDrafts: true,

  frontMatter: {
    extraFields: {},
    dateFormat: 'iso8601',
    injectEarnings: false,
    unquotedDates: false,
    rewriteImageUrls: false,
    imageBaseUrl: '/images',
  },

  images: {
    mode: 'reference',
    outputDir: 'images',
    perPostDirs: true,
    extractFeatured: true,
    removeFeaturedFromBody: false,
  },

  embeds: {
    mode: 'raw_html',
    shortcodeFormat: 'hugo',
  },

  content: {
    sectionBreaks: 'hr',
    dropCaps: 'strip',
  },

  supplementary: {
    bookmarks: true,
    claps: true,
    highlights: true,
    interests: true,
    lists: true,
    earnings: true,
    socialGraph: true,
    profile: true,
    blogrollFormat: 'none',
  },

  includeAll: false,
  verbose: false,
};
