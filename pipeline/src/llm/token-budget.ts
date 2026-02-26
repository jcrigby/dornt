import type { RawArticle } from '../types/index.js';
import { config } from '../config.js';

// Rough token estimate: ~4 chars per token for English text
const CHARS_PER_TOKEN = 4;

// Context window budgets (leaving room for system prompt + output)
const MODEL_BUDGETS: Record<string, number> = {
  'anthropic/claude-sonnet-4': 150_000,   // 200K context, reserve 50K
  'openai/gpt-4o': 100_000,              // 128K context, reserve 28K
  'meta-llama/llama-3.1-70b-instruct': 100_000,
  'meta-llama/llama-3.1-8b-instruct': 100_000,
};

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

export function getContextBudget(model: string): number {
  return MODEL_BUDGETS[model] || 80_000;
}

/**
 * For large clusters, prepare a two-pass input:
 * If total article tokens exceed the context budget, batch-summarize first,
 * then use summaries + top N full articles.
 */
export function prepareClusterInput(
  articles: RawArticle[],
  model: string
): { needsTwoPass: boolean; directArticles: RawArticle[]; overflowArticles: RawArticle[] } {
  const budget = getContextBudget(model);
  const systemPromptTokens = 2000; // Reserve for system prompt
  const outputTokens = 4096;       // Reserve for output
  const availableTokens = budget - systemPromptTokens - outputTokens;

  // Sort by recency
  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  let totalTokens = 0;
  const directArticles: RawArticle[] = [];
  const overflowArticles: RawArticle[] = [];

  for (const article of sorted) {
    const tokens = estimateTokens(formatArticleForPrompt(article));
    if (totalTokens + tokens <= availableTokens) {
      directArticles.push(article);
      totalTokens += tokens;
    } else {
      overflowArticles.push(article);
    }
  }

  return {
    needsTwoPass: overflowArticles.length > 0,
    directArticles,
    overflowArticles,
  };
}

export function formatArticleForPrompt(article: RawArticle): string {
  const text = article.fullText.slice(0, 3000); // Cap each article
  return `[Source: ${article.source}] [Date: ${article.publishedAt}]\nTitle: ${article.title}\n${text}\n`;
}

export function formatArticlesBlock(articles: RawArticle[]): string {
  return articles
    .map((a, i) => `--- Article [${i + 1}] ---\n${formatArticleForPrompt(a)}`)
    .join('\n');
}
