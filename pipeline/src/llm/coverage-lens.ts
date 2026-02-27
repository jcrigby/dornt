import { generateJson } from './openrouter-client.js';
import { SYSTEM_PROMPT, COVERAGE_LENS_PROMPT } from './prompt-templates.js';
import { formatArticlesBlock } from './token-budget.js';
import { writeJson } from '../storage/storage.js';
import { config } from '../config.js';
import type { RawArticle, CoverageAnalysis, Cluster } from '../types/index.js';

const PROCESSED = config.storage.processed;

export async function analyzeCoverage(
  cluster: Cluster,
  articles: RawArticle[]
): Promise<CoverageAnalysis> {
  const articlesText = formatArticlesBlock(articles.slice(0, 50));
  const prompt = COVERAGE_LENS_PROMPT.replace('{articles}', articlesText);

  const { data } = await generateJson<{
    frames: Array<{
      name: string;
      description: string;
      sources: string[];
      emphasis: string;
    }>;
    outlierPerspectives: string[];
    missingContext: string[];
  }>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { maxTokens: 4096 }
  );

  const coverage: CoverageAnalysis = {
    clusterId: cluster.id,
    frames: data.frames,
    outlierPerspectives: data.outlierPerspectives,
    missingContext: data.missingContext,
    generatedAt: new Date().toISOString(),
    model: config.openrouter.models.primary,
  };

  await writeJson(PROCESSED, `clusters/${cluster.id}/coverage.json`, coverage);
  return coverage;
}
