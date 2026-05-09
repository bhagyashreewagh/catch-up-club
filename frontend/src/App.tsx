import { useState } from 'react';
import { ParticleProvider } from './components/ParticleEffect';
import type { AnalysisResult, AppView, AgentStatus, ProvostResult } from './types';
import Landing from './components/Landing';
import ProcessingView from './components/ProcessingView';
import StudentView from './components/student/StudentView';
import FacultyView from './components/faculty/FacultyView';
import ProvostView from './components/provost/ProvostView';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>([]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [provostResult, setProvostResult] = useState<ProvostResult | null>(null);
  const [seekTarget, setSeekTarget] = useState<{ time: number; key: number }>({ time: 0, key: 0 });
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');

  function seek(time: number) {
    setSeekTarget(prev => ({ time, key: prev.key + 1 }));
  }

  function handleAnalyze(url: string, includeFaculty: boolean) {
    setError(null);
    setResult(null);
    setAgentStatuses([]);
    setView('processing');

    const AGENTS = ['transcript', 'knowledge', 'faculty', 'study'];
    setAgentStatuses(AGENTS.map(a => ({ agent: a, status: 'idle', message: '' })));

    const params = new URLSearchParams({ url, faculty: String(includeFaculty), language });
    const es = new EventSource(`/api/analyze?${params}`);

    es.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (event.type === 'agent_start' || event.type === 'agent_progress') {
        setAgentStatuses(prev =>
          prev.map(s => s.agent === event.agent ? { ...s, status: 'running', message: event.message } : s));
      } else if (event.type === 'agent_complete') {
        setAgentStatuses(prev =>
          prev.map(s => s.agent === event.agent ? { ...s, status: 'done', message: event.message } : s));
      } else if (event.type === 'complete') {
        es.close();
        setResult(event.result);
        setView(includeFaculty ? 'faculty' : 'student');
      } else if (event.type === 'error') {
        es.close();
        setError(event.message);
        setView('landing');
      }
    };

    es.onerror = () => {
      es.close();
      setError('Connection lost. Please try again.');
      setView('landing');
    };
  }

  function goHome() {
    setView('landing');
    setResult(null);
    setProvostResult(null);
    setError(null);
  }

  return (
    <ParticleProvider>
      <div style={{ minHeight: '100vh', background: 'transparent' }}>
        {view === 'landing' && (
          <Landing onAnalyze={handleAnalyze} onProvost={() => setView('provost')} error={error} language={language} onLanguageChange={setLanguage} />
        )}
        {view === 'processing' && (
          <ProcessingView agents={agentStatuses} language={language} />
        )}
        {view === 'student' && result && (
          <StudentView result={result} seekTarget={seekTarget} onSeek={seek} onHome={goHome} onSwitchFaculty={() => setView('faculty')} language={language} onLanguageChange={setLanguage} />
        )}
        {view === 'faculty' && result && (
          <FacultyView result={result} onHome={goHome} onSeek={seek} onSwitchStudent={() => setView('student')} />
        )}
        {view === 'provost' && (
          <ProvostView onHome={goHome} onResult={setProvostResult} provostResult={provostResult} />
        )}
      </div>
    </ParticleProvider>
  );
}
