import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Play, Loader2, ChevronRight, RotateCcw } from 'lucide-react';
import type { QuizQuestion, QuizEvaluation } from '../../types';

interface Props {
  videoId: string;
  onSeek: (seconds: number) => void;
  language?: string;
}

type Phase = 'intro' | 'loading' | 'quiz' | 'done';

interface AnswerRecord {
  question: QuizQuestion;
  answer: string;
  evaluation: QuizEvaluation;
}

const DIFFICULTY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  easy:   { bg: '#F0F7F0', color: '#2D6A4F', border: '#32A29B' },
  medium: { bg: '#FEF9EE', color: '#7C5D0E', border: '#C9AA5A' },
  hard:   { bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5' },
};

export default function SocraticMode({ videoId, onSeek, language = 'en' }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<QuizEvaluation | null>(null);
  const [records, setRecords] = useState<AnswerRecord[]>([]);

  async function startQuiz() {
    setPhase('loading');
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, language }),
      });
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setCurrent(0);
      setRecords([]);
      setPhase('quiz');
    } catch {
      setPhase('intro');
    }
  }

  async function submitAnswer() {
    if (!answer.trim() || !questions[current]) return;
    setEvaluating(true);
    setEvaluation(null);
    try {
      const res = await fetch('/api/quiz/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, question: questions[current].question, studentAnswer: answer, language }),
      });
      const data = await res.json();
      setEvaluation(data.evaluation);
      setRecords(prev => [...prev, { question: questions[current], answer, evaluation: data.evaluation }]);
    } finally {
      setEvaluating(false);
    }
  }

  function nextQuestion() {
    if (current + 1 >= questions.length) setPhase('done');
    else { setCurrent(c => c + 1); setAnswer(''); setEvaluation(null); }
  }

  function reset() {
    setPhase('intro'); setQuestions([]); setCurrent(0);
    setAnswer(''); setEvaluation(null); setRecords([]);
  }

  function fmtTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  const avgScore = records.length
    ? Math.round(records.reduce((s, r) => s + r.evaluation.score, 0) / records.length)
    : 0;

  if (phase === 'intro') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18,
          background: '#B85A000D', border: '1.5px solid #B85A0030',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={32} color="#B85A00" />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A1628', marginBottom: 8, margin: '0 0 8px' }}>Feynman Quiz</h3>
          <p style={{ fontSize: 14, color: '#636363', maxWidth: 280, lineHeight: 1.6, margin: 0 }}>
            If you can explain it simply, you truly understand it.
            Six AI-generated questions that test deep understanding, not just recall.
          </p>
        </div>
        <button onClick={startQuiz} className="btn-primary">
          <ChevronRight size={16} />
          Start quiz
        </button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <Loader2 size={32} color="#B85A00" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 14, color: '#818181', margin: 0 }}>Generating questions from the lecture...</p>
      </div>
    );
  }

  if (phase === 'done') {
    const scoreColor = avgScore >= 70 ? '#2A8A84' : avgScore >= 50 ? '#7C5D0E' : '#991B1B';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 4 }}>
            <span style={{ color: scoreColor }}>{avgScore}</span>
            <span style={{ color: '#DBDBDB', fontSize: 28 }}>/100</span>
          </div>
          <p style={{ fontSize: 14, color: '#818181', margin: 0 }}>Average score across {records.length} questions</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {records.map((r, i) => (
            <div key={i} style={{ border: '1.5px solid #DBDBDB', borderRadius: 14, padding: 16, background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#636363', fontWeight: 500 }}>Q{i + 1}. {r.question.question}</span>
                <span style={{ fontSize: 15, fontWeight: 700, flexShrink: 0, color: r.evaluation.correct ? '#2A8A84' : '#991B1B' }}>
                  {r.evaluation.score}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#636363', lineHeight: 1.55, margin: 0 }}>{r.evaluation.feedback}</p>
            </div>
          ))}
        </div>
        <button onClick={reset} className="btn-ghost" style={{ marginTop: 16, justifyContent: 'center' }}>
          <RotateCcw size={14} />
          Try again
        </button>
      </div>
    );
  }

  const q = questions[current];
  const diffColors = DIFFICULTY_COLORS[q.difficulty] ?? DIFFICULTY_COLORS.medium;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: '#818181' }}>Question {current + 1} of {questions.length}</span>
        <span style={{
          fontSize: 12, padding: '3px 10px', borderRadius: 99,
          background: diffColors.bg, color: diffColors.color, border: `1px solid ${diffColors.border}`,
          fontWeight: 600, textTransform: 'capitalize',
        }}>
          {q.difficulty}
        </span>
      </div>

      {/* Question card */}
      <div style={{ border: '1.5px solid #DBDBDB', borderRadius: 14, padding: 16, marginBottom: 16, background: '#fff' }}>
        <div style={{ fontSize: 12, color: '#B85A00', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {q.topic}
        </div>
        <p style={{ fontSize: 15, color: '#1A1628', lineHeight: 1.6, fontWeight: 500, margin: 0 }}>{q.question}</p>
        <button
          onClick={() => onSeek(q.timestampHint)}
          style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#818181', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s', padding: 0 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#B85A00'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#818181'; }}
        >
          <Play size={12} />
          Hint: watch {fmtTime(q.timestampHint)}
        </button>
      </div>

      {/* Answer input */}
      {!evaluation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Explain it in your own words..."
            style={{
              flex: 1, background: '#fff', border: '1.5px solid #DBDBDB',
              borderRadius: 12, padding: 14, fontSize: 15, color: '#1A1628',
              fontFamily: 'inherit', outline: 'none', resize: 'none',
              minHeight: 120, transition: 'border-color 0.15s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#B85A00'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#DBDBDB'; }}
            disabled={evaluating}
          />
          <button
            onClick={submitAnswer}
            disabled={evaluating || !answer.trim()}
            className="btn-primary"
            style={{ justifyContent: 'center', padding: '14px 24px' }}
          >
            {evaluating ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Evaluating...</> : 'Submit answer'}
          </button>
        </div>
      )}

      {/* Evaluation */}
      <AnimatePresence>
        {evaluation && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <div style={{
              border: `1.5px solid ${evaluation.correct ? '#32A29B' : '#FCA5A5'}`,
              background: evaluation.correct ? '#F0F7F0' : '#FEF2F2',
              borderRadius: 14, padding: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 900, color: evaluation.correct ? '#2A8A84' : '#991B1B' }}>
                  {evaluation.score}/100
                </span>
                <span style={{ fontSize: 14, color: '#636363' }}>{evaluation.correct ? 'Nice work!' : 'Keep going'}</span>
              </div>
              <p style={{ fontSize: 13, color: '#636363', lineHeight: 1.6, margin: 0 }}>{evaluation.feedback}</p>
            </div>

            <div style={{ border: '1.5px solid #DBDBDB', borderRadius: 14, padding: 16, background: '#fff' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#818181', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Model answer
              </div>
              <p style={{ fontSize: 13, color: '#636363', lineHeight: 1.6, margin: '0 0 12px' }}>{evaluation.modelAnswer}</p>
              <button
                onClick={() => onSeek(evaluation.timestamp)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#B85A00', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                <Play size={12} />
                See it explained at {fmtTime(evaluation.timestamp)}
              </button>
            </div>

            <button onClick={nextQuestion} className="btn-primary" style={{ justifyContent: 'center', padding: '14px 24px' }}>
              {current + 1 >= questions.length ? 'See results' : 'Next question'}
              <ChevronRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
