import Parser from 'rss-parser';
import { v4 as uuid } from 'uuid';
import { config } from '../config.js';
import { feeds } from './feed-registry.js';
import { normalizeUrl, contentHash } from './deduplicator.js';
import { extractArticle } from './article-extractor.js';
import { writeJson, readJson, listFiles } from '../storage/storage.js';
import type { RawArticle } from '../types/index.js';

const parser = new Parser({
  timeout: 10_000,
  headers: { 'User-Agent': 'Dornt-News-Intelligence/0.1' },
});

const BUCKET = config.storage.raw;

interface FeedResult {
  feedName: string;
  articlesFound: number;
  articlesNew: number;
  errors: string[];
}

export async function fetchAllFeeds(): Promise<FeedResult[]> {
  const results: FeedResult[] = [];
  const existingUrls = await loadExistingUrls();

  // Process feeds in batches of 10 to avoid overwhelming
  const batchSize = 10;
  for (let i = 0; i < feeds.length; i += batchSize) {
    const batch = feeds.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(feed => fetchSingleFeed(feed.url, feed.name, feed.category, existingUrls))
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          feedName: batch[j].name,
          articlesFound: 0,
          articlesNew: 0,
          errors: [String(result.reason)],
        });
      }
    }
  }

  return results;
}

async function fetchSingleFeed(
  feedUrl: string,
  feedName: string,
  category: string,
  existingUrls: Set<string>
): Promise<FeedResult> {
  const result: FeedResult = { feedName, articlesFound: 0, articlesNew: 0, errors: [] };

  try {
    const feed = await parser.parseURL(feedUrl);
    const items = (feed.items || []).slice(0, config.pipeline.maxArticlesPerFeed);
    result.articlesFound = items.length;

    const cutoff = Date.now() - config.pipeline.maxArticleAgeDays * 24 * 60 * 60 * 1000;

    for (const item of items) {
      try {
        if (!item.link) continue;

        const normalized = normalizeUrl(item.link);
        if (existingUrls.has(normalized)) continue;

        const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
        if (pubDate < cutoff) continue;

        // Extract full text
        const extracted = await extractArticle(item.link);

        const article: RawArticle = {
          id: uuid(),
          url: item.link,
          normalizedUrl: normalized,
          title: item.title || extracted?.title || 'Untitled',
          source: feedName,
          feedUrl,
          publishedAt: item.pubDate || new Date().toISOString(),
          fetchedAt: new Date().toISOString(),
          author: item.creator || item.author || undefined,
          contentHash: contentHash(extracted?.textContent || item.contentSnippet || item.title || ''),
          fullText: extracted?.textContent || item.contentSnippet || '',
          summary: item.contentSnippet?.slice(0, 500),
          imageUrl: item.enclosure?.url || undefined,
          categories: [category],
        };

        // Store article
        const datePath = new Date().toISOString().slice(0, 10);
        await writeJson(BUCKET, `articles/${datePath}/${article.id}.json`, article);
        existingUrls.add(normalized);
        result.articlesNew++;
      } catch (err) {
        result.errors.push(`Item "${item.title}": ${err}`);
      }
    }
  } catch (err) {
    result.errors.push(`Feed error: ${err}`);
  }

  return result;
}

async function loadExistingUrls(): Promise<Set<string>> {
  const urls = new Set<string>();
  try {
    // Load URL index
    const index = await readJson<string[]>(BUCKET, 'indexes/known-urls.json');
    if (index) {
      for (const url of index) urls.add(url);
    }
  } catch {
    // First run, no index yet
  }
  return urls;
}

export async function saveUrlIndex(urls: Set<string>): Promise<void> {
  await writeJson(BUCKET, 'indexes/known-urls.json', Array.from(urls));
}
