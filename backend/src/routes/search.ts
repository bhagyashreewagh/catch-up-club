import { Router } from 'express';
import type { Request, Response } from 'express';

import { getClient } from '../utils/anthropicClient.js';
import { analysisCache } from '../agents/orchestrator.js';
import { truncateTranscript, segmentsToText } from '../utils/youtube.js';
import type { SearchResult } from '../types.js';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { videoId, question, language = 'en' } = req.body as { videoId: string; question: string; language?: string };

  if (!videoId || !question) {
    res.status(400).json({ error: 'Missing videoId or question' });
    return;
  }

  // Cache key is stored as "videoId:language" — try exact match first, then any language
  const cached =
    analysisCache.get(videoId + ':' + language) ??
    analysisCache.get(videoId + ':en') ??
    [...analysisCache.entries()].find(([k]) => k.startsWith(videoId + ':'))?.[1];

  if (!cached) {
    res.status(404).json({ error: 'Video not analyzed yet. Please analyze it first.' });
    return;
  }

  const transcriptText = truncateTranscript(segmentsToText(cached.segments));

  try {
    const response = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are Fathom's Semantic Search Agent. Given a student's question and a lecture transcript, find the most relevant moments where the lecture addresses that question. Be precise with timestamps. Return only valid JSON.`,
      messages: [{
        role: 'user',
        content: `Student question: "${question}"

Find up to 3 moments in this lecture that best answer this question. For each:
- timestamp: seconds from start (use the [M:SS] markers)
- quote: the exact words said at that moment (verbatim, ~15-30 words)
- explanation: why this moment is relevant to the question (1-2 sentences)
- relevance: 1-10 score
${language !== 'en' ? `\nIMPORTANT: Write the explanation field in ${language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : language === 'de' ? 'German' : language === 'zh' ? 'Mandarin Chinese' : language === 'hi' ? 'Hindi' : language === 'pt' ? 'Portuguese' : language === 'ar' ? 'Arabic' : language === 'ja' ? 'Japanese' : language === 'ko' ? 'Korean' : language === 'it' ? 'Italian' : 'English'}. The quote should remain as spoken in the video.` : ''}
Return ONLY this JSON (no markdown):
[{"timestamp":0,"quote":"...","explanation":"...","relevance":9}]

TRANSCRIPT:
${transcriptText}`,
      }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const results: SearchResult[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    res.json({ results: results.sort((a, b) => b.relevance - a.relevance) });
  } catch (err) {
    res.status(500).json({ error: 'Search failed. Please try again.' });
  }
});

export default router;
