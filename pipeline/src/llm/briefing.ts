import { v4 as uuid } from 'uuid';
import { generateJson } from './openrouter-client.js';
import { SYSTEM_PROMPT, BRIEFING_PROMPT } from './prompt-templates.js';
import { writeJson } from '../storage/storage.js';
import { config } from '../config.js';
import type { Cluster, DailyBriefing } from '../types/index.js';

const PROCESSED = config.storage.processed;

export async function generateBriefing(clusters: Cluster[]): Promise<DailyBriefing> {
  const clustersText = clusters
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 30) // Top 30 clusters for context
    .map(c => `[ID: ${c.id}] "${c.title}" | Importance: ${c.importance} | Articles: ${c.articleCount} | Sources: ${c.topSources.join(', ')}`)
    .join('\n');

  const prompt = BRIEFING_PROMPT.replace('{clusters}', clustersText);

  const { data } = await generateJson<{
    headline: string;
    topStories: Array<{
      clusterId: string;
      title: string;
      summary: string;
      importance: number;
    }>;
    emergingThemes: string[];
    notableShifts: string[];
  }>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { maxTokens: 4096 }
  );

  const today = new Date().toISOString().slice(0, 10);

  const briefing: DailyBriefing = {
    id: uuid(),
    date: today,
    headline: data.headline,
    topStories: data.topStories,
    emergingThemes: data.emergingThemes,
    notableShifts: data.notableShifts,
    generatedAt: new Date().toISOString(),
    model: config.openrouter.models.primary,
  };

  await writeJson(PROCESSED, `briefings/${today}.json`, briefing);
  return briefing;
}
