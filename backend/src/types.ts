export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

export interface VideoInfo {
  id: string;
  title: string;
  author: string;
  thumbnailUrl: string;
  url: string;
  durationSeconds?: number;
}

export interface Concept {
  id: string;
  name: string;
  description: string;
  timestamp: number;
  category: 'definition' | 'theory' | 'example' | 'fact' | 'process';
  importance: number;
}

export interface Relationship {
  source: string;
  target: string;
  type: 'extends' | 'contrasts' | 'requires' | 'example_of' | 'leads_to' | 'related';
  strength: number;
}

export interface KnowledgeGraph {
  concepts: Concept[];
  relationships: Relationship[];
}

export interface OutlineItem {
  title: string;
  timestamp: number;
  depth: number;
  summary: string;
  children: OutlineItem[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  timestamp: number;
  conceptId: string;
  hint?: string;
}

export interface Summaries {
  brief: string;
  standard: string;
  comprehensive: string;
}

export interface StudyMaterials {
  outline: OutlineItem[];
  flashcards: Flashcard[];
  summaries: Summaries;
  keyTerms: string[];
}

export interface AuditIssue {
  timestamp: number;
  description: string;
  suggestion: string;
}

export interface AuditDimension {
  score: number;
  strengths: string[];
  issues: AuditIssue[];
}

export interface AuditReport {
  overall: number;
  pedagogical: AuditDimension;
  accessibility: AuditDimension;
  clarity: AuditDimension;
  equity: AuditDimension;
  topPriority: {
    timestamp: number;
    issue: string;
    suggestedRewrite: string;
  };
}

export interface CurriculumObjective {
  text: string;
  coverage: 'covered' | 'partial' | 'missing';
  coveragePercent: number;
  relatedTimestamps: Array<{ videoIndex: number; timestamp: number; quote: string }>;
}

export interface ProvostResult {
  videos: VideoInfo[];
  objectives: CurriculumObjective[];
  overallCoverage: number;
  topGaps: string[];
  topStrengths: string[];
}

export interface AnalysisResult {
  video: VideoInfo;
  segments: TranscriptSegment[];
  graph: KnowledgeGraph;
  study: StudyMaterials;
  audit?: AuditReport;
  language?: string;
}

export interface SearchResult {
  timestamp: number;
  quote: string;
  explanation: string;
  relevance: number;
}

export type SSEEvent =
  | { type: 'agent_start'; agent: string; message: string }
  | { type: 'agent_progress'; agent: string; message: string; detail?: string }
  | { type: 'agent_complete'; agent: string; message: string }
  | { type: 'complete'; result: AnalysisResult }
  | { type: 'error'; message: string };
