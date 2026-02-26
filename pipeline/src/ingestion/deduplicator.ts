import { createHash } from 'node:crypto';

/**
 * Normalize a URL for deduplication:
 * - Strip tracking params (utm_*, fbclid, etc.)
 * - Remove trailing slashes
 * - Lowercase hostname
 * - Remove www. prefix
 * - Remove fragment
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Lowercase hostname, remove www
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    // Remove tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref', 'source',
    ];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }

    // Sort remaining params for consistency
    parsed.searchParams.sort();

    // Remove fragment
    parsed.hash = '';

    // Build clean URL, remove trailing slash
    let clean = parsed.toString();
    if (clean.endsWith('/')) clean = clean.slice(0, -1);

    return clean;
  } catch {
    return url.toLowerCase().trim();
  }
}

/**
 * Generate a content hash for deduplication.
 * Uses first 2000 chars of content to detect near-duplicates
 * even when URLs differ (e.g. syndicated articles).
 */
export function contentHash(text: string): string {
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);

  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

/**
 * Check if two articles are likely duplicates based on content hash
 * or very similar titles from different sources.
 */
export function isDuplicate(
  hash1: string,
  hash2: string,
  title1?: string,
  title2?: string
): boolean {
  if (hash1 === hash2) return true;

  if (title1 && title2) {
    const norm1 = title1.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const norm2 = title2.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (norm1 === norm2) return true;

    // Jaccard similarity on words
    const words1 = new Set(norm1.split(/\s+/));
    const words2 = new Set(norm2.split(/\s+/));
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    const similarity = intersection.size / union.size;
    return similarity > 0.8;
  }

  return false;
}
