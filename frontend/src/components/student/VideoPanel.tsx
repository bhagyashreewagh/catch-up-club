import { useEffect, useRef, useState } from 'react';
import type { VideoInfo, Concept } from '../../types';
import { Clock, ExternalLink } from 'lucide-react';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface Props {
  video: VideoInfo;
  seekTarget: { time: number; key: number };
  onTimeUpdate?: (seconds: number) => void;
  markedConcepts?: Concept[];
  onMarkerClick?: (concept: Concept) => void;
}

export default function VideoPanel({ video, seekTarget, onTimeUpdate, markedConcepts = [] }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const [embedBlocked, setEmbedBlocked] = useState(false);

  useEffect(() => {
    if (window.YT?.Player) { initPlayer(); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = initPlayer;
  }, []);

  function initPlayer() {
    if (!containerRef.current) return;
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId: video.id,
      playerVars: { modestbranding: 1, rel: 0, color: 'white' },
      events: {
        onReady: () => {
          setReady(true);
          setDuration(playerRef.current?.getDuration() ?? 0);
          pollRef.current = setInterval(() => {
            const t = playerRef.current?.getCurrentTime() ?? 0;
            setCurrentTime(t);
            onTimeUpdate?.(t);
          }, 500);
        },
        onError: (e: { data: number }) => {
          // 101 / 150 = embedding disabled by video owner
          if (e.data === 101 || e.data === 150) setEmbedBlocked(true);
        },
      },
    });
  }

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (ready && seekTarget.key > 0) {
      const clamped = duration > 0 ? Math.min(seekTarget.time, duration - 1) : seekTarget.time;
      playerRef.current?.seekTo(clamped, true);
      playerRef.current?.playVideo();
    }
  }, [seekTarget.key, ready]);

  function fmtTime(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = String(Math.floor(s % 60)).padStart(2, '0');
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const CONCEPT_COLORS: Record<string, string> = {
    definition: '#B85A00', theory: '#B85900',
    example: '#32A29B', fact: '#9B8C5A', process: '#2A8A84',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* YouTube embed */}
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#1A1628', aspectRatio: '16/9' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        {!ready && !embedBlocked && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1628' }}>
            <div style={{ width: 28, height: 28, border: '2px solid rgba(127,32,32,0.3)', borderTopColor: '#B85A00', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
          </div>
        )}
        {embedBlocked && (
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ position: 'absolute', inset: 0, display: 'block', textDecoration: 'none' }}
          >
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            {/* dark overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
            {/* play button */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.4)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Watch on YouTube</span>
            </div>
          </a>
        )}
      </div>

      {/* Video info */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#1A1628', lineHeight: 1.4, margin: '0 0 4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {video.title}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#818181' }}>
          <span>{video.author}</span>
          {duration > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              {fmtTime(duration)}
            </span>
          )}
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: '#818181', textDecoration: 'none', fontSize: 13, transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#B85A00'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#818181'; }}
          >
            <ExternalLink size={12} />
            YouTube
          </a>
        </div>
      </div>

      {/* Timeline */}
      {duration > 0 && (
        <div>
          <div style={{ position: 'relative', height: 10, display: 'flex', alignItems: 'center' }}>
            <div style={{ height: 6, background: '#E0E0E0', borderRadius: 3, overflow: 'hidden', width: '100%' }}>
              <div style={{ height: '100%', background: '#B85A00', borderRadius: 3, width: `${progress}%`, transition: 'width 0.5s' }} />
            </div>
            {markedConcepts.filter(c => c.timestamp <= duration).map(concept => {
              const pct = (concept.timestamp / duration) * 100;
              const color = CONCEPT_COLORS[concept.category] ?? '#B85A00';
              return (
                <button
                  key={concept.id}
                  title={`${concept.name} (${fmtTime(concept.timestamp)})`}
                  onClick={() => playerRef.current?.seekTo(concept.timestamp, true)}
                  style={{
                    position: 'absolute', top: 0, width: 4, height: 10, borderRadius: 2,
                    background: color, border: 'none', cursor: 'pointer', padding: 0,
                    left: `${pct}%`, transform: 'translateX(-50%)',
                    transition: 'transform 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(-50%) scaleY(1.4)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(-50%)'; }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12, color: '#818181', fontFamily: 'monospace' }}>
            <span>{fmtTime(currentTime)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
