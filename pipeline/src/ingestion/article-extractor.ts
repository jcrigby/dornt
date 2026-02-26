import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

interface ExtractedArticle {
  title: string;
  textContent: string;
  excerpt: string;
  byline: string | null;
  length: number;
}

const FETCH_TIMEOUT = 8_000;

export async function extractArticle(url: string): Promise<ExtractedArticle | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Dornt/0.1; +https://dornt.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) return null;

    return {
      title: article.title,
      textContent: cleanText(article.textContent),
      excerpt: article.excerpt || '',
      byline: article.byline,
      length: article.length,
    };
  } catch {
    return null;
  }
}

function cleanText(text: string): string {
  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, 50_000); // Cap at 50k chars
}
