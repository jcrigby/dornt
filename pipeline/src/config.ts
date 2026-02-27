import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFilePath = resolve(__dirname, '..', '.env');

export const config = {
  // Storage directories (subdirectories under .local-storage/)
  storage: {
    raw: 'dornt-raw',
    processed: 'dornt-processed',
    public: 'dornt-public',
  },

  // OpenRouter
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: {
      embeddings: 'openai/text-embedding-3-small',
      titleGen: 'meta-llama/llama-3.1-8b-instruct',
      redditSentiment: 'meta-llama/llama-3.1-70b-instruct',
      batchSummary: 'meta-llama/llama-3.1-70b-instruct',
      primary: 'anthropic/claude-sonnet-4',
      fallback: 'openai/gpt-4o',
    },
    maxRetries: 3,
    retryDelayMs: 1000,
    rateLimitRpm: 60,
  },

  // Pipeline settings
  pipeline: {
    port: parseInt(process.env.PORT || '8080', 10),
    maxArticlesPerFeed: 20,
    maxArticleAgeDays: 3,
    clusterSimilarityThreshold: 0.72,
    clusterMergeThreshold: 0.85,
    minClusterSize: 3,
    largeClusterThreshold: 100,
    batchSummarySize: 30,
    staleClusterDays: 7,
    lockTimeoutMs: 15 * 60 * 1000, // 15 minutes
  },

  // Reddit
  reddit: {
    userAgent: 'dornt-news-intelligence/0.1.0',
    maxPostsPerSubreddit: 25,
    maxCommentsPerPost: 10,
  },

  // Site generation
  site: {
    publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
    apiPrefix: 'api/v1',
    topStoriesCount: 12,
    trendingCount: 6,
  },
};

/**
 * Parse a .env file into key-value pairs.
 * Handles KEY=VALUE, quoted values, and comments.
 */
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

/**
 * Load pipeline/.env file and merge values into config.
 * process.env takes priority over .env file values.
 */
export function loadEnvFile(): void {
  if (!existsSync(envFilePath)) return;

  const content = readFileSync(envFilePath, 'utf-8');
  const envVars = parseEnvFile(content);

  // Only apply .env values when the corresponding process.env is not set
  if (envVars.OPENROUTER_API_KEY && !process.env.OPENROUTER_API_KEY) {
    config.openrouter.apiKey = envVars.OPENROUTER_API_KEY;
  }
  if (envVars.PUBLIC_BASE_URL && !process.env.PUBLIC_BASE_URL) {
    config.site.publicBaseUrl = envVars.PUBLIC_BASE_URL;
  }
  if (envVars.PORT && !process.env.PORT) {
    config.pipeline.port = parseInt(envVars.PORT, 10);
  }
}

/**
 * Upsert a key in the .env file and update the live config.
 */
export function saveToEnvFile(key: string, value: string): void {
  let lines: string[] = [];

  if (existsSync(envFilePath)) {
    lines = readFileSync(envFilePath, 'utf-8').split('\n');
  }

  // Upsert the key
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('#') || !trimmed) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const lineKey = trimmed.slice(0, eqIndex).trim();
    if (lineKey === key) {
      lines[i] = `${key}=${value}`;
      found = true;
      break;
    }
  }

  if (!found) {
    lines.push(`${key}=${value}`);
  }

  writeFileSync(envFilePath, lines.join('\n'));
}

/** Get the current OpenRouter API key. */
export function getApiKey(): string {
  return config.openrouter.apiKey;
}

/** Set the OpenRouter API key in both live config and .env file. */
export function setApiKey(apiKey: string): void {
  config.openrouter.apiKey = apiKey;
  saveToEnvFile('OPENROUTER_API_KEY', apiKey);
}
