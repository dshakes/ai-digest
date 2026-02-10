import { createNewsCard, createPaperCard, createReleaseCard, createResourceCard, createPodcasterGroup, createPopularEpisodeCard, timeAgo } from './cards.js';

const PAGE_SIZE = 10;

// Track load-more buttons by grid ID so we can clean them up
const loadMoreButtons = {};

function renderGrid(gridId, items, cardFactory) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';

  // Clean up previous load-more button for this grid
  if (loadMoreButtons[gridId]) {
    loadMoreButtons[gridId].remove();
    delete loadMoreButtons[gridId];
  }

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <span class="material-icons-outlined">cloud_off</span>
        <h3>No items found</h3>
        <p>Try refreshing or check your network connection.</p>
      </div>`;
    return;
  }

  // Show first batch only
  let shown = Math.min(PAGE_SIZE, items.length);
  const fragment = document.createDocumentFragment();
  items.slice(0, shown).forEach(item => fragment.appendChild(cardFactory(item)));
  grid.appendChild(fragment);

  // Add Load More button if there are more items
  if (items.length > shown) {
    const btn = document.createElement('button');
    btn.className = 'load-more-btn';
    btn.innerHTML = `<span class="material-icons-outlined">expand_more</span> Load More <span class="load-more-btn__count">(${items.length - shown} remaining)</span>`;

    // Insert button right after the grid element
    grid.after(btn);
    loadMoreButtons[gridId] = btn;

    btn.addEventListener('click', () => {
      const nextBatch = items.slice(shown, shown + PAGE_SIZE);
      const frag = document.createDocumentFragment();
      nextBatch.forEach(item => frag.appendChild(cardFactory(item)));
      grid.appendChild(frag);
      shown += nextBatch.length;

      if (shown >= items.length) {
        btn.remove();
        delete loadMoreButtons[gridId];
      } else {
        btn.querySelector('.load-more-btn__count').textContent = `(${items.length - shown} remaining)`;
      }
    });
  }
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

export function renderPodcastsTab(channels, videosByChannel, famousEpisodes) {
  // Render popular episodes (horizontal scroll, sorted by views)
  const popularContainer = document.getElementById('podcastsPopularRow');
  const popularCount = document.getElementById('popularEpisodesCount');
  if (popularContainer) {
    popularContainer.innerHTML = '';
    if (famousEpisodes.length === 0) {
      popularContainer.innerHTML = `
        <div class="empty-state">
          <span class="material-icons-outlined">cloud_off</span>
          <h3>No episodes match your filters</h3>
        </div>`;
    } else {
      const frag = document.createDocumentFragment();
      famousEpisodes.forEach(ep => frag.appendChild(createPopularEpisodeCard(ep)));
      popularContainer.appendChild(frag);
    }
    if (popularCount) popularCount.textContent = famousEpisodes.length ? `(${famousEpisodes.length})` : '';
  }

  // Render podcaster groups
  const groupsContainer = document.getElementById('podcastsChannelGroups');
  const podcastersCount = document.getElementById('podcastersCount');
  if (groupsContainer) {
    groupsContainer.innerHTML = '';
    if (channels.length === 0) {
      groupsContainer.innerHTML = `
        <div class="empty-state">
          <span class="material-icons-outlined">cloud_off</span>
          <h3>No podcasters match your filters</h3>
        </div>`;
    } else {
      const frag = document.createDocumentFragment();
      channels.forEach(ch => {
        const videos = videosByChannel[ch.channelId] || [];
        frag.appendChild(createPodcasterGroup(ch, videos));
      });
      groupsContainer.appendChild(frag);
    }
    if (podcastersCount) podcastersCount.textContent = channels.length ? `(${channels.length})` : '';
  }
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
  const byDate = (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  const normalize = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);

  // 1. Curated major releases (highest quality, always prioritized)
  const curated = releases
    .filter(r => r.source === 'major_releases')
    .sort(byDate);

  // 2. High-engagement HN stories as live dynamic supplements (100+ points)
  const liveReleases = releases
    .filter(r => r.source === 'hackernews' && (r.engagement?.score || 0) >= 100)
    .sort(byDate);

  // Merge: curated first, fill remaining slots with live HN stories
  const combined = [...curated];
  const seenTitles = curated.map(c => normalize(c.title));
  const NON_COMPANY_TAGS = new Set(['AI', 'inference', 'coding-tool', 'image-gen', 'search']);

  for (const item of liveReleases) {
    if (combined.length >= 5) break;
    const norm = normalize(item.title);
    if (seenTitles.some(t => t.includes(norm) || norm.includes(t))) continue;
    // Use company tag as author for logo display
    const companyTag = (item.tags || []).find(t => !NON_COMPANY_TAGS.has(t));
    if (companyTag) item.author = companyTag;
    if (!item.extra) item.extra = {};
    if ((item.tags || []).includes('inference')) item.extra.category = 'inference';
    else if ((item.tags || []).includes('coding-tool')) item.extra.category = 'tool';
    else item.extra.category = 'model';
    combined.push(item);
    seenTitles.push(norm);
  }

  renderHighlightCards('highlightsWeek', combined.slice(0, 5), 'No major releases found');
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

// Inline SVG logos for major AI companies (brand colors, from Simple Icons)
const COMPANY_LOGOS = {
  anthropic: '<svg viewBox="0 0 24 24"><path d="M17.304 3.541h-3.672l6.696 16.918H24Zm-10.608 0L0 20.459h3.744l1.37-3.553h7.005l1.37 3.553h3.744L10.536 3.541Zm-.371 10.223 2.291-5.946 2.292 5.946Z" fill="#D4714E"/></svg>',
  openai: '<svg viewBox="0 0 24 24"><path d="M22.28 9.82a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.52 2.9A5.98 5.98 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.2 5.99 5.99 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.07zM13.26 22.43a4.48 4.48 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.8.8 0 0 0 .39-.68v-6.74l2.02 1.17a.07.07 0 0 1 .04.05v5.58a4.5 4.5 0 0 1-4.49 4.5zM3.6 18.3a4.47 4.47 0 0 1-.54-3.01l.14.09 4.78 2.76a.77.77 0 0 0 .78 0l5.84-3.37v2.33a.08.08 0 0 1-.03.06l-4.84 2.79a4.5 4.5 0 0 1-6.14-1.65zM2.34 7.9a4.49 4.49 0 0 1 2.37-1.97V11.6a.77.77 0 0 0 .39.68l5.81 3.35-2.02 1.17a.08.08 0 0 1-.07 0l-4.83-2.79A4.5 4.5 0 0 1 2.34 7.87zm16.6 3.86l-5.83-3.39 2.02-1.16a.08.08 0 0 1 .07 0l4.83 2.79a4.49 4.49 0 0 1-.68 8.1v-5.68a.79.79 0 0 0-.4-.67zm2.01-3.02l-.14-.09-4.77-2.78a.78.78 0 0 0-.79 0L9.41 9.23V6.9a.07.07 0 0 1 .03-.06l4.83-2.79a4.5 4.5 0 0 1 6.68 4.66zM8.31 12.86l-2.02-1.16a.08.08 0 0 1-.04-.06V6.07a4.5 4.5 0 0 1 7.38-3.45l-.14.08L8.7 5.46a.8.8 0 0 0-.39.68zm1.1-2.37l2.6-1.5 2.6 1.5v3l-2.6 1.5-2.6-1.5z" fill="#412991"/></svg>',
  google: '<svg viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053z" fill="#4285F4"/></svg>',
  meta: '<svg viewBox="0 0 24 24"><path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973.085.384.18.712.265.86a5.3 5.3 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.74 3.74 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.9 44.9 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z" fill="#0081FB"/></svg>',
  microsoft: '<svg viewBox="0 0 24 24"><rect width="11.4" height="11.4" fill="#F25022"/><rect x="12.6" width="11.4" height="11.4" fill="#7FBA00"/><rect y="12.6" width="11.4" height="11.4" fill="#00A4EF"/><rect x="12.6" y="12.6" width="11.4" height="11.4" fill="#FFB900"/></svg>',
  github: '<svg viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="#181717"/></svg>',
  nvidia: '<svg viewBox="0 0 24 24"><path d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185V10.044c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6 6 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237h-.008c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z" fill="#76B900"/></svg>',
  xai: '<svg viewBox="0 0 439 482"><path d="M355.48 155.08L363.79 481.45H430.35L438.67 36.27ZM438.67 0H337.11L177.74 227.62L228.52 300.14ZM0 481.45H101.56L152.35 408.93L101.56 336.4ZM0 155.08L228.52 481.45H330.08L101.56 155.08Z" fill="#000"/></svg>',
};

function getCompanyInitials(author) {
  const name = (author || '').trim();
  if (!name) return '?';
  const parts = name.split(/[\s\/]+/).filter(Boolean);
  if (parts.length <= 1) return name.charAt(0).toUpperCase();
  return parts.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('');
}

function getCompanyLogo(author, color) {
  const key = (author || '').toLowerCase();
  for (const [name, svg] of Object.entries(COMPANY_LOGOS)) {
    if (key.includes(name)) {
      return `<span class="highlight-card__logo highlight-card__logo--svg">${svg}</span>`;
    }
  }
  // Fallback to colored initials for companies without SVG logos
  const initials = getCompanyInitials(author);
  const smClass = initials.length > 1 ? ' highlight-card__logo--sm' : '';
  return `<span class="highlight-card__logo${smClass}" style="background:${color}">${escapeHTML(initials)}</span>`;
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
      <span class="highlight-card__header">
        ${getCompanyLogo(item.author, color)}
        <span class="highlight-card__company" style="color:${color}">${escapeHTML(item.author || '')}</span>
      </span>
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
