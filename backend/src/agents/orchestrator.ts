import type { Response } from 'express';
import type { SSEEvent, AnalysisResult } from '../types.js';
import { runTranscriptAgent } from './transcriptAgent.js';
import { runKnowledgeAgent } from './knowledgeAgent.js';
import { runStudyAgent } from './studyAgent.js';
import { runFacultyAgent } from './facultyAgent.js';

export const analysisCache = new Map<string, AnalysisResult>();

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  zh: 'Mandarin Chinese', hi: 'Hindi', pt: 'Portuguese',
  ar: 'Arabic', ja: 'Japanese', ko: 'Korean', it: 'Italian',
};

function send(res: Response, event: SSEEvent) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export async function orchestrate(
  url: string,
  includeFaculty: boolean,
  language: string,
  res: Response
): Promise<void> {
  try {
    send(res, { type: 'agent_start', agent: 'transcript', message: 'Fetching lecture from YouTube...' });

    const transcriptResult = await runTranscriptAgent(url);
    const { video, segments, text, wordCount, durationMinutes } = transcriptResult;

    const cached = analysisCache.get(video.id + ':' + language);
    if (cached && !includeFaculty) {
      send(res, { type: 'agent_complete', agent: 'transcript', message: `Loaded from cache: ${durationMinutes} min lecture` });
      send(res, { type: 'complete', result: cached });
      return;
    }

    send(res, {
      type: 'agent_complete',
      agent: 'transcript',
      message: `Got it: ${durationMinutes} min lecture, ~${wordCount.toLocaleString()} words`,
    });

    send(res, { type: 'agent_start', agent: 'knowledge', message: 'Mapping concept relationships...' });
    if (includeFaculty) {
      send(res, { type: 'agent_start', agent: 'faculty', message: 'Auditing pedagogical quality...' });
    }

    const parallelTasks: Promise<unknown>[] = [runKnowledgeAgent(text)];
    if (includeFaculty) parallelTasks.push(runFacultyAgent(text));

    const [graph, audit] = await Promise.all(parallelTasks) as [Awaited<ReturnType<typeof runKnowledgeAgent>>, Awaited<ReturnType<typeof runFacultyAgent>> | undefined];

    send(res, {
      type: 'agent_complete',
      agent: 'knowledge',
      message: `Found ${graph.concepts.length} concepts, ${graph.relationships.length} connections`,
    });

    if (includeFaculty && audit) {
      send(res, {
        type: 'agent_complete',
        agent: 'faculty',
        message: `Audit complete, overall score ${audit.overall}/100`,
      });
    }

    let study;
    if (!includeFaculty) {
      const langName = LANGUAGE_NAMES[language] ?? 'English';
      const studyMsg = language !== 'en'
        ? `Crafting study materials in ${langName}...`
        : 'Crafting personalized study materials...';
      send(res, { type: 'agent_start', agent: 'study', message: studyMsg });

      study = await runStudyAgent(text, graph, language);

      send(res, {
        type: 'agent_complete',
        agent: 'study',
        message: `${study.flashcards.length} flashcards, ${study.outline.length} chapters, 3 summaries ready`,
      });
    }

    const result: AnalysisResult = {
      video,
      segments,
      graph,
      study: study ?? { outline: [], flashcards: [], summaries: { brief: '', standard: '', comprehensive: '' }, keyTerms: [] },
      language,
      ...(includeFaculty && audit ? { audit } : {}),
    };

    analysisCache.set(video.id + ':' + language, result);
    send(res, { type: 'complete', result });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred';
    send(res, { type: 'error', message });
  }
}
