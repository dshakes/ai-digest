import { fetchJSON } from '../services/fetcher.js';

export async function fetchItems() {
  try {
    const data = await fetchJSON(`data/major-releases.json?v=${Date.now()}`);
    const releases = data.releases || [];

    return releases.map(r => ({
      id: `major-${Array.from(r.title.slice(0, 20), c => c.charCodeAt(0).toString(36)).join('')}`,
      title: r.title,
      url: r.url,
      description: r.description,
      source: 'major_releases',
      sourceName: r.company,
      author: r.company,
      publishedAt: r.date + 'T12:00:00',
      engagement: { score: r.significance, comments: 0 },
      tags: [r.category, r.company].filter(Boolean),
      type: 'release',
      extra: {
        category: r.category,
        significance: r.significance,
      },
    }));
  } catch {
    console.warn('Major releases fetch failed, skipping');
    return [];
  }
}
