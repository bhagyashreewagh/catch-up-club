import { getClient } from '../utils/anthropicClient.js';
import { truncateTranscript } from '../utils/youtube.js';
import type { AuditReport } from '../types.js';


export async function runFacultyAgent(transcriptText: string): Promise<AuditReport> {
  const text = truncateTranscript(transcriptText);

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 6144,
    system: `You are Fathom's Pedagogical Audit Agent. You help faculty members improve their teaching through private, evidence-based, compassionate feedback. You are specific, constructive, and always cite exact timestamps. You never generalize - every observation comes from the actual transcript. You output only valid JSON. Never include markdown fences.`,
    messages: [{
      role: 'user',
      content: `Audit this lecture transcript across four dimensions. This report is private and for the instructor's eyes only.

DIMENSIONS:
1. PEDAGOGICAL (0-100): Learning objectives clarity, concept scaffolding, use of examples, metacognitive prompts, assessment alignment
2. ACCESSIBILITY (0-100): Pacing, jargon definition, assumed prior knowledge, redundancy for retention, inclusive pacing
3. CLARITY (0-100): Logical flow, signposting, transitions, repetition of key points, concrete examples
4. EQUITY (0-100): Inclusive language, diverse examples, cultural assumptions, representation in citations/examples

For each dimension provide:
- score: 0-100
- strengths: array of 2-3 specific strengths with evidence from the transcript
- issues: array of 2-4 specific issues each with timestamp (seconds), description, and actionable suggestion

Also identify topPriority: the single change that would most improve this lecture, with the exact timestamp, what the issue is, and a suggested rewrite of that specific moment.

overall: weighted average of all four scores.

Return ONLY this JSON (no markdown, no explanation):
{
  "overall": 75,
  "pedagogical": {
    "score": 80,
    "strengths": ["Clear learning objectives stated at 0:15 - students immediately know what they'll learn"],
    "issues": [{"timestamp": 340, "description": "Introduces eigenvalues before establishing what vectors are", "suggestion": "Add a 30-second primer: 'Before we go further, let me remind you what a vector is...'"}]
  },
  "accessibility": {"score": 70, "strengths": [], "issues": []},
  "clarity": {"score": 78, "strengths": [], "issues": []},
  "equity": {"score": 72, "strengths": [], "issues": []},
  "topPriority": {
    "timestamp": 234,
    "issue": "Dense terminology block with no definitions or examples",
    "suggestedRewrite": "Let me break each of these terms down before we move on. First, [term] means..."
  }
}

TRANSCRIPT:
${text}`,
    }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Faculty agent returned malformed output');

  return JSON.parse(jsonMatch[0]) as AuditReport;
}
