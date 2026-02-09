import { fetchXML } from '../services/fetcher.js';
import { cache } from '../services/cache.js';
import { CONFIG } from '../config.js';

const CACHE_KEY = 'arxiv';
const BASE = 'https://export.arxiv.org/api/query';

export async function fetchItems() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  try {
    const url = `${BASE}?search_query=${CONFIG.SEARCH_QUERIES.arxiv_categories}&start=0&max_results=${CONFIG.MAX_ITEMS_PER_SOURCE}&sortBy=submittedDate&sortOrder=descending`;

    const doc = await fetchXML(url, { useProxy: true });
    const entries = doc.querySelectorAll('entry');
    if (entries.length === 0) return [];

    const items = Array.from(entries).map(entry => {
      const idUrl = entry.querySelector('id')?.textContent || '';
      const arxivId = idUrl.split('/abs/').pop() || idUrl;
      const authors = Array.from(entry.querySelectorAll('author name'))
        .map(n => n.textContent)
        .slice(0, 5);

      return {
        id: `arxiv-${arxivId}`,
        title: (entry.querySelector('title')?.textContent || '').replace(/\s+/g, ' ').trim(),
        url: idUrl,
        description: (entry.querySelector('summary')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 300),
        source: 'arxiv',
        sourceName: 'ArXiv',
        author: authors.join(', ') + (entry.querySelectorAll('author').length > 5 ? ' et al.' : ''),
        publishedAt: entry.querySelector('published')?.textContent || '',
        engagement: { score: 0, comments: 0 },
        tags: Array.from(entry.querySelectorAll('category'))
          .map(c => c.getAttribute('term'))
          .filter(Boolean),
        type: 'paper',
      };
    });

    cache.set(CACHE_KEY, items, CONFIG.CACHE_TTL.papers);
    return items;
  } catch {
    console.warn('ArXiv fetch failed, skipping');
    return [];
  }
}
