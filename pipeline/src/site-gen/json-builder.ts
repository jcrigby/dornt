import { config } from '../config.js';
import { readJson, listFiles, writeJson } from '../storage/gcs-client.js';
import type {
  Cluster, Synthesis, Claim, CoverageAnalysis, CommunityAnalysis, DeepAnalysis,
  RawArticle, StoryDetail, ArticleSummary, Storyline, DailyBriefing,
} from '../types/index.js';

const PROCESSED = config.gcs.processedBucket;
const RAW = config.gcs.rawBucket;
const PUBLIC = config.gcs.publicBucket;
const API = config.site.apiPrefix;

export async function buildStoryDetail(cluster: Cluster): Promise<StoryDetail> {
  // Load all analysis data for this cluster in parallel
  const [synthesis, claims, coverage, community, deepAnalysis] = await Promise.all([
    readJson<Synthesis>(PROCESSED, `clusters/${cluster.id}/synthesis.json`),
    readJson<Claim[]>(PROCESSED, `clusters/${cluster.id}/claims.json`),
    readJson<CoverageAnalysis>(PROCESSED, `clusters/${cluster.id}/coverage.json`),
    readJson<CommunityAnalysis>(PROCESSED, `clusters/${cluster.id}/community.json`),
    readJson<DeepAnalysis>(PROCESSED, `clusters/${cluster.id}/deep-analysis.json`),
  ]);

  // Load article summaries
  const articles: ArticleSummary[] = [];
  for (const articleId of cluster.articleIds.slice(0, 50)) {
    const article = await findArticle(articleId);
    if (article) {
      articles.push({
        id: article.id,
        title: article.title,
        source: article.source,
        url: article.url,
        publishedAt: article.publishedAt,
        imageUrl: article.imageUrl,
      });
    }
  }

  // Find related storylines
  const storylines = await readJson<Storyline[]>(PROCESSED, 'storylines/index.json') || [];
  const relatedStorylines = storylines
    .filter(s => s.clusterIds.includes(cluster.id))
    .map(s => s.id);

  const detail: StoryDetail = {
    cluster,
    synthesis,
    claims: claims || [],
    coverage,
    community,
    deepAnalysis,
    articles,
    relatedStorylines,
  };

  // Write to public bucket
  await writeJson(PUBLIC, `${API}/stories/${cluster.id}.json`, detail);
  return detail;
}

async function findArticle(articleId: string): Promise<RawArticle | null> {
  // Search recent date directories for the article
  const now = new Date();
  for (let i = 0; i < config.pipeline.maxArticleAgeDays + 1; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const datePath = date.toISOString().slice(0, 10);
    const article = await readJson<RawArticle>(RAW, `articles/${datePath}/${articleId}.json`);
    if (article) return article;
  }
  return null;
}

export async function buildStorylineDetails(storylines: Storyline[]): Promise<void> {
  const indexData = storylines.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    clusterCount: s.clusterIds.length,
    status: s.status,
    updatedAt: s.updatedAt,
  }));

  await writeJson(PUBLIC, `${API}/storylines/index.json`, {
    storylines: indexData,
    generatedAt: new Date().toISOString(),
  });

  for (const storyline of storylines) {
    await writeJson(PUBLIC, `${API}/storylines/${storyline.id}.json`, storyline);
  }
}

export async function buildBriefing(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const briefing = await readJson<DailyBriefing>(PROCESSED, `briefings/${today}.json`);

  if (briefing) {
    await writeJson(PUBLIC, `${API}/briefing/latest.json`, briefing);
    await writeJson(PUBLIC, `${API}/briefing/${today}.json`, briefing);
  }
}
