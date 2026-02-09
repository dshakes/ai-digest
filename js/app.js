import { initTabs } from './ui/tabs.js';
import { showLoader, hideLoader } from './ui/loader.js';
import { renderNews, renderReleases, renderPapers, renderResources, renderArchive, renderHighlights, buildSourceFilters } from './ui/renderer.js';
import { showToast } from './ui/toast.js';
import { fetchAllNews, fetchAllReleases, fetchAllPapers } from './services/aggregator.js';
import { startScheduler } from './services/scheduler.js';
import { cache } from './services/cache.js';
import { CONFIG } from './config.js';

let currentNews = [];
let currentReleases = [];
let currentPapers = [];
let currentArchive = [];
let resourcesData = null;

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Active filters & sort
// Inference-related keywords for topic filtering
const INFERENCE_KEYWORDS = /\b(vllm|tensorrt|sglang|llama\.cpp|tgi|inference|serving|throughput|latency|quantiz|gguf|ggml|awq|gptq|speculative decod|batching|kv.?cache|tensor.?parallel|pipeline.?parallel|model.?serving|token.?per.?sec|triton|onnx|openvino|ctransformers|exllama|mlx|mps|cuda|gpu.?memory|context.?length|rope|flash.?attention|paged.?attention)\b/i;
const MODEL_KEYWORDS = /\b(gpt|claude|opus|sonnet|gemini|llama|mistral|deepseek|grok|qwen|phi|gemma|stable.?diffusion|dall.?e|flux|sora|midjourney|model|release|launch|parameter|benchmark)\b/i;
const TOOL_KEYWORDS = /\b(cursor|windsurf|copilot|codex|claude.?code|replit|v0|ollama|perplexity|notebooklm|editor|ide|agent|assistant|chatbot|playground|api)\b/i;

const filters = {
  newsSource: 'all',
  newsSort: 'relevance',
  newsTopic: 'all',
  releasesSource: 'all',
  releasesSort: 'relevance',
  releasesTopic: 'all',
  papersSource: 'all',
  papersSort: 'relevance',
  archiveSource: 'all',
  archiveSort: 'newest',
  resourceCost: 'all',
  resourceLevel: 'all',
};

function sortItems(items, sortBy) {
  const sorted = [...items];
  switch (sortBy) {
    case 'relevance':
      return sorted.sort((a, b) => b.score - a.score);
    case 'newest':
      return sorted.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    case 'popular':
      return sorted.sort((a, b) => (b.engagement?.score || 0) - (a.engagement?.score || 0));
    default:
      return sorted;
  }
}

function matchesTopic(item, topic) {
  if (topic === 'all') return true;
  const text = `${item.title} ${item.description || ''} ${(item.tags || []).join(' ')}`;
  if (topic === 'inference') return INFERENCE_KEYWORDS.test(text);
  if (topic === 'models') return MODEL_KEYWORDS.test(text);
  if (topic === 'tools') return TOOL_KEYWORDS.test(text);
  return true;
}

function filterAndSort(items, sourceFilter, searchQuery, sortBy, topicFilter = 'all') {
  let result = items;
  if (sourceFilter !== 'all') {
    result = result.filter(item => item.source === sourceFilter);
  }
  if (topicFilter !== 'all') {
    result = result.filter(item => matchesTopic(item, topicFilter));
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.author?.toLowerCase().includes(q) ||
      item.tags?.some(t => t?.toLowerCase().includes(q))
    );
  }
  return sortItems(result, sortBy);
}

function buildArchive() {
  const cutoff = Date.now() - ONE_YEAR_MS;
  const allItems = [...currentNews, ...currentReleases, ...currentPapers];
  currentArchive = allItems.filter(item => new Date(item.publishedAt).getTime() < cutoff);
  renderArchive(sortItems(currentArchive, filters.archiveSort));
  buildSourceFilters(currentArchive, 'archiveSourceFilters');
}

async function loadNews() {
  const { items, errors } = await fetchAllNews();
  currentNews = items;
  renderNews(sortItems(items, filters.newsSort));
  buildSourceFilters(items, 'newsSourceFilters');
  if (errors.length) showToast(`${errors.length} news source(s) unavailable`, 'error');
}

async function loadReleases() {
  const { items, errors } = await fetchAllReleases();
  currentReleases = items;
  renderReleases(sortItems(items, filters.releasesSort));
  buildSourceFilters(items, 'releasesSourceFilters');
  renderHighlights(items);
  if (errors.length) showToast(`${errors.length} release source(s) unavailable`, 'error');
}

async function loadPapers() {
  const { items, errors } = await fetchAllPapers();
  currentPapers = items;
  renderPapers(sortItems(items, filters.papersSort));
  buildSourceFilters(items, 'papersSourceFilters');
  if (errors.length) showToast(`${errors.length} paper source(s) unavailable`, 'error');
}

async function loadResources() {
  try {
    const resp = await fetch('data/learning-resources.json');
    resourcesData = await resp.json();
    renderResources(resourcesData.categories);
  } catch {
    showToast('Could not load learning resources', 'error');
  }
}

function filterResources() {
  if (!resourcesData) return;
  const filtered = resourcesData.categories.map(cat => ({
    ...cat,
    resources: cat.resources.filter(r => {
      if (filters.resourceCost !== 'all' && r.cost !== filters.resourceCost) return false;
      if (filters.resourceLevel !== 'all' && r.level !== filters.resourceLevel) return false;
      return true;
    }),
  })).filter(cat => cat.resources.length > 0);
  renderResources(filtered);
}

function applyFilters(section) {
  if (section === 'news') {
    const q = document.getElementById('newsSearch').value;
    renderNews(filterAndSort(currentNews, filters.newsSource, q, filters.newsSort, filters.newsTopic));
  } else if (section === 'releases') {
    const q = document.getElementById('releasesSearch').value;
    renderReleases(filterAndSort(currentReleases, filters.releasesSource, q, filters.releasesSort, filters.releasesTopic));
  } else if (section === 'papers') {
    const q = document.getElementById('papersSearch').value;
    renderPapers(filterAndSort(currentPapers, filters.papersSource, q, filters.papersSort));
  } else if (section === 'archive') {
    const q = document.getElementById('archiveSearch').value;
    renderArchive(filterAndSort(currentArchive, filters.archiveSource, q, filters.archiveSort));
  }
}

function updateTimestamp() {
  const el = document.getElementById('lastUpdated');
  if (el) el.textContent = `Updated ${new Date().toLocaleTimeString()}`;
}

function setupSortListeners(selectId, section, filterKey) {
  const el = document.getElementById(selectId);
  if (!el) return;
  el.addEventListener('change', () => {
    filters[filterKey] = el.value;
    applyFilters(section);
  });
}

function setupSearchListeners(inputId, section) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.addEventListener('input', () => applyFilters(section));
}

function setupSourceFilterListeners(containerId, section, filterKey) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    filters[filterKey] = chip.dataset.source;
    el.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    applyFilters(section);
  });
}

function setupTopicFilterListeners(containerId, section, filterKey) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip || !chip.dataset.topic) return;
    filters[filterKey] = chip.dataset.topic;
    el.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    applyFilters(section);
  });
}

function setupEventListeners() {
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('spinning');
    cache.clear();
    showLoader('newsGrid');
    showLoader('releasesGrid');
    showLoader('papersGrid');
    await Promise.allSettled([loadNews(), loadReleases(), loadPapers()]);
    buildArchive();
    hideLoader('newsGrid');
    hideLoader('releasesGrid');
    hideLoader('papersGrid');
    updateTimestamp();
    btn.classList.remove('spinning');
    showToast('All sources refreshed', 'success');
  });

  // Search
  setupSearchListeners('newsSearch', 'news');
  setupSearchListeners('releasesSearch', 'releases');
  setupSearchListeners('papersSearch', 'papers');
  setupSearchListeners('archiveSearch', 'archive');

  // Source filters
  setupSourceFilterListeners('newsSourceFilters', 'news', 'newsSource');
  setupSourceFilterListeners('releasesSourceFilters', 'releases', 'releasesSource');
  setupSourceFilterListeners('papersSourceFilters', 'papers', 'papersSource');
  setupSourceFilterListeners('archiveSourceFilters', 'archive', 'archiveSource');

  // Sort selects
  setupSortListeners('newsSort', 'news', 'newsSort');
  setupSortListeners('releasesSort', 'releases', 'releasesSort');
  setupSortListeners('papersSort', 'papers', 'papersSort');
  setupSortListeners('archiveSort', 'archive', 'archiveSort');

  // Topic filters
  setupTopicFilterListeners('newsTopicFilters', 'news', 'newsTopic');
  setupTopicFilterListeners('releasesTopicFilters', 'releases', 'releasesTopic');

  // Resource filters
  document.getElementById('resourcesFilters').addEventListener('click', (e) => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    const filterType = chip.dataset.filter;
    const value = chip.dataset.value;
    if (filterType === 'cost') filters.resourceCost = value;
    if (filterType === 'level') filters.resourceLevel = value;
    chip.closest('.filter-group').querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    filterResources();
  });
}

async function init() {
  initTabs();
  setupEventListeners();

  showLoader('newsGrid');
  showLoader('releasesGrid');
  showLoader('papersGrid');

  await Promise.allSettled([loadNews(), loadReleases(), loadPapers(), loadResources()]);

  // Build archive from all loaded data
  buildArchive();

  hideLoader('newsGrid');
  hideLoader('releasesGrid');
  hideLoader('papersGrid');
  updateTimestamp();

  startScheduler({
    news: {
      interval: CONFIG.REFRESH_INTERVALS.news,
      callback: async () => { await loadNews(); buildArchive(); updateTimestamp(); },
    },
    releases: {
      interval: CONFIG.REFRESH_INTERVALS.releases,
      callback: async () => { await loadReleases(); buildArchive(); updateTimestamp(); },
    },
    papers: {
      interval: CONFIG.REFRESH_INTERVALS.papers,
      callback: async () => { await loadPapers(); buildArchive(); updateTimestamp(); },
    },
    resources: {
      interval: CONFIG.REFRESH_INTERVALS.resources,
      callback: async () => { await loadResources(); updateTimestamp(); },
    },
  });
}

document.addEventListener('DOMContentLoaded', init);
