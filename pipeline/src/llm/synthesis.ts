import { chatCompletion, generateJson } from './openrouter-client.js';
import { SYSTEM_PROMPT, SYNTHESIS_PROMPT, TITLE_PROMPT, BATCH_SUMMARY_PROMPT } from './prompt-templates.js';
import { prepareClusterInput, formatArticlesBlock } from './token-budget.js';
import { writeJson } from '../storage/storage.js';
import { config } from '../config.js';
import type { RawArticle, Synthesis, Citation, Cluster } from '../types/index.js';

const PROCESSED = config.storage.processed;

export async function generateClusterTitle(articles: RawArticle[]): Promise<string> {
  const titles = articles.map(a => `- ${a.title}`).join('\n');
  const prompt = TITLE_PROMPT.replace('{titles}', titles);

  const result = await chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { model: config.openrouter.models.titleGen, maxTokens: 100, temperature: 0.2 }
  );

  return result.content.trim().replace(/^["']|["']$/g, '');
}

export async function generateSynthesis(
  cluster: Cluster,
  articles: RawArticle[]
): Promise<Synthesis> {
  const model = config.openrouter.models.primary;
  const { needsTwoPass, directArticles, overflowArticles } = prepareClusterInput(articles, model);

  let articlesText: string;

  if (needsTwoPass && overflowArticles.length > 0) {
    // Two-pass: summarize overflow articles first
    const summaries = await batchSummarize(overflowArticles);
    const directBlock = formatArticlesBlock(directArticles);
    articlesText = `${directBlock}\n\n--- Summaries of additional articles ---\n${summaries}`;
  } else {
    articlesText = formatArticlesBlock(directArticles);
  }

  const prompt = SYNTHESIS_PROMPT.replace('{articles}', articlesText);

  const { data, tokensUsed } = await generateJson<{
    narrative: string;
    keyDevelopments: string[];
    citations: Array<{ index: number; source: string; title: string; quote?: string }>;
  }>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { model, maxTokens: 4096 }
  );

  const citations: Citation[] = data.citations.map((c, i) => {
    const article = articles.find(a => a.source === c.source || a.title === c.title);
    return {
      index: c.index || i + 1,
      articleId: article?.id || '',
      source: c.source,
      title: c.title,
      url: article?.url || '',
      quote: c.quote,
    };
  });

  const synthesis: Synthesis = {
    clusterId: cluster.id,
    narrative: data.narrative,
    citations,
    keyDevelopments: data.keyDevelopments,
    generatedAt: new Date().toISOString(),
    model,
    tokenCount: tokensUsed.prompt + tokensUsed.completion,
  };

  await writeJson(PROCESSED, `clusters/${cluster.id}/synthesis.json`, synthesis);
  return synthesis;
}

async function batchSummarize(articles: RawArticle[]): Promise<string> {
  const articlesText = formatArticlesBlock(articles);
  const prompt = BATCH_SUMMARY_PROMPT.replace('{articles}', articlesText);

  const result = await chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { model: config.openrouter.models.batchSummary, maxTokens: 4096 }
  );

  return result.content;
}
