# AI Digest

A zero-dependency, static AI news aggregator that pulls the latest AI news, research papers, model releases, and learning resources from 10+ free public APIs — intelligently ranked by popularity, recency, and source authority.

**Live:** [dshakes.github.io/ai-digest](https://dshakes.github.io/ai-digest/)

## What It Does

- **News** — Aggregates AI stories from Hacker News, Dev.to, Reddit (r/MachineLearning, r/LocalLLaMA), and company blogs (Anthropic, OpenAI, Google AI, Meta AI, Microsoft AI, vLLM, Hugging Face, Lilian Weng)
- **Releases** — Curated major product and model launches (Claude, GPT, Gemini, Llama, DeepSeek, etc.) plus trending HN release stories, filtered to exclude SDK noise
- **Papers** — Latest research from ArXiv, Semantic Scholar, and HuggingFace Daily Papers with citation counts and PDF links
- **Resources** — Curated free and paid learning resources for beginners to advanced practitioners, filterable by cost and level
- **AI Engineer** — Interactive 12-week multi-track learning path with collapsible stages. Shared 4-week foundation (Python, Math, ML, Neural Networks), then fork into 3 specializations with badge-ring headers and visual progress rails:
  - **Applied AI Scientist** — Deep learning architectures, NLP & transformers, LLMs & fine-tuning, agentic AI research (design patterns, ReAct, tool use)
  - **AI Platform Engineer** — MLOps & K8s (Kubeflow, KServe), LLM serving (vLLM, TensorRT-LLM), agent infra & MCP gateways, guardrails & scalable ops (Ray, KubeRay, GPU Operator)
  - **AI Software Engineer** — Prompt engineering (Anthropic, OpenAI, DeepLearning.AI), RAG & vector databases, AI agents with MCP & A2A, production apps & guardrails
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
- **CORS proxy cascade** — Automatic fallback (allorigins → corsproxy.io) for blocked APIs
- **localStorage caching** — TTL-based with LRU eviction (10min news, 15min releases, 30min papers)
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

No API keys required. All sources are free and public.

## Run Locally

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

## Deploy

Hosted on GitHub Pages — every push to `main` auto-deploys. No CI, no server, no cost.

## Project Structure

```
ai-digest/
├── index.html              # SPA shell
├── css/
│   ├── styles.css          # Layout, variables, responsive
│   └── components.css      # Cards, chips, loaders, toasts
├── js/
│   ├── app.js              # Entry point, orchestration
│   ├── config.js           # API URLs, scoring weights, RSS feeds
│   ├── ui/                 # Tabs, cards, renderer, loader, toast
│   ├── sources/            # One module per data source
│   └── services/           # Cache, CORS proxy, fetcher, scorer, scheduler
├── data/
│   ├── major-releases.json # Curated flagship releases
│   └── learning-resources.json
└── assets/
    └── favicon.svg
```

## License

MIT
