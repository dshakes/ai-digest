export const CONFIG = {
  CACHE_TTL: {
    news: 10 * 60 * 1000,
    papers: 30 * 60 * 1000,
    releases: 15 * 60 * 1000,
    resources: 24 * 60 * 60 * 1000,
  },
  REFRESH_INTERVALS: {
    news: 10 * 60 * 1000,
    papers: 30 * 60 * 1000,
    releases: 15 * 60 * 1000,
    resources: 60 * 60 * 1000,
  },
  MAX_ITEMS_PER_SOURCE: 20,
  SEARCH_QUERIES: {
    hn: 'AI OR "artificial intelligence" OR "machine learning" OR LLM OR "large language model" OR GPT OR "deep learning" OR vLLM OR "LLM inference" OR TensorRT',
    devto_tags: ['ai', 'machinelearning', 'deeplearning', 'llm', 'artificialintelligence', 'inference'],
    reddit_subreddits: 'artificial+MachineLearning+deeplearning+LanguageTechnology+LocalLLaMA',
    arxiv_categories: 'cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL',
    semantic_scholar: 'artificial intelligence large language model',
  },
  SOURCE_AUTHORITY: {
    hackernews: 0.9,
    devto: 0.6,
    reddit: 0.7,
    rss: 0.85,
    arxiv: 0.95,
    semantic_scholar: 0.9,
    huggingface: 0.85,
    major_releases: 1.0,
  },
  CORS_PROXIES: [
    { name: 'allorigins', buildUrl: (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` },
    { name: 'corsproxy', buildUrl: (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}` },
  ],
  // AI Atlas — LLM-powered concept search
  ATLAS: {
    apiKey: '',           // Paste your API key here for ready-to-use Atlas
    provider: 'openai',  // 'openai' or 'anthropic'
    openai: {
      model: 'gpt-4.1',
      url: 'https://api.openai.com/v1/chat/completions',
    },
    anthropic: {
      model: 'claude-sonnet-4-5-20250929',
      url: 'https://api.anthropic.com/v1/messages',
    },
    cacheTTL: 24 * 60 * 60 * 1000,  // 24h
  },
  RSS_FEEDS: [
    // Company blogs
    { name: 'Anthropic', url: 'https://www.anthropic.com/feed.xml', authority: 1.0 },
    { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss/', authority: 1.0 },
    { name: 'Google AI Blog', url: 'https://blog.research.google/feeds/posts/default?alt=rss', authority: 1.0 },
    { name: 'Meta AI', url: 'https://ai.meta.com/blog/rss/', authority: 0.95 },
    { name: 'Microsoft AI', url: 'https://blogs.microsoft.com/ai/feed/', authority: 0.9 },
    // Inference & serving
    { name: 'vLLM Blog', url: 'https://blog.vllm.ai/feed.xml', authority: 0.9 },
    { name: 'Anyscale Blog', url: 'https://www.anyscale.com/blog/rss.xml', authority: 0.8 },
    // Popular AI media
    { name: 'MIT Tech Review AI', url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed', authority: 0.8 },
    { name: 'The Gradient', url: 'https://thegradient.pub/rss/', authority: 0.7 },
    { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml', authority: 0.85 },
    { name: 'Lilian Weng', url: 'https://lilianweng.github.io/index.xml', authority: 0.85 },
  ],
};
