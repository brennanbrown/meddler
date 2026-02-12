import path from 'path';
import fs from 'fs-extra';

export interface ValidationResult {
  valid: boolean;
  message: string;
  warning: string | null;
  authorName: string | null;
  publishedCount: number;
  draftCount: number;
  exportPath: string;
}

/**
 * Validate that a directory is a valid Medium export.
 */
export function validateExport(exportPath: string): ValidationResult {
  const result: ValidationResult = {
    valid: false,
    message: '',
    warning: null,
    authorName: null,
    publishedCount: 0,
    draftCount: 0,
    exportPath,
  };

  // Check README.html exists
  const readmePath = path.join(exportPath, 'README.html');
  if (!fs.existsSync(readmePath)) {
    result.message = "This doesn't look like a Medium export. No README.html found.";
    return result;
  }

  // Try to extract author name from README.html
  try {
    const readmeHtml = fs.readFileSync(readmePath, 'utf-8');
    const match = readmeHtml.match(/Archive for ([^<]+)/);
    if (match) {
      result.authorName = match[1].trim();
    }
  } catch {
    // Non-fatal
  }

  // Check posts/ directory exists
  const postsDir = path.join(exportPath, 'posts');
  if (!fs.existsSync(postsDir) || !fs.statSync(postsDir).isDirectory()) {
    // Check if there's any supplementary data
    const hasSuppData = ['profile', 'bookmarks', 'claps', 'lists', 'partner-program', 'interests']
      .some(dir => fs.existsSync(path.join(exportPath, dir)));

    if (hasSuppData) {
      result.valid = true;
      result.warning = 'No posts/ directory found. Only supplementary data will be processed.';
      result.message = 'Valid Medium export (supplementary data only).';
      return result;
    }

    result.message = "This export doesn't contain any posts or supplementary data.";
    return result;
  }

  // Count posts
  const postFiles = fs.readdirSync(postsDir).filter((f: string) => f.endsWith('.html'));
  if (postFiles.length === 0) {
    result.warning = 'The posts/ directory is empty. Only supplementary data will be processed.';
  }

  for (const file of postFiles) {
    if (file.startsWith('draft_')) {
      result.draftCount++;
    } else {
      result.publishedCount++;
    }
  }

  result.valid = true;
  result.message = 'Valid Medium export.';
  return result;
}
