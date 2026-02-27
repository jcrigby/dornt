import { v4 as uuid } from 'uuid';
import { config } from '../config.js';
import { cosineSimilarity } from './embedder.js';
import { readJson, writeJson, listFiles } from '../storage/storage.js';
import type { Cluster, ArticleEmbedding, RawArticle } from '../types/index.js';

const PROCESSED = config.storage.processed;
const RAW = config.storage.raw;
const THRESHOLD = config.pipeline.clusterSimilarityThreshold;

export async function clusterArticles(
  newEmbeddings: ArticleEmbedding[],
  articles: Map<string, RawArticle>
): Promise<{ updated: Cluster[]; created: Cluster[] }> {
  // Load existing clusters
  const existingClusters = await loadClusters();
  const clusterEmbeddings = await loadClusterEmbeddings();

  const updated: Cluster[] = [];
  const created: Cluster[] = [];
  const assigned = new Set<string>();

  for (const embedding of newEmbeddings) {
    if (assigned.has(embedding.articleId)) continue;

    let bestCluster: Cluster | null = null;
    let bestSim = 0;

    // Compare against existing cluster centroids
    for (const cluster of existingClusters) {
      const centroid = clusterEmbeddings.get(cluster.id);
      if (!centroid) continue;

      const sim = cosineSimilarity(embedding.embedding, centroid);
      if (sim > bestSim && sim >= THRESHOLD) {
        bestSim = sim;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      // Add to existing cluster
      if (!bestCluster.articleIds.includes(embedding.articleId)) {
        bestCluster.articleIds.push(embedding.articleId);
        bestCluster.articleCount = bestCluster.articleIds.length;
        bestCluster.updatedAt = new Date().toISOString();
        updateClusterMeta(bestCluster, articles);
        updateCentroid(bestCluster.id, embedding.embedding, clusterEmbeddings);

        if (!updated.includes(bestCluster)) updated.push(bestCluster);
      }
      assigned.add(embedding.articleId);
    } else {
      // Try to group with other unassigned new articles
      const clusterMembers: ArticleEmbedding[] = [embedding];
      assigned.add(embedding.articleId);

      for (const other of newEmbeddings) {
        if (assigned.has(other.articleId)) continue;
        const sim = cosineSimilarity(embedding.embedding, other.embedding);
        if (sim >= THRESHOLD) {
          clusterMembers.push(other);
          assigned.add(other.articleId);
        }
      }

      if (clusterMembers.length >= config.pipeline.minClusterSize) {
        const cluster = createCluster(clusterMembers, articles);
        const centroid = computeCentroid(clusterMembers.map(m => m.embedding));
        cluster.centroid = centroid;
        clusterEmbeddings.set(cluster.id, centroid);
        existingClusters.push(cluster);
        created.push(cluster);
      }
      // If too few, articles remain unclustered (orphans) — they'll get another chance next run
    }
  }

  // Persist updated and new clusters
  for (const cluster of [...updated, ...created]) {
    await writeJson(PROCESSED, `clusters/${cluster.id}/cluster.json`, cluster);
  }

  // Save centroid index
  const centroidIndex: Record<string, number[]> = {};
  for (const [id, centroid] of clusterEmbeddings) {
    centroidIndex[id] = centroid;
  }
  await writeJson(PROCESSED, 'clusters/centroids.json', centroidIndex);

  return { updated, created };
}

function createCluster(
  members: ArticleEmbedding[],
  articles: Map<string, RawArticle>
): Cluster {
  const now = new Date().toISOString();
  const articleIds = members.map(m => m.articleId);
  const cluster: Cluster = {
    id: uuid(),
    title: '', // Will be set by LLM title generation
    articleIds,
    redditPostIds: [],
    createdAt: now,
    updatedAt: now,
    articleCount: articleIds.length,
    sourceCount: 0,
    topSources: [],
    importance: 0,
    status: 'new',
  };

  updateClusterMeta(cluster, articles);
  return cluster;
}

function updateClusterMeta(cluster: Cluster, articles: Map<string, RawArticle>): void {
  const sources = new Map<string, number>();
  for (const id of cluster.articleIds) {
    const article = articles.get(id);
    if (article) {
      sources.set(article.source, (sources.get(article.source) || 0) + 1);
    }
  }
  cluster.sourceCount = sources.size;
  cluster.topSources = [...sources.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  // Simple importance: more articles + more sources = more important
  cluster.importance = Math.min(100, Math.round(
    (cluster.articleCount * 3 + cluster.sourceCount * 10)
  ));

  if (cluster.status === 'new' && cluster.articleCount >= config.pipeline.minClusterSize) {
    cluster.status = 'active';
  }
}

function computeCentroid(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return [];
  const dim = embeddings[0].length;
  const centroid = new Array(dim).fill(0);

  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      centroid[i] += emb[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    centroid[i] /= embeddings.length;
  }

  return centroid;
}

function updateCentroid(
  clusterId: string,
  newEmbedding: number[],
  centroids: Map<string, number[]>
): void {
  const existing = centroids.get(clusterId);
  if (!existing) {
    centroids.set(clusterId, newEmbedding);
    return;
  }

  // Running average (simple approach)
  const updated = existing.map((v, i) => (v + newEmbedding[i]) / 2);
  centroids.set(clusterId, updated);
}

async function loadClusters(): Promise<Cluster[]> {
  const clusters: Cluster[] = [];
  try {
    const files = await listFiles(PROCESSED, 'clusters/');
    const clusterFiles = files.filter(f => f.endsWith('/cluster.json'));

    for (const file of clusterFiles) {
      const cluster = await readJson<Cluster>(PROCESSED, file);
      if (cluster && cluster.status !== 'archived') {
        clusters.push(cluster);
      }
    }
  } catch {
    // First run
  }
  return clusters;
}

async function loadClusterEmbeddings(): Promise<Map<string, number[]>> {
  const map = new Map<string, number[]>();
  try {
    const index = await readJson<Record<string, number[]>>(PROCESSED, 'clusters/centroids.json');
    if (index) {
      for (const [id, centroid] of Object.entries(index)) {
        map.set(id, centroid);
      }
    }
  } catch {
    // First run
  }
  return map;
}
