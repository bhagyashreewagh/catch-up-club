import { getClient } from '../utils/anthropicClient.js';
import { truncateTranscript } from '../utils/youtube.js';
import type { KnowledgeGraph } from '../types.js';


export async function runKnowledgeAgent(transcriptText: string): Promise<KnowledgeGraph> {
  const text = truncateTranscript(transcriptText);

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: `You are Fathom's Knowledge Extraction Agent. You analyze university lecture transcripts and extract their conceptual DNA: the concepts, their meanings, and how they connect. You are precise, thorough, and output only valid JSON. Never include markdown fences.`,
    messages: [{
      role: 'user',
      content: `Analyze this lecture transcript and extract its knowledge structure.

Extract up to 25 key concepts and the relationships between them.

For each concept:
- id: kebab-case unique identifier
- name: clear, concise name (as a professor would write it)
- description: 1-2 sentences explaining what it is and why it matters
- timestamp: seconds from start where it's first meaningfully introduced
- category: "definition" | "theory" | "example" | "fact" | "process"
- importance: 1-10 (how central is this to understanding the lecture)

For each relationship:
- source: concept id
- target: concept id
- type: "extends" | "contrasts" | "requires" | "example_of" | "leads_to" | "related"
- strength: 1-10

Return ONLY this JSON structure (no markdown, no explanation):
{"concepts":[{"id":"","name":"","description":"","timestamp":0,"category":"definition","importance":8}],"relationships":[{"source":"","target":"","type":"extends","strength":7}]}

TRANSCRIPT:
${text}`,
    }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Knowledge agent returned malformed output');

  const graph = JSON.parse(jsonMatch[0]) as KnowledgeGraph;
  // Ensure no orphan relationships
  const conceptIds = new Set(graph.concepts.map(c => c.id));
  graph.relationships = graph.relationships.filter(
    r => conceptIds.has(r.source) && conceptIds.has(r.target)
  );

  return graph;
}
