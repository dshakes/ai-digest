import { fetchXML } from './fetcher.js';
import { cache } from './cache.js';

const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours
const YT_FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=';
const MAX_VIDEOS = 5;

function parseEntry(entry) {
  const videoId = entry.querySelector('videoId')?.textContent
    || entry.querySelector('id')?.textContent?.split(':').pop()
    || '';
  return {
    title: entry.querySelector('title')?.textContent || '',
    url: `https://www.youtube.com/watch?v=${videoId}`,
    videoId,
    publishedAt: entry.querySelector('published')?.textContent || '',
    thumbnail: entry.querySelector('group thumbnail')?.getAttribute('url')
      || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    description: entry.querySelector('group description')?.textContent || '',
  };
}

const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;

async function fetchChannelVideos(channelId) {
  const cached = cache.get(`podcast-yt:${channelId}`);
  if (cached) return cached;

  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) await delay(RETRY_DELAY);
      const doc = await fetchXML(`${YT_FEED_URL}${channelId}`, { useProxy: true, timeout: 12000 });
      const entries = Array.from(doc.querySelectorAll('entry')).slice(0, MAX_VIDEOS);
      const videos = entries.map(parseEntry);
      cache.set(`podcast-yt:${channelId}`, videos, CACHE_TTL);
      return videos;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export async function fetchAllChannelVideos(channels) {
  const videosByChannel = {};
  let errorCount = 0;

  // Fetch in small batches of 3 to avoid proxy rate limits
  const BATCH = 3;
  for (let i = 0; i < channels.length; i += BATCH) {
    const batch = channels.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(ch => fetchChannelVideos(ch.channelId))
    );
    results.forEach((result, j) => {
      const channelId = batch[j].channelId;
      if (result.status === 'fulfilled') {
        videosByChannel[channelId] = result.value;
      } else {
        videosByChannel[channelId] = [];
        errorCount++;
      }
    });
    // Small pause between batches
    if (i + BATCH < channels.length) await delay(300);
  }

  return { videosByChannel, errorCount };
}
