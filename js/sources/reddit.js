import { fetchXML } from '../services/fetcher.js';
import { cache } from '../services/cache.js';
import { CONFIG } from '../config.js';

const CACHE_KEY = 'reddit';

function stripHTML(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || '';
}

export async function fetchItems() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  try {
    const subs = CONFIG.SEARCH_QUERIES.reddit_subreddits;
    const url = `https://www.reddit.com/r/${subs}/.rss?limit=${CONFIG.MAX_ITEMS_PER_SOURCE}`;

    const doc = await fetchXML(url, { useProxy: true });

    const entries = doc.querySelectorAll('entry');
    const items = Array.from(entries)
      .map(entry => {
        const title = entry.querySelector('title')?.textContent?.trim() || '';
        const link = entry.querySelector('link')?.getAttribute('href') || '';
        const author = entry.querySelector('author name')?.textContent?.trim().replace(/^\/u\//, '') || '';
        const updated = entry.querySelector('updated')?.textContent || new Date().toISOString();
        const content = entry.querySelector('content')?.textContent || '';
        const category = entry.querySelector('category')?.getAttribute('term') || '';

        // Skip stickied/automated posts
        if (title.startsWith('[D] Self-Promotion') || title.startsWith('[D] Monthly')) return null;

        return {
          id: `reddit-${Array.from(link.slice(-20), c => c.charCodeAt(0).toString(36)).join('')}`,
          title,
          url: link,
          description: stripHTML(content).slice(0, 200),
          source: 'reddit',
          sourceName: category ? `r/${category}` : 'Reddit',
          author,
          publishedAt: updated,
          engagement: { score: 0, comments: 0 },
          tags: category ? [category] : ['reddit'],
          type: 'news',
        };
      })
      .filter(Boolean);

    cache.set(CACHE_KEY, items, CONFIG.CACHE_TTL.news);
    return items;
  } catch {
    console.warn('Reddit fetch failed, skipping');
    return [];
  }
}
