import { YoutubeTranscript } from 'youtube-transcript';
import https from 'https';
import type { VideoInfo, TranscriptSegment } from '../types.js';

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  // Try oEmbed first
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json() as { title: string; author_name: string };
      return {
        id: videoId,
        title: data.title,
        author: data.author_name,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    }
  } catch { /* fall through to scrape */ }

  // Fallback: scrape title from YouTube page (works for public videos with embedding disabled)
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      const titleMatch = html.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : 'YouTube Lecture';
      const authorMatch = html.match(/"ownerChannelName":"([^"]+)"/);
      const author = authorMatch ? authorMatch[1] : 'Unknown';
      return {
        id: videoId,
        title,
        author,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    }
  } catch { /* fall through */ }

  // Last resort: return placeholder so transcript can still be fetched
  return {
    id: videoId,
    title: 'YouTube Lecture',
    author: 'Unknown',
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

function decodeEntities(text: string): string {
  return text
    .replace(/\n/g, ' ')
    .replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

// Primary for cloud: Supadata API (free 100/month — set SUPADATA_API_KEY env var)
async function fetchViaSupadata(videoId: string): Promise<TranscriptSegment[]> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) throw new Error('SUPADATA_API_KEY not set');

  // Use Node's https directly — avoids Node 18 experimental fetch issues
  const rawBody = await new Promise<string>((resolve, reject) => {
    const url = new URL(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&lang=en`);
    https.request(
      { hostname: url.hostname, path: url.pathname + url.search, method: 'GET', headers: { 'x-api-key': apiKey } },
      (res) => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`Supadata API error ${res.statusCode}`));
          res.resume();
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      }
    ).on('error', reject).end();
  });

  const data = JSON.parse(rawBody) as any;
  if (data?.error) throw new Error(`Supadata: ${data.message ?? data.error}`);

  // Supadata returns { content: [{ text, offset, duration }] } or { chunks: [...] }
  const chunks: any[] = data?.content ?? data?.chunks ?? data?.transcript ?? [];
  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('Supadata returned empty transcript');
  }

  return chunks.map((c: any) => ({
    text: decodeEntities(String(c.text ?? '')),
    start: (c.offset ?? 0) / 1000,
    duration: (c.duration ?? 0) / 1000,
  })).filter(s => s.text.length > 0);
}

// Fallback: youtube-transcript library (works on residential/local IPs)
async function fetchViaLibrary(videoId: string): Promise<TranscriptSegment[]> {
  const raw = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' })
    .catch(() => YoutubeTranscript.fetchTranscript(videoId));
  if (!raw || raw.length === 0) throw new Error('No transcript found via library');
  return raw.map(s => ({
    text: decodeEntities(s.text),
    start: s.offset / 1000,
    duration: s.duration / 1000,
  }));
}

export async function getTranscript(videoId: string): Promise<TranscriptSegment[]> {
  // Try Supadata first if API key is available (cloud-friendly), fall back to library (local)
  const segments = await fetchViaSupadata(videoId).catch(async (err) => {
    if (!process.env.SUPADATA_API_KEY) {
      console.log('[transcript] No SUPADATA_API_KEY, using local library');
    } else {
      console.warn('[transcript] Supadata failed, trying fallback:', err?.message);
    }
    return fetchViaLibrary(videoId).catch(() => {
      throw new Error('Could not fetch transcript. The video may not have captions enabled, or may be private.');
    });
  });

  if (!segments || segments.length === 0) {
    throw new Error('No transcript found. The video may not have captions enabled.');
  }

  return segments;
}

export function segmentsToText(segments: TranscriptSegment[]): string {
  return segments.map(s => {
    const mins = Math.floor(s.start / 60);
    const secs = Math.floor(s.start % 60);
    return `[${mins}:${secs.toString().padStart(2, '0')}] ${s.text}`;
  }).join('\n');
}

export function truncateTranscript(text: string, maxChars = 90000): string {
  if (text.length <= maxChars) return text;
  const truncated = text.slice(0, maxChars);
  const lastNewline = truncated.lastIndexOf('\n');
  return truncated.slice(0, lastNewline) + '\n[... transcript continues, showing first portion only ...]';
}
