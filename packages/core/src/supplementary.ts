import * as cheerio from 'cheerio';
import {
  ProfileData,
  PublicationRole,
  BookmarkEntry,
  ClapEntry,
  HighlightEntry,
  ListData,
  EarningsEntry,
  FollowingData,
  InterestsData,
} from './types';

/**
 * Extract profile data from profile/profile.html
 */
export function parseProfile(html: string): ProfileData {
  const $ = cheerio.load(html);

  const displayName = $('h3.p-name').text().trim() || null;
  const avatarUrl = $('img.u-photo').attr('src') || null;

  // Extract structured fields from <li> elements
  const getText = (label: string): string | null => {
    let value: string | null = null;
    $('li').each((_i, el) => {
      const text = $(el).text();
      if (text.startsWith(label)) {
        value = text.slice(label.length).trim();
      }
    });
    return value;
  };

  const username = (() => {
    const link = $('a.u-url').attr('href') || '';
    const match = link.match(/@([^/]+)/);
    return match ? match[1] : null;
  })();

  const email = getText('Email address:');
  const mediumUserId = getText('Medium user ID:');
  const createdAt = getText('Created at:');

  // Connected accounts
  const twitterHandle = (() => {
    let handle: string | null = null;
    $('li').each((_i, el) => {
      const text = $(el).text();
      if (text.startsWith('X:')) {
        const link = $(el).find('a').attr('href') || '';
        const match = link.match(/twitter\.com\/([^/]+)/);
        handle = match ? match[1] : text.slice(2).trim();
      }
    });
    return handle;
  })();

  const twitterId = getText('X account ID:');
  const facebookName = getText('Facebook display name:');
  const facebookId = getText('Facebook account ID:');

  // Membership
  const membershipDate = (() => {
    const section = $('section').text();
    const match = section.match(/Became a Medium member at (.+)/);
    return match ? match[1].trim() : null;
  })();

  return {
    displayName,
    username,
    email,
    mediumUserId,
    avatarUrl,
    bio: null, // extracted separately from about.html
    createdAt,
    connectedAccounts: {
      twitter: twitterHandle,
      twitterId,
      facebook: facebookName,
      facebookId,
    },
    membershipDate,
  };
}

/**
 * Extract bio from profile/about.html
 */
export function parseAbout(html: string): string {
  const $ = cheerio.load(html);
  const body = $('section[data-field="body"]');

  // Get all paragraph text
  const paragraphs: string[] = [];
  body.find('p').each((_i, el) => {
    const text = $(el).text().trim();
    if (text) paragraphs.push(text);
  });

  return paragraphs.join('\n\n');
}

/**
 * Extract publication roles from profile/publications.html
 */
export function parsePublications(html: string): PublicationRole[] {
  const $ = cheerio.load(html);
  const roles: PublicationRole[] = [];

  $('h4').each((_i, heading) => {
    const role = $(heading).text().trim().toLowerCase() as 'editor' | 'writer';
    const list = $(heading).next('ul');
    list.find('li').each((_j, li) => {
      const link = $(li).find('a');
      const name = link.text().trim();
      const url = link.attr('href') || '';
      const fullText = $(li).text();
      const ownerMatch = fullText.match(/\(([^)]+)\)/);
      roles.push({
        name,
        url,
        role,
        ownershipNote: ownerMatch ? ownerMatch[1] : null,
      });
    });
  });

  return roles;
}

/**
 * Parse bookmarks from bookmarks/bookmarks-NNNN.html files
 */
export function parseBookmarks(htmlFiles: string[]): BookmarkEntry[] {
  const entries: BookmarkEntry[] = [];

  for (const html of htmlFiles) {
    const $ = cheerio.load(html);
    $('li').each((_i, el) => {
      const link = $(el).find('a.h-cite');
      const time = $(el).find('time.dt-published');
      if (link.length > 0) {
        entries.push({
          title: link.text().trim(),
          url: link.attr('href') || '',
          dateBookmarked: time.text().trim() || null,
        });
      }
    });
  }

  return entries;
}

/**
 * Parse claps from claps/claps-NNNN.html files
 */
export function parseClaps(htmlFiles: string[]): ClapEntry[] {
  const entries: ClapEntry[] = [];

  for (const html of htmlFiles) {
    const $ = cheerio.load(html);
    $('li.h-entry').each((_i, el) => {
      const link = $(el).find('a.h-cite');
      const time = $(el).find('time.dt-published');
      const text = $(el).text();

      // Extract clap count from "+N —" prefix
      const clapMatch = text.match(/^\+(\d+)/);
      const claps = clapMatch ? parseInt(clapMatch[1], 10) : 1;

      if (link.length > 0) {
        entries.push({
          title: link.text().trim(),
          url: link.attr('href') || '',
          claps,
          date: time.text().trim() || null,
        });
      }
    });
  }

  return entries;
}

/**
 * Parse highlights from highlights/highlights-NNNN.html files
 */
export function parseHighlights(htmlFiles: string[]): HighlightEntry[] {
  const entries: HighlightEntry[] = [];

  for (const html of htmlFiles) {
    const $ = cheerio.load(html);
    $('li.h-entry').each((_i, el) => {
      const time = $(el).find('time.dt-published');
      const highlight = $(el).find('span.markup--highlight, span[name="selection"]');

      const quote = highlight.length > 0
        ? highlight.text().trim()
        : $(el).find('p').text().trim();

      if (quote) {
        entries.push({
          quote,
          date: time.text().trim() || null,
        });
      }
    });
  }

  return entries;
}

/**
 * Parse a single list file from lists/<name>.html
 */
export function parseList(html: string, filename: string): ListData {
  const $ = cheerio.load(html);

  const name = $('h1.p-name').text().trim() ||
    $('h2.p-summary').text().trim() ||
    filename.replace(/\.html$/, '');

  const timeEl = $('time.dt-published');
  const date = timeEl.length > 0 ? (timeEl.attr('datetime') || timeEl.text().trim()) : null;

  const listUrlEl = $('footer a[href*="list"]');
  const listUrl = listUrlEl.length > 0 ? listUrlEl.attr('href') || null : null;

  const posts: { title: string; url: string }[] = [];
  $('li[data-field="post"]').each((_i, el) => {
    const link = $(el).find('a');
    if (link.length > 0) {
      posts.push({
        title: link.text().trim(),
        url: link.attr('href') || '',
      });
    }
  });

  return { name, date, listUrl, posts };
}

/**
 * Parse partner program earnings from partner-program/posts-NNNN.html files
 */
export function parseEarnings(htmlFiles: string[]): EarningsEntry[] {
  const entries: EarningsEntry[] = [];

  for (const html of htmlFiles) {
    const $ = cheerio.load(html);
    $('li.h-entry').each((_i, el) => {
      const link = $(el).find('a');
      const text = $(el).text();

      if (link.length > 0) {
        const href = link.attr('href') || '';
        const title = link.text().trim();

        // Extract earnings: " - $NNN" at end
        const earningsMatch = text.match(/\$([0-9,.]+)\s*$/);
        const earnings = earningsMatch
          ? parseFloat(earningsMatch[1].replace(',', ''))
          : 0;

        // Extract Medium ID from href — last hyphen-separated segment of the path
        // e.g., /p/the-piss-average-problem-ec2a2dd6f5ad → ec2a2dd6f5ad
        const pathPart = href.split('/').pop() || '';
        const lastHyphen = pathPart.lastIndexOf('-');
        const mediumId = lastHyphen !== -1 ? pathPart.slice(lastHyphen + 1) : '';

        entries.push({ title, url: href, mediumId, earnings });
      }
    });
  }

  return entries;
}

/**
 * Parse following data from users-following/, pubs-following/, topics-following/
 */
export function parseFollowing(
  usersHtmlFiles: string[],
  pubsHtmlFiles: string[],
  topicsHtmlFiles: string[]
): FollowingData {
  const users: { username: string; url: string }[] = [];
  const publications: { name: string; url: string }[] = [];
  const topics: { name: string; url: string }[] = [];

  for (const html of usersHtmlFiles) {
    const $ = cheerio.load(html);
    $('li').each((_i, el) => {
      const link = $(el).find('a');
      if (link.length > 0) {
        users.push({
          username: link.text().trim(),
          url: link.attr('href') || '',
        });
      }
    });
  }

  for (const html of pubsHtmlFiles) {
    const $ = cheerio.load(html);
    $('li').each((_i, el) => {
      const link = $(el).find('a');
      if (link.length > 0) {
        publications.push({
          name: link.text().trim(),
          url: link.attr('href') || '',
        });
      }
    });
  }

  for (const html of topicsHtmlFiles) {
    const $ = cheerio.load(html);
    $('li').each((_i, el) => {
      const link = $(el).find('a');
      if (link.length > 0) {
        topics.push({
          name: link.text().trim(),
          url: link.attr('href') || '',
        });
      }
    });
  }

  return { users, publications, topics };
}

/**
 * Parse interests from interests/ directory files
 */
export function parseInterests(files: {
  tags?: string;
  topics?: string;
  publications?: string;
  writers?: string;
}): InterestsData {
  const parseList = (html: string | undefined): { name: string; url: string }[] => {
    if (!html) return [];
    const $ = cheerio.load(html);
    const items: { name: string; url: string }[] = [];
    $('li').each((_i, el) => {
      const link = $(el).find('a');
      if (link.length > 0) {
        items.push({
          name: link.text().trim(),
          url: link.attr('href') || '',
        });
      }
    });
    return items;
  };

  return {
    tags: parseList(files.tags),
    topics: parseList(files.topics),
    publications: parseList(files.publications),
    writers: parseList(files.writers),
  };
}
