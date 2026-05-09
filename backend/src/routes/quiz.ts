import { Router } from 'express';
import type { Request, Response } from 'express';

import { getClient } from '../utils/anthropicClient.js';
import { analysisCache } from '../agents/orchestrator.js';
import { truncateTranscript, segmentsToText } from '../utils/youtube.js';

const router = Router();

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  zh: 'Mandarin Chinese', hi: 'Hindi', pt: 'Portuguese',
  ar: 'Arabic', ja: 'Japanese', ko: 'Korean', it: 'Italian',
};

export interface QuizQuestion {
  id: string;
  question: string;
  timestampHint: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface QuizEvaluation {
  correct: boolean;
  score: number;
  feedback: string;
  modelAnswer: string;
  timestamp: number;
}

router.post('/generate', async (req: Request, res: Response) => {
  const { videoId, language = 'en' } = req.body as { videoId: string; language?: string };

  const cached = analysisCache.get(videoId + ':' + language) ?? analysisCache.get(videoId + ':en');
  if (!cached) {
    res.status(404).json({ error: 'Video not analyzed yet.' });
    return;
  }

  const concepts = cached.graph.concepts
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 8);

  const transcriptText = truncateTranscript(segmentsToText(cached.segments), 60000);
  const langName = LANGUAGE_NAMES[language] ?? 'English';
  const langInstruction = language !== 'en'
    ? `\nIMPORTANT: Write ALL questions and topic names in ${langName}.`
    : '';

  try {
    const response = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `You are Fathom's Socratic Quiz Agent. You generate questions that test deep understanding, not just memorization. Inspired by the Feynman Technique: if a student can explain it simply, they truly understand it. Return only valid JSON.`,
      messages: [{
        role: 'user',
        content: `Based on this lecture, generate 6 quiz questions that test genuine understanding.${langInstruction}

Key concepts to cover: ${concepts.map(c => c.name).join(', ')}

Questions should:
- Test application and understanding, not just recall
- Mix difficulty levels (2 easy, 2 medium, 2 hard)
- Be open-ended (not multiple choice) so students must articulate understanding
- Be specific to the actual content of this lecture

Return ONLY this JSON (no markdown):
[{"id":"q1","question":"...","timestampHint":0,"difficulty":"medium","topic":"concept name"}]

TRANSCRIPT (partial):
${transcriptText}`,
      }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '[]';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const questions: QuizQuestion[] = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    res.json({ questions });
  } catch {
    res.status(500).json({ error: 'Failed to generate quiz.' });
  }
});

router.post('/evaluate', async (req: Request, res: Response) => {
  const { videoId, question, studentAnswer, language = 'en' } = req.body as {
    videoId: string;
    question: string;
    studentAnswer: string;
    language?: string;
  };

  const cached = analysisCache.get(videoId + ':' + language) ?? analysisCache.get(videoId + ':en');
  if (!cached) {
    res.status(404).json({ error: 'Video not analyzed yet.' });
    return;
  }

  const transcriptText = truncateTranscript(segmentsToText(cached.segments), 60000);
  const langName = LANGUAGE_NAMES[language] ?? 'English';
  const langInstruction = language !== 'en'
    ? `\nIMPORTANT: Write your feedback and modelAnswer in ${langName}.`
    : '';

  try {
    const response = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are Fathom's Answer Evaluation Agent. You evaluate student answers with honesty and kindness. You always ground your feedback in the actual lecture content. Return only valid JSON.`,
      messages: [{
        role: 'user',
        content: `Evaluate this student's answer.${langInstruction}

QUESTION: ${question}
STUDENT'S ANSWER: ${studentAnswer}

Based on the lecture transcript below, evaluate:
- correct: true if the answer demonstrates genuine understanding (doesn't have to be perfect)
- score: 0-100
- feedback: 2-3 sentences of specific, constructive feedback
- modelAnswer: what a strong answer would look like (2-3 sentences)
- timestamp: seconds in the lecture where this is best explained

Return ONLY this JSON (no markdown):
{"correct":true,"score":75,"feedback":"...","modelAnswer":"...","timestamp":0}

TRANSCRIPT (partial):
${transcriptText}`,
      }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const evaluation: QuizEvaluation = jsonMatch ? JSON.parse(jsonMatch[0]) : { correct: false, score: 0, feedback: 'Could not evaluate.', modelAnswer: '', timestamp: 0 };
    res.json({ evaluation });
  } catch {
    res.status(500).json({ error: 'Failed to evaluate answer.' });
  }
});

export default router;
