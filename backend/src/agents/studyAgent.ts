import { getClient } from '../utils/anthropicClient.js';
import { truncateTranscript } from '../utils/youtube.js';
import type { StudyMaterials, KnowledgeGraph } from '../types.js';


const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  zh: 'Mandarin Chinese', hi: 'Hindi', pt: 'Portuguese',
  ar: 'Arabic', ja: 'Japanese', ko: 'Korean', it: 'Italian',
};

export async function runStudyAgent(
  transcriptText: string,
  graph: KnowledgeGraph,
  language = 'en'
): Promise<StudyMaterials> {
  const text = truncateTranscript(transcriptText);
  const conceptNames = graph.concepts
    .sort((a, b) => b.importance - a.importance)
    .slice(0, 15)
    .map(c => c.name)
    .join(', ');

  const langName = LANGUAGE_NAMES[language] ?? 'English';
  const langInstruction = language !== 'en'
    ? `IMPORTANT: Generate ALL human-readable text (titles, summaries, questions, answers, hints, terms) in ${langName}. Do not use English for any of these fields.`
    : '';

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: `You are Fathom's Study Materials Agent. You transform lecture transcripts into high-quality, exam-ready study materials that students actually want to use. You are precise, pedagogically sound, and output only valid JSON. Never include markdown fences.`,
    messages: [{
      role: 'user',
      content: `Based on this lecture transcript, generate comprehensive study materials.${langInstruction ? '\n\n' + langInstruction : ''}

Key concepts identified: ${conceptNames}

Create:
1. OUTLINE: 3-5 top-level sections, each with 2-4 subsections. Every item needs a timestamp (seconds) and a 1-sentence summary.
2. FLASHCARDS: Exactly 12 cards. Each card must:
   - Test one specific thing (not a vague "what is X" but a precise, exam-style question)
   - Have a clear, complete answer (not just a definition, include why it matters)
   - Include a timestamp for where to find this in the lecture
   - Include an optional hint for the hard ones
3. SUMMARIES:
   - "brief": ~100 words. The absolute essential takeaway. What you'd text a friend.
   - "standard": ~300 words. Main ideas and how they connect. What you'd write in study notes.
   - "comprehensive": ~800 words. Full coverage with examples. What you'd write before an exam.
4. KEY TERMS: 12-15 terms a student must know. Just the term names.

Return ONLY this JSON (no markdown, no explanation):
{
  "outline": [{"title":"","timestamp":0,"depth":1,"summary":"","children":[{"title":"","timestamp":0,"depth":2,"summary":"","children":[]}]}],
  "flashcards": [{"id":"fc-1","front":"","back":"","timestamp":0,"conceptId":"","hint":""}],
  "summaries": {"brief":"","standard":"","comprehensive":""},
  "keyTerms": []
}

TRANSCRIPT:
${text}`,
    }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Study agent returned malformed output');

  return JSON.parse(jsonMatch[0]) as StudyMaterials;
}
