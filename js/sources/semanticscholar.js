import { fetchJSON } from '../services/fetcher.js';
import { cache } from '../services/cache.js';
import { CONFIG } from '../config.js';

const CACHE_KEY = 'semantic_scholar';
const BASE = 'https://api.semanticscholar.org/graph/v1/paper/search';

export async function fetchItems() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  try {
    const fields = 'title,url,abstract,year,citationCount,authors,publicationDate,openAccessPdf';
    const url = `${BASE}?query=${encodeURIComponent(CONFIG.SEARCH_QUERIES.semantic_scholar)}&fields=${fields}&limit=${CONFIG.MAX_ITEMS_PER_SOURCE}&year=2024-2026`;

    let data;
    try {
      data = await fetchJSON(url);
    } catch {
      data = await fetchJSON(url, { useProxy: true });
    }

    const items = (data.data || []).map(paper => ({
      id: `ss-${paper.paperId}`,
      title: paper.title || '',
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
      description: (paper.abstract || '').slice(0, 300),
      source: 'semantic_scholar',
      sourceName: 'Semantic Scholar',
      author: (paper.authors || []).slice(0, 5).map(a => a.name).join(', ') +
        ((paper.authors || []).length > 5 ? ' et al.' : ''),
      publishedAt: paper.publicationDate || `${paper.year}-01-01`,
      engagement: { score: paper.citationCount || 0, comments: 0 },
      tags: ['ai', 'ml'],
      type: 'paper',
      extra: {
        pdfUrl: paper.openAccessPdf?.url,
        citations: paper.citationCount,
      },
    }));

    cache.set(CACHE_KEY, items, CONFIG.CACHE_TTL.papers);
    return items;
  } catch {
    console.warn('Semantic Scholar fetch failed, skipping');
    return [];
  }
}
