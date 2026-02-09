import { createNewsCard, createPaperCard, createReleaseCard, createResourceCard, timeAgo } from './cards.js';

function renderGrid(gridId, items, cardFactory) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <span class="material-icons-outlined">cloud_off</span>
        <h3>No items found</h3>
        <p>Try refreshing or check your network connection.</p>
      </div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach(item => fragment.appendChild(cardFactory(item)));
  grid.appendChild(fragment);
}

export function renderNews(items) {
  renderGrid('newsGrid', items, createNewsCard);
  const badge = document.getElementById('newsCount');
  if (badge) badge.textContent = items.length || '';
}

export function renderReleases(items) {
  renderGrid('releasesGrid', items, createReleaseCard);
  const badge = document.getElementById('releasesCount');
  if (badge) badge.textContent = items.length || '';
}

export function renderArchive(items) {
  renderGrid('archiveGrid', items, createNewsCard);
  const badge = document.getElementById('archiveCount');
  if (badge) badge.textContent = items.length || '';
}

export function renderPapers(items) {
  renderGrid('papersGrid', items, createPaperCard);
  const badge = document.getElementById('papersCount');
  if (badge) badge.textContent = items.length || '';
}

export function renderResources(categories) {
  const container = document.getElementById('resourcesContent');
  if (!container) return;
  container.innerHTML = '';

  const fragment = document.createDocumentFragment();
  categories.forEach(cat => {
    const section = document.createElement('div');
    section.className = 'category-section';
    section.innerHTML = `
      <h2 class="category-section__title">
        <span class="material-icons-outlined">${categoryIcon(cat.id)}</span>
        ${escapeHTML(cat.name)}
      </h2>`;
    const grid = document.createElement('div');
    grid.className = 'card-grid resources-grid';
    cat.resources.forEach(r => grid.appendChild(createResourceCard(r)));
    section.appendChild(grid);
    fragment.appendChild(section);
  });
  container.appendChild(fragment);
}

export function renderHighlights(releases) {
  // Only curated major releases (not HN stories)
  const major = releases.filter(r => r.source === 'major_releases');

  // Sort by date descending, take top 5 most recent
  const recent = major
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 5);

  renderHighlightCards('highlightsWeek', recent, 'No major releases found');
}

const COMPANY_COLORS = {
  anthropic: '#7B1FA2',
  openai: '#2E7D32',
  google: '#1A73E8',
  meta: '#1565C0',
  microsoft: '#0078D4',
  'github / microsoft': '#0078D4',
  deepseek: '#4A6CF7',
  'xai': '#1DA1F2',
  nvidia: '#76B900',
  vllm: '#E65100',
  sglang: '#E65100',
};

function getCompanyColor(author) {
  const key = (author || '').toLowerCase();
  for (const [name, color] of Object.entries(COMPANY_COLORS)) {
    if (key.includes(name)) return color;
  }
  return '#5F6368';
}

function renderHighlightCards(containerId, items, emptyMsg) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = `<div class="highlights__empty">${emptyMsg}</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    const category = item.extra?.category || 'model';
    const color = getCompanyColor(item.author);
    const a = document.createElement('a');
    a.className = `highlight-card highlight-card--${category}`;
    a.style.borderLeftColor = color;
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = `
      <span class="highlight-card__company" style="color:${color}">${escapeHTML(item.author || '')}</span>
      <span class="highlight-card__title">${escapeHTML(item.title)}</span>
      <span class="highlight-card__category highlight-card__category--${category}">${category}</span>
      <span class="highlight-card__meta">
        <span class="material-icons-outlined">schedule</span>
        ${timeAgo(item.publishedAt)}
      </span>
    `;
    fragment.appendChild(a);
  });
  container.appendChild(fragment);
}

export function buildSourceFilters(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const sources = [...new Set(items.map(i => i.source))];
  container.innerHTML = `<span class="source-filters__label">Sources:</span>`;

  const allChip = document.createElement('button');
  allChip.className = 'filter-chip active';
  allChip.textContent = 'All';
  allChip.dataset.source = 'all';
  container.appendChild(allChip);

  sources.forEach(s => {
    const chip = document.createElement('button');
    chip.className = 'filter-chip';
    chip.textContent = sourceLabel(s);
    chip.dataset.source = s;
    container.appendChild(chip);
  });
}

function categoryIcon(id) {
  const map = {
    courses: 'play_circle', tutorials: 'code', books: 'menu_book',
    tools: 'build', communities: 'groups', newsletters: 'mail',
  };
  return map[id] || 'folder';
}

function sourceLabel(source) {
  const map = {
    hackernews: 'Hacker News', devto: 'Dev.to', reddit: 'Reddit',
    rss: 'Blogs', arxiv: 'ArXiv', semantic_scholar: 'Semantic Scholar',
    huggingface: 'HuggingFace',
    major_releases: 'Major Release',
    rss_vllm_blog: 'vLLM',
    rss_anyscale_blog: 'Anyscale',
    rss_meta_ai: 'Meta AI',
    rss_microsoft_ai: 'Microsoft AI',
    rss_hugging_face_blog: 'HuggingFace',
    rss_lilian_weng: 'Lilian Weng',
  };
  return map[source] || source;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
