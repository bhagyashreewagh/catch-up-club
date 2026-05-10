import { YoutubeTranscript } from 'youtube-transcript';
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
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const res = await fetch(oembedUrl);
  if (!res.ok) throw new Error(`Could not fetch video info (status ${res.status}). Is the video public?`);
  const data = await res.json() as { title: string; author_name: string };
  return {
    id: videoId,
    title: data.title,
    author: data.author_name,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export async function getTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const raw = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' }).catch(async () => {
    // Fallback: try without lang preference
    return YoutubeTranscript.fetchTranscript(videoId);
  });

  if (!raw || raw.length === 0) {
    throw new Error('No transcript found. The video may have captions disabled or be a live stream.');
  }

  return raw.map(s => ({
    text: s.text.replace(/\n/g, ' ').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))),
    start: s.offset / 1000,
    duration: s.duration / 1000,
  }));
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
