// ── Article & Ingestion ──

export interface RawArticle {
  id: string;
  url: string;
  normalizedUrl: string;
  title: string;
  source: string;
  feedUrl: string;
  publishedAt: string;
  fetchedAt: string;
  author?: string;
  contentHash: string;
  fullText: string;
  summary?: string;
  imageUrl?: string;
  categories?: string[];
}

export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  url: string;
  selftext: string;
  author: string;
  score: number;
  numComments: number;
  createdUtc: number;
  permalink: string;
  fetchedAt: string;
  topComments: RedditComment[];
}

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  createdUtc: number;
}

// ── Clustering ──

export interface ArticleEmbedding {
  articleId: string;
  embedding: number[];
  model: string;
  createdAt: string;
}

export interface Cluster {
  id: string;
  title: string;
  summary?: string;
  articleIds: string[];
  redditPostIds: string[];
  centroid?: number[];
  createdAt: string;
  updatedAt: string;
  lastAnalyzedAt?: string;
  articleCount: number;
  sourceCount: number;
  topSources: string[];
  importance: number; // 0-100 score
  status: 'new' | 'active' | 'stale' | 'archived';
}

// ── LLM Analysis ──

export interface Synthesis {
  clusterId: string;
  narrative: string; // markdown with citation markers [1], [2]...
  citations: Citation[];
  keyDevelopments: string[];
  generatedAt: string;
  model: string;
  tokenCount: number;
}

export interface Citation {
  index: number;
  articleId: string;
  source: string;
  title: string;
  url: string;
  quote?: string;
}

export interface Claim {
  id: string;
  clusterId: string;
  text: string;
  status: 'undisputed' | 'disputed' | 'evolving' | 'retracted';
  supportingSources: string[];
  disputingSources: string[];
  firstSeenAt: string;
  lastUpdatedAt: string;
}

export interface CoverageAnalysis {
  clusterId: string;
  frames: NarrativeFrame[];
  outlierPerspectives: string[];
  missingContext: string[];
  generatedAt: string;
  model: string;
}

export interface NarrativeFrame {
  name: string;
  description: string;
  sources: string[];
  emphasis: string;
}

export interface CommunityAnalysis {
  clusterId: string;
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';
  sentimentScore: number; // -1 to 1
  keyThemes: string[];
  notableQuotes: CommunityQuote[];
  discussionVolume: number;
  generatedAt: string;
  model: string;
}

export interface CommunityQuote {
  text: string;
  author: string;
  subreddit: string;
  score: number;
}

export interface DeepAnalysis {
  clusterId: string;
  stakeholders: Stakeholder[];
  predictions: Prediction[];
  historicalContext: string;
  implications: string[];
  generatedAt: string;
  model: string;
}

export interface Stakeholder {
  name: string;
  role: string;
  position: string;
  influence: 'high' | 'medium' | 'low';
}

export interface Prediction {
  text: string;
  likelihood: 'likely' | 'possible' | 'unlikely';
  timeframe: string;
  basis: string;
}

// ── Storylines ──

export interface Storyline {
  id: string;
  title: string;
  description: string;
  clusterIds: string[];
  arc: string; // narrative arc description
  startedAt: string;
  updatedAt: string;
  status: 'developing' | 'ongoing' | 'concluded';
}

// ── Briefing ──

export interface DailyBriefing {
  id: string;
  date: string;
  headline: string;
  topStories: BriefingStory[];
  emergingThemes: string[];
  notableShifts: string[];
  generatedAt: string;
  model: string;
}

export interface BriefingStory {
  clusterId: string;
  title: string;
  summary: string;
  importance: number;
}

// ── Pipeline State ──

export interface PipelineState {
  stage: PipelineStage;
  status: 'idle' | 'running' | 'completed' | 'failed';
  lastRunAt?: string;
  lastCompletedAt?: string;
  error?: string;
  lockedBy?: string;
  lockedAt?: string;
}

export type PipelineStage = 'ingest' | 'cluster' | 'analyze' | 'storylines' | 'sitegen';

// ── Site Gen / API Output ──

export interface StoryIndex {
  stories: StoryIndexEntry[];
  generatedAt: string;
  totalCount: number;
}

export interface StoryIndexEntry {
  id: string;
  title: string;
  summary: string;
  articleCount: number;
  sourceCount: number;
  topSources: string[];
  categories: string[];
  importance: number;
  updatedAt: string;
  imageUrl?: string;
}

export interface StoryDetail {
  cluster: Cluster;
  synthesis: Synthesis | null;
  claims: Claim[];
  coverage: CoverageAnalysis | null;
  community: CommunityAnalysis | null;
  deepAnalysis: DeepAnalysis | null;
  articles: ArticleSummary[];
  relatedStorylines: string[];
}

export interface ArticleSummary {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface TopStoriesResponse {
  top: StoryIndexEntry[];
  trending: StoryIndexEntry[];
  generatedAt: string;
}

export interface PlatformMeta {
  totalArticles: number;
  totalClusters: number;
  activeClusters: number;
  totalSources: number;
  lastIngestionAt: string;
  lastAnalysisAt: string;
  generatedAt: string;
}

// ── Config ──

export interface FeedConfig {
  url: string;
  name: string;
  category: string;
}

export interface SubredditConfig {
  name: string;
  category: string;
}
