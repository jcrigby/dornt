import type { FeedConfig, SubredditConfig } from '../types/index.js';

export const feeds: FeedConfig[] = [
  // ── Major Wire Services ──
  { url: 'https://rss.upi.com/news/news.rss', name: 'UPI', category: 'wire' },
  { url: 'https://www.reutersagency.com/feed/', name: 'Reuters', category: 'wire' },

  // ── US Broadsheets ──
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', name: 'NYT', category: 'broadsheet' },
  { url: 'https://feeds.washingtonpost.com/rss/world', name: 'WaPo World', category: 'broadsheet' },
  { url: 'https://feeds.washingtonpost.com/rss/politics', name: 'WaPo Politics', category: 'broadsheet' },
  { url: 'https://www.wsj.com/xml/rss/3_7085.xml', name: 'WSJ World', category: 'broadsheet' },
  { url: 'https://feeds.latimes.com/latimes/news', name: 'LA Times', category: 'broadsheet' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml', name: 'NYT Politics', category: 'broadsheet' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NYT World', category: 'broadsheet' },

  // ── UK / International ──
  { url: 'https://feeds.bbci.co.uk/news/rss.xml', name: 'BBC News', category: 'international' },
  { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC World', category: 'international' },
  { url: 'https://www.theguardian.com/world/rss', name: 'The Guardian World', category: 'international' },
  { url: 'https://www.theguardian.com/us-news/rss', name: 'The Guardian US', category: 'international' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', category: 'international' },
  { url: 'https://www.ft.com/?format=rss', name: 'Financial Times', category: 'international' },
  { url: 'https://www.telegraph.co.uk/rss.xml', name: 'The Telegraph', category: 'international' },

  // ── US Cable / Broadcast ──
  { url: 'https://feeds.foxnews.com/foxnews/latest', name: 'Fox News', category: 'cable' },
  { url: 'https://feeds.foxnews.com/foxnews/politics', name: 'Fox Politics', category: 'cable' },
  { url: 'https://feeds.nbcnews.com/nbcnews/public/news', name: 'NBC News', category: 'cable' },
  { url: 'https://feeds.cbsnews.com/CBSNewsMain', name: 'CBS News', category: 'cable' },
  { url: 'https://abcnews.go.com/abcnews/topstories', name: 'ABC News', category: 'cable' },
  { url: 'http://rss.cnn.com/rss/cnn_topstories.rss', name: 'CNN', category: 'cable' },
  { url: 'http://rss.cnn.com/rss/cnn_world.rss', name: 'CNN World', category: 'cable' },

  // ── Digital / Opinion ──
  { url: 'https://www.vox.com/rss/index.xml', name: 'Vox', category: 'digital' },
  { url: 'https://thehill.com/feed/', name: 'The Hill', category: 'digital' },
  { url: 'https://www.politico.com/rss/politicopicks.xml', name: 'Politico', category: 'digital' },
  { url: 'https://www.axios.com/feeds/feed.rss', name: 'Axios', category: 'digital' },
  { url: 'https://www.huffpost.com/section/front-page/feed', name: 'HuffPost', category: 'digital' },
  { url: 'https://www.breitbart.com/feed/', name: 'Breitbart', category: 'digital' },
  { url: 'https://www.dailywire.com/feeds/rss.xml', name: 'Daily Wire', category: 'digital' },

  // ── Tech ──
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica', category: 'tech' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', category: 'tech' },
  { url: 'https://www.wired.com/feed/rss', name: 'Wired', category: 'tech' },
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', category: 'tech' },

  // ── Business / Finance ──
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', name: 'CNBC', category: 'finance' },
  { url: 'https://www.bloomberg.com/feed/podcast/etf-iq.xml', name: 'Bloomberg', category: 'finance' },
  { url: 'https://www.marketwatch.com/rss/topstories', name: 'MarketWatch', category: 'finance' },

  // ── Science / Health ──
  { url: 'https://www.sciencedaily.com/rss/all.xml', name: 'ScienceDaily', category: 'science' },
  { url: 'https://www.nature.com/nature.rss', name: 'Nature', category: 'science' },
  { url: 'https://www.statnews.com/feed/', name: 'STAT News', category: 'health' },

  // ── Analysis / Long-form ──
  { url: 'https://www.economist.com/rss', name: 'The Economist', category: 'analysis' },
  { url: 'https://foreignpolicy.com/feed/', name: 'Foreign Policy', category: 'analysis' },
  { url: 'https://www.theatlantic.com/feed/all/', name: 'The Atlantic', category: 'analysis' },
];

export const subreddits: SubredditConfig[] = [
  { name: 'worldnews', category: 'world' },
  { name: 'news', category: 'general' },
  { name: 'politics', category: 'politics' },
  { name: 'geopolitics', category: 'geopolitics' },
  { name: 'technology', category: 'tech' },
  { name: 'science', category: 'science' },
  { name: 'economics', category: 'economics' },
  { name: 'business', category: 'business' },
  { name: 'energy', category: 'energy' },
  { name: 'environment', category: 'environment' },
  { name: 'UpliftingNews', category: 'general' },
  { name: 'neutralnews', category: 'general' },
  { name: 'anime_titties', category: 'world' }, // actual world news subreddit
  { name: 'Futurology', category: 'tech' },
  { name: 'collapse', category: 'analysis' },
  { name: 'TrueReddit', category: 'analysis' },
];
