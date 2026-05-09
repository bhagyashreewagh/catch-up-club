import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Play, Lightbulb } from 'lucide-react';
import { useParticle } from '../ParticleEffect';
import type { Flashcard } from '../../types';

interface Props { flashcards: Flashcard[]; onSeek: (s: number) => void; }

function fmt(s: number) { return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }

export default function Flashcards({ flashcards, onSeek }: Props) {
  const spawn = useParticle();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [mastered, setMastered] = useState<Set<string>>(new Set());
  const [dir, setDir] = useState(1);

  const card = flashcards[index];
  if (!card) return null;

  function go(delta: number) { setDir(delta); setFlipped(false); setShowHint(false); setIndex(i => (i + delta + flashcards.length) % flashcards.length); }

  const masteredCount = flashcards.filter(f => mastered.has(f.id)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 14, color: '#636363', whiteSpace: 'nowrap' }}>{index + 1} / {flashcards.length}</span>
        <div style={{ flex: 1, height: 4, background: '#E8E8E8', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#B85A00', borderRadius: 2, width: `${((index + 1) / flashcards.length) * 100}%`, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: 14, color: '#32A29B', whiteSpace: 'nowrap', fontWeight: 600 }}>{masteredCount} mastered</span>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className={`flip-card ${flipped ? 'flipped' : ''}`}
          style={{ width: '100%', maxWidth: 460, height: 240, cursor: 'pointer' }}
          onClick={() => setFlipped(f => !f)}
          onMouseMove={e => spawn(e.clientX, e.clientY)}>
          <div className="flip-card-inner" style={{ position: 'relative', width: '100%', height: '100%' }}>

            {/* Front */}
            <div className="flip-card-front card" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#B85A00', letterSpacing: '0.1em', marginBottom: 14, textTransform: 'uppercase' }}>Question</div>
              <AnimatePresence mode="wait">
                <motion.p key={`f${index}`} initial={{ opacity: 0, x: dir * 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -dir * 16 }}
                  style={{ fontSize: 17, color: '#1A1628', lineHeight: 1.55, fontWeight: 500, margin: 0 }}>
                  {card.front}
                </motion.p>
              </AnimatePresence>
              {card.hint && showHint && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: 14, fontSize: 14, color: '#2A8A84', background: '#E8F5F4', border: '1px solid #DBDBDB', borderRadius: 8, padding: '8px 14px' }}>
                  💡 {card.hint}
                </motion.div>
              )}
              <p style={{ marginTop: 14, fontSize: 12, color: '#818181', margin: '14px 0 0' }}>tap to flip</p>
            </div>

            {/* Back */}
            <div className="flip-card-back card" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center', background: '#F4F3F3' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#32A29B', letterSpacing: '0.1em', marginBottom: 14, textTransform: 'uppercase' }}>Answer</div>
              <p style={{ fontSize: 16, color: '#1A1628', lineHeight: 1.6, margin: 0 }}>{card.back}</p>
              <button onClick={e => { e.stopPropagation(); onSeek(card.timestamp); }}
                onMouseMove={e => spawn(e.clientX, e.clientY)}
                style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#B85A00', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                <Play size={13} /> Watch at {fmt(card.timestamp)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 20 }}>
        <button onClick={() => go(-1)} className="btn-ghost" style={{ padding: '8px 10px' }} onMouseMove={e => spawn(e.clientX, e.clientY)}>
          <ChevronLeft size={20} />
        </button>

        {card.hint && !flipped && (
          <button onClick={() => setShowHint(h => !h)} className="btn-ghost"
            onMouseMove={e => spawn(e.clientX, e.clientY)}
            style={{ fontSize: 13, color: showHint ? '#2A8A84' : undefined }}>
            <Lightbulb size={14} /> Hint
          </button>
        )}

        <button
          onClick={() => setMastered(prev => { const n = new Set(prev); n.has(card.id) ? n.delete(card.id) : n.add(card.id); return n; })}
          onMouseMove={e => spawn(e.clientX, e.clientY)}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            border: `1.5px solid ${mastered.has(card.id) ? '#32A29B' : '#DBDBDB'}`,
            background: mastered.has(card.id) ? '#32A29B18' : '#fff',
            color: mastered.has(card.id) ? '#2A8A84' : '#636363',
          }}>
          {mastered.has(card.id) ? '✓ Mastered' : 'Mark as mastered'}
        </button>

        <button onClick={() => { setFlipped(false); setShowHint(false); setIndex(0); setMastered(new Set()); }}
          className="btn-ghost" style={{ padding: '8px 10px' }} title="Restart">
          <RotateCcw size={16} />
        </button>
        <button onClick={() => go(1)} className="btn-ghost" style={{ padding: '8px 10px' }} onMouseMove={e => spawn(e.clientX, e.clientY)}>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
