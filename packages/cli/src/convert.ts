import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import ora from 'ora';
import got from 'got';
import * as cheerio from 'cheerio';
import {
  MeddlerConfig,
  ConversionReport,
  ReportMessage,
  PostMetadata,
  EarningsEntry,
  extractMetadata,
  convertBody,
  generateFrontMatter,
  parseProfile,
  parseAbout,
  parsePublications,
  parseBookmarks,
  parseClaps,
  parseHighlights,
  parseList,
  parseEarnings,
  parseFollowing,
  parseInterests,
} from '@brennanbrown/core';

/**
 * Main conversion orchestrator.
 */
export async function runConversion(
  exportPath: string,
  config: MeddlerConfig,
  dryRun: boolean
): Promise<void> {
  const report: ConversionReport = {
    generatedAt: new Date().toISOString(),
    tool: 'meddler-cli',
    version: '1.0.2',
    config: {
      format: config.format,
      outputFormat: config.outputFormat,
      target: config.target,
      includeDrafts: config.includeDrafts,
      includeResponses: config.includeResponses,
    },
    summary: {
      postsFound: 0,
      postsConverted: 0,
      draftsConverted: 0,
      responsesSkipped: 0,
      responsesIncluded: 0,
      imagesDownloaded: 0,
      imagesFailed: 0,
      supplementaryFiles: 0,
    },
    warnings: [],
    errors: [],
  };

  // Build earnings lookup if needed
  let earningsMap: Map<string, number> = new Map();
  if (config.frontMatter.injectEarnings) {
    earningsMap = await loadEarningsMap(exportPath);
  }

  // Discover post files
  const postsDir = path.join(exportPath, 'posts');
  let postFiles: string[] = [];
  if (await fs.pathExists(postsDir)) {
    postFiles = (await fs.readdir(postsDir))
      .filter((f: string) => f.endsWith('.html'))
      .sort();
  }

  if (postFiles.length === 0) {
    console.log(chalk.yellow('  ⚠ No posts found in this export. Only supplementary data will be processed.'));
  }

  report.summary.postsFound = postFiles.length;

  // Set up output directory
  const outputBase = path.resolve(config.output);
  if (!dryRun) {
    await fs.ensureDir(outputBase);
  }

  // Convert posts
  const spinner = ora(`Converting ${postFiles.length} posts...`).start();
  let converted = 0;
  let skipped = 0;

  for (const file of postFiles) {
    try {
      const html = await fs.readFile(path.join(postsDir, file), 'utf-8');
      const metadata = extractMetadata(html, file);

      // Inject earnings if available
      if (earningsMap.has(metadata.mediumId)) {
        metadata.earnings = earningsMap.get(metadata.mediumId)!;
      }

      // Filter based on config
      if (metadata.draft && !config.includeDrafts) {
        skipped++;
        continue;
      }

      if (metadata.type === 'response' && !config.includeResponses) {
        report.summary.responsesSkipped++;
        skipped++;
        continue;
      }

      if (metadata.type === 'response') {
        report.summary.responsesIncluded++;
      }

      // Convert body
      const { markdown, images } = convertBody(html, config, metadata.slug);

      // Generate front matter
      const frontMatter = generateFrontMatter(metadata, config);

      // Assemble output
      let outputContent: string;

      if (config.outputFormat === 'markdown') {
        if (frontMatter) {
          outputContent = `${frontMatter}\n\n${markdown}\n`;
        } else {
          outputContent = `# ${metadata.title}\n\n${markdown}\n`;
        }
      } else if (config.outputFormat === 'html') {
        outputContent = buildCleanHtml(html, metadata);
      } else {
        // structured-json
        outputContent = JSON.stringify({
          metadata: buildJsonMetadata(metadata),
          content: markdown,
        }, null, 2);
      }

      // Determine output path
      const outputPath = getOutputPath(metadata, config);
      const fullOutputPath = path.join(outputBase, outputPath);

      if (!dryRun) {
        await fs.ensureDir(path.dirname(fullOutputPath));
        await fs.writeFile(fullOutputPath, outputContent, 'utf-8');

        // Download images if configured
        if (config.images.mode !== 'reference' && images.length > 0) {
          for (const img of images) {
            if (img.localPath) {
              const imgOutputPath = path.join(outputBase, getImagesBasePath(config), img.localPath);
              const downloaded = await downloadImage(img.originalUrl, imgOutputPath, report);
              if (downloaded) {
                report.summary.imagesDownloaded++;
              } else {
                report.summary.imagesFailed++;
              }
            }
          }
        }
      }

      converted++;
      if (metadata.draft) {
        report.summary.draftsConverted++;
      }

      spinner.text = `Converting posts... ${converted}/${postFiles.length - skipped}`;

      if (config.verbose) {
        spinner.info(`  ✓ ${metadata.slug}`);
        spinner.start(`Converting posts... ${converted}/${postFiles.length - skipped}`);
      }
    } catch (err: any) {
      report.errors.push({ file, message: err.message || String(err) });
      if (config.verbose) {
        spinner.warn(`  ✗ ${file}: ${err.message}`);
        spinner.start(`Converting posts...`);
      }
    }
  }

  report.summary.postsConverted = converted - report.summary.draftsConverted;
  spinner.succeed(`Converted ${converted} posts (${skipped} skipped).`);

  // Convert supplementary data
  if (config.supplementary.bookmarks || config.supplementary.claps ||
      config.supplementary.highlights || config.supplementary.interests ||
      config.supplementary.lists || config.supplementary.earnings ||
      config.supplementary.socialGraph || config.supplementary.profile) {
    await convertSupplementary(exportPath, outputBase, config, report, dryRun);
  }

  // Write report
  if (!dryRun) {
    const reportPath = path.join(outputBase, 'meddler-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  }

  // Print summary
  console.log('');
  console.log(chalk.bold.green('  ✅ Export complete!\n'));
  console.log(`  ${chalk.bold('Posts converted:')} ${report.summary.postsConverted} published, ${report.summary.draftsConverted} drafts`);
  if (report.summary.responsesSkipped > 0) {
    console.log(`  ${chalk.bold('Responses skipped:')} ${report.summary.responsesSkipped}`);
  }
  if (report.summary.responsesIncluded > 0) {
    console.log(`  ${chalk.bold('Responses included:')} ${report.summary.responsesIncluded}`);
  }
  if (config.images.mode !== 'reference') {
    console.log(`  ${chalk.bold('Images:')} ${report.summary.imagesDownloaded} downloaded, ${report.summary.imagesFailed} failed`);
  }
  if (report.summary.supplementaryFiles > 0) {
    console.log(`  ${chalk.bold('Supplementary files:')} ${report.summary.supplementaryFiles}`);
  }
  if (report.errors.length > 0) {
    console.log(chalk.yellow(`  ${chalk.bold('Errors:')} ${report.errors.length} (see meddler-report.json)`));
  }
  if (!dryRun) {
    console.log(`\n  Output: ${chalk.underline(outputBase)}`);
  }
  console.log('');
  
  // Attribution footer
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log(chalk.dim(`  🍓 A ${chalk.underline('Berry House')} project by ${chalk.underline('Brennan Kenneth Brown')}`));
  console.log(chalk.dim(`  Support Meddler: ${chalk.underline('https://ko-fi.com/brennan')}`));
  console.log(chalk.dim(`  License: AGPL-3.0`));
  console.log(chalk.dim('  ─────────────────────────────────────'));
  console.log('');
}

/**
 * Determine the output file path for a post based on SSG target and config.
 */
function getOutputPath(metadata: PostMetadata, config: MeddlerConfig): string {
  const ext = config.outputFormat === 'structured-json' ? 'json' : config.outputFormat === 'html' ? 'html' : 'md';
  const slug = metadata.slug || metadata.mediumId;

  switch (config.target) {
    case 'hugo': {
      const dir = metadata.draft && config.separateDrafts ? 'content/drafts' : 'content/posts';
      return path.join(dir, slug, `index.${ext}`);
    }
    case 'jekyll': {
      if (metadata.draft && config.separateDrafts) {
        return path.join('_drafts', `${slug}.${ext}`);
      }
      let datePrefix = '0000-00-00';
      if (metadata.date) {
        const parsed = new Date(metadata.date);
        if (!isNaN(parsed.getTime())) {
          datePrefix = parsed.toISOString().split('T')[0];
        }
      }
      return path.join('_posts', `${datePrefix}-${slug}.${ext}`);
    }
    case 'eleventy': {
      const dir = metadata.draft && config.separateDrafts ? 'drafts' : 'posts';
      return path.join(dir, `${slug}.${ext}`);
    }
    case 'astro': {
      const dir = metadata.draft && config.separateDrafts ? 'src/content/drafts' : 'src/content/posts';
      return path.join(dir, `${slug}.${ext}`);
    }
    default: {
      const dir = metadata.draft && config.separateDrafts ? 'drafts' : 'posts';
      return path.join(dir, `${slug}.${ext}`);
    }
  }
}

/**
 * Get the base path for images based on SSG target.
 */
function getImagesBasePath(config: MeddlerConfig): string {
  switch (config.target) {
    case 'hugo': return 'static';
    case 'jekyll': return 'assets';
    case 'astro': return 'public';
    default: return '';
  }
}

/**
 * Get the data directory path based on SSG target.
 */
function getDataDir(config: MeddlerConfig): string {
  switch (config.target) {
    case 'hugo': return 'data';
    case 'jekyll': return '_data';
    case 'eleventy': return '_data';
    case 'astro': return 'src/data';
    default: return 'data';
  }
}

/**
 * Download a single image to disk.
 */
async function downloadImage(
  url: string,
  outputPath: string,
  report: ConversionReport
): Promise<boolean> {
  try {
    await fs.ensureDir(path.dirname(outputPath));
    const response = await got(url, { responseType: 'buffer', timeout: { request: 30000 } });
    await fs.writeFile(outputPath, response.body);
    return true;
  } catch (err: any) {
    report.warnings.push({
      file: url,
      message: `Image download failed: ${err.message || String(err)}`,
    });
    return false;
  }
}

/**
 * Build clean HTML output (stripped of Medium boilerplate).
 */
function buildCleanHtml(html: string, metadata: PostMetadata): string {
  const $ = cheerio.load(html);

  // Remove style blocks
  $('style').remove();

  // Extract just the body content
  const body = $('section[data-field="body"]').html() || '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${metadata.title}</title>
</head>
<body>
  <article>
    <h1>${metadata.title}</h1>
    ${metadata.subtitle ? `<p><em>${metadata.subtitle}</em></p>` : ''}
    ${body}
  </article>
</body>
</html>`;
}

/**
 * Build JSON metadata object.
 */
function buildJsonMetadata(metadata: PostMetadata): Record<string, unknown> {
  return {
    title: metadata.title,
    subtitle: metadata.subtitle || undefined,
    date: metadata.date,
    slug: metadata.slug,
    canonical_url: metadata.canonicalUrl || undefined,
    author: metadata.author || undefined,
    medium_id: metadata.mediumId,
    draft: metadata.draft,
    tags: metadata.tags,
    type: metadata.type,
    earnings: metadata.earnings ?? undefined,
  };
}

/**
 * Load the earnings lookup map from partner-program/ files.
 */
async function loadEarningsMap(exportPath: string): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const dir = path.join(exportPath, 'partner-program');

  if (!await fs.pathExists(dir)) return map;

  const files = (await fs.readdir(dir)).filter((f: string) => f.endsWith('.html')).sort();
  const htmlFiles: string[] = [];

  for (const file of files) {
    htmlFiles.push(await fs.readFile(path.join(dir, file), 'utf-8'));
  }

  const entries = parseEarnings(htmlFiles);
  for (const entry of entries) {
    if (entry.mediumId) {
      map.set(entry.mediumId, entry.earnings);
    }
  }

  return map;
}

/**
 * Read all HTML files from a directory (handling pagination).
 */
async function readAllHtmlFiles(dirPath: string): Promise<string[]> {
  if (!await fs.pathExists(dirPath)) return [];
  const files = (await fs.readdir(dirPath))
    .filter((f: string) => f.endsWith('.html'))
    .sort();
  const contents: string[] = [];
  for (const file of files) {
    contents.push(await fs.readFile(path.join(dirPath, file), 'utf-8'));
  }
  return contents;
}

/**
 * Convert supplementary data (bookmarks, claps, highlights, etc.).
 */
async function convertSupplementary(
  exportPath: string,
  outputBase: string,
  config: MeddlerConfig,
  report: ConversionReport,
  dryRun: boolean
): Promise<void> {
  const spinner = ora('Converting supplementary data...').start();
  const dataDir = path.join(outputBase, getDataDir(config));

  if (!dryRun) {
    await fs.ensureDir(dataDir);
  }

  // Profile
  if (config.supplementary.profile) {
    try {
      const profilePath = path.join(exportPath, 'profile', 'profile.html');
      const aboutPath = path.join(exportPath, 'profile', 'about.html');
      const pubsPath = path.join(exportPath, 'profile', 'publications.html');

      let profileData: any = {};
      if (await fs.pathExists(profilePath)) {
        profileData = parseProfile(await fs.readFile(profilePath, 'utf-8'));
      }
      if (await fs.pathExists(aboutPath)) {
        profileData.bio = parseAbout(await fs.readFile(aboutPath, 'utf-8'));
      }

      let publications: any[] = [];
      if (await fs.pathExists(pubsPath)) {
        publications = parsePublications(await fs.readFile(pubsPath, 'utf-8'));
      }

      if (!dryRun) {
        await fs.writeFile(
          path.join(dataDir, 'author.json'),
          JSON.stringify(profileData, null, 2),
          'utf-8'
        );
        if (publications.length > 0) {
          await fs.writeFile(
            path.join(dataDir, 'publications.json'),
            JSON.stringify(publications, null, 2),
            'utf-8'
          );
          report.summary.supplementaryFiles++;
        }
        report.summary.supplementaryFiles++;
      }
    } catch (err: any) {
      report.warnings.push({ file: 'profile/', message: err.message });
    }
  }

  // Bookmarks
  if (config.supplementary.bookmarks) {
    try {
      const files = await readAllHtmlFiles(path.join(exportPath, 'bookmarks'));
      if (files.length > 0) {
        const bookmarks = parseBookmarks(files);
        if (!dryRun) {
          await fs.writeFile(
            path.join(dataDir, 'bookmarks.json'),
            JSON.stringify(bookmarks, null, 2),
            'utf-8'
          );
        }
        report.summary.supplementaryFiles++;
      }
    } catch (err: any) {
      report.warnings.push({ file: 'bookmarks/', message: err.message });
    }
  }

  // Claps
  if (config.supplementary.claps) {
    try {
      const files = await readAllHtmlFiles(path.join(exportPath, 'claps'));
      if (files.length > 0) {
        const claps = parseClaps(files);
        if (!dryRun) {
          await fs.writeFile(
            path.join(dataDir, 'claps.json'),
            JSON.stringify(claps, null, 2),
            'utf-8'
          );
        }
        report.summary.supplementaryFiles++;
      }
    } catch (err: any) {
      report.warnings.push({ file: 'claps/', message: err.message });
    }
  }

  // Highlights
  if (config.supplementary.highlights) {
    try {
      const files = await readAllHtmlFiles(path.join(exportPath, 'highlights'));
      if (files.length > 0) {
        const highlights = parseHighlights(files);
        if (!dryRun) {
          await fs.writeFile(
            path.join(dataDir, 'highlights.json'),
            JSON.stringify(highlights, null, 2),
            'utf-8'
          );
        }
        report.summary.supplementaryFiles++;
      }
    } catch (err: any) {
      report.warnings.push({ file: 'highlights/', message: err.message });
    }
  }

  // Interests
  if (config.supplementary.interests) {
    try {
      const interestsDir = path.join(exportPath, 'interests');
      if (await fs.pathExists(interestsDir)) {
        const readIfExists = async (name: string): Promise<string | undefined> => {
          const p = path.join(interestsDir, name);
          return await fs.pathExists(p) ? await fs.readFile(p, 'utf-8') : undefined;
        };

        const interests = parseInterests({
          tags: await readIfExists('tags.html'),
          topics: await readIfExists('topics.html'),
          publications: await readIfExists('publications.html'),
          writers: await readIfExists('writers.html'),
        });

        if (!dryRun) {
          await fs.writeFile(
            path.join(dataDir, 'interests.json'),
            JSON.stringify(interests, null, 2),
            'utf-8'
          );
        }
        report.summary.supplementaryFiles++;
      }
    } catch (err: any) {
      report.warnings.push({ file: 'interests/', message: err.message });
    }
  }

  // Lists
  if (config.supplementary.lists) {
    try {
      const listsDir = path.join(exportPath, 'lists');
      if (await fs.pathExists(listsDir)) {
        const listFiles = (await fs.readdir(listsDir)).filter((f: string) => f.endsWith('.html'));
        const listsOutputDir = path.join(dataDir, 'lists');
        if (!dryRun && listFiles.length > 0) {
          await fs.ensureDir(listsOutputDir);
        }
        for (const file of listFiles) {
          const html = await fs.readFile(path.join(listsDir, file), 'utf-8');
          const listData = parseList(html, file);
          if (!dryRun) {
            const outName = file.replace(/\.html$/, '.json');
            await fs.writeFile(
              path.join(listsOutputDir, outName),
              JSON.stringify(listData, null, 2),
              'utf-8'
            );
          }
          report.summary.supplementaryFiles++;
        }
      }
    } catch (err: any) {
      report.warnings.push({ file: 'lists/', message: err.message });
    }
  }

  // Earnings
  if (config.supplementary.earnings) {
    try {
      const files = await readAllHtmlFiles(path.join(exportPath, 'partner-program'));
      if (files.length > 0) {
        const earnings = parseEarnings(files);
        if (!dryRun) {
          await fs.writeFile(
            path.join(dataDir, 'earnings.json'),
            JSON.stringify(earnings, null, 2),
            'utf-8'
          );
        }
        report.summary.supplementaryFiles++;
      }
    } catch (err: any) {
      report.warnings.push({ file: 'partner-program/', message: err.message });
    }
  }

  // Social graph (following)
  if (config.supplementary.socialGraph) {
    try {
      const usersFiles = await readAllHtmlFiles(path.join(exportPath, 'users-following'));
      const pubsFiles = await readAllHtmlFiles(path.join(exportPath, 'pubs-following'));
      const topicsFiles = await readAllHtmlFiles(path.join(exportPath, 'topics-following'));

      if (usersFiles.length > 0 || pubsFiles.length > 0 || topicsFiles.length > 0) {
        const following = parseFollowing(usersFiles, pubsFiles, topicsFiles);
        if (!dryRun) {
          await fs.writeFile(
            path.join(dataDir, 'following.json'),
            JSON.stringify(following, null, 2),
            'utf-8'
          );
        }
        report.summary.supplementaryFiles++;
      }
    } catch (err: any) {
      report.warnings.push({ file: 'following/', message: err.message });
    }
  }

  spinner.succeed(`Supplementary data: ${report.summary.supplementaryFiles} files generated.`);
}
