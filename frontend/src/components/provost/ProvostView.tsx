import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Plus, Trash2, Loader2, Building2, CheckCircle2, AlertCircle, MinusCircle, Users } from 'lucide-react';
import type { ProvostResult } from '../../types';

interface Props {
  onHome: () => void;
  onResult: (r: ProvostResult) => void;
  provostResult: ProvostResult | null;
}

export default function ProvostView({ onHome, onResult, provostResult }: Props) {
  const [urls, setUrls] = useState(['', '']);
  const [objectives, setObjectives] = useState(['', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProvostResult | null>(provostResult);

  function addUrl() { if (urls.length < 10) setUrls(u => [...u, '']); }
  function removeUrl(i: number) { setUrls(u => u.filter((_, j) => j !== i)); }
  function setUrl(i: number, v: string) { setUrls(u => u.map((x, j) => j === i ? v : x)); }

  function addObj() { setObjectives(o => [...o, '']); }
  function removeObj(i: number) { setObjectives(o => o.filter((_, j) => j !== i)); }
  function setObj(i: number, v: string) { setObjectives(o => o.map((x, j) => j === i ? v : x)); }

  async function analyze() {
    const validUrls = urls.filter(u => u.trim());
    const validObjs = objectives.filter(o => o.trim());
    if (!validUrls.length || !validObjs.length) {
      setError('Add at least one URL and one learning objective.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/provost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: validUrls, objectives: validObjs }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Analysis failed');
      }
      const data: ProvostResult = await res.json();
      setResult(data);
      onResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const COVERAGE_META = {
    covered: {
      icon: <CheckCircle2 size={16} color="#2A8A84" />,
      color: '#2A8A84', bg: '#F0F7F0', border: '#32A29B50',
      barColor: '#32A29B',
    },
    partial: {
      icon: <MinusCircle size={16} color="#7C5D0E" />,
      color: '#7C5D0E', bg: '#FEF9EE', border: '#C9AA5A50',
      barColor: '#C9AA5A',
    },
    missing: {
      icon: <AlertCircle size={16} color="#991B1B" />,
      color: '#991B1B', bg: '#FEF2F2', border: '#FCA5A550',
      barColor: '#FCA5A5',
    },
  };

  const inputStyle = {
    width: '100%', background: '#fff', border: '1.5px solid #DBDBDB',
    borderRadius: 12, padding: '10px 14px', fontSize: 15, color: '#1A1628',
    fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 24px', borderBottom: '1.5px solid #DBDBDB' }}>
        <button onClick={onHome} className="btn-ghost" style={{ padding: '6px 10px' }}>
          <Home size={16} />
        </button>
        <div style={{ width: 1, height: 16, background: '#DBDBDB' }} />
        <Users size={16} color="#B85A00" />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1628' }}>The Catch Up Club</span>
        <span style={{ color: '#DBDBDB' }}>·</span>
        <Building2 size={15} color="#636363" />
        <span style={{ fontSize: 13, color: '#636363' }}>Provost View</span>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', width: '100%', padding: '40px 24px' }}>
        {!result ? (
          <>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1A1628', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
                Curriculum Coverage Analysis
              </h1>
              <p style={{ fontSize: 15, color: '#636363', lineHeight: 1.65, margin: 0 }}>
                Add lecture URLs from a single course and your stated learning objectives.
                We'll tell you exactly what's covered, what's missing, and where the gaps are.
              </p>
            </div>

            {/* URLs */}
            <div data-spotlight="true" style={{ border: '1.5px solid #DBDBDB', borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1A1628', marginBottom: 12, margin: '0 0 12px' }}>Lecture URLs</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {urls.map((url, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="url"
                      value={url}
                      onChange={e => setUrl(i, e.target.value)}
                      placeholder={`Lecture ${i + 1} YouTube URL`}
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = '#B85A00'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#DBDBDB'; }}
                    />
                    {urls.length > 1 && (
                      <button onClick={() => removeUrl(i)} className="btn-ghost" style={{ padding: '8px 10px', color: '#818181' }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {urls.length < 10 && (
                <button onClick={addUrl} className="btn-ghost" style={{ fontSize: 13 }}>
                  <Plus size={14} /> Add lecture
                </button>
              )}
            </div>

            {/* Objectives */}
            <div data-spotlight="true" style={{ border: '1.5px solid #DBDBDB', borderRadius: 16, padding: 20, marginBottom: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#1A1628', margin: '0 0 4px' }}>Learning Objectives</h2>
              <p style={{ fontSize: 13, color: '#818181', margin: '0 0 12px' }}>Copy these from your syllabus or course catalog.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {objectives.map((obj, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: '#818181', fontFamily: 'monospace', marginTop: 13, width: 20, flexShrink: 0 }}>{i + 1}.</span>
                    <textarea
                      value={obj}
                      onChange={e => setObj(i, e.target.value)}
                      placeholder="Students will be able to..."
                      rows={2}
                      style={{ ...inputStyle, resize: 'none', flex: 1 }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#B85A00'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#DBDBDB'; }}
                    />
                    {objectives.length > 1 && (
                      <button onClick={() => removeObj(i)} className="btn-ghost" style={{ padding: '8px 10px', color: '#818181', marginTop: 2 }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={addObj} className="btn-ghost" style={{ fontSize: 13 }}>
                <Plus size={14} /> Add objective
              </button>
            </div>

            {error && (
              <div style={{
                marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 14, color: '#991B1B', background: '#FEF2F2',
                border: '1.5px solid #FCA5A550', borderRadius: 12, padding: '12px 16px',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <button onClick={analyze} disabled={loading} className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '15px 24px', fontSize: 16 }}>
              {loading ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing {urls.filter(u => u.trim()).length} lectures...</>
              ) : (
                <>Analyze curriculum</>
              )}
            </button>
          </>
        ) : (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              {/* Summary */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 56, fontWeight: 900, color: '#B85A00', lineHeight: 1 }}>{result.overallCoverage}%</span>
                  <span style={{ fontSize: 18, color: '#636363' }}>curriculum coverage</span>
                </div>
                <p style={{ fontSize: 14, color: '#818181', margin: 0 }}>across {result.videos.length} lectures</p>
              </div>

              {/* Gaps + Strengths */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                <div style={{ border: '1.5px solid #DBDBDB', borderRadius: 16, padding: 18, background: '#fff' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 10px' }}>
                    <AlertCircle size={13} /> Top gaps
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.topGaps.map((g, i) => (
                      <li key={i} style={{ fontSize: 13, color: '#636363', paddingLeft: 12, borderLeft: '2px solid #FCA5A570', lineHeight: 1.5 }}>{g}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ border: '1.5px solid #DBDBDB', borderRadius: 16, padding: 18, background: '#fff' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#2A8A84', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, margin: '0 0 10px' }}>
                    <CheckCircle2 size={13} /> Top strengths
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {result.topStrengths.map((s, i) => (
                      <li key={i} style={{ fontSize: 13, color: '#636363', paddingLeft: 12, borderLeft: '2px solid #32A29B70', lineHeight: 1.5 }}>{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Objective breakdown */}
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A1628', marginBottom: 14, margin: '0 0 14px' }}>Objective-by-objective breakdown</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {result.objectives.map((obj, i) => {
                  const meta = COVERAGE_META[obj.coverage];
                  return (
                    <div key={i} style={{ border: `1.5px solid ${meta.border}`, borderRadius: 14, padding: 16, background: meta.bg }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ marginTop: 2, flexShrink: 0 }}>{meta.icon}</div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, color: '#1A1628', fontWeight: 500, lineHeight: 1.5, margin: '0 0 10px' }}>{obj.text}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ flex: 1, height: 6, background: '#E0E0E0', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', background: meta.barColor, borderRadius: 3, width: `${obj.coveragePercent}%`, transition: 'width 0.7s' }} />
                            </div>
                            <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: meta.color }}>{obj.coveragePercent}%</span>
                          </div>
                          {obj.relatedTimestamps.length > 0 && (
                            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {obj.relatedTimestamps.map((ts, j) => (
                                <span key={j} style={{ fontSize: 12, fontFamily: 'monospace', color: '#636363', background: '#fff', border: '1px solid #E0E0E0', padding: '2px 8px', borderRadius: 6 }}>
                                  L{ts.videoIndex + 1} · {Math.floor(ts.timestamp / 60)}:{String(Math.floor(ts.timestamp % 60)).padStart(2, '0')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => setResult(null)} className="btn-ghost"
                style={{ marginTop: 32, width: '100%', justifyContent: 'center' }}>
                ← Analyze another course
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
