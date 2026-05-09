import { getClient } from '../utils/anthropicClient.js';
import { truncateTranscript } from '../utils/youtube.js';
import type { ProvostResult, VideoInfo } from '../types.js';


export async function runCurriculumAgent(
  videos: VideoInfo[],
  transcripts: string[],
  objectives: string[]
): Promise<ProvostResult> {
  const combinedTranscripts = transcripts.map((t, i) => {
    const truncated = truncateTranscript(t, Math.floor(80000 / transcripts.length));
    return `=== LECTURE ${i + 1}: "${videos[i].title}" ===\n${truncated}`;
  }).join('\n\n');

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: `You are Fathom's Curriculum Analysis Agent. You help university leaders verify that courses deliver what they promise. You are analytical, evidence-based, and precise. You cite specific moments. You output only valid JSON. Never include markdown fences.`,
    messages: [{
      role: 'user',
      content: `Analyze whether these course lectures actually deliver on the stated learning objectives.

STATED LEARNING OBJECTIVES:
${objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

For each objective:
- coverage: "covered" (>70% addressed), "partial" (30-70%), or "missing" (<30%)
- coveragePercent: 0-100
- relatedTimestamps: up to 3 specific moments from the transcripts that address this objective (videoIndex is 0-based, timestamp in seconds, quote is the actual words said)

Also:
- overallCoverage: weighted average of all coverage percentages
- topGaps: 3 objectives most underserved (exact text)
- topStrengths: 3 objectives best addressed (exact text)

Return ONLY this JSON (no markdown, no explanation):
{
  "objectives": [
    {
      "text": "Students will be able to...",
      "coverage": "covered",
      "coveragePercent": 85,
      "relatedTimestamps": [{"videoIndex": 0, "timestamp": 145, "quote": "Here we demonstrate exactly how..."}]
    }
  ],
  "overallCoverage": 72,
  "topGaps": ["objective text here"],
  "topStrengths": ["objective text here"]
}

LECTURE TRANSCRIPTS:
${combinedTranscripts}`,
    }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Curriculum agent returned malformed output');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    videos,
    objectives: parsed.objectives,
    overallCoverage: parsed.overallCoverage,
    topGaps: parsed.topGaps,
    topStrengths: parsed.topStrengths,
  } as ProvostResult;
}
