import { config } from '../config.js';
import type { ArticleEmbedding, RawArticle } from '../types/index.js';

const EMBED_BATCH_SIZE = 50; // Nomic supports batching

export async function embedArticles(articles: RawArticle[]): Promise<ArticleEmbedding[]> {
  const results: ArticleEmbedding[] = [];

  for (let i = 0; i < articles.length; i += EMBED_BATCH_SIZE) {
    const batch = articles.slice(i, i + EMBED_BATCH_SIZE);
    const texts = batch.map(a => prepareEmbedText(a));

    const embeddings = await fetchEmbeddings(texts);

    for (let j = 0; j < batch.length; j++) {
      results.push({
        articleId: batch[j].id,
        embedding: embeddings[j],
        model: config.openrouter.models.embeddings,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

function prepareEmbedText(article: RawArticle): string {
  // Combine title + first ~1000 chars of content for embedding
  const content = article.fullText.slice(0, 1000);
  return `${article.title}\n\n${content}`;
}

async function fetchEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch(`${config.openrouter.baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.openrouter.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://dornt.com',
      'X-Title': 'Dornt News Intelligence',
    },
    body: JSON.stringify({
      model: config.openrouter.models.embeddings,
      input: texts,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding API error ${response.status}: ${err}`);
  }

  const data = await response.json() as any;
  return data.data.map((d: any) => d.embedding);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dotProduct / denom;
}
