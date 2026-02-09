// Learning Path — collapsible stages, mobile scroll indicators, trending fetch

const HN_BASE = 'https://hn.algolia.com/api/v1/search';
const DEVTO_BASE = 'https://dev.to/api/articles';
const TRENDING_CACHE = {};
const TRENDING_TTL = 30 * 60 * 1000; // 30 min

export function initLearningPath() {
  initCollapsibleStages();
  initExpandCollapseAll();
  initMobileScrollIndicator();
  initTrendingToggles();
}

// ─── Expand / Collapse All toggle ───
function initExpandCollapseAll() {
  const btn = document.getElementById('expandAllStages');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const stages = document.querySelectorAll('.learning-path__track-stage');
    const allExpanded = [...stages].every(s => s.classList.contains('is-expanded'));
    stages.forEach(s => s.classList.toggle('is-expanded', !allExpanded));
    btn.innerHTML = allExpanded
      ? '<span class="material-icons-outlined">unfold_more</span> Expand All'
      : '<span class="material-icons-outlined">unfold_less</span> Collapse All';
  });
}

// ─── Collapsible stages — click header/title to expand/collapse ───
function initCollapsibleStages() {
  document.querySelectorAll('.learning-path__track-stage').forEach(stage => {
    stage.addEventListener('click', e => {
      if (e.target.closest('a') || e.target.closest('.learning-path__resources') ||
          e.target.closest('.learning-path__trending')) return;
      stage.classList.toggle('is-expanded');
    });
  });
}

// ─── Mobile scroll indicator — update active dot on swipe ───
function initMobileScrollIndicator() {
  const tracks = document.querySelector('.learning-path__tracks');
  const dots = document.querySelectorAll('.learning-path__scroll-dot');
  if (tracks && dots.length) {
    tracks.addEventListener('scroll', () => {
      const cardWidth = tracks.scrollWidth / 3;
      const idx = Math.min(2, Math.round(tracks.scrollLeft / cardWidth));
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }, { passive: true });
  }
}

// ─── Trending toggle — click to expand & fetch trending resources ───
function initTrendingToggles() {
  document.querySelectorAll('.learning-path__trending-toggle').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const trending = btn.closest('.learning-path__trending');
      const isOpen = trending.classList.toggle('is-trending-open');
      if (isOpen) {
        const topic = trending.closest('.learning-path__track-stage')?.dataset.topic;
        if (topic) fetchTrending(trending, topic);
      }
    });
  });
}

// ─── Fetch trending links from HN Algolia + Dev.to ───
async function fetchTrending(container, topic) {
  const linksEl = container.querySelector('.learning-path__trending-links');
  if (!linksEl || linksEl.dataset.loaded) return;

  // Check cache
  const cached = TRENDING_CACHE[topic];
  if (cached && Date.now() - cached.ts < TRENDING_TTL) {
    renderTrendingLinks(linksEl, cached.items);
    return;
  }

  linksEl.innerHTML = '<div class="learning-path__trending-loader">Loading trending resources…</div>';

  const keywords = topic.split(/\s+/).join('+');

  try {
    const [hnItems, devtoItems] = await Promise.allSettled([
      fetchHN(keywords),
      fetchDevto(keywords),
    ]);

    const hn = hnItems.status === 'fulfilled' ? hnItems.value : [];
    const devto = devtoItems.status === 'fulfilled' ? devtoItems.value : [];

    // Merge, score, dedupe, and pick top 3
    const merged = [...hn, ...devto]
      .map(item => ({ ...item, score: scoreItem(item) }))
      .sort((a, b) => b.score - a.score);

    // Dedupe by domain
    const seen = new Set();
    const unique = [];
    for (const item of merged) {
      try {
        const domain = new URL(item.url).hostname;
        if (!seen.has(domain)) {
          seen.add(domain);
          unique.push(item);
        }
      } catch { unique.push(item); }
      if (unique.length >= 3) break;
    }

    TRENDING_CACHE[topic] = { items: unique, ts: Date.now() };
    renderTrendingLinks(linksEl, unique);
  } catch {
    linksEl.innerHTML = `<span style="font-size:11px;color:var(--md-grey-400)">Could not load trending <button class="learning-path__trending-retry" style="background:none;border:none;color:var(--md-primary-600);font-size:11px;cursor:pointer;text-decoration:underline;padding:0;margin-left:4px;">Retry</button></span>`;
    linksEl.querySelector('.learning-path__trending-retry')?.addEventListener('click', e => {
      e.stopPropagation();
      linksEl.dataset.loaded = '';
      fetchTrending(container, topic);
    });
  }
}

function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function fetchHN(query) {
  const weekAgo = Math.floor((Date.now() - 14 * 24 * 60 * 60 * 1000) / 1000);
  const url = `${HN_BASE}?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${weekAgo}&hitsPerPage=10`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.hits || [])
    .filter(h => h.url && h.title)
    .map(h => ({
      title: h.title,
      url: h.url,
      points: h.points || 0,
      comments: h.num_comments || 0,
      source: 'HN',
      age: Date.now() - new Date(h.created_at).getTime(),
    }));
}

async function fetchDevto(query) {
  // Use full topic with spaces for better Dev.to search results
  const searchTerm = query.replace(/\+/g, ' ').split(/\s+/)[0];
  const url = `${DEVTO_BASE}?tag=${encodeURIComponent(searchTerm)}&per_page=5&top=7`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data || [])
    .filter(a => a.url && a.title)
    .map(a => ({
      title: a.title,
      url: a.url,
      points: a.positive_reactions_count || 0,
      comments: a.comments_count || 0,
      source: 'Dev.to',
      age: Date.now() - new Date(a.published_at).getTime(),
    }));
}

function scoreItem(item) {
  // Engagement (0-50): normalized log scale
  const engagement = Math.min(50, Math.log2(1 + item.points) * 5 + Math.log2(1 + item.comments) * 3);
  // Recency (0-50): exponential decay over 14 days
  const ageHours = item.age / (1000 * 60 * 60);
  const recency = 50 * Math.exp(-ageHours / (14 * 24));
  return Math.round(engagement + recency);
}

function renderTrendingLinks(container, items) {
  if (!items.length) {
    container.innerHTML = '<span style="font-size:11px;color:var(--md-grey-400)">No trending resources found</span>';
    container.dataset.loaded = 'true';
    return;
  }
  container.innerHTML = items.map(item => `
    <a href="${item.url}" target="_blank" rel="noopener">
      <span class="material-icons-outlined">trending_up</span>
      ${escapeHtml(item.title)}
      <span class="learning-path__trending-score">${item.points} pts · ${item.source}</span>
    </a>
  `).join('');
  container.dataset.loaded = 'true';
}

function escapeHtml(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}
