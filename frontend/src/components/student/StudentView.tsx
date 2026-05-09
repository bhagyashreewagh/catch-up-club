import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, GraduationCap, BookOpen, Layers, Search, Brain, Network, Users, Globe, Loader2, ChevronDown } from 'lucide-react';
import type { AnalysisResult, StudyMaterials } from '../../types';
import VideoPanel from './VideoPanel';
import ConstellationGraph from './ConstellationGraph';
import Flashcards from './Flashcards';
import Summary from './Summary';
import Outline from './Outline';
import SemanticSearch from './SemanticSearch';
import SocraticMode from './SocraticMode';

type Tab = 'outline' | 'flashcards' | 'summary' | 'search' | 'quiz';
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'outline',    label: 'Outline',    icon: <Layers size={14} /> },
  { id: 'flashcards', label: 'Flashcards', icon: <BookOpen size={14} /> },
  { id: 'summary',    label: 'Summary',    icon: <Brain size={14} /> },
  { id: 'search',     label: 'Search',     icon: <Search size={14} /> },
  { id: 'quiz',       label: 'Quiz',       icon: <GraduationCap size={14} /> },
];

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

interface Props {
  result: AnalysisResult;
  seekTarget: { time: number; key: number };
  onSeek: (s: number) => void;
  onHome: () => void;
  onSwitchFaculty: () => void;
  language: string;
  onLanguageChange: (code: string) => void;
}

export default function StudentView({ result, seekTarget, onSeek, onHome, onSwitchFaculty, language, onLanguageChange }: Props) {
  const [tab, setTab] = useState<Tab>('outline');
  const [currentTime, setCurrentTime] = useState(0);
  const [showGraph, setShowGraph] = useState(true);
  const [translatedStudy, setTranslatedStudy] = useState<StudyMaterials | null>(null);
  const [translating, setTranslating] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const study = translatedStudy ?? result.study;
  const activeLang = LANGUAGES.find(l => l.code === language) ?? LANGUAGES[0];

  async function handleLanguageSelect(code: string) {
    setLangMenuOpen(false);
    onLanguageChange(code);
    if (code === 'en') { setTranslatedStudy(null); return; }
    if ((result as AnalysisResult & { language?: string }).language === code) { setTranslatedStudy(null); return; }
    setTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study: result.study, language: code }),
      });
      const data = await res.json();
      if (data.study) setTranslatedStudy(data.study);
    } catch {
      onLanguageChange('en');
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Topbar */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
        borderBottom: '1.5px solid #DBDBDB', flexShrink: 0,
      }}>
        <button onClick={onHome} className="btn-ghost" style={{ padding: '6px 10px' }}>
          <Home size={16} />
        </button>
        <div style={{ width: 1, height: 18, background: '#DBDBDB' }} />
        <Users size={16} color="#B85A00" />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1628' }}>The Catch Up Club</span>
        <span style={{ fontSize: 13, color: '#818181' }}>·</span>
        <p style={{ fontSize: 13, color: '#636363', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {result.video.title}
        </p>

        {/* Language picker */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setLangMenuOpen(o => !o)}
            disabled={translating}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              border: `1.5px solid ${language !== 'en' ? '#B85A00' : '#DBDBDB'}`,
              borderRadius: 9, background: language !== 'en' ? '#FFF5ED' : '#fff',
              cursor: 'pointer', fontSize: 13, color: '#1A1628', transition: 'all 0.15s',
            }}
          >
            {translating
              ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              : <Globe size={13} color="#B85A00" />}
            <span>{translating ? 'Translating...' : activeLang.flag + ' ' + activeLang.label}</span>
            <ChevronDown size={12} color="#818181" style={{ transform: langMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
          <AnimatePresence>
            {langMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 200,
                  background: '#fff', border: '1.5px solid #DBDBDB', borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.10)', minWidth: 160, overflow: 'hidden',
                }}
              >
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
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

        {result.audit && (
          <button onClick={onSwitchFaculty} className="btn-ghost" style={{ fontSize: 13, flexShrink: 0 }}>
            <GraduationCap size={14} /> Faculty Audit
          </button>
        )}
      </header>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }} onClick={() => langMenuOpen && setLangMenuOpen(false)}>

        {/* Left */}
        <div style={{ width: '42%', display: 'flex', flexDirection: 'column', borderRight: '1.5px solid #DBDBDB', minHeight: 0 }}>
          <div style={{ padding: '16px 16px 8px', flexShrink: 0 }}>
            <VideoPanel video={result.video} seekTarget={seekTarget} onTimeUpdate={setCurrentTime} markedConcepts={result.graph.concepts} />
          </div>
          <div style={{ padding: '0 16px 8px', flexShrink: 0 }}>
            <button
              onClick={() => setShowGraph(g => !g)}
              className="btn-ghost"
              style={{ fontSize: 13, padding: '6px 12px', border: '1.5px solid #DBDBDB', borderRadius: 8, background: showGraph ? '#F0EFED' : 'transparent' }}
            >
              <Network size={14} />
              Knowledge Constellation
              <span style={{ color: '#818181', fontWeight: 400, marginLeft: 4 }}>({result.graph.concepts.length})</span>
            </button>
          </div>
          {showGraph && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ flex: 1, minHeight: 0, margin: '0 16px 16px', borderRadius: 14, overflow: 'hidden', border: '1.5px solid #DBDBDB', background: '#fff' }}>
              <ConstellationGraph graph={result.graph} onSeek={onSeek} />
            </motion.div>
          )}
        </div>

        {/* Right */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1.5px solid #DBDBDB', flexShrink: 0 }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                style={{ fontSize: 14, padding: '12px 14px' }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '20px', overflowY: 'auto', position: 'relative' }}>
            {translating && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.88)', zIndex: 10,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
                <Loader2 size={28} color="#B85A00" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 14, color: '#636363', margin: 0 }}>Translating to {activeLang.label}...</p>
              </div>
            )}
            <motion.div key={tab + language} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ height: '100%' }}>
              {tab === 'outline'    && <Outline outline={study.outline} onSeek={onSeek} currentTime={currentTime} />}
              {tab === 'flashcards' && <Flashcards flashcards={study.flashcards} onSeek={onSeek} />}
              {tab === 'summary'    && <Summary study={study} />}
              {tab === 'search'     && <SemanticSearch videoId={result.video.id} onSeek={onSeek} language={language} />}
              {tab === 'quiz'       && <SocraticMode videoId={result.video.id} onSeek={onSeek} language={language} />}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
