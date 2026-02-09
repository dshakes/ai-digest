import { fetchJSON } from '../services/fetcher.js';
import { cache } from '../services/cache.js';
import { CONFIG } from '../config.js';

const CACHE_KEY = 'hn_releases';
const BASE = 'https://hn.algolia.com/api/v1/search';

// Major AI products/models/companies — not libraries or SDKs
const PRODUCT_QUERIES = [
  'Claude',
  'Opus',
  'Sonnet',
  'GPT-4',
  'GPT-5',
  'ChatGPT',
  'OpenAI Codex',
  'Gemini',
  'Gemma',
  'Llama',
  'Mistral',
  'DeepSeek',
  'Grok',
  'Kimi',
  'Qwen',
  'Copilot',
  'Cursor AI',
  'Windsurf',
  'Claude Code',
  'Stable Diffusion',
  'Midjourney',
  'Sora',
  'DALL-E',
  'Ollama',
  'Perplexity',
  'NotebookLM',
  'Replit Agent',
  // Inference & serving
  'vLLM',
  'TensorRT-LLM',
  'SGLang',
  'llama.cpp',
  'TGI',
  'LLM inference',
];

// Skip stories about SDKs, libraries, packages, configs, docs, minor patches
const NOISE_PATTERN = /\b(sdk|npm|pip|package|library|binding|wrapper|client|dependency|dependencies|changelog|patch|hotfix|bugfix|docs update|readme|typo|config|lint|ci\/cd|docker|yaml|\.toml|\.json schema)\b/i;

// Must have some engagement to be worth showing
const MIN_POINTS = 20;

export async function fetchItems() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  try {
  const monthAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);

  // Batch products into groups to reduce API calls
  const batches = [];
  for (let i = 0; i < PRODUCT_QUERIES.length; i += 5) {
    const group = PRODUCT_QUERIES.slice(i, i + 5);
    const query = group.map(p => `"${p}"`).join(' OR ');
    batches.push(query);
  }

  const results = await Promise.allSettled(
    batches.map(query => {
      const url = `${BASE}?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${monthAgo},points>${MIN_POINTS}&hitsPerPage=15`;
      return fetchJSON(url);
    })
  );

  const allHits = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value?.hits) {
      allHits.push(...r.value.hits);
    }
  }

  // Deduplicate by objectID
  const seen = new Set();
  const unique = allHits.filter(h => {
    if (seen.has(h.objectID)) return false;
    seen.add(h.objectID);
    return true;
  });

  const items = unique
    .filter(hit => {
      const title = (hit.title || '').toLowerCase();
      // Reject SDK/library noise
      if (NOISE_PATTERN.test(title)) return false;
      return true;
    })
    .map(hit => ({
      id: `hnr-${hit.objectID}`,
      title: hit.title || '',
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      description: hit.story_text ? hit.story_text.slice(0, 200) : '',
      source: 'hackernews',
      sourceName: 'Hacker News',
      author: hit.author || '',
      publishedAt: hit.created_at,
      engagement: { score: hit.points || 0, comments: hit.num_comments || 0 },
      tags: detectTags(hit.title || ''),
      type: 'release',
    }));

  cache.set(CACHE_KEY, items, CONFIG.CACHE_TTL.releases);
  return items;
  } catch {
    console.warn('HN releases fetch failed, skipping');
    return [];
  }
}

function detectTags(title) {
  const tags = [];
  const t = title.toLowerCase();
  if (/claude|opus|sonnet|anthropic/.test(t)) tags.push('Anthropic');
  if (/gpt|chatgpt|openai|codex|dall.e|sora/.test(t)) tags.push('OpenAI');
  if (/gemini|gemma|google|deepmind|notebooklm/.test(t)) tags.push('Google');
  if (/llama|meta ai/.test(t)) tags.push('Meta');
  if (/mistral/.test(t)) tags.push('Mistral');
  if (/deepseek/.test(t)) tags.push('DeepSeek');
  if (/grok|xai/.test(t)) tags.push('xAI');
  if (/kimi|moonshot/.test(t)) tags.push('Kimi');
  if (/copilot|cursor|windsurf|claude code|replit/.test(t)) tags.push('coding-tool');
  if (/stable diffusion|midjourney|flux|dall.e/.test(t)) tags.push('image-gen');
  if (/perplexity/.test(t)) tags.push('search');
  if (/vllm|tensorrt|sglang|llama\.cpp|tgi|inference|serving|throughput|latency|quantiz/.test(t)) tags.push('inference');
  if (tags.length === 0) tags.push('AI');
  return tags;
}
