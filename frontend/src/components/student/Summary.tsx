import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useParticle } from '../ParticleEffect';
import type { StudyMaterials } from '../../types';

const DEPTHS = [
  { key: 'brief',         label: '90-second',  desc: 'The essential takeaway' },
  { key: 'standard',      label: '5-minute',   desc: 'Main ideas, connected' },
  { key: 'comprehensive', label: 'Full notes',  desc: 'Complete coverage' },
] as const;

export default function Summary({ study }: { study: StudyMaterials }) {
  const spawn = useParticle();
  const [depth, setDepth] = useState<'brief' | 'standard' | 'comprehensive'>('standard');
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(study.summaries[depth]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Depth selector */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {DEPTHS.map(d => (
          <button key={d.key} onClick={() => setDepth(d.key)}
            onMouseMove={e => spawn(e.clientX, e.clientY)}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
              border: `1.5px solid ${depth === d.key ? '#B85A00' : '#DBDBDB'}`,
              background: depth === d.key ? '#B85A0010' : '#fff',
              color: depth === d.key ? '#B85A00' : '#636363',
              textAlign: 'center',
            }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{d.label}</div>
            <div style={{ fontSize: 12, color: depth === d.key ? '#A85200' : '#818181', marginTop: 2 }}>{d.desc}</div>
          </button>
        ))}
      </div>

      {/* Text */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div key={depth} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, overflowY: 'auto', paddingRight: 4 }}>
            <p style={{ fontSize: 16, color: '#1A1628', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0 }}>
              {study.summaries[depth]}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Key terms + copy */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1.5px solid #DBDBDB' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#636363', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Terms</span>
          <button onClick={copy} className="btn-ghost" style={{ fontSize: 13, padding: '5px 10px' }}
            onMouseMove={e => spawn(e.clientX, e.clientY)}>
            {copied ? <><Check size={13} color="#32A29B" /> Copied</> : <><Copy size={13} /> Copy summary</>}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {study.keyTerms.map(term => (
            <span key={term} style={{ fontSize: 13, padding: '4px 12px', background: '#F0EFED', border: '1px solid #DBDBDB', borderRadius: 99, color: '#636363', fontWeight: 500 }}>
              {term}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
