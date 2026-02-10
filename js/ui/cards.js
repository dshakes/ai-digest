export function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

function scoreClass(score) {
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

function sourceBadgeClass(source) {
  const map = {
    hackernews: 'hn', devto: 'devto', reddit: 'reddit',
    arxiv: 'arxiv', semantic_scholar: 'semantic', huggingface: 'huggingface', rss: 'rss',
    major_releases: 'major',
  };
  if (map[source]) return map[source];
  // Per-company RSS feeds
  if (source?.includes('anthropic')) return 'anthropic';
  if (source?.includes('openai')) return 'openai';
  if (source?.includes('google')) return 'google';
  if (source?.includes('vllm')) return 'vllm';
  if (source?.includes('anyscale')) return 'vllm';
  return 'rss';
}

export function createNewsCard(item) {
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.source = item.source;
  el.dataset.score = item.score;

  el.innerHTML = `
    <div class="card__score card__score--${scoreClass(item.score)}"></div>
    <div class="card__header">
      <span class="card__source-badge card__source-badge--${sourceBadgeClass(item.source)}">${item.sourceName}</span>
      <h3 class="card__title"><a href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHTML(item.title)}</a></h3>
    </div>
    ${item.description ? `<p class="card__description">${escapeHTML(item.description)}</p>` : ''}
    <div class="card__meta">
      ${item.author ? `<span class="card__meta-item"><span class="material-icons-outlined">person</span>${escapeHTML(item.author)}</span>` : ''}
      <span class="card__meta-item"><span class="material-icons-outlined">schedule</span>${timeAgo(item.publishedAt)}</span>
      ${item.engagement.score ? `<span class="card__meta-item"><span class="material-icons-outlined">arrow_upward</span>${formatNumber(item.engagement.score)}</span>` : ''}
      ${item.engagement.comments ? `<span class="card__meta-item"><span class="material-icons-outlined">chat_bubble_outline</span>${formatNumber(item.engagement.comments)}</span>` : ''}
    </div>
  `;
  return el;
}

export function createPaperCard(item) {
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.source = item.source;
  el.dataset.score = item.score;

  const tags = (item.tags || []).slice(0, 3);

  el.innerHTML = `
    <div class="card__score card__score--${scoreClass(item.score)}"></div>
    <div class="card__header">
      <span class="card__source-badge card__source-badge--${sourceBadgeClass(item.source)}">${item.sourceName}</span>
      <h3 class="card__title"><a href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHTML(item.title)}</a></h3>
    </div>
    ${item.description ? `<p class="card__description">${escapeHTML(item.description)}</p>` : ''}
    <div class="card__meta">
      ${item.author ? `<span class="card__meta-item"><span class="material-icons-outlined">person</span>${escapeHTML(truncate(item.author, 50))}</span>` : ''}
      <span class="card__meta-item"><span class="material-icons-outlined">schedule</span>${timeAgo(item.publishedAt)}</span>
      ${item.engagement.score ? `<span class="card__meta-item"><span class="material-icons-outlined">format_quote</span>${formatNumber(item.engagement.score)} citations</span>` : ''}
      ${item.extra?.pdfUrl ? `<span class="card__meta-item"><a href="${escapeAttr(item.extra.pdfUrl)}" target="_blank" rel="noopener"><span class="material-icons-outlined">picture_as_pdf</span>PDF</a></span>` : ''}
    </div>
    ${tags.length ? `<div class="card__tags">${tags.map(t => `<span class="card__tag">${escapeHTML(t)}</span>`).join('')}</div>` : ''}
  `;
  return el;
}

export function createReleaseCard(item) {
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.source = item.source;
  el.dataset.score = item.score;

  const tags = (item.tags || []).filter(Boolean).slice(0, 3);
  const isGitHub = item.source === 'github';
  const isHFModel = item.source === 'hf_models';

  el.innerHTML = `
    <div class="card__score card__score--${scoreClass(item.score)}"></div>
    <div class="card__header">
      <span class="card__source-badge card__source-badge--${sourceBadgeClass(item.source)}">${escapeHTML(item.sourceName)}</span>
      <h3 class="card__title"><a href="${escapeAttr(item.url)}" target="_blank" rel="noopener">${escapeHTML(item.title)}</a></h3>
    </div>
    ${item.description ? `<p class="card__description">${escapeHTML(item.description)}</p>` : ''}
    <div class="card__meta">
      ${item.author ? `<span class="card__meta-item"><span class="material-icons-outlined">person</span>${escapeHTML(truncate(item.author, 30))}</span>` : ''}
      <span class="card__meta-item"><span class="material-icons-outlined">schedule</span>${timeAgo(item.publishedAt)}</span>
      ${isGitHub && item.extra?.tagName ? `<span class="card__meta-item"><span class="material-icons-outlined">local_offer</span>${escapeHTML(item.extra.tagName)}</span>` : ''}
      ${isGitHub && item.engagement.score ? `<span class="card__meta-item"><span class="material-icons-outlined">star</span>${formatNumber(item.engagement.score)}</span>` : ''}
      ${isHFModel && item.extra?.downloads ? `<span class="card__meta-item"><span class="material-icons-outlined">download</span>${formatNumber(item.extra.downloads)}</span>` : ''}
      ${isHFModel && item.extra?.likes ? `<span class="card__meta-item"><span class="material-icons-outlined">favorite</span>${formatNumber(item.extra.likes)}</span>` : ''}
      ${!isGitHub && !isHFModel && item.engagement.score ? `<span class="card__meta-item"><span class="material-icons-outlined">arrow_upward</span>${formatNumber(item.engagement.score)}</span>` : ''}
      ${!isGitHub && !isHFModel && item.engagement.comments ? `<span class="card__meta-item"><span class="material-icons-outlined">chat_bubble_outline</span>${formatNumber(item.engagement.comments)}</span>` : ''}
    </div>
    ${tags.length ? `<div class="card__tags">${tags.map(t => `<span class="card__tag">${escapeHTML(t)}</span>`).join('')}</div>` : ''}
  `;
  return el;
}

export function createResourceCard(resource) {
  const el = document.createElement('article');
  el.className = 'resource-card';
  el.dataset.cost = resource.cost;
  el.dataset.level = resource.level;

  el.innerHTML = `
    <div class="resource-card__header">
      <span class="resource-card__cost resource-card__cost--${resource.cost}">${resource.cost}</span>
      <span class="resource-card__level resource-card__level--${resource.level}">${resource.level}</span>
    </div>
    <h3 class="resource-card__title"><a href="${escapeAttr(resource.url)}" target="_blank" rel="noopener">${escapeHTML(resource.title)}</a></h3>
    <p class="resource-card__description">${escapeHTML(resource.description)}</p>
    <span class="resource-card__provider"><span class="material-icons-outlined">business</span>${escapeHTML(resource.provider)}</span>
    ${resource.tags?.length ? `<div class="resource-card__tags">${resource.tags.map(t => `<span class="resource-card__tag">${escapeHTML(t)}</span>`).join('')}</div>` : ''}
  `;
  return el;
}

export function createPodcasterGroup(channel, videos) {
  const el = document.createElement('div');
  el.dataset.category = channel.category;

  const desc = channel.description.length > 100
    ? channel.description.slice(0, 100) + '...'
    : channel.description;

  const displayVideos = videos.slice(0, 3);
  el.className = `channel-group${displayVideos.length === 0 ? ' channel-group--no-videos' : ''}`;

  el.innerHTML = `
    <div class="channel-group__header">
      <div class="channel-group__title-row">
        <span class="channel-group__category channel-group__category--${channel.category}">${escapeHTML(channel.category)}</span>
        <h3 class="channel-group__name"><a href="${escapeAttr(channel.url)}" target="_blank" rel="noopener">${escapeHTML(channel.title)}</a></h3>
      </div>
      <div class="channel-group__meta">
        <span><span class="material-icons-outlined">person</span>${escapeHTML(channel.host)}</span>
        <span><span class="material-icons-outlined">group</span>${escapeHTML(channel.subscribers)}</span>
      </div>
      <p class="channel-group__desc">${escapeHTML(desc)}</p>
    </div>
    ${displayVideos.length ? `<div class="channel-group__videos">
      ${displayVideos.map(v => `
        <a href="${escapeAttr(v.url)}" target="_blank" rel="noopener" class="channel-group__video">
          <div class="channel-group__video-img">
            <img src="${escapeAttr(v.thumbnail)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${escapeAttr(v.videoId)}/mqdefault.jpg'">
            <span class="channel-group__video-play material-icons-outlined">play_circle_filled</span>
          </div>
          <span class="channel-group__video-title">${escapeHTML(v.title)}</span>
        </a>
      `).join('')}
    </div>` : ''}
  `;

  return el;
}

export function createPopularEpisodeCard(episode) {
  const el = document.createElement('a');
  el.className = 'popular-episode';
  el.href = `https://www.youtube.com/watch?v=${escapeAttr(episode.videoId)}`;
  el.target = '_blank';
  el.rel = 'noopener';
  el.dataset.category = episode.category;

  el.innerHTML = `
    <div class="popular-episode__img">
      <img src="${escapeAttr(episode.thumbnail)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${escapeAttr(episode.videoId)}/mqdefault.jpg'">
      <span class="popular-episode__play material-icons-outlined">play_circle_filled</span>
      <span class="popular-episode__duration">${escapeHTML(episode.duration)}</span>
    </div>
    <div class="popular-episode__body">
      <h4 class="popular-episode__title">${escapeHTML(episode.title)}</h4>
      <span class="popular-episode__channel">${escapeHTML(episode.channel)}</span>
      <div class="popular-episode__meta">
        <span class="popular-episode__views"><span class="material-icons-outlined">visibility</span>${escapeHTML(episode.views)}</span>
        <span><span class="material-icons-outlined">schedule</span>${escapeHTML(episode.date)}</span>
      </div>
    </div>
  `;
  return el;
}

function formatVideoDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '...' : str;
}
