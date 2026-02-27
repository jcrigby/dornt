import express from 'express';
import { resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { config, loadEnvFile, getApiKey, setApiKey } from './config.js';
import { generatePKCE, getAuthUrl, exchangeCodeForKey, validateKey } from './auth/openrouter-oauth.js';
import { acquireLock, releaseLock, markRunning, markCompleted, markFailed } from './storage/state-manager.js';
import { fetchAllFeeds } from './ingestion/rss-fetcher.js';
import { fetchAllSubreddits } from './ingestion/reddit-fetcher.js';
import { embedArticles } from './clustering/embedder.js';
import { clusterArticles } from './clustering/clusterer.js';
import { mergeNearDuplicateClusters } from './clustering/cluster-merger.js';
import { generateClusterTitle, generateSynthesis } from './llm/synthesis.js';
import { extractClaims } from './llm/claims.js';
import { analyzeCoverage } from './llm/coverage-lens.js';
import { analyzeCommunity } from './llm/community.js';
import { generateDeepAnalysis } from './llm/deep-analysis.js';
import { detectStorylines } from './llm/storylines.js';
import { generateBriefing } from './llm/briefing.js';
import { buildSiteData } from './site-gen/index-builder.js';
import { readJson, listFiles } from './storage/storage.js';
import type { RawArticle, Cluster, RedditPost, PipelineStage } from './types/index.js';

// Load .env file before anything else
loadEnvFile();

const app = express();
app.use(express.json());

// Serve dornt-assets statically for the setup page
app.use('/dornt-assets', express.static(resolve(process.cwd(), '../site/dornt-assets')));

// Serve generated API data from local storage
app.use('/api/v1', express.static(resolve(process.cwd(), '.local-storage/dornt-public/api/v1')));

// Serve the site with local API base injected into HTML pages
const siteDir = resolve(process.cwd(), '../site');
app.use('/site', (req, res, next) => {
  // For HTML pages, inject DORNT_API_BASE before serving
  if (req.path.endsWith('.html') || req.path === '/' || !req.path.includes('.')) {
    const filePath = req.path === '/' ? '/index.html' : req.path.endsWith('.html') ? req.path : req.path + '.html';
    const fullPath = resolve(siteDir, filePath.slice(1));
    if (existsSync(fullPath)) {
      let html = readFileSync(fullPath, 'utf-8');
      // Inject API base before closing </head>
      const script = `<script>window.DORNT_API_BASE = '/api/v1';</script>`;
      html = html.replace('</head>', script + '</head>');
      // Fix relative asset paths to work under /site/
      return res.type('html').send(html);
    }
  }
  next();
}, express.static(siteDir));

// In-memory PKCE state (per-session, cleared on restart — fine for local setup)
let pendingPKCE: { codeVerifier: string } | null = null;

// ── Setup & Auth Routes ──

// Auto-redirect to /setup if no API key configured
app.get('/', (_req, res) => {
  if (!getApiKey()) {
    return res.redirect('/setup');
  }
  res.json({ status: 'ok', service: 'dornt-pipeline', version: '0.1.0' });
});

// API status endpoint
app.get('/api/status', async (_req, res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return res.json({ configured: false, keyValid: false, keyPrefix: null });
  }
  const keyInfo = await validateKey(apiKey);
  res.json({
    configured: true,
    keyValid: keyInfo.valid,
    keyPrefix: apiKey.slice(0, 8) + '...',
    label: keyInfo.label,
    limit: keyInfo.limit,
    usage: keyInfo.usage,
  });
});

// OAuth callback — exchanges code for API key
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code as string | undefined;
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }
  if (!pendingPKCE) {
    return res.status(400).send('No pending OAuth flow. Please start again from /setup');
  }

  try {
    const apiKey = await exchangeCodeForKey(code, pendingPKCE.codeVerifier);
    pendingPKCE = null;
    setApiKey(apiKey);
    console.log('OpenRouter API key obtained via OAuth and saved to .env');
    res.redirect('/setup?success=1');
  } catch (err) {
    pendingPKCE = null;
    const message = err instanceof Error ? err.message : String(err);
    console.error('OAuth key exchange failed:', message);
    res.redirect(`/setup?error=${encodeURIComponent(message)}`);
  }
});

// Setup page
app.get('/setup', (_req, res) => {
  const port = config.pipeline.port;
  const callbackUrl = `http://localhost:${port}/auth/callback`;

  // Generate PKCE pair for this session
  const pkce = generatePKCE();
  pendingPKCE = { codeVerifier: pkce.codeVerifier };
  const authUrl = getAuthUrl(callbackUrl, pkce.codeChallenge);

  res.type('html').send(setupPageHTML(authUrl));
});

// Manual API key submission
app.post('/api/set-key', async (req, res) => {
  const { apiKey } = req.body as { apiKey?: string };
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or empty apiKey' });
  }

  const keyInfo = await validateKey(apiKey.trim());
  if (!keyInfo.valid) {
    return res.status(400).json({ error: 'Invalid API key — could not verify with OpenRouter' });
  }

  setApiKey(apiKey.trim());
  console.log('OpenRouter API key set manually and saved to .env');
  res.json({ success: true });
});

// Wrapper for stage execution with locking
async function runStage(stage: PipelineStage, handler: () => Promise<unknown>): Promise<{ success: boolean; result?: unknown; error?: string }> {
  const lockId = await acquireLock(stage);
  if (!lockId) {
    return { success: false, error: `Stage ${stage} is already running` };
  }

  try {
    await markRunning(stage);
    const result = await handler();
    await markCompleted(stage);
    return { success: true, result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markFailed(stage, message);
    return { success: false, error: message };
  } finally {
    await releaseLock(stage, lockId);
  }
}

// ── Stage 1: Ingest ──
app.post('/ingest', async (_req, res) => {
  const result = await runStage('ingest', async () => {
    console.log('Starting ingestion...');
    const [feedResults, redditResults] = await Promise.all([
      fetchAllFeeds(),
      fetchAllSubreddits(),
    ]);

    const totalNewArticles = feedResults.reduce((sum, r) => sum + r.articlesNew, 0);
    const totalNewPosts = redditResults.reduce((sum, r) => sum + r.postsNew, 0);
    const feedErrors = feedResults.filter(r => r.errors.length > 0).length;

    console.log(`Ingestion complete: ${totalNewArticles} new articles, ${totalNewPosts} new Reddit posts, ${feedErrors} feeds with errors`);
    return { newArticles: totalNewArticles, newRedditPosts: totalNewPosts, feedErrors };
  });

  res.status(result.success ? 200 : 500).json(result);
});

// ── Stage 2: Cluster ──
app.post('/cluster', async (_req, res) => {
  const result = await runStage('cluster', async () => {
    console.log('Starting clustering...');

    // Load recent unembedded articles
    const articles = await loadRecentArticles();
    if (articles.length === 0) {
      return { message: 'No new articles to cluster' };
    }

    console.log(`Embedding ${articles.length} articles...`);
    const embeddings = await embedArticles(articles);

    const articleMap = new Map(articles.map(a => [a.id, a]));
    const { updated, created } = await clusterArticles(embeddings, articleMap);

    // Generate titles for new clusters
    for (const cluster of created) {
      const clusterArticles = cluster.articleIds
        .map(id => articleMap.get(id))
        .filter((a): a is RawArticle => !!a);
      if (clusterArticles.length > 0) {
        cluster.title = await generateClusterTitle(clusterArticles);
      }
    }

    // Merge near-duplicate clusters
    const allClusters = [...updated, ...created];
    const centroids = new Map<string, number[]>();
    for (const cluster of allClusters) {
      if (cluster.centroid) centroids.set(cluster.id, cluster.centroid);
    }
    await mergeNearDuplicateClusters(allClusters, centroids);

    console.log(`Clustering complete: ${created.length} new, ${updated.length} updated`);
    return { newClusters: created.length, updatedClusters: updated.length };
  });

  res.status(result.success ? 200 : 500).json(result);
});

// ── Stage 3: Analyze ──
app.post('/analyze', async (_req, res) => {
  const result = await runStage('analyze', async () => {
    console.log('Starting analysis...');
    const clusters = await loadClustersNeedingAnalysis();

    if (clusters.length === 0) {
      return { message: 'No clusters need analysis' };
    }

    console.log(`Analyzing ${clusters.length} clusters...`);
    let analyzed = 0;

    for (const cluster of clusters) {
      try {
        const articles = await loadClusterArticles(cluster);
        const redditPosts = await loadClusterRedditPosts(cluster);

        // Step 1: Synthesis
        const synthesis = await generateSynthesis(cluster, articles);

        // Step 2: Claims + Coverage + Community (parallel)
        const [claims, _coverage, _community] = await Promise.all([
          extractClaims(cluster, articles),
          analyzeCoverage(cluster, articles),
          analyzeCommunity(cluster, redditPosts),
        ]);

        // Step 3: Deep Analysis (depends on synthesis + claims)
        await generateDeepAnalysis(cluster, synthesis, claims);

        cluster.lastAnalyzedAt = new Date().toISOString();
        analyzed++;
        console.log(`Analyzed cluster "${cluster.title}" (${analyzed}/${clusters.length})`);
      } catch (err) {
        console.error(`Failed to analyze cluster ${cluster.id}:`, err);
      }
    }

    return { clustersAnalyzed: analyzed };
  });

  res.status(result.success ? 200 : 500).json(result);
});

// ── Stage 4: Storylines ──
app.post('/storylines', async (_req, res) => {
  const result = await runStage('storylines', async () => {
    console.log('Detecting storylines...');
    const clusters = await loadActiveClusters();
    const storylines = await detectStorylines(clusters);
    const briefing = await generateBriefing(clusters);
    console.log(`Found ${storylines.length} storylines, briefing generated`);
    return { storylines: storylines.length, briefingDate: briefing.date };
  });

  res.status(result.success ? 200 : 500).json(result);
});

// ── Stage 5: Site Gen ──
app.post('/sitegen', async (_req, res) => {
  const result = await runStage('sitegen', async () => {
    await buildSiteData();
    return { message: 'Site data generated' };
  });

  res.status(result.success ? 200 : 500).json(result);
});

// ── Helpers ──
async function loadRecentArticles(): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];
  const now = new Date();

  for (let i = 0; i < config.pipeline.maxArticleAgeDays; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const datePath = date.toISOString().slice(0, 10);

    try {
      const files = await listFiles(config.storage.raw, `articles/${datePath}/`);
      for (const file of files.slice(0, 500)) { // Cap per day
        const article = await readJson<RawArticle>(config.storage.raw, file);
        if (article) articles.push(article);
      }
    } catch {
      // No articles for this date
    }
  }

  return articles;
}

async function loadActiveClusters(): Promise<Cluster[]> {
  const clusters: Cluster[] = [];
  const files = await listFiles(config.storage.processed, 'clusters/');
  const clusterFiles = files.filter(f => f.endsWith('/cluster.json'));

  for (const file of clusterFiles) {
    const cluster = await readJson<Cluster>(config.storage.processed, file);
    if (cluster && (cluster.status === 'active' || cluster.status === 'new')) {
      clusters.push(cluster);
    }
  }

  return clusters;
}

async function loadClustersNeedingAnalysis(): Promise<Cluster[]> {
  const clusters = await loadActiveClusters();
  return clusters.filter(c => {
    if (!c.lastAnalyzedAt) return true;
    // Re-analyze if updated since last analysis
    return new Date(c.updatedAt) > new Date(c.lastAnalyzedAt);
  });
}

async function loadClusterArticles(cluster: Cluster): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];
  for (const id of cluster.articleIds) {
    const now = new Date();
    for (let i = 0; i <= config.pipeline.maxArticleAgeDays; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const datePath = date.toISOString().slice(0, 10);
      const article = await readJson<RawArticle>(config.storage.raw, `articles/${datePath}/${id}.json`);
      if (article) {
        articles.push(article);
        break;
      }
    }
  }
  return articles;
}

async function loadClusterRedditPosts(cluster: Cluster): Promise<RedditPost[]> {
  const posts: RedditPost[] = [];
  for (const id of cluster.redditPostIds) {
    const now = new Date();
    for (let i = 0; i <= config.pipeline.maxArticleAgeDays; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const datePath = date.toISOString().slice(0, 10);
      const post = await readJson<RedditPost>(config.storage.raw, `reddit/${datePath}/${id}.json`);
      if (post) {
        posts.push(post);
        break;
      }
    }
  }
  return posts;
}

// ── Setup Page HTML ──
function setupPageHTML(authUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dornt — Setup</title>
<link rel="icon" href="/dornt-assets/favicon.ico" type="image/x-icon">
<style>
  @font-face {
    font-family: 'GeistSans';
    src: url('/dornt-assets/fonts/font1.woff');
    font-weight: 100 900;
    font-display: swap;
  }
  @font-face {
    font-family: 'GeistMono';
    src: url('/dornt-assets/fonts/font2.woff');
    font-weight: 100 900;
    font-display: swap;
  }

  :root {
    --teal: #0d9488;
    --teal-hover: #0f766e;
    --teal-light: #14b8a6;
    --teal-dim: rgba(13,148,136,0.10);
    --teal-border: rgba(13,148,136,0.20);
    --navy: #0f172a;
    --navy-mid: #1e293b;
    --bg: #f8fafc;
    --white: #ffffff;
    --border: #e2e8f0;
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
    --red: #ef4444;
    --red-bg: #fef2f2;
    --green: #22c55e;
    --green-bg: #f0fdf4;
    --green-border: #bbf7d0;
    --font: 'GeistSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'GeistMono', ui-monospace, monospace;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--font);
    background: var(--bg);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .setup-container {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 48px;
    max-width: 480px;
    width: 100%;
    margin: 24px;
  }

  .logo {
    font-size: 28px;
    font-weight: 700;
    color: var(--teal);
    margin-bottom: 8px;
  }

  .subtitle {
    color: var(--text-secondary);
    font-size: 14px;
    margin-bottom: 32px;
  }

  .status-banner {
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    margin-bottom: 24px;
    display: none;
  }
  .status-banner.success {
    display: block;
    background: var(--green-bg);
    border: 1px solid var(--green-border);
    color: #166534;
  }
  .status-banner.error {
    display: block;
    background: var(--red-bg);
    border: 1px solid #fecaca;
    color: #991b1b;
  }
  .status-banner.configured {
    display: block;
    background: var(--green-bg);
    border: 1px solid var(--green-border);
    color: #166534;
  }

  .section-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 12px;
  }

  .btn-oauth {
    display: block;
    width: 100%;
    padding: 12px 20px;
    background: var(--teal);
    color: white;
    border: none;
    border-radius: 8px;
    font-family: var(--font);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    text-decoration: none;
    transition: background 0.15s;
  }
  .btn-oauth:hover { background: var(--teal-hover); }

  .divider {
    display: flex;
    align-items: center;
    margin: 28px 0;
    color: var(--text-muted);
    font-size: 12px;
  }
  .divider::before, .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--border);
  }
  .divider span { padding: 0 12px; }

  .manual-form { display: flex; gap: 8px; }

  .manual-form input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-family: var(--font-mono);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
  }
  .manual-form input:focus { border-color: var(--teal); }

  .btn-save {
    padding: 10px 18px;
    background: var(--navy);
    color: white;
    border: none;
    border-radius: 8px;
    font-family: var(--font);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
  }
  .btn-save:hover { background: var(--navy-mid); }

  .btn-continue {
    display: none;
    width: 100%;
    padding: 12px 20px;
    margin-top: 16px;
    background: var(--teal);
    color: white;
    border: none;
    border-radius: 8px;
    font-family: var(--font);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    text-decoration: none;
    transition: background 0.15s;
  }
  .btn-continue:hover { background: var(--teal-hover); }

  .key-info {
    margin-top: 12px;
    font-size: 13px;
    color: var(--text-secondary);
    font-family: var(--font-mono);
  }

  .error-text {
    color: var(--red);
    font-size: 13px;
    margin-top: 8px;
    display: none;
  }
</style>
</head>
<body>
<div class="setup-container">
  <div class="logo">Dornt</div>
  <div class="subtitle">Connect your OpenRouter account to power the intelligence pipeline.</div>

  <div class="status-banner" id="status-banner"></div>

  <div id="setup-flow">
    <div class="section-label">Recommended</div>
    <a href="${authUrl}" class="btn-oauth" id="btn-oauth">Connect to OpenRouter</a>

    <div class="divider"><span>or paste your API key</span></div>

    <form class="manual-form" id="manual-form">
      <input type="text" id="api-key-input" placeholder="sk-or-v1-..." autocomplete="off" spellcheck="false">
      <button type="submit" class="btn-save">Save</button>
    </form>
    <div class="error-text" id="manual-error"></div>
  </div>

  <a href="/" class="btn-continue" id="btn-continue">Continue to Dashboard</a>
  <div class="key-info" id="key-info"></div>
</div>

<script>
  const params = new URLSearchParams(window.location.search);

  async function checkStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      const banner = document.getElementById('status-banner');
      const btnContinue = document.getElementById('btn-continue');
      const setupFlow = document.getElementById('setup-flow');
      const keyInfo = document.getElementById('key-info');

      if (data.configured && data.keyValid) {
        banner.className = 'status-banner configured';
        banner.textContent = 'API key is configured and valid.';
        btnContinue.style.display = 'block';
        keyInfo.textContent = 'Key: ' + data.keyPrefix + (data.label ? ' (' + data.label + ')' : '');
      } else if (data.configured && !data.keyValid) {
        banner.className = 'status-banner error';
        banner.textContent = 'API key is configured but could not be validated. You may want to re-enter it.';
      }
    } catch {}
  }

  if (params.get('success') === '1') {
    const banner = document.getElementById('status-banner');
    banner.className = 'status-banner success';
    banner.textContent = 'OpenRouter connected successfully! Your API key has been saved.';
    document.getElementById('btn-continue').style.display = 'block';
    document.getElementById('setup-flow').style.display = 'none';
  } else if (params.get('error')) {
    const banner = document.getElementById('status-banner');
    banner.className = 'status-banner error';
    banner.textContent = 'OAuth error: ' + params.get('error');
  } else {
    checkStatus();
  }

  document.getElementById('manual-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('api-key-input');
    const errorEl = document.getElementById('manual-error');
    errorEl.style.display = 'none';

    const key = input.value.trim();
    if (!key) { errorEl.textContent = 'Please enter an API key.'; errorEl.style.display = 'block'; return; }

    try {
      const res = await fetch('/api/set-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      });
      const data = await res.json();
      if (!res.ok) {
        errorEl.textContent = data.error || 'Failed to save key.';
        errorEl.style.display = 'block';
        return;
      }
      window.location.href = '/setup?success=1';
    } catch (err) {
      errorEl.textContent = 'Network error. Is the server running?';
      errorEl.style.display = 'block';
    }
  });
</script>
</body>
</html>`;
}

// Start server
app.listen(config.pipeline.port, () => {
  console.log(`Dornt pipeline running on port ${config.pipeline.port}`);
  if (!getApiKey()) {
    console.log(`No OpenRouter API key configured. Visit http://localhost:${config.pipeline.port}/setup to configure.`);
  }
});
