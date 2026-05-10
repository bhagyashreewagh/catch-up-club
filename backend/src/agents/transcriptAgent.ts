import { getVideoInfo, getTranscript, segmentsToText, extractVideoId } from '../utils/youtube.js';
import type { VideoInfo, TranscriptSegment } from '../types.js';

export interface TranscriptResult {
  video: VideoInfo;
  segments: TranscriptSegment[];
  text: string;
  wordCount: number;
  durationMinutes: number;
}

export async function runTranscriptAgent(url: string): Promise<TranscriptResult> {
  // Detect YouTube music radio / auto-playlist URLs before extracting ID
  if (/[?&]start_radio=1/.test(url) || /[?&]list=RD/.test(url)) {
    throw new Error("That looks like a YouTube Music radio link. Please paste a direct lecture URL — e.g. youtube.com/watch?v=...");
  }

  const videoId = extractVideoId(url);
  if (!videoId) throw new Error("Couldn't recognise that as a YouTube URL. Try pasting the full link, e.g. https://www.youtube.com/watch?v=abc123");

  const [video, segments] = await Promise.all([
    getVideoInfo(videoId),
    getTranscript(videoId),
  ]);

  // Guard: detect music videos by ♪ symbol prevalence
  const musicSegments = segments.filter(s => s.text.includes('♪') || s.text.includes('♫'));
  if (musicSegments.length > segments.length * 0.3) {
    throw new Error('This looks like a music video, not a lecture. Please paste a YouTube lecture or educational video URL.');
  }

  const text = segmentsToText(segments);
  const wordCount = text.split(/\s+/).length;

  // Guard: too short to be a useful lecture (< 100 real words)
  if (wordCount < 100) {
    throw new Error('This video is too short or has too little speech to analyze. Please use a lecture that is at least a few minutes long.');
  }

  const lastSegment = segments[segments.length - 1];
  const durationMinutes = lastSegment
    ? Math.ceil((lastSegment.start + lastSegment.duration) / 60)
    : 0;

  return { video, segments, text, wordCount, durationMinutes };
}
