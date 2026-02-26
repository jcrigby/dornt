#!/usr/bin/env npx tsx

/**
 * Seed feeds — Test RSS feed fetching with a small subset of feeds.
 * Usage: npx tsx scripts/seed-feeds.ts
 */

import Parser from 'rss-parser';

const testFeeds = [
  { url: 'https://feeds.bbci.co.uk/news/rss.xml', name: 'BBC News' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml', name: 'NYT' },
  { url: 'https://apnews.com/hub/ap-top-news.rss', name: 'AP News' },
  { url: 'http://rss.cnn.com/rss/cnn_topstories.rss', name: 'CNN' },
  { url: 'https://www.theguardian.com/world/rss', name: 'Guardian World' },
];

const parser = new Parser({
  timeout: 10_000,
  headers: { 'User-Agent': 'Dornt-Seed/0.1' },
});

async function main() {
  console.log('Testing RSS feeds...\n');

  for (const feed of testFeeds) {
    try {
      const result = await parser.parseURL(feed.url);
      const items = result.items?.slice(0, 3) || [];
      console.log(`${feed.name} — ${result.items?.length || 0} items`);
      for (const item of items) {
        console.log(`  - ${item.title}`);
        console.log(`    ${item.link}`);
      }
      console.log();
    } catch (err) {
      console.error(`${feed.name} — ERROR: ${err}`);
    }
  }
}

main().catch(console.error);
