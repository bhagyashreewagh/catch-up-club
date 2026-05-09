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

export interface StudyMaterials {
  outline: OutlineItem[];
  flashcards: Flashcard[];
  summaries: { brief: string; standard: string; comprehensive: string };
  keyTerms: string[];
}

export interface AuditDimension {
  score: number;
  strengths: string[];
  issues: Array<{ timestamp: number; description: string; suggestion: string }>;
}

export interface AuditReport {
  overall: number;
  pedagogical: AuditDimension;
  accessibility: AuditDimension;
  clarity: AuditDimension;
  equity: AuditDimension;
  topPriority: { timestamp: number; issue: string; suggestedRewrite: string };
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

export type AppView = 'landing' | 'processing' | 'student' | 'faculty' | 'provost' | 'provost-result';

export interface AgentStatus {
  agent: string;
  status: 'idle' | 'running' | 'done' | 'error';
  message: string;
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
