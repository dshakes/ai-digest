# Zettanaut

**Navigate the AI Universe** — Your all-in-one AI intelligence hub with curated news, multi-track learning paths, research papers, and an AI-powered concept encyclopedia.

**Live:** [dshakes.github.io/ai-digest](https://dshakes.github.io/ai-digest/)

## What It Does

- **News** — Aggregates AI stories from Hacker News, Dev.to, Reddit (r/MachineLearning, r/LocalLLaMA), and company blogs (Anthropic, OpenAI, Google AI, Meta AI, Microsoft AI, vLLM, Hugging Face, Lilian Weng)
- **Releases** — Curated major product and model launches (Claude, GPT, Gemini, Llama, DeepSeek, etc.) plus trending HN release stories, filtered to exclude SDK noise
- **Papers** — Latest research from ArXiv, Semantic Scholar, and HuggingFace Daily Papers with citation counts and PDF links
- **Resources** — Curated free and paid learning resources for beginners to advanced practitioners, filterable by cost and level
- **AI Engineer** — Comprehensive 16-week multi-track learning path (100+ curated tutorials) with collapsible stages and dynamic trending resources (fetched live from HN + Dev.to, scored by popularity/relevance). Shared 4-week foundation, then fork into 3 specializations (6 stages each):
  - **Applied AI Scientist** — Deep learning architectures, NLP & transformers, LLMs & fine-tuning, agentic AI, computer vision & multimodal AI, reinforcement learning & RLHF
  - **AI Platform Engineer** — MLOps fundamentals, LLM serving, agent infra & MCP gateways, guardrails & observability, GPU optimization & quantization, distributed training
  - **AI Software Engineer** — Prompt engineering & security, RAG & vectors, AI agents with MCP/A2A/LangGraph, production apps, evaluation & testing, full-stack AI patterns
- **AI Atlas** — LLM-powered concept encyclopedia. Search any AI concept and get instant, comprehensive explanations with key points, related concepts, and references. Supports OpenAI and Anthropic APIs with streaming and localStorage caching.
- **Archive** — Historical items older than one year across all categories
- **Highlights** — Top banner showcasing this week's major releases at a glance

### LLM Inference Focus

Built for inference specialists — topic filters on News and Releases tabs let you zero in on **LLM Inference** content: vLLM, TensorRT-LLM, SGLang, llama.cpp, quantization, KV cache, paged attention, speculative decoding, and more.

## Scoring Algorithm

Every item is scored on a 0–100 scale:

```
score = recency (35%) + engagement (35%) + authority (30%)
```

- **Recency** — Exponential decay: `100 * e^(-ageHours / 48)`
- **Engagement** — Normalized per source (HN points, Reddit upvotes, citations, stars)
- **Authority** — Source weight (company blogs: 1.0, ArXiv: 0.95, HN: 0.9, Reddit: 0.7)

## Tech Stack

- **Vanilla HTML/CSS/JS** — Zero dependencies, no build step
- **ES6 modules** — Clean separation of concerns across 20+ modules
- **Client-side fetch** — All data pulled directly in the browser
- **LLM API integration** — OpenAI / Anthropic for AI Atlas concept search (API key stored locally)
- **CORS proxy cascade** — Automatic fallback (allorigins → corsproxy.io) for blocked APIs
- **localStorage caching** — TTL-based with LRU eviction (10min news, 15min releases, 30min papers, 24h concepts)
- **Auto-refresh** — Configurable intervals, pauses when tab is hidden (Visibility API)
- **Material Design** — Google-style subtle colors, Roboto font, Material Icons

## Data Sources

| Source | Type | Proxy Needed |
|--------|------|:---:|
| Hacker News (Algolia API) | News + Releases | No |
| Dev.to API | News | No |
| Reddit JSON | News | Yes |
| RSS Feeds (11 blogs) | News | Yes |
| ArXiv API | Papers | Yes |
| Semantic Scholar API | Papers | Fallback |
| HuggingFace Daily Papers | Papers | Fallback |
| Curated Releases JSON | Releases | No |
| OpenAI / Anthropic API | AI Atlas | No |

## Run Locally

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

## Deploy

Hosted on GitHub Pages — every push to `main` auto-deploys. No CI, no server, no cost.

## Project Structure

```
zettanaut/
├── index.html              # SPA shell
├── css/
│   ├── styles.css          # Layout, variables, responsive
│   └── components.css      # Cards, chips, loaders, toasts
├── js/
│   ├── app.js              # Entry point, orchestration
│   ├── config.js           # API URLs, scoring weights, RSS feeds, Atlas config
│   ├── ui/                 # Tabs, cards, renderer, loader, toast
│   ├── sources/            # One module per data source
│   └── services/           # Cache, CORS proxy, fetcher, scorer, scheduler, concept-search
├── data/
│   ├── major-releases.json # Curated flagship releases
│   └── learning-resources.json
└── assets/
    └── favicon.svg
```

## License

MIT
