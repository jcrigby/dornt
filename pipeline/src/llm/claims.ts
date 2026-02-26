import { v4 as uuid } from 'uuid';
import { generateJson } from './openrouter-client.js';
import { SYSTEM_PROMPT, CLAIMS_PROMPT } from './prompt-templates.js';
import { formatArticlesBlock } from './token-budget.js';
import { writeJson, readJson } from '../storage/gcs-client.js';
import { config } from '../config.js';
import type { RawArticle, Claim, Cluster } from '../types/index.js';

const PROCESSED = config.gcs.processedBucket;

export async function extractClaims(
  cluster: Cluster,
  articles: RawArticle[]
): Promise<Claim[]> {
  const articlesText = formatArticlesBlock(articles.slice(0, 50)); // Cap for context
  const prompt = CLAIMS_PROMPT.replace('{articles}', articlesText);

  const { data } = await generateJson<{
    claims: Array<{
      text: string;
      status: 'undisputed' | 'disputed' | 'evolving' | 'retracted';
      supportingSources: string[];
      disputingSources: string[];
    }>;
  }>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { maxTokens: 4096 }
  );

  // Load existing claims for this cluster to track evolution
  const existingClaims = await readJson<Claim[]>(
    PROCESSED, `clusters/${cluster.id}/claims.json`
  ) || [];

  const now = new Date().toISOString();

  const claims: Claim[] = data.claims.map(c => {
    // Check if this claim already exists (fuzzy match on text)
    const existing = existingClaims.find(
      ec => ec.text.toLowerCase().includes(c.text.toLowerCase().slice(0, 50)) ||
            c.text.toLowerCase().includes(ec.text.toLowerCase().slice(0, 50))
    );

    return {
      id: existing?.id || uuid(),
      clusterId: cluster.id,
      text: c.text,
      status: c.status,
      supportingSources: c.supportingSources,
      disputingSources: c.disputingSources || [],
      firstSeenAt: existing?.firstSeenAt || now,
      lastUpdatedAt: now,
    };
  });

  await writeJson(PROCESSED, `clusters/${cluster.id}/claims.json`, claims);
  return claims;
}
