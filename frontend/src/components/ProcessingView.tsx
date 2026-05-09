import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, Circle, FileText, Network, BookOpen, GraduationCap, Brain } from 'lucide-react';
import type { AgentStatus } from '../types';

const AGENT_META: Record<string, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  transcript: { label: 'Transcript Agent', icon: <FileText size={15} />, color: '#32A29B', desc: 'Fetching and parsing YouTube captions' },
  knowledge:  { label: 'Knowledge Agent', icon: <Network size={15} />,   color: '#B85A00', desc: 'Extracting concepts and mapping relationships' },
  faculty:    { label: 'Audit Agent',     icon: <GraduationCap size={15} />, color: '#636363', desc: 'Evaluating pedagogy and accessibility' },
  study:      { label: 'Study Agent',     icon: <BookOpen size={15} />,   color: '#32A29B', desc: 'Crafting flashcards, summaries, outline' },
};

export default function ProcessingView({ agents, language }: { agents: AgentStatus[]; language?: string }) {
  const running = agents.filter(a => a.status === 'running').length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
          <Brain size={28} color="#B85A00" style={{ animation: 'spin 3s linear infinite' }} />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1A1628', margin: 0 }}>Analyzing your lecture</h1>
        </div>
        <p style={{ fontSize: 16, color: '#636363', margin: 0 }}>
          {running > 0 ? `${running} agent${running > 1 ? 's' : ''} working in parallel…` : 'Initializing…'}
        </p>
      </motion.div>

      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {agents.map((agent, i) => {
          const meta = AGENT_META[agent.agent];
          if (!meta) return null;
          const isRunning = agent.status === 'running';
          const isDone = agent.status === 'done';

          return (
            <motion.div
              key={agent.agent}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card"
              style={{
                padding: '16px 20px',
                border: isRunning ? `1.5px solid ${meta.color}` : undefined,
                boxShadow: isRunning ? `0 0 0 3px ${meta.color}18` : undefined,
                transition: 'all 0.3s',
                opacity: isDone ? 0.7 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ marginTop: 2 }}>
                  {agent.status === 'idle' && <Circle size={18} color="#DBDBDB" />}
                  {isRunning && <Loader2 size={18} color={meta.color} style={{ animation: 'spin 1s linear infinite' }} />}
                  {isDone && <CheckCircle2 size={18} color="#32A29B" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ color: meta.color }}>{meta.icon}</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#1A1628' }}>{meta.label}</span>
                    {isRunning && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: meta.color, fontFamily: 'monospace', letterSpacing: '0.05em' }}>ACTIVE</span>}
                    {isDone && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: '#32A29B', fontFamily: 'monospace' }}>DONE</span>}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={agent.message || 'idle'}
                      initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ margin: 0, fontSize: 14, color: agent.status === 'idle' ? '#818181' : '#636363', fontFamily: isRunning ? 'monospace' : 'inherit' }}
                    >
                      {agent.status === 'idle' ? meta.desc : agent.message}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {isRunning && (
                <div style={{ marginTop: 12, height: 3, background: '#F0EFED', borderRadius: 2, overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', background: meta.color, borderRadius: 2, width: '45%' }}
                    animate={{ x: ['-100%', '280%'] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        style={{ marginTop: 40, fontSize: 14, color: '#818181', textAlign: 'center', maxWidth: 340 }}>
        Knowledge + Audit agents run in parallel. A typical lecture takes 30 to 60 seconds.
      </motion.p>
    </div>
  );
}
