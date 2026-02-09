// AI Atlas — LLM-powered concept search with streaming, autocomplete & caching

import { CONFIG } from '../config.js';

const CACHE_PREFIX = 'zettanaut_atlas_';
const KEY_STORAGE = 'zettanaut_atlas_api_key';
const PROVIDER_STORAGE = 'zettanaut_atlas_provider';

// ─── Lightweight concept index for autocomplete ───
const CONCEPT_INDEX = [
  { name: 'Neural Network', cat: 'Fundamentals', aliases: ['NN', 'ANN', 'artificial neural network'] },
  { name: 'Backpropagation', cat: 'Fundamentals', aliases: ['backprop', 'backward pass'] },
  { name: 'Gradient Descent', cat: 'Fundamentals', aliases: ['SGD', 'stochastic gradient descent', 'optimizer'] },
  { name: 'Transfer Learning', cat: 'Fundamentals', aliases: ['pretrained', 'domain adaptation'] },
  { name: 'Embeddings', cat: 'Fundamentals', aliases: ['word embeddings', 'vector representations', 'word2vec'] },
  { name: 'Tokenization', cat: 'Fundamentals', aliases: ['tokenizer', 'BPE', 'byte pair encoding', 'sentencepiece'] },
  { name: 'Loss Function', cat: 'Fundamentals', aliases: ['cost function', 'objective function', 'cross entropy'] },
  { name: 'Activation Function', cat: 'Fundamentals', aliases: ['ReLU', 'sigmoid', 'tanh', 'GELU'] },
  { name: 'Batch Normalization', cat: 'Fundamentals', aliases: ['batchnorm', 'layer normalization', 'layernorm'] },

  { name: 'Transformer', cat: 'Architecture', aliases: ['transformer architecture', 'self-attention model'] },
  { name: 'Attention Mechanism', cat: 'Architecture', aliases: ['self-attention', 'multi-head attention', 'cross-attention'] },
  { name: 'CNN', cat: 'Architecture', aliases: ['convolutional neural network', 'convnet', 'convolution'] },
  { name: 'RNN / LSTM', cat: 'Architecture', aliases: ['recurrent neural network', 'LSTM', 'GRU', 'sequence model'] },
  { name: 'GAN', cat: 'Architecture', aliases: ['generative adversarial network', 'generator discriminator'] },
  { name: 'Diffusion Model', cat: 'Architecture', aliases: ['DDPM', 'stable diffusion', 'denoising diffusion', 'latent diffusion'] },
  { name: 'Mixture of Experts', cat: 'Architecture', aliases: ['MoE', 'sparse MoE', 'expert routing'] },
  { name: 'Vision Transformer', cat: 'Architecture', aliases: ['ViT', 'image transformer', 'visual transformer'] },
  { name: 'Autoencoder', cat: 'Architecture', aliases: ['VAE', 'variational autoencoder', 'encoder decoder'] },
  { name: 'State Space Model', cat: 'Architecture', aliases: ['SSM', 'Mamba', 'S4', 'structured state space'] },
  { name: 'Graph Neural Network', cat: 'Architecture', aliases: ['GNN', 'graph convolution', 'message passing'] },

  { name: 'Large Language Model', cat: 'LLMs', aliases: ['LLM', 'foundation model', 'GPT', 'Claude', 'language model'] },
  { name: 'Fine-tuning', cat: 'LLMs', aliases: ['finetuning', 'SFT', 'supervised fine-tuning', 'instruction tuning'] },
  { name: 'RLHF', cat: 'LLMs', aliases: ['reinforcement learning from human feedback', 'reward model', 'PPO alignment'] },
  { name: 'DPO', cat: 'LLMs', aliases: ['direct preference optimization', 'preference learning'] },
  { name: 'LoRA / PEFT', cat: 'LLMs', aliases: ['low-rank adaptation', 'parameter efficient fine-tuning', 'QLoRA', 'adapter'] },
  { name: 'Context Window', cat: 'LLMs', aliases: ['context length', 'max tokens', 'sequence length', 'long context'] },
  { name: 'Prompt Engineering', cat: 'LLMs', aliases: ['prompting', 'system prompt', 'few-shot prompting', 'prompt design'] },
  { name: 'Chain-of-Thought', cat: 'LLMs', aliases: ['CoT', 'step by step reasoning', 'reasoning chain', 'think step by step'] },
  { name: 'In-Context Learning', cat: 'LLMs', aliases: ['ICL', 'few-shot learning', 'zero-shot', 'demonstration learning'] },
  { name: 'Temperature & Sampling', cat: 'LLMs', aliases: ['top-p', 'top-k', 'nucleus sampling', 'temperature'] },
  { name: 'Tokenizer', cat: 'LLMs', aliases: ['BPE tokenizer', 'sentencepiece', 'tiktoken', 'vocabulary'] },
  { name: 'Scaling Laws', cat: 'LLMs', aliases: ['Chinchilla scaling', 'compute optimal', 'neural scaling'] },

  { name: 'KV Cache', cat: 'Inference', aliases: ['key-value cache', 'attention cache', 'inference cache'] },
  { name: 'Paged Attention', cat: 'Inference', aliases: ['PagedAttention', 'vLLM attention', 'memory paging'] },
  { name: 'Continuous Batching', cat: 'Inference', aliases: ['dynamic batching', 'inflight batching', 'iteration-level scheduling'] },
  { name: 'Speculative Decoding', cat: 'Inference', aliases: ['draft model', 'assisted generation', 'spec decode'] },
  { name: 'Quantization', cat: 'Inference', aliases: ['GPTQ', 'AWQ', 'GGUF', 'INT4', 'INT8', 'model compression'] },
  { name: 'vLLM', cat: 'Inference', aliases: ['vllm', 'vLLM engine', 'LLM serving engine'] },
  { name: 'Flash Attention', cat: 'Inference', aliases: ['FlashAttention', 'FlashAttention-2', 'IO-aware attention'] },
  { name: 'TensorRT-LLM', cat: 'Inference', aliases: ['TensorRT', 'NVIDIA inference', 'TRT-LLM'] },
  { name: 'GGUF / llama.cpp', cat: 'Inference', aliases: ['GGML', 'llama.cpp', 'CPU inference', 'local LLM'] },

  { name: 'Model Context Protocol', cat: 'Agents & Tools', aliases: ['MCP', 'context protocol', 'tool protocol'] },
  { name: 'A2A Protocol', cat: 'Agents & Tools', aliases: ['agent-to-agent', 'agent communication', 'Google A2A'] },
  { name: 'Agentic AI', cat: 'Agents & Tools', aliases: ['AI agents', 'autonomous agents', 'agent framework'] },
  { name: 'ReAct', cat: 'Agents & Tools', aliases: ['reasoning and acting', 'reason + act', 'ReAct pattern'] },
  { name: 'Tool Use', cat: 'Agents & Tools', aliases: ['function calling', 'tool calling', 'API calling', 'plugins'] },
  { name: 'Multi-Agent Systems', cat: 'Agents & Tools', aliases: ['MAS', 'multi-agent', 'agent swarm', 'agent orchestration'] },
  { name: 'LangChain', cat: 'Agents & Tools', aliases: ['langchain', 'LLM framework', 'chain of LLM calls'] },
  { name: 'LangGraph', cat: 'Agents & Tools', aliases: ['langgraph', 'agent graph', 'stateful agents'] },

  { name: 'RAG', cat: 'RAG & Search', aliases: ['retrieval-augmented generation', 'retrieval augmented generation'] },
  { name: 'Vector Database', cat: 'RAG & Search', aliases: ['vector store', 'vector DB', 'Pinecone', 'Chroma', 'Weaviate', 'FAISS'] },
  { name: 'Semantic Search', cat: 'RAG & Search', aliases: ['neural search', 'embedding search', 'similarity search'] },
  { name: 'Chunking', cat: 'RAG & Search', aliases: ['text splitting', 'document chunking', 'chunk strategy'] },
  { name: 'Hybrid Search', cat: 'RAG & Search', aliases: ['keyword + semantic', 'BM25 + vector', 'sparse dense'] },
  { name: 'Reranking', cat: 'RAG & Search', aliases: ['cross-encoder', 'reranker', 'Cohere rerank'] },

  { name: 'Hallucination', cat: 'Safety & Ethics', aliases: ['confabulation', 'factual errors', 'making things up'] },
  { name: 'Guardrails', cat: 'Safety & Ethics', aliases: ['safety guardrails', 'output validation', 'content filtering'] },
  { name: 'Constitutional AI', cat: 'Safety & Ethics', aliases: ['CAI', 'AI constitution', 'RLAIF', 'Anthropic safety'] },
  { name: 'Prompt Injection', cat: 'Safety & Ethics', aliases: ['jailbreak', 'prompt attack', 'indirect injection'] },
  { name: 'Red Teaming', cat: 'Safety & Ethics', aliases: ['adversarial testing', 'safety evaluation', 'attack testing'] },
  { name: 'AI Alignment', cat: 'Safety & Ethics', aliases: ['alignment', 'value alignment', 'AI safety'] },
  { name: 'Bias & Fairness', cat: 'Safety & Ethics', aliases: ['algorithmic bias', 'fairness', 'model bias', 'debiasing'] },

  { name: 'MLOps', cat: 'MLOps', aliases: ['ML operations', 'machine learning operations', 'ML lifecycle'] },
  { name: 'Model Serving', cat: 'MLOps', aliases: ['inference serving', 'model deployment', 'serving infrastructure'] },
  { name: 'Feature Store', cat: 'MLOps', aliases: ['feature engineering', 'feature platform', 'Feast'] },
  { name: 'Experiment Tracking', cat: 'MLOps', aliases: ['MLflow', 'W&B', 'experiment logging', 'run tracking'] },
  { name: 'Model Registry', cat: 'MLOps', aliases: ['model versioning', 'model catalog', 'artifact store'] },
  { name: 'LLMOps', cat: 'MLOps', aliases: ['LLM operations', 'prompt management', 'LLM monitoring'] },

  { name: 'Distributed Training', cat: 'Training', aliases: ['data parallel', 'model parallel', 'multi-GPU training'] },
  { name: 'FSDP', cat: 'Training', aliases: ['fully sharded data parallel', 'PyTorch FSDP', 'ZeRO'] },
  { name: 'DeepSpeed', cat: 'Training', aliases: ['deepspeed', 'ZeRO optimizer', 'Microsoft DeepSpeed'] },
  { name: 'Mixed Precision Training', cat: 'Training', aliases: ['FP16', 'BF16', 'AMP', 'automatic mixed precision'] },
  { name: 'Knowledge Distillation', cat: 'Training', aliases: ['distillation', 'teacher student', 'model compression'] },
  { name: 'Curriculum Learning', cat: 'Training', aliases: ['training curriculum', 'progressive training'] },
  { name: 'Data Augmentation', cat: 'Training', aliases: ['synthetic data', 'augmentation', 'data generation'] },
];

const ALL_CATEGORIES = [...new Set(CONCEPT_INDEX.map(c => c.cat))].sort();

// ─── Init ───
export async function initAtlas() {
  renderSearch();
}

// ─── API Key Management ───
function getApiKey() { return localStorage.getItem(KEY_STORAGE) || CONFIG.ATLAS.apiKey || ''; }
function setApiKey(key) { localStorage.setItem(KEY_STORAGE, key); }
function getProvider() { return localStorage.getItem(PROVIDER_STORAGE) || CONFIG.ATLAS.provider; }
function setProvider(p) { localStorage.setItem(PROVIDER_STORAGE, p); }

// ─── Main Search UI ───
function renderSearch() {
  const panel = document.getElementById('panel-ai-atlas');
  if (!panel) return;

  const hasKey = !!getApiKey();
  const keyNotice = hasKey ? '' : `
    <div class="ai-atlas__key-notice">
      <span class="material-icons-outlined">vpn_key</span>
      No API key configured. Click <button class="ai-atlas__key-notice-link" id="atlasInlineSetup">settings</button> to add your OpenAI or Anthropic key.
    </div>
  `;

  const container = panel.querySelector('.ai-atlas');
  container.innerHTML = `
    <div class="ai-atlas__hero">
      <span class="material-icons-outlined ai-atlas__hero-icon">auto_awesome</span>
      <h2 class="ai-atlas__hero-title">AI Atlas</h2>
      <p class="ai-atlas__hero-subtitle">Search any AI concept — get instant, in-depth explanations powered by AI</p>
      <div class="ai-atlas__search-wrapper">
        <span class="material-icons-outlined ai-atlas__search-icon">search</span>
        <input type="text" class="ai-atlas__search" id="atlasSearch" placeholder="Search concepts… e.g. MCP, RAG, Transformer, RLHF" autocomplete="off">
        <div class="ai-atlas__autocomplete" id="atlasAutocomplete"></div>
      </div>
      ${keyNotice}
    </div>
    <div class="ai-atlas__popular" id="atlasPopular">
      <h3 class="ai-atlas__section-title"><span class="material-icons-outlined">explore</span> Explore Concepts</h3>
      <div class="ai-atlas__categories" id="atlasCategoryFilters"></div>
      <div class="ai-atlas__chips" id="atlasChips"></div>
    </div>
    <div class="ai-atlas__detail" id="atlasDetail" style="display:none"></div>
    <button class="ai-atlas__settings-btn" id="atlasSettingsBtn" title="Change API key or provider">
      <span class="material-icons-outlined">settings</span>
    </button>
  `;

  renderCategoryFilters();
  renderConceptChips();
  initSearchInput();

  // Auto-focus search on tab switch
  const observer = new MutationObserver(() => {
    if (panel.classList.contains('active')) {
      document.getElementById('atlasSearch')?.focus();
    }
  });
  observer.observe(panel, { attributes: true, attributeFilter: ['class'] });

  // Settings button — show inline setup dialog
  const showSettings = () => {
    const provider = getProvider();
    const currentKey = getApiKey();
    const detail = document.getElementById('atlasDetail');
    const popular = document.getElementById('atlasPopular');
    if (popular) popular.style.display = 'none';
    if (detail) {
      detail.style.display = 'block';
      detail.innerHTML = `
        <button class="ai-atlas__back" id="atlasSettingsBack">
          <span class="material-icons-outlined">arrow_back</span> Back to search
        </button>
        <div class="ai-atlas__setup">
          <div class="ai-atlas__setup-card">
            <h3><span class="material-icons-outlined">settings</span> AI Atlas Settings</h3>
            <p>Configure your AI provider and API key for concept explanations.</p>
            <div class="ai-atlas__setup-form">
              <div class="ai-atlas__setup-provider">
                <label>
                  <input type="radio" name="atlasProvider" value="openai" ${provider === 'openai' ? 'checked' : ''}>
                  <span>OpenAI <small>(GPT-4o-mini — fast & affordable)</small></span>
                </label>
                <label>
                  <input type="radio" name="atlasProvider" value="anthropic" ${provider === 'anthropic' ? 'checked' : ''}>
                  <span>Anthropic <small>(Claude 3.5 Haiku — fast & capable)</small></span>
                </label>
              </div>
              <div class="ai-atlas__setup-input">
                <input type="password" id="atlasApiKey" placeholder="Paste your API key here..." value="${currentKey}" autocomplete="off">
                <button class="ai-atlas__setup-btn" id="atlasSetupBtn">
                  <span class="material-icons-outlined">check</span> Save
                </button>
              </div>
              <small class="ai-atlas__setup-note">Your key is stored locally in your browser and only used to call the AI provider's API directly.</small>
            </div>
          </div>
        </div>
      `;
      detail.querySelector('#atlasSettingsBack')?.addEventListener('click', () => showPopular());
      detail.querySelector('#atlasSetupBtn')?.addEventListener('click', () => {
        const key = document.getElementById('atlasApiKey')?.value.trim();
        const prov = document.querySelector('input[name="atlasProvider"]:checked')?.value || 'openai';
        if (key) setApiKey(key);
        setProvider(prov);
        showPopular();
        // Remove key notice if it exists
        document.querySelector('.ai-atlas__key-notice')?.remove();
      });
      detail.querySelector('#atlasApiKey')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') detail.querySelector('#atlasSetupBtn')?.click();
      });
    }
  };

  document.getElementById('atlasSettingsBtn')?.addEventListener('click', showSettings);
  document.getElementById('atlasInlineSetup')?.addEventListener('click', showSettings);
}

// ─── Category Filters ───
function renderCategoryFilters() {
  const el = document.getElementById('atlasCategoryFilters');
  if (!el) return;
  el.innerHTML = `
    <button class="ai-atlas__cat-chip active" data-cat="all">All</button>
    ${ALL_CATEGORIES.map(c => `<button class="ai-atlas__cat-chip" data-cat="${c}">${c}</button>`).join('')}
  `;
  el.addEventListener('click', e => {
    const chip = e.target.closest('.ai-atlas__cat-chip');
    if (!chip) return;
    el.querySelectorAll('.ai-atlas__cat-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderConceptChips(chip.dataset.cat === 'all' ? null : chip.dataset.cat);
  });
}

// ─── Concept Chips ───
function renderConceptChips(category) {
  const el = document.getElementById('atlasChips');
  if (!el) return;
  const filtered = category ? CONCEPT_INDEX.filter(c => c.cat === category) : CONCEPT_INDEX;
  el.innerHTML = filtered.map(c => `
    <button class="ai-atlas__chip" data-name="${esc(c.name)}">
      ${esc(c.name)}
      <span class="ai-atlas__chip-cat">${esc(c.cat)}</span>
    </button>
  `).join('');
  el.addEventListener('click', e => {
    const chip = e.target.closest('.ai-atlas__chip');
    if (!chip) return;
    const name = chip.dataset.name;
    document.getElementById('atlasSearch').value = name;
    lookupConcept(name);
  });
}

// ─── Search Input with Autocomplete ───
function initSearchInput() {
  const input = document.getElementById('atlasSearch');
  const dropdown = document.getElementById('atlasAutocomplete');
  if (!input || !dropdown) return;

  let selectedIdx = -1;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    selectedIdx = -1;
    if (q.length < 1) {
      dropdown.style.display = 'none';
      showPopular();
      return;
    }

    const matches = CONCEPT_INDEX.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.aliases.some(a => a.toLowerCase().includes(q)) ||
      c.cat.toLowerCase().includes(q)
    ).slice(0, 8);

    // Always show a "Search for..." option at the end for freeform queries
    const freeformHtml = `
      <button class="ai-atlas__ac-item ai-atlas__ac-freeform" data-idx="${matches.length}" data-name="${esc(input.value.trim())}">
        <span class="material-icons-outlined">auto_awesome</span>
        <span class="ai-atlas__ac-name">Search: <strong>${esc(input.value.trim())}</strong></span>
        <span class="ai-atlas__ac-cat">AI-powered</span>
      </button>
    `;

    if (!matches.length) {
      dropdown.innerHTML = freeformHtml;
      dropdown.style.display = 'block';
    } else {
      dropdown.innerHTML = matches.map((c, i) => `
        <button class="ai-atlas__ac-item${i === selectedIdx ? ' selected' : ''}" data-idx="${i}" data-name="${esc(c.name)}">
          <span class="ai-atlas__ac-name">${highlightMatch(c.name, q)}</span>
          <span class="ai-atlas__ac-cat">${esc(c.cat)}</span>
        </button>
      `).join('') + freeformHtml;
      dropdown.style.display = 'block';
    }

    dropdown.querySelectorAll('.ai-atlas__ac-item').forEach(item => {
      item.addEventListener('click', () => {
        const name = item.dataset.name;
        input.value = name;
        dropdown.style.display = 'none';
        lookupConcept(name);
      });
    });
  });

  // Keyboard navigation
  input.addEventListener('keydown', e => {
    const items = dropdown.querySelectorAll('.ai-atlas__ac-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!items.length) return;
      selectedIdx = Math.min(selectedIdx + 1, items.length - 1);
      items.forEach((it, i) => it.classList.toggle('selected', i === selectedIdx));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      selectedIdx = Math.max(selectedIdx - 1, 0);
      items.forEach((it, i) => it.classList.toggle('selected', i === selectedIdx));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0 && items[selectedIdx]) {
        items[selectedIdx].click();
      } else if (input.value.trim()) {
        dropdown.style.display = 'none';
        lookupConcept(input.value.trim());
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
    }
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.ai-atlas__search-wrapper')) {
      dropdown.style.display = 'none';
    }
  });
}

// ─── Lookup Concept (cache → LLM API) ───
async function lookupConcept(conceptName) {
  const popular = document.getElementById('atlasPopular');
  const detail = document.getElementById('atlasDetail');
  if (!detail) return;

  if (popular) popular.style.display = 'none';
  detail.style.display = 'block';

  // Check cache first
  const cacheKey = CACHE_PREFIX + conceptName.toLowerCase().replace(/\s+/g, '-');
  const cached = getCachedConcept(cacheKey);
  if (cached) {
    renderDetail(conceptName, cached);
    return;
  }

  // Show loading state
  renderLoading(conceptName);

  try {
    const result = await callLLM(conceptName);
    cacheConcept(cacheKey, result);
    renderDetail(conceptName, result);
  } catch (err) {
    renderError(conceptName, err.message);
  }
}

// ─── LLM API Call with Streaming ───
async function callLLM(conceptName) {
  const apiKey = getApiKey();
  const provider = getProvider();
  if (!apiKey) throw new Error('No API key configured');

  const systemPrompt = `You are an expert AI encyclopedia. When asked about an AI concept, provide a comprehensive, educational explanation that helps someone truly understand the topic.

You MUST respond with valid JSON in this exact format:
{
  "summary": "A clear 1-2 sentence definition accessible to beginners.",
  "explanation": "A detailed 3-4 paragraph explanation. Cover what it is, why it matters, how it works at a high level, and current state of the art. Use **bold** for key terms. Separate paragraphs with \\n\\n.",
  "keyPoints": ["5-6 concise bullet points covering the most important aspects"],
  "related": ["3-5 related AI concept names"],
  "references": [
    {"title": "Resource title", "url": "https://real-url.com"}
  ]
}

Rules:
- Explanations should be genuinely educational, written in clear professional prose
- Use **bold** for important terms in the explanation
- For references, only include URLs you are confident are real and accessible
- Include 2-3 high-quality references (official docs, seminal papers, authoritative tutorials)
- Related concepts should be real AI/ML concepts the reader might want to explore next
- If you don't recognize the concept, still try to provide the best explanation you can`;

  const userPrompt = `Explain this AI concept in detail: "${conceptName}"`;

  const detail = document.getElementById('atlasDetail');

  if (provider === 'anthropic') {
    const res = await fetch(CONFIG.ATLAS.anthropic.url, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CONFIG.ATLAS.anthropic.model,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        stream: true,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    return await readAnthropicStream(res, detail, conceptName);
  } else {
    const res = await fetch(CONFIG.ATLAS.openai.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CONFIG.ATLAS.openai.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        stream: true,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errBody.slice(0, 200)}`);
    }

    return await readOpenAIStream(res, detail, conceptName);
  }
}

// ─── OpenAI SSE Stream Reader ───
async function readOpenAIStream(res, detail, conceptName) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;
      try {
        const json = JSON.parse(data);
        const content = json.choices?.[0]?.delta?.content || '';
        accumulated += content;
        updateStreamingPreview(detail, conceptName, accumulated);
      } catch {}
    }
  }

  return parseResponse(accumulated);
}

// ─── Anthropic SSE Stream Reader ───
async function readAnthropicStream(res, detail, conceptName) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const json = JSON.parse(line.slice(6));
        if (json.type === 'content_block_delta' && json.delta?.text) {
          accumulated += json.delta.text;
          updateStreamingPreview(detail, conceptName, accumulated);
        }
      } catch {}
    }
  }

  return parseResponse(accumulated);
}

// ─── Streaming Preview (show raw text as it arrives) ───
function updateStreamingPreview(detail, conceptName, text) {
  const streamEl = detail.querySelector('.ai-atlas__stream-content');
  if (streamEl) {
    streamEl.textContent = text;
  }
}

// ─── Parse JSON response from LLM ───
function parseResponse(text) {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not parse AI response');

  try {
    const data = JSON.parse(jsonMatch[0]);
    return {
      summary: data.summary || '',
      explanation: data.explanation || '',
      keyPoints: data.keyPoints || data.key_points || [],
      related: data.related || data.relatedConcepts || [],
      references: data.references || [],
    };
  } catch (e) {
    throw new Error('Invalid JSON in AI response');
  }
}

// ─── Render Loading State ───
function renderLoading(conceptName) {
  const detail = document.getElementById('atlasDetail');
  if (!detail) return;

  detail.innerHTML = `
    <button class="ai-atlas__back" id="atlasBack">
      <span class="material-icons-outlined">arrow_back</span> Back to search
    </button>
    <div class="ai-atlas__card ai-atlas__card--loading">
      <div class="ai-atlas__card-header">
        <h2 class="ai-atlas__card-title">${esc(conceptName)}</h2>
        <div class="ai-atlas__loading-indicator">
          <span class="material-icons-outlined ai-atlas__loading-spin">auto_awesome</span>
          <span>Generating explanation...</span>
        </div>
      </div>
      <div class="ai-atlas__card-body">
        <div class="ai-atlas__stream-preview">
          <pre class="ai-atlas__stream-content"></pre>
        </div>
      </div>
    </div>
  `;

  detail.querySelector('#atlasBack')?.addEventListener('click', () => showPopular());
}

// ─── Render Concept Detail ───
function renderDetail(conceptName, data) {
  const detail = document.getElementById('atlasDetail');
  if (!detail) return;

  const refsHtml = (data.references || []).map(ref =>
    `<a href="${ref.url}" target="_blank" rel="noopener" class="ai-atlas__ref-link">
      <span class="material-icons-outlined">open_in_new</span> ${esc(ref.title)}
    </a>`
  ).join('');

  const relatedHtml = (data.related || []).map(name =>
    `<button class="ai-atlas__related-chip" data-name="${esc(name)}">
      <span class="material-icons-outlined">auto_awesome</span> ${esc(name)}
    </button>`
  ).join('');

  detail.innerHTML = `
    <button class="ai-atlas__back" id="atlasBack">
      <span class="material-icons-outlined">arrow_back</span> Back to search
    </button>
    <div class="ai-atlas__card">
      <div class="ai-atlas__card-header">
        <h2 class="ai-atlas__card-title">${esc(conceptName)}</h2>
        <p class="ai-atlas__card-summary">${esc(data.summary)}</p>
      </div>
      <div class="ai-atlas__card-body">
        <div class="ai-atlas__card-main">
          <div class="ai-atlas__section">
            <h3><span class="material-icons-outlined">menu_book</span> In Depth</h3>
            <div class="ai-atlas__explanation">${renderMarkdown(data.explanation)}</div>
          </div>
          ${refsHtml ? `
          <div class="ai-atlas__section">
            <h3><span class="material-icons-outlined">link</span> Learn More</h3>
            <div class="ai-atlas__refs">${refsHtml}</div>
          </div>` : ''}
          ${relatedHtml ? `
          <div class="ai-atlas__section">
            <h3><span class="material-icons-outlined">hub</span> Related Concepts</h3>
            <div class="ai-atlas__related">${relatedHtml}</div>
          </div>` : ''}
        </div>
        <aside class="ai-atlas__card-sidebar">
          <h4><span class="material-icons-outlined">checklist</span> Key Points</h4>
          <ul class="ai-atlas__key-points">
            ${(data.keyPoints || []).map(p => `<li>${esc(p)}</li>`).join('')}
          </ul>
        </aside>
      </div>
    </div>
  `;

  // Back button
  detail.querySelector('#atlasBack')?.addEventListener('click', () => showPopular());

  // Related concept clicks
  detail.querySelectorAll('.ai-atlas__related-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const name = chip.dataset.name;
      document.getElementById('atlasSearch').value = name;
      lookupConcept(name);
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ─── Render Error ───
function renderError(conceptName, message) {
  const detail = document.getElementById('atlasDetail');
  if (!detail) return;

  let hint = '';
  if (message.includes('401') || message.includes('invalid')) {
    hint = 'Your API key may be invalid. Click settings to update it.';
  } else if (message.includes('429')) {
    hint = 'Rate limit reached. Please wait a moment and try again.';
  } else if (message.includes('CORS') || message.includes('Failed to fetch')) {
    hint = 'Network error. This may be a CORS issue — try using OpenAI instead of Anthropic.';
  }

  detail.innerHTML = `
    <button class="ai-atlas__back" id="atlasBack">
      <span class="material-icons-outlined">arrow_back</span> Back to search
    </button>
    <div class="ai-atlas__card ai-atlas__card--error">
      <div class="ai-atlas__error">
        <span class="material-icons-outlined">error_outline</span>
        <h3>Could not load "${esc(conceptName)}"</h3>
        <p>${esc(message)}</p>
        ${hint ? `<p class="ai-atlas__error-hint">${hint}</p>` : ''}
        <button class="ai-atlas__retry-btn" id="atlasRetry">
          <span class="material-icons-outlined">refresh</span> Try Again
        </button>
      </div>
    </div>
  `;

  detail.querySelector('#atlasBack')?.addEventListener('click', () => showPopular());
  detail.querySelector('#atlasRetry')?.addEventListener('click', () => lookupConcept(conceptName));
}

// ─── Show Popular (back to browse) ───
function showPopular() {
  const popular = document.getElementById('atlasPopular');
  const detail = document.getElementById('atlasDetail');
  if (popular) popular.style.display = 'block';
  if (detail) detail.style.display = 'none';
}

// ─── Cache ───
function getCachedConcept(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CONFIG.ATLAS.cacheTTL) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch { return null; }
}

function cacheConcept(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

// ─── Helpers ───
function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return esc(text);
  return esc(text.slice(0, idx)) +
    `<strong>${esc(text.slice(idx, idx + query.length))}</strong>` +
    esc(text.slice(idx + query.length));
}

function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>').replace(/$/, '</p>');
}

function esc(str) {
  const el = document.createElement('span');
  el.textContent = str || '';
  return el.innerHTML;
}
