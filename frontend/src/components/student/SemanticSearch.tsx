import { useState } from 'react';
import { Search, Play, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SearchResult } from '../../types';

interface Props {
  videoId: string;
  onSeek: (seconds: number) => void;
  language?: string;
}

const EXAMPLE_QUERIES = [
  'What is the main equation introduced?',
  'Where do they explain the intuition?',
  'When is the first example given?',
  'What are the key assumptions?',
];

export default function SemanticSearch({ videoId, onSeek, language = 'en' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(q?: string) {
    const question = q ?? query;
    if (!question.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, question, language }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function fmtTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Input */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} color="#818181" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleSearch()}
          placeholder="Ask anything about this lecture..."
          className="input-field"
          style={{ paddingLeft: 40, paddingRight: 44 }}
          disabled={loading}
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#B85A00', opacity: loading || !query.trim() ? 0.3 : 1, padding: 4,
          }}
        >
          {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={16} />}
        </button>
      </div>

      {/* Example queries */}
      {!searched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p style={{ fontSize: 12, color: '#818181', marginBottom: 4, margin: '0 0 4px' }}>Try asking:</p>
          {EXAMPLE_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => { setQuery(q); handleSearch(q); }}
              style={{
                textAlign: 'left', fontSize: 13, color: '#636363',
                background: '#F4F3F3', border: '1.5px solid #DBDBDB',
                borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F0EFED'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F4F3F3'; }}
            >
              "{q}"
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
        {searched && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#818181' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Searching the lecture...
                </div>
              </div>
            ) : results.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 14, color: '#818181' }}>
                No relevant moments found. Try rephrasing your question.
              </div>
            ) : (
              results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  style={{
                    border: '1.5px solid #DBDBDB', borderRadius: 14, padding: '16px',
                    background: '#fff', transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#B85A00', fontWeight: 600 }}>
                      {fmtTime(r.timestamp)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div
                          key={j}
                          style={{
                            width: 4, height: 12, borderRadius: 2,
                            background: j < Math.round(r.relevance / 2) ? '#B85A00' : '#E0E0E0',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <blockquote style={{
                    fontSize: 13, color: '#636363', fontStyle: 'italic',
                    borderLeft: '2px solid #DBDBDB', paddingLeft: 12,
                    marginBottom: 8, lineHeight: 1.6, margin: '0 0 8px',
                  }}>
                    "{r.quote}"
                  </blockquote>
                  <p style={{ fontSize: 13, color: '#1A1628', marginBottom: 12, margin: '0 0 12px' }}>{r.explanation}</p>
                  <button
                    onClick={() => onSeek(r.timestamp)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
                      color: '#B85A00', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    <Play size={12} />
                    Jump to {fmtTime(r.timestamp)}
                  </button>
                </motion.div>
              ))
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
