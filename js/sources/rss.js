import { fetchXML } from '../services/fetcher.js';
import { cache } from '../services/cache.js';
import { CONFIG } from '../config.js';

const CACHE_KEY = 'rss';

function parseRSSItems(doc, feedName) {
  // Try RSS 2.0 <item> elements
  let entries = doc.querySelectorAll('item');
  if (entries.length > 0) {
    return Array.from(entries).map(item => ({
      title: item.querySelector('title')?.textContent?.trim() || '',
      url: item.querySelector('link')?.textContent?.trim() || '',
      description: stripHTML(item.querySelector('description')?.textContent || '').slice(0, 200),
      author: item.querySelector('dc\\:creator, creator, author')?.textContent?.trim() || feedName,
      publishedAt: item.querySelector('pubDate')?.textContent || new Date().toISOString(),
    }));
  }

  // Try Atom <entry> elements
  entries = doc.querySelectorAll('entry');
  return Array.from(entries).map(entry => ({
    title: entry.querySelector('title')?.textContent?.trim() || '',
    url: entry.querySelector('link')?.getAttribute('href') || entry.querySelector('link')?.textContent?.trim() || '',
    description: stripHTML(entry.querySelector('summary, content')?.textContent || '').slice(0, 200),
    author: entry.querySelector('author name')?.textContent?.trim() || feedName,
    publishedAt: entry.querySelector('published, updated')?.textContent || new Date().toISOString(),
  }));
}

function stripHTML(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}

function feedSourceId(feedName) {
  return 'rss_' + feedName.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export async function fetchItems() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  try {
    const results = await Promise.allSettled(
      CONFIG.RSS_FEEDS.map(async (feed) => {
        const doc = await fetchXML(feed.url, { useProxy: true });
        const sourceId = feedSourceId(feed.name);
        return parseRSSItems(doc, feed.name).map(item => ({
          id: `rss-${Array.from(item.url.slice(0, 30), c => c.charCodeAt(0).toString(36)).join('').slice(0, 20)}`,
          ...item,
          source: sourceId,
          sourceName: feed.name,
          engagement: { score: 0, comments: 0 },
          tags: ['ai', feed.name],
          type: 'news',
        }));
      })
    );

    const items = [];
    for (const r of results) {
      if (r.status === 'fulfilled') items.push(...r.value);
    }

    cache.set(CACHE_KEY, items, CONFIG.CACHE_TTL.news);
    return items;
  } catch {
    console.warn('RSS fetch failed, skipping');
    return [];
  }
}
