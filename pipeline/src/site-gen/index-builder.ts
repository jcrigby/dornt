import { config } from '../config.js';
import { readJson, listFiles, writeJson } from '../storage/storage.js';
import { buildStoryDetail, buildStorylineDetails, buildBriefing } from './json-builder.js';
import type {
  Cluster, RawArticle, StoryIndex, StoryIndexEntry, TopStoriesResponse, PlatformMeta, Storyline,
} from '../types/index.js';

const PROCESSED = config.storage.processed;
const PUBLIC = config.storage.public;
const RAW = config.storage.raw;
const API = config.site.apiPrefix;

interface StoryMeta {
  imageUrl?: string;
  categories: string[];
}

export async function buildSiteData(): Promise<void> {
  console.log('Building site data...');

  // Load all active clusters
  const clusters = await loadActiveClusters();
  console.log(`Found ${clusters.length} active clusters`);

  // Build individual story detail pages and collect images + categories
  const storyMeta: Record<string, StoryMeta> = {};
  for (const cluster of clusters) {
    const detail = await buildStoryDetail(cluster);
    const img = detail.articles.find(a => a.imageUrl)?.imageUrl;

    // Collect categories from raw articles
    const cats: Record<string, number> = {};
    for (const articleId of cluster.articleIds.slice(0, 50)) {
      const article = await findArticle(articleId);
      if (article?.categories) {
        for (const cat of article.categories) {
          cats[cat] = (cats[cat] || 0) + 1;
        }
      }
    }
    // Sort by frequency, take top 3
    const topCats = Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c]) => c);

    storyMeta[cluster.id] = { imageUrl: img, categories: topCats };
  }

  // Build story index
  const storyIndex = buildStoryIndex(clusters, storyMeta);
  await writeJson(PUBLIC, `${API}/stories/index.json`, storyIndex);

  // Build top stories
  const topStories = buildTopStories(clusters, storyMeta);
  await writeJson(PUBLIC, `${API}/top.json`, topStories);

  // Build storyline data
  const storylines = await readJson<Storyline[]>(PROCESSED, 'storylines/index.json') || [];
  await buildStorylineDetails(storylines);

  // Build briefing data
  await buildBriefing();

  // Build platform meta
  const meta = await buildPlatformMeta(clusters);
  await writeJson(PUBLIC, `${API}/meta.json`, meta);

  console.log('Site data build complete');
}

function buildStoryIndex(clusters: Cluster[], meta: Record<string, StoryMeta>): StoryIndex {
  const stories: StoryIndexEntry[] = clusters
    .sort((a, b) => b.importance - a.importance)
    .map(c => ({
      id: c.id,
      title: c.title,
      summary: c.summary || '',
      articleCount: c.articleCount,
      sourceCount: c.sourceCount,
      topSources: c.topSources,
      categories: meta[c.id]?.categories || [],
      importance: c.importance,
      updatedAt: c.updatedAt,
      imageUrl: meta[c.id]?.imageUrl,
    }));

  return {
    stories,
    generatedAt: new Date().toISOString(),
    totalCount: stories.length,
  };
}

function buildTopStories(clusters: Cluster[], meta: Record<string, StoryMeta>): TopStoriesResponse {
  const sorted = [...clusters].sort((a, b) => b.importance - a.importance);
  const toEntry = (c: Cluster): StoryIndexEntry => ({
    id: c.id,
    title: c.title,
    summary: c.summary || '',
    articleCount: c.articleCount,
    sourceCount: c.sourceCount,
    topSources: c.topSources,
    categories: meta[c.id]?.categories || [],
    importance: c.importance,
    updatedAt: c.updatedAt,
    imageUrl: meta[c.id]?.imageUrl,
  });

  // Trending: recently updated clusters with growing article count
  const trending = [...clusters]
    .filter(c => {
      const age = Date.now() - new Date(c.updatedAt).getTime();
      return age < 6 * 60 * 60 * 1000; // Updated in last 6 hours
    })
    .sort((a, b) => b.articleCount - a.articleCount)
    .slice(0, config.site.trendingCount);

  return {
    top: sorted.slice(0, config.site.topStoriesCount).map(toEntry),
    trending: trending.map(toEntry),
    generatedAt: new Date().toISOString(),
  };
}

async function buildPlatformMeta(clusters: Cluster[]): Promise<PlatformMeta> {
  const activeClusters = clusters.filter(c => c.status === 'active').length;
  const totalArticles = clusters.reduce((sum, c) => sum + c.articleCount, 0);
  const sources = new Set(clusters.flatMap(c => c.topSources));

  return {
    totalArticles,
    totalClusters: clusters.length,
    activeClusters,
    totalSources: sources.size,
    lastIngestionAt: new Date().toISOString(),
    lastAnalysisAt: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
  };
}

async function findArticle(articleId: string): Promise<RawArticle | null> {
  const now = new Date();
  for (let i = 0; i < config.pipeline.maxArticleAgeDays + 1; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const datePath = date.toISOString().slice(0, 10);
    const article = await readJson<RawArticle>(RAW, `articles/${datePath}/${articleId}.json`);
    if (article) return article;
  }
  return null;
}

async function loadActiveClusters(): Promise<Cluster[]> {
  const clusters: Cluster[] = [];
  try {
    const files = await listFiles(PROCESSED, 'clusters/');
    const clusterFiles = files.filter(f => f.endsWith('/cluster.json'));

    for (const file of clusterFiles) {
      const cluster = await readJson<Cluster>(PROCESSED, file);
      if (cluster && (cluster.status === 'active' || cluster.status === 'new')) {
        clusters.push(cluster);
      }
    }
  } catch {
    // No clusters yet
  }
  return clusters;
}
