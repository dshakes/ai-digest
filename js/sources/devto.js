import { fetchJSON } from '../services/fetcher.js';
import { cache } from '../services/cache.js';
import { CONFIG } from '../config.js';

const CACHE_KEY = 'devto';

export async function fetchItems() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  try {
    const tags = CONFIG.SEARCH_QUERIES.devto_tags;
    const perTag = Math.ceil(CONFIG.MAX_ITEMS_PER_SOURCE / tags.length);

    const results = await Promise.allSettled(
      tags.map(tag =>
        fetchJSON(`https://dev.to/api/articles?tag=${tag}&top=7&per_page=${perTag}`)
      )
    );

    const items = [];
    for (const r of results) {
      if (r.status !== 'fulfilled' || !Array.isArray(r.value)) continue;
      for (const a of r.value) {
        items.push({
          id: `devto-${a.id}`,
          title: a.title || '',
          url: a.url || '',
          description: a.description || '',
          source: 'devto',
          sourceName: 'Dev.to',
          author: a.user?.name || a.user?.username || '',
          publishedAt: a.published_timestamp || a.published_at,
          engagement: {
            score: a.positive_reactions_count || 0,
            comments: a.comments_count || 0,
          },
          tags: a.tag_list || [],
          type: 'news',
        });
      }
    }

    // Deduplicate by id
    const unique = [...new Map(items.map(i => [i.id, i])).values()];
    cache.set(CACHE_KEY, unique, CONFIG.CACHE_TTL.news);
    return unique;
  } catch {
    console.warn('Dev.to fetch failed, skipping');
    return [];
  }
}
