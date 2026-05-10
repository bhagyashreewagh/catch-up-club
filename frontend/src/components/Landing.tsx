import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, GraduationCap, Building2, AlertCircle, ArrowRight, Youtube, Users, Globe, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English',    flag: '🇺🇸' },
  { code: 'es', label: 'Spanish',    flag: '🇪🇸' },
  { code: 'fr', label: 'French',     flag: '🇫🇷' },
  { code: 'de', label: 'German',     flag: '🇩🇪' },
  { code: 'zh', label: 'Mandarin',   flag: '🇨🇳' },
  { code: 'hi', label: 'Hindi',      flag: '🇮🇳' },
  { code: 'pt', label: 'Portuguese', flag: '🇧🇷' },
  { code: 'ar', label: 'Arabic',     flag: '🇸🇦' },
  { code: 'ja', label: 'Japanese',   flag: '🇯🇵' },
  { code: 'ko', label: 'Korean',     flag: '🇰🇷' },
  { code: 'it', label: 'Italian',    flag: '🇮🇹' },
];

const FEATURES = [
  { icon: '🌌', label: 'Knowledge map', desc: 'Every concept, visualized and connected' },
  { icon: '🗂', label: 'Flashcards', desc: '12 exam-ready cards, auto-generated' },
  { icon: '🔍', label: 'Semantic search', desc: 'Ask anything. Find the exact moment.' },
  { icon: '🧠', label: 'Feynman quiz', desc: 'Explain it back. AI grades your answer.' },
];

const EXAMPLE_URLS = [
  'https://www.youtube.com/watch?v=aircAruvnKk',
  'https://www.youtube.com/watch?v=PL9hbcn-8il0',
];

interface Props {
  onAnalyze: (url: string, includeFaculty: boolean) => void;
  onProvost: () => void;
  error: string | null;
  language: string;
  onLanguageChange: (code: string) => void;
}

export default function Landing({ onAnalyze, onProvost, error, language, onLanguageChange }: Props) {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<'student' | 'faculty'>('student');
  const [loading, setLoading] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const activeLang = LANGUAGES.find(l => l.code === language) ?? LANGUAGES[0];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    onAnalyze(url.trim(), mode === 'faculty');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} onClick={() => langMenuOpen && setLangMenuOpen(false)}>

      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px', borderBottom: '1.5px solid #DBDBDB',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#B85A00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={16} color="#fff" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#1A1628', letterSpacing: '-0.3px' }}>
            The Catch Up Club
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Language picker */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={e => { e.stopPropagation(); setLangMenuOpen(o => !o); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                border: `1.5px solid ${language !== 'en' ? '#B85A00' : '#DBDBDB'}`,
                borderRadius: 9, background: language !== 'en' ? '#FFF5ED' : '#fff',
                cursor: 'pointer', fontSize: 13, color: '#1A1628', transition: 'all 0.15s',
              }}
            >
              <Globe size={13} color="#B85A00" />
              <span>{activeLang.flag} {activeLang.label}</span>
              <ChevronDown size={12} color="#818181" style={{ transform: langMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            <AnimatePresence>
              {langMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 200,
                    background: '#fff', border: '1.5px solid #DBDBDB', borderRadius: 12,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.10)', minWidth: 160, overflow: 'hidden',
                  }}
                >
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { onLanguageChange(lang.code); setLangMenuOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '9px 14px', border: 'none',
                        background: lang.code === language ? '#FFF5ED' : 'transparent',
                        cursor: 'pointer', fontSize: 13,
                        color: lang.code === language ? '#B85A00' : '#1A1628',
                        fontWeight: lang.code === language ? 600 : 400, textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (lang.code !== language) (e.currentTarget as HTMLButtonElement).style.background = '#F4F3F3'; }}
                      onMouseLeave={e => { if (lang.code !== language) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <span>{lang.flag}</span><span>{lang.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={onProvost} className="btn-ghost">
            <Building2 size={15} />
            Provost view
          </button>
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px 48px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 600, textAlign: 'center' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#F0EFED', border: '1.5px solid #DBDBDB',
            color: '#636363', fontSize: 13, fontWeight: 600,
            padding: '5px 14px', borderRadius: 99, marginBottom: 28,
            letterSpacing: '0.03em',
          }}>
            5 AI agents · under 60 seconds · {LANGUAGES.length} languages
          </div>

          <h1 style={{
            fontSize: 54, fontWeight: 800, lineHeight: 1.1,
            color: '#1A1628', marginBottom: 20, letterSpacing: '-1.5px',
          }}>
            Turn long lectures into your
            <br />
            <span style={{ color: '#B85A00' }}>personal study room.</span>
          </h1>

          <p style={{
            fontSize: 18, color: '#636363', lineHeight: 1.7,
            marginBottom: 36, maxWidth: 480, margin: '0 auto 36px',
          }}>
            Paste any YouTube lecture URL. Five AI agents turn it into a knowledge map,
            flashcards, summaries, and a Feynman quiz — in any language.
          </p>

          {language !== 'en' && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#FFF5ED', border: '1.5px solid #B85A0040',
                color: '#B85A00', fontSize: 13, fontWeight: 600,
                padding: '6px 14px', borderRadius: 99, marginBottom: 20,
              }}
            >
              {activeLang.flag} Study materials will be generated in {activeLang.label}
            </motion.div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
            {[
              { id: 'student', label: 'Student', Icon: BookOpen },
              { id: 'faculty', label: 'Faculty + Audit', Icon: GraduationCap },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id as 'student' | 'faculty')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px', borderRadius: 10,
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${mode === id ? '#B85A00' : '#DBDBDB'}`,
                  background: mode === id ? '#B85A00' : '#FFFFFF',
                  color: mode === id ? '#FFFFFF' : '#636363',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {mode === 'faculty' && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                fontSize: 15, color: '#636363',
                background: '#F0EFED', border: '1.5px solid #DBDBDB',
                borderRadius: 12, padding: '12px 18px', marginBottom: 16, textAlign: 'left',
              }}
            >
              <strong style={{ color: '#1A1628' }}>Private faculty audit.</strong>{' '}
              Pedagogy, accessibility, clarity, and equity, each scored with timestamped suggestions.
            </motion.p>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Youtube size={18} color="#B8AFA4"
                style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="input-field"
                style={{ paddingLeft: 46, fontSize: 17, borderRadius: 14 }}
                disabled={loading}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="btn-primary"
              style={{ justifyContent: 'center', padding: '15px 24px', fontSize: 17, borderRadius: 14 }}
            >
              {loading ? (
                <>
                  <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
                  Starting agents...
                </>
              ) : (
                <>Analyze this lecture <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {error && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 10,
                background: '#FEF2F2', border: '1.5px solid #FCA5A5',
                color: '#991B1B', borderRadius: 12, padding: '12px 16px', fontSize: 15, textAlign: 'left',
              }}>
              <AlertCircle size={17} style={{ marginTop: 1, flexShrink: 0 }} />
              {error}
            </motion.div>
          )}

          <p style={{ marginTop: 14, fontSize: 13, color: '#818181' }}>
            Try an example:{' '}
            {EXAMPLE_URLS.map((u, i) => (
              <button key={i} onClick={() => setUrl(u)}
                style={{ color: '#B85A00', textDecoration: 'underline', marginRight: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                Example {i + 1}
              </button>
            ))}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            marginTop: 64, display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16, width: '100%', maxWidth: 760,
          }}
        >
          {FEATURES.map(f => (
            <div
              key={f.label}
              data-spotlight="true"
              style={{
                border: '1.5px solid #DBDBDB', borderRadius: 16,
                padding: '22px 18px', textAlign: 'center',
                transition: 'transform 0.2s', cursor: 'default',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; }}
            >
              <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1628', marginBottom: 6 }}>{f.label}</div>
              <div style={{ fontSize: 14, color: '#636363', lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </motion.div>
      </main>

      <footer style={{ textAlign: 'center', padding: '18px', fontSize: 13, color: '#818181', borderTop: '1.5px solid #DBDBDB' }}>
        Cloudforce No Resume Required hackathon · The Catch Up Club 2026
      </footer>
    </div>
  );
}
