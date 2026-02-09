import { fetchJSON } from '../services/fetcher.js';
import { cache } from '../services/cache.js';
import { CONFIG } from '../config.js';

const CACHE_KEY = 'hackernews';
const BASE = 'https://hn.algolia.com/api/v1/search';

export async function fetchItems() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  try {
    const weekAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    const url = `${BASE}?query=${encodeURIComponent(CONFIG.SEARCH_QUERIES.hn)}&tags=story&numericFilters=created_at_i>${weekAgo}&hitsPerPage=${CONFIG.MAX_ITEMS_PER_SOURCE}`;

    const data = await fetchJSON(url);
    const items = (data.hits || []).map(hit => ({
      id: `hn-${hit.objectID}`,
      title: hit.title || '',
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      description: hit.story_text ? hit.story_text.slice(0, 200) : '',
      source: 'hackernews',
      sourceName: 'Hacker News',
      author: hit.author || '',
      publishedAt: hit.created_at,
      engagement: { score: hit.points || 0, comments: hit.num_comments || 0 },
      tags: ['ai'],
      type: 'news',
    }));

    cache.set(CACHE_KEY, items, CONFIG.CACHE_TTL.news);
    return items;
  } catch {
    console.warn('Hacker News fetch failed, skipping');
    return [];
  }
}
