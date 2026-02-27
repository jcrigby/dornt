import { v4 as uuid } from 'uuid';
import { config } from '../config.js';
import { subreddits } from './feed-registry.js';
import { writeJson, readJson } from '../storage/storage.js';
import type { RedditPost, RedditComment } from '../types/index.js';

const BUCKET = config.storage.raw;

interface RedditFetchResult {
  subreddit: string;
  postsFound: number;
  postsNew: number;
  error?: string;
}

export async function fetchAllSubreddits(): Promise<RedditFetchResult[]> {
  const results: RedditFetchResult[] = [];
  const existingIds = await loadExistingRedditIds();

  // Process sequentially to respect rate limits
  for (const sub of subreddits) {
    const result = await fetchSubreddit(sub.name, existingIds);
    results.push(result);
    // Reddit rate limit: ~1 request per second for unauthenticated
    await sleep(1200);
  }

  await saveRedditIdIndex(existingIds);
  return results;
}

async function fetchSubreddit(
  subreddit: string,
  existingIds: Set<string>
): Promise<RedditFetchResult> {
  const result: RedditFetchResult = { subreddit, postsFound: 0, postsNew: 0 };

  try {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${config.reddit.maxPostsPerSubreddit}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': config.reddit.userAgent },
    });

    if (!response.ok) {
      result.error = `HTTP ${response.status}`;
      return result;
    }

    const data = await response.json() as any;
    const posts = data?.data?.children || [];
    result.postsFound = posts.length;

    for (const child of posts) {
      const post = child.data;
      if (!post || existingIds.has(post.id)) continue;

      // Skip stickied and self-only posts with no external link
      if (post.stickied) continue;

      // Fetch top comments
      const comments = await fetchComments(subreddit, post.id);

      const redditPost: RedditPost = {
        id: post.id,
        subreddit,
        title: post.title,
        url: post.url,
        selftext: post.selftext?.slice(0, 10_000) || '',
        author: post.author,
        score: post.score,
        numComments: post.num_comments,
        createdUtc: post.created_utc,
        permalink: `https://reddit.com${post.permalink}`,
        fetchedAt: new Date().toISOString(),
        topComments: comments,
      };

      const datePath = new Date().toISOString().slice(0, 10);
      await writeJson(BUCKET, `reddit/${datePath}/${redditPost.id}.json`, redditPost);
      existingIds.add(post.id);
      result.postsNew++;

      await sleep(600); // Rate limit between comment fetches
    }
  } catch (err) {
    result.error = String(err);
  }

  return result;
}

async function fetchComments(subreddit: string, postId: string): Promise<RedditComment[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?limit=${config.reddit.maxCommentsPerPost}&sort=top`;
    const response = await fetch(url, {
      headers: { 'User-Agent': config.reddit.userAgent },
    });

    if (!response.ok) return [];

    const data = await response.json() as any;
    const commentListing = data?.[1]?.data?.children || [];

    return commentListing
      .filter((c: any) => c.kind === 't1' && c.data?.body)
      .slice(0, config.reddit.maxCommentsPerPost)
      .map((c: any) => ({
        id: c.data.id,
        author: c.data.author,
        body: c.data.body.slice(0, 2000),
        score: c.data.score,
        createdUtc: c.data.created_utc,
      }));
  } catch {
    return [];
  }
}

async function loadExistingRedditIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  try {
    const index = await readJson<string[]>(BUCKET, 'indexes/known-reddit-ids.json');
    if (index) {
      for (const id of index) ids.add(id);
    }
  } catch {
    // First run
  }
  return ids;
}

async function saveRedditIdIndex(ids: Set<string>): Promise<void> {
  await writeJson(BUCKET, 'indexes/known-reddit-ids.json', Array.from(ids));
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
