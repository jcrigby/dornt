import Parser from 'rss-parser';
import { YoutubeTranscript } from 'youtube-transcript';
import { v4 as uuid } from 'uuid';
import { config } from '../config.js';
import { youtubeChannels } from './feed-registry.js';
import { normalizeUrl, contentHash } from './deduplicator.js';
import { writeJson, readJson } from '../storage/storage.js';
import type { RawArticle } from '../types/index.js';

const parser = new Parser({
  timeout: 10_000,
  headers: { 'User-Agent': 'Dornt-News-Intelligence/0.1' },
});

const BUCKET = config.storage.raw;

interface YouTubeFetchResult {
  channelName: string;
  videosFound: number;
  videosNew: number;
  errors: string[];
}

export async function fetchAllYouTubeChannels(): Promise<YouTubeFetchResult[]> {
  const results: YouTubeFetchResult[] = [];
  const existingUrls = await loadExistingYouTubeUrls();

  const { batchSize } = config.youtube;
  for (let i = 0; i < youtubeChannels.length; i += batchSize) {
    const batch = youtubeChannels.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(ch => fetchChannel(ch.channelId, ch.name, ch.category, existingUrls))
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          channelName: batch[j].name,
          videosFound: 0,
          videosNew: 0,
          errors: [String(result.reason)],
        });
      }
    }
  }

  await saveYouTubeUrlIndex(existingUrls);
  return results;
}

async function fetchChannel(
  channelId: string,
  channelName: string,
  category: string,
  existingUrls: Set<string>
): Promise<YouTubeFetchResult> {
  const result: YouTubeFetchResult = { channelName, videosFound: 0, videosNew: 0, errors: [] };

  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const feed = await parser.parseURL(feedUrl);
    const items = (feed.items || []).slice(0, config.youtube.maxVideosPerChannel);
    result.videosFound = items.length;

    const cutoff = Date.now() - config.pipeline.maxArticleAgeDays * 24 * 60 * 60 * 1000;

    for (const item of items) {
      try {
        if (!item.link) continue;

        const normalized = normalizeUrl(item.link);
        if (existingUrls.has(normalized)) continue;

        const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
        if (pubDate < cutoff) continue;

        const videoId = extractVideoId(item.link);
        if (!videoId) continue;

        // Try to get transcript, fall back to description
        let fullText = '';
        try {
          const transcript = await YoutubeTranscript.fetchTranscript(videoId);
          fullText = transcript
            .map(t => t.text)
            .join(' ')
            .slice(0, config.youtube.maxTranscriptLength);
        } catch {
          // Transcript unavailable — use description
          fullText = item.contentSnippet || item.content || '';
        }

        if (!fullText) continue;

        const article: RawArticle = {
          id: uuid(),
          url: item.link,
          normalizedUrl: normalized,
          title: item.title || 'Untitled Video',
          source: `YouTube: ${channelName}`,
          feedUrl: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
          publishedAt: item.pubDate || new Date().toISOString(),
          fetchedAt: new Date().toISOString(),
          author: item.author || channelName,
          contentHash: contentHash(fullText),
          fullText,
          summary: (item.contentSnippet || '').slice(0, 500),
          imageUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          categories: [category, 'youtube'],
        };

        const datePath = new Date().toISOString().slice(0, 10);
        await writeJson(BUCKET, `articles/${datePath}/${article.id}.json`, article);
        existingUrls.add(normalized);
        result.videosNew++;

        // Rate limit between transcript fetches
        await sleep(config.youtube.rateLimitDelayMs);
      } catch (err) {
        result.errors.push(`Video "${item.title}": ${err}`);
      }
    }
  } catch (err) {
    result.errors.push(`Channel error: ${err}`);
  }

  return result;
}

function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      return parsed.searchParams.get('v');
    }
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1);
    }
  } catch {}
  return null;
}

async function loadExistingYouTubeUrls(): Promise<Set<string>> {
  const urls = new Set<string>();
  try {
    const index = await readJson<string[]>(BUCKET, 'indexes/known-youtube-urls.json');
    if (index) {
      for (const url of index) urls.add(url);
    }
  } catch {
    // First run
  }
  return urls;
}

async function saveYouTubeUrlIndex(urls: Set<string>): Promise<void> {
  await writeJson(BUCKET, 'indexes/known-youtube-urls.json', Array.from(urls));
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
