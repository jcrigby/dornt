import { config } from '../config.js';
import { cosineSimilarity } from './embedder.js';
import { readJson, writeJson, deleteFile } from '../storage/storage.js';
import type { Cluster } from '../types/index.js';

const PROCESSED = config.storage.processed;
const MERGE_THRESHOLD = config.pipeline.clusterMergeThreshold;

export async function mergeNearDuplicateClusters(
  clusters: Cluster[],
  centroids: Map<string, number[]>
): Promise<Cluster[]> {
  const merged = new Set<string>();
  const result: Cluster[] = [];

  for (let i = 0; i < clusters.length; i++) {
    if (merged.has(clusters[i].id)) continue;

    let primary = clusters[i];
    const centroidA = centroids.get(primary.id);
    if (!centroidA) {
      result.push(primary);
      continue;
    }

    for (let j = i + 1; j < clusters.length; j++) {
      if (merged.has(clusters[j].id)) continue;

      const centroidB = centroids.get(clusters[j].id);
      if (!centroidB) continue;

      const sim = cosineSimilarity(centroidA, centroidB);
      if (sim >= MERGE_THRESHOLD) {
        // Merge smaller into larger
        const secondary = clusters[j];
        primary = mergeTwoClusters(primary, secondary);
        merged.add(secondary.id);

        // Clean up the merged cluster file
        await deleteFile(PROCESSED, `clusters/${secondary.id}/cluster.json`);
        centroids.delete(secondary.id);

        console.log(`Merged cluster "${secondary.id}" into "${primary.id}" (sim=${sim.toFixed(3)})`);
      }
    }

    result.push(primary);
    await writeJson(PROCESSED, `clusters/${primary.id}/cluster.json`, primary);
  }

  return result;
}

function mergeTwoClusters(primary: Cluster, secondary: Cluster): Cluster {
  const allArticleIds = [...new Set([...primary.articleIds, ...secondary.articleIds])];
  const allRedditIds = [...new Set([...primary.redditPostIds, ...secondary.redditPostIds])];

  return {
    ...primary,
    articleIds: allArticleIds,
    redditPostIds: allRedditIds,
    articleCount: allArticleIds.length,
    updatedAt: new Date().toISOString(),
    importance: Math.max(primary.importance, secondary.importance),
    // Keep the title of the larger cluster
    title: primary.articleCount >= secondary.articleCount ? primary.title : secondary.title,
  };
}
