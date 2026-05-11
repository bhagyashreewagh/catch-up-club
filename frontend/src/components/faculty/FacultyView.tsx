import { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, BookOpen, Play, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Users } from 'lucide-react';
import type { AnalysisResult, AuditDimension } from '../../types';

interface Props {
  result: AnalysisResult;
  onHome: () => void;
  onSeek: (s: number) => void;
  onSwitchStudent: () => void;
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="36" cy="36" r={r} stroke="#E0E0E0" strokeWidth="6" fill="none" />
      <circle
        cx="36" cy="36" r={r}
        stroke={color}
        strokeWidth="6"
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s' }}
      />
    </svg>
  );
}

function DimensionCard({ label, dim, color, onSeek }: { label: string; dim: AuditDimension; color: string; onSeek: (s: number) => void }) {
  const [open, setOpen] = useState(false);

  function fmtTime(s: number) {
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  return (
    <div data-spotlight="true" style={{ border: '1.5px solid #DBDBDB', borderRadius: 16, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ScoreRing score={dim.score} color={color} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color }}>{dim.score}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1628', marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 13, color: '#818181' }}>
            {dim.strengths.length} strengths · {dim.issues.length} issues
          </div>
        </div>
        {open
          ? <ChevronUp size={16} color="#818181" />
          : <ChevronDown size={16} color="#818181" />}
      </div>

      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {dim.strengths.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2A8A84', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 8px' }}>
                <CheckCircle2 size={13} /> Strengths
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dim.strengths.map((s, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#636363', paddingLeft: 12, borderLeft: '2px solid #32A29B40', lineHeight: 1.5 }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {dim.issues.length > 0 && (
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#7C5D0E', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 8px' }}>
                <AlertTriangle size={13} /> Issues & suggestions
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dim.issues.map((issue, i) => (
                  <div key={i} style={{ background: '#FAFAFA', border: '1px solid #E0E0E0', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                      <p style={{ fontSize: 13, color: '#1A1628', lineHeight: 1.5, margin: 0 }}>{issue.description}</p>
                      <button
                        onClick={() => onSeek(issue.timestamp)}
                        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'monospace', color: '#B85A00', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                      >
                        <Play size={11} />
                        {fmtTime(issue.timestamp)}
                      </button>
                    </div>
                    <p style={{ fontSize: 12, color: '#636363', fontStyle: 'italic', margin: 0 }}>→ {issue.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function FacultyView({ result, onHome, onSeek, onSwitchStudent }: Props) {
  const audit = result.audit;
  if (!audit) return null;

  function fmtTime(s: number) {
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  const overallColor = audit.overall >= 80 ? '#2A8A84' : audit.overall >= 60 ? '#7C5D0E' : '#991B1B';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', borderBottom: '1.5px solid #DBDBDB' }}>
        <button onClick={onHome} className="btn-ghost" style={{ padding: '6px 10px' }}>
          <Home size={16} />
        </button>
        <div style={{ width: 1, height: 16, background: '#DBDBDB' }} />
        <Users size={16} color="#B85A00" />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1628' }}>The Catch Up Club</span>
        <span style={{ color: '#DBDBDB' }}>·</span>
        <span style={{ fontSize: 13, color: '#636363' }}>Faculty Audit</span>
        <div style={{ flex: 1 }} />
        <button onClick={onSwitchStudent} className="btn-ghost" style={{ fontSize: 13 }}>
          <BookOpen size={14} />
          Student View
        </button>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        {/* Video title */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 12, color: '#818181', marginBottom: 4, margin: '0 0 4px' }}>Audit for</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1A1628', lineHeight: 1.3, margin: '0 0 4px' }}>{result.video.title}</h1>
          <p style={{ fontSize: 14, color: '#818181', margin: 0 }}>{result.video.author}</p>
        </div>

        {/* Overall score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ border: '1.5px solid #DBDBDB', borderRadius: 16, padding: 24, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24, background: '#fff' }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <ScoreRing score={audit.overall} color={overallColor} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 900, color: overallColor }}>{audit.overall}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1628', marginBottom: 6 }}>
              Overall Score: {audit.overall >= 80 ? 'Strong' : audit.overall >= 60 ? 'Developing' : 'Needs Work'}
            </div>
            <p style={{ fontSize: 14, color: '#636363', lineHeight: 1.65, maxWidth: 440, margin: 0 }}>
              This report is private and for your eyes only. Use it to identify one or two improvements before your next lecture.
            </p>
          </div>
        </motion.div>

        {/* Top priority */}
        <div style={{ border: '1.5px solid #C9AA5A50', borderRadius: 16, padding: 20, marginBottom: 24, background: '#FEF9EE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={16} color="#7C5D0E" />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#7C5D0E' }}>Highest-impact improvement</span>
            <button
              onClick={() => onSeek(audit.topPriority.timestamp)}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'monospace', color: '#B85A00', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
            >
              <Play size={11} />
              {fmtTime(audit.topPriority.timestamp)}
            </button>
          </div>
          <p style={{ fontSize: 14, color: '#1A1628', marginBottom: 12, margin: '0 0 12px' }}>{audit.topPriority.issue}</p>
          <div style={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 12, color: '#818181', fontWeight: 700, marginBottom: 4, margin: '0 0 4px' }}>Suggested rewrite:</p>
            <p style={{ fontSize: 13, color: '#2A8A84', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>"{audit.topPriority.suggestedRewrite}"</p>
          </div>
        </div>

        {/* Four dimensions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <DimensionCard label="Pedagogical"  dim={audit.pedagogical}  color="#6366f1" onSeek={onSeek} />
          <DimensionCard label="Accessibility" dim={audit.accessibility} color="#0891b2" onSeek={onSeek} />
          <DimensionCard label="Clarity"      dim={audit.clarity}      color="#2A8A84" onSeek={onSeek} />
          <DimensionCard label="Equity"       dim={audit.equity}       color="#7C5D0E" onSeek={onSeek} />
        </div>

      </div>
    </div>
  );
}
