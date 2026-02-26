import { v4 as uuid } from 'uuid';
import { generateJson } from './openrouter-client.js';
import { SYSTEM_PROMPT, STORYLINE_PROMPT } from './prompt-templates.js';
import { readJson, writeJson } from '../storage/gcs-client.js';
import { config } from '../config.js';
import type { Cluster, Storyline } from '../types/index.js';

const PROCESSED = config.gcs.processedBucket;

export async function detectStorylines(clusters: Cluster[]): Promise<Storyline[]> {
  if (clusters.length < 2) return [];

  const clustersText = clusters
    .map(c => `[ID: ${c.id}] Title: "${c.title}" | Articles: ${c.articleCount} | Sources: ${c.topSources.join(', ')} | Updated: ${c.updatedAt}`)
    .join('\n');

  const prompt = STORYLINE_PROMPT.replace('{clusters}', clustersText);

  const { data } = await generateJson<{
    storylines: Array<{
      title: string;
      description: string;
      clusterIds: string[];
      arc: string;
      status: 'developing' | 'ongoing' | 'concluded';
    }>;
  }>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { maxTokens: 4096 }
  );

  // Load existing storylines to preserve IDs
  const existing = await readJson<Storyline[]>(PROCESSED, 'storylines/index.json') || [];
  const now = new Date().toISOString();

  const storylines: Storyline[] = data.storylines.map(s => {
    // Try to match to existing storyline by cluster overlap
    const match = existing.find(e => {
      const overlap = e.clusterIds.filter(id => s.clusterIds.includes(id));
      return overlap.length >= Math.min(2, e.clusterIds.length);
    });

    return {
      id: match?.id || uuid(),
      title: s.title,
      description: s.description,
      clusterIds: s.clusterIds,
      arc: s.arc,
      startedAt: match?.startedAt || now,
      updatedAt: now,
      status: s.status,
    };
  });

  await writeJson(PROCESSED, 'storylines/index.json', storylines);

  // Also save individual storyline files
  for (const storyline of storylines) {
    await writeJson(PROCESSED, `storylines/${storyline.id}.json`, storyline);
  }

  return storylines;
}
