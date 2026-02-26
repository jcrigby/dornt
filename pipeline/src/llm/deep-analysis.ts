import { generateJson } from './openrouter-client.js';
import { SYSTEM_PROMPT, DEEP_ANALYSIS_PROMPT } from './prompt-templates.js';
import { writeJson } from '../storage/gcs-client.js';
import { config } from '../config.js';
import type { Synthesis, Claim, DeepAnalysis, Cluster } from '../types/index.js';

const PROCESSED = config.gcs.processedBucket;

export async function generateDeepAnalysis(
  cluster: Cluster,
  synthesis: Synthesis,
  claims: Claim[]
): Promise<DeepAnalysis> {
  const claimsText = claims
    .map(c => `- [${c.status}] ${c.text} (supported by: ${c.supportingSources.join(', ')})`)
    .join('\n');

  const prompt = DEEP_ANALYSIS_PROMPT
    .replace('{synthesis}', synthesis.narrative)
    .replace('{claims}', claimsText);

  const { data } = await generateJson<{
    stakeholders: Array<{
      name: string;
      role: string;
      position: string;
      influence: 'high' | 'medium' | 'low';
    }>;
    predictions: Array<{
      text: string;
      likelihood: 'likely' | 'possible' | 'unlikely';
      timeframe: string;
      basis: string;
    }>;
    historicalContext: string;
    implications: string[];
  }>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { maxTokens: 4096 }
  );

  const analysis: DeepAnalysis = {
    clusterId: cluster.id,
    stakeholders: data.stakeholders,
    predictions: data.predictions,
    historicalContext: data.historicalContext,
    implications: data.implications,
    generatedAt: new Date().toISOString(),
    model: config.openrouter.models.primary,
  };

  await writeJson(PROCESSED, `clusters/${cluster.id}/deep-analysis.json`, analysis);
  return analysis;
}
