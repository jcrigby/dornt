import { generateJson } from './openrouter-client.js';
import { SYSTEM_PROMPT, COMMUNITY_PROMPT } from './prompt-templates.js';
import { writeJson } from '../storage/storage.js';
import { config } from '../config.js';
import type { RedditPost, CommunityAnalysis, Cluster, CommunityQuote } from '../types/index.js';

const PROCESSED = config.storage.processed;

export async function analyzeCommunity(
  cluster: Cluster,
  redditPosts: RedditPost[]
): Promise<CommunityAnalysis | null> {
  if (redditPosts.length === 0) {
    return null;
  }

  const discussionsText = redditPosts
    .map(post => {
      const comments = post.topComments
        .map(c => `  - u/${c.author} (score: ${c.score}): ${c.body.slice(0, 500)}`)
        .join('\n');
      return `[r/${post.subreddit}] "${post.title}" (score: ${post.score}, ${post.numComments} comments)\n${comments}`;
    })
    .join('\n\n');

  const prompt = COMMUNITY_PROMPT.replace('{discussions}', discussionsText);

  const { data } = await generateJson<{
    sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
    sentimentScore: number;
    keyThemes: string[];
    notableQuotes: Array<{ text: string; author: string; subreddit: string; score: number }>;
    discussionVolume: number;
  }>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { model: config.openrouter.models.redditSentiment, maxTokens: 2048 }
  );

  const community: CommunityAnalysis = {
    clusterId: cluster.id,
    sentiment: data.sentiment,
    sentimentScore: Math.max(-1, Math.min(1, data.sentimentScore)),
    keyThemes: data.keyThemes,
    notableQuotes: data.notableQuotes as CommunityQuote[],
    discussionVolume: redditPosts.reduce((sum, p) => sum + p.numComments, 0),
    generatedAt: new Date().toISOString(),
    model: config.openrouter.models.redditSentiment,
  };

  await writeJson(PROCESSED, `clusters/${cluster.id}/community.json`, community);
  return community;
}
