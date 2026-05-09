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
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error('Invalid YouTube URL. Please use a standard youtube.com/watch or youtu.be link.');

  const [video, segments] = await Promise.all([
    getVideoInfo(videoId),
    getTranscript(videoId),
  ]);

  const text = segmentsToText(segments);
  const wordCount = text.split(/\s+/).length;
  const lastSegment = segments[segments.length - 1];
  const durationMinutes = lastSegment
    ? Math.ceil((lastSegment.start + lastSegment.duration) / 60)
    : 0;

  return { video, segments, text, wordCount, durationMinutes };
}
