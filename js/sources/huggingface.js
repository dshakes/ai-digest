import { fetchJSON } from '../services/fetcher.js';
import { cache } from '../services/cache.js';
import { CONFIG } from '../config.js';

const CACHE_KEY = 'huggingface';

export async function fetchItems() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  try {
    let data;
    try {
      data = await fetchJSON('https://huggingface.co/api/daily_papers?limit=30');
    } catch {
      data = await fetchJSON('https://huggingface.co/api/daily_papers?limit=30', { useProxy: true });
    }

    const items = (Array.isArray(data) ? data : []).map(entry => {
      const paper = entry.paper || entry;
      return {
        id: `hf-${paper.id || paper._id}`,
        title: paper.title || '',
        url: `https://huggingface.co/papers/${paper.id || paper._id}`,
        description: (paper.summary || '').slice(0, 300),
        source: 'huggingface',
        sourceName: 'HuggingFace',
        author: (paper.authors || []).slice(0, 5).map(a => a.name || a.user?.fullname || '').filter(Boolean).join(', '),
        publishedAt: paper.publishedAt || entry.publishedAt || new Date().toISOString(),
        engagement: {
          score: entry.paper?.upvotes ?? entry.upvotes ?? 0,
          comments: entry.numComments || 0,
        },
        tags: paper.ai_keywords || ['ai'],
        type: 'paper',
      };
    });

    cache.set(CACHE_KEY, items, CONFIG.CACHE_TTL.papers);
    return items;
  } catch {
    console.warn('HuggingFace fetch failed, skipping');
    return [];
  }
}
