import type { FeedConfig, SubredditConfig, YouTubeChannelConfig } from '../types/index.js';

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

  // ── Sports ──
  { url: 'https://www.espn.com/espn/rss/news', name: 'ESPN', category: 'sports' },
  { url: 'https://feeds.bbci.co.uk/sport/rss.xml', name: 'BBC Sport', category: 'sports' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml', name: 'NYT Sports', category: 'sports' },
  { url: 'https://sports.yahoo.com/rss/', name: 'Yahoo Sports', category: 'sports' },

  // ── Entertainment ──
  { url: 'https://variety.com/feed/', name: 'Variety', category: 'entertainment' },
  { url: 'https://www.hollywoodreporter.com/feed/', name: 'Hollywood Reporter', category: 'entertainment' },
  { url: 'https://www.rollingstone.com/feed/', name: 'Rolling Stone', category: 'entertainment' },

  // ── Law ──
  { url: 'https://www.scotusblog.com/feed/', name: 'SCOTUSblog', category: 'law' },

  // ── Environment ──
  { url: 'https://insideclimatenews.org/feed/', name: 'Inside Climate News', category: 'environment' },
  { url: 'https://www.carbonbrief.org/feed/', name: 'Carbon Brief', category: 'environment' },
  { url: 'https://grist.org/feed/', name: 'Grist', category: 'environment' },

  // ── Science / Health (expanded) ──
  { url: 'https://www.newscientist.com/feed/home/', name: 'New Scientist', category: 'science' },
  { url: 'https://www.science.org/rss/news_current.xml', name: 'Science AAAS', category: 'science' },

  // ── Finance (expanded) ──
  { url: 'https://www.businessinsider.com/rss', name: 'Business Insider', category: 'finance' },
  { url: 'https://finance.yahoo.com/rss/', name: 'Yahoo Finance', category: 'finance' },

  // ── Tech (expanded) ──
  { url: 'https://www.theregister.com/headlines.atom', name: 'The Register', category: 'tech' },
  { url: 'https://www.engadget.com/rss.xml', name: 'Engadget', category: 'tech' },
  { url: 'https://www.technologyreview.com/feed/', name: 'MIT Tech Review', category: 'tech' },
  { url: 'https://404media.co/rss/', name: '404 Media', category: 'tech' },

  // ── International (expanded) ──
  { url: 'https://www.france24.com/en/rss', name: 'France 24', category: 'international' },
  { url: 'https://rss.dw.com/rdf/rss-en-all', name: 'DW', category: 'international' },
  { url: 'https://www.scmp.com/rss/91/feed', name: 'SCMP', category: 'international' },
  { url: 'https://www.thehindu.com/news/feeder/default.rss', name: 'The Hindu', category: 'international' },
  { url: 'https://www.abc.net.au/news/feed/51120/rss.xml', name: 'ABC Australia', category: 'international' },

  // ── AI Company Blogs ──
  { url: 'https://openai.com/blog/rss.xml', name: 'OpenAI Blog', category: 'ai' },
  { url: 'https://blog.google/technology/ai/rss/', name: 'Google AI Blog', category: 'ai' },
  { url: 'https://deepmind.google/blog/feed/basic/', name: 'DeepMind Blog', category: 'ai' },
  { url: 'https://www.microsoft.com/en-us/research/feed/', name: 'MS Research', category: 'ai' },
  { url: 'https://blogs.nvidia.com/feed/', name: 'NVIDIA Blog', category: 'ai' },
  { url: 'https://huggingface.co/blog/feed.xml', name: 'Hugging Face Blog', category: 'ai' },
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
  { name: 'sports', category: 'sports' },
  { name: 'entertainment', category: 'entertainment' },
  { name: 'law', category: 'law' },
  { name: 'climate', category: 'environment' },
  { name: 'space', category: 'science' },
  { name: 'europe', category: 'international' },
  { name: 'asia', category: 'international' },
  { name: 'LatinAmerica', category: 'international' },
];

export const youtubeChannels: YouTubeChannelConfig[] = [
  // ── News & Analysis ──
  { channelId: 'UCupvZG-5ko_eiXAupbDfxWw', name: 'CNN', category: 'news' },
  { channelId: 'UCeY0bbntWzzVIaj2z3QigXg', name: 'NBC News', category: 'news' },
  { channelId: 'UCBi2mrWuNuyYy4gbM6fU18Q', name: 'ABC News', category: 'news' },
  { channelId: 'UC8p1vwvWtl6T73JiExfWs1g', name: 'CNBC', category: 'finance' },
  { channelId: 'UCIRYBXDze5krPDzAEOxFGVA', name: 'Johnny Harris', category: 'analysis' },

  // ── Tech & AI ──
  { channelId: 'UCsBjURrPoezykLs9EqgamOA', name: 'Fireship', category: 'tech' },
  { channelId: 'UCbfYPyITQ-7l4upoX8nvctg', name: 'Two Minute Papers', category: 'ai' },
  { channelId: 'UCZHmQk67mSJgfCCTn7xBfew', name: 'MKBHD', category: 'tech' },

  // ── Science & Environment ──
  { channelId: 'UCsXVk37bltHxD1rDPwtNM8Q', name: 'Kurzgesagt', category: 'science' },
  { channelId: 'UC6nSFpj9HTCZ5t-N3Rm3-HA', name: 'Vsauce', category: 'science' },
  { channelId: 'UCsooa4yRKGN_zEE8iknghZA', name: 'TED-Ed', category: 'science' },

  // ── Geopolitics & International ──
  { channelId: 'UCwnKziETDbHJtx78nIkfYug', name: 'Caspian Report', category: 'geopolitics' },
  { channelId: 'UCLMnUt94VhMpLg1PvIS8JOQ', name: 'Nate B Jones', category: 'geopolitics' },
  { channelId: 'UCHd62-u_v4DvJ8TCFtpi4GA', name: 'VisualPolitik EN', category: 'geopolitics' },
];
