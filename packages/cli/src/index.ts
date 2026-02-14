#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs-extra';
import {
  MeddlerConfig,
  DEFAULT_CONFIG,
  ImageMode,
  EmbedMode,
  FrontMatterFormat,
  OutputFormat,
  SSGTarget,
} from '@brennanbrown/core';
import { validateExport } from './validate';
import { runConversion } from './convert';

const program = new Command();

program
  .name('meddler')
  .description('Convert a Medium data export into clean, portable formats for static site generators.')
  .version('1.0.2')
  .argument('<input-path>', 'Path to extracted Medium export folder or .zip file')
  .option('-o, --output <dir>', 'Output directory', DEFAULT_CONFIG.output)
  .option('-f, --format <fmt>', 'Front matter format: yaml, toml, json, none', DEFAULT_CONFIG.format)
  .option('--output-format <fmt>', 'Output format: markdown, html, structured-json', DEFAULT_CONFIG.outputFormat)
  .option('-t, --target <ssg>', 'Target SSG: generic, hugo, eleventy, jekyll, astro', DEFAULT_CONFIG.target)
  .option('--drafts', 'Include draft posts (default: true)')
  .option('--no-drafts', 'Exclude draft posts')
  .option('--responses', 'Include short responses/comments', DEFAULT_CONFIG.includeResponses)
  .option('--images <mode>', 'Image handling: reference, download, optimize', DEFAULT_CONFIG.images.mode)
  .option('--embeds <mode>', 'Embed handling: raw_html, shortcodes, placeholders', DEFAULT_CONFIG.embeds.mode)
  .option('--earnings', 'Inject partner program earnings into front matter')
  .option('--unquoted-dates', 'Output dates without quotes (Eleventy compatibility)')
  .option('--rewrite-image-urls', 'Rewrite Medium CDN URLs to local paths')
  .option('--image-base-url <url>', 'Base URL for rewritten images (default: /images)', '/images')
  .option('--supplementary', 'Convert supplementary data (bookmarks, claps, etc.)', true)
  .option('--no-supplementary', 'Skip supplementary data conversion')
  .option('--include-all', 'Include all data including sessions, IPs, blocks')
  .option('--dry-run', 'Preview what would be generated without writing files')
  .option('--verbose', 'Verbose logging output')
  .action(async (inputPath: string, options: Record<string, any>) => {
    const config = buildConfig(inputPath, options);

    console.log(chalk.bold.cyan('\n  ◉ Meddler') + chalk.dim(' — Medium Export Converter\n'));

    // Validate input
    const spinner = ora('Validating Medium export...').start();
    const exportPath = await resolveInputPath(config.input);

    if (!exportPath) {
      spinner.fail('Could not find or extract the Medium export.');
      process.exit(1);
    }

    const validation = validateExport(exportPath);
    if (!validation.valid) {
      spinner.fail(validation.message);
      process.exit(1);
    }

    spinner.succeed(`Valid Medium export found: ${chalk.green(validation.authorName || 'Unknown author')}`);

    if (validation.warning) {
      console.log(chalk.yellow(`  ⚠ ${validation.warning}`));
    }

    // Show summary
    console.log(chalk.dim('  ─────────────────────────────────────'));
    console.log(`  ${chalk.bold('Posts:')} ${validation.publishedCount} published, ${validation.draftCount} drafts`);
    console.log(`  ${chalk.bold('Format:')} ${config.format} front matter → ${config.target}`);
    console.log(`  ${chalk.bold('Output:')} ${path.resolve(config.output)}`);
    console.log(chalk.dim('  ─────────────────────────────────────\n'));

    if (options.dryRun) {
      console.log(chalk.yellow('  Dry run mode — no files will be written.\n'));
    }

    // Run conversion
    await runConversion(exportPath, config, options.dryRun || false);
  });

/**
 * Build a MeddlerConfig from CLI options.
 */
function buildConfig(inputPath: string, options: Record<string, any>): MeddlerConfig {
  const config: MeddlerConfig = { ...DEFAULT_CONFIG };

  config.input = inputPath;
  config.output = options.output || DEFAULT_CONFIG.output;
  config.format = (options.format as FrontMatterFormat) || DEFAULT_CONFIG.format;
  config.outputFormat = (options.outputFormat as OutputFormat) || DEFAULT_CONFIG.outputFormat;
  config.target = (options.target as SSGTarget) || DEFAULT_CONFIG.target;

  config.includeDrafts = options.drafts !== false;
  config.includeResponses = options.responses || false;

  config.images = {
    ...DEFAULT_CONFIG.images,
    mode: (options.images as ImageMode) || DEFAULT_CONFIG.images.mode,
  };

  config.embeds = {
    ...DEFAULT_CONFIG.embeds,
    mode: (options.embeds as EmbedMode) || DEFAULT_CONFIG.embeds.mode,
    shortcodeFormat: (options.target as SSGTarget) || DEFAULT_CONFIG.embeds.shortcodeFormat,
  };

  config.frontMatter = {
    ...DEFAULT_CONFIG.frontMatter,
    injectEarnings: options.earnings || false,
    unquotedDates: options.unquotedDates || false,
    rewriteImageUrls: options.rewriteImageUrls || false,
    imageBaseUrl: options.imageBaseUrl || DEFAULT_CONFIG.frontMatter.imageBaseUrl,
  };

  config.includeAll = options.includeAll || false;
  config.verbose = options.verbose || false;

  // Apply SSG-specific defaults
  applyTargetDefaults(config);

  return config;
}

/**
 * Apply SSG-specific default overrides.
 */
function applyTargetDefaults(config: MeddlerConfig): void {
  switch (config.target) {
    case 'hugo':
      if (config.format === 'yaml') config.format = 'toml';
      if (config.embeds.mode === 'raw_html') config.embeds.mode = 'shortcodes';
      config.embeds.shortcodeFormat = 'hugo';
      break;
    case 'jekyll':
      config.format = config.format === 'toml' ? 'yaml' : config.format;
      break;
    case 'astro':
    case 'eleventy':
      config.format = config.format === 'toml' ? 'yaml' : config.format;
      break;
  }
}

/**
 * Resolve the input path — handles .zip extraction or direct directory.
 */
async function resolveInputPath(inputPath: string): Promise<string | null> {
  const resolved = path.resolve(inputPath);

  if (!await fs.pathExists(resolved)) {
    return null;
  }

  const stat = await fs.stat(resolved);

  if (stat.isDirectory()) {
    // Check if this is the export root or if there's a subdirectory
    const readmeExists = await fs.pathExists(path.join(resolved, 'README.html'));
    if (readmeExists) return resolved;

    // Check for a single subdirectory (the hash-named folder)
    const entries = await fs.readdir(resolved);
    for (const entry of entries) {
      const sub = path.join(resolved, entry);
      const subStat = await fs.stat(sub);
      if (subStat.isDirectory()) {
        const subReadme = await fs.pathExists(path.join(sub, 'README.html'));
        if (subReadme) return sub;
      }
    }

    return resolved;
  }

  if (resolved.endsWith('.zip')) {
    const spinner = ora('Extracting .zip archive...').start();
    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(resolved);
      const tempDir = path.join(path.dirname(resolved), '.meddler-extracted');
      await fs.ensureDir(tempDir);
      zip.extractAllTo(tempDir, true);
      spinner.succeed('Archive extracted.');

      // Find the export root inside extracted folder
      const entries = await fs.readdir(tempDir);
      for (const entry of entries) {
        const sub = path.join(tempDir, entry);
        const subStat = await fs.stat(sub);
        if (subStat.isDirectory()) {
          const subReadme = await fs.pathExists(path.join(sub, 'README.html'));
          if (subReadme) return sub;
        }
      }
      return tempDir;
    } catch (err) {
      spinner.fail('Failed to extract .zip archive.');
      return null;
    }
  }

  return null;
}

program.parse();
