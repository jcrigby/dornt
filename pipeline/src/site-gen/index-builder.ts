import { config } from '../config.js';
import { readJson, listFiles, writeJson } from '../storage/gcs-client.js';
import { buildStoryDetail, buildStorylineDetails, buildBriefing } from './json-builder.js';
import type {
  Cluster, StoryIndex, StoryIndexEntry, TopStoriesResponse, PlatformMeta, Storyline,
} from '../types/index.js';

const PROCESSED = config.gcs.processedBucket;
const PUBLIC = config.gcs.publicBucket;
const RAW = config.gcs.rawBucket;
const API = config.site.apiPrefix;

export async function buildSiteData(): Promise<void> {
  console.log('Building site data...');

  // Load all active clusters
  const clusters = await loadActiveClusters();
  console.log(`Found ${clusters.length} active clusters`);

  // Build story index
  const storyIndex = buildStoryIndex(clusters);
  await writeJson(PUBLIC, `${API}/stories/index.json`, storyIndex);

  // Build top stories
  const topStories = buildTopStories(clusters);
  await writeJson(PUBLIC, `${API}/top.json`, topStories);

  // Build individual story detail pages (only for changed clusters)
  for (const cluster of clusters) {
    await buildStoryDetail(cluster);
  }

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

function buildStoryIndex(clusters: Cluster[]): StoryIndex {
  const stories: StoryIndexEntry[] = clusters
    .sort((a, b) => b.importance - a.importance)
    .map(c => ({
      id: c.id,
      title: c.title,
      summary: c.summary || '',
      articleCount: c.articleCount,
      sourceCount: c.sourceCount,
      topSources: c.topSources,
      importance: c.importance,
      updatedAt: c.updatedAt,
    }));

  return {
    stories,
    generatedAt: new Date().toISOString(),
    totalCount: stories.length,
  };
}

function buildTopStories(clusters: Cluster[]): TopStoriesResponse {
  const sorted = [...clusters].sort((a, b) => b.importance - a.importance);
  const toEntry = (c: Cluster): StoryIndexEntry => ({
    id: c.id,
    title: c.title,
    summary: c.summary || '',
    articleCount: c.articleCount,
    sourceCount: c.sourceCount,
    topSources: c.topSources,
    importance: c.importance,
    updatedAt: c.updatedAt,
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
