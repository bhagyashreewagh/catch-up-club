import { useEffect, useRef, useState, useCallback } from 'react';
import type { KnowledgeGraph, Concept } from '../../types';

interface SimNode extends Concept { x: number; y: number; vx: number; vy: number; radius: number; }

const CAT_COLORS: Record<string, { fill: string; glow: string; label: string }> = {
  definition: { fill: '#B85A00', glow: 'rgba(127,32,32,0.3)',   label: '#B85A00' },
  theory:     { fill: '#B85900', glow: 'rgba(90,24,24,0.3)',    label: '#B85900' },
  example:    { fill: '#32A29B', glow: 'rgba(134,155,126,0.3)', label: '#2A8A84' },
  fact:       { fill: '#9B8C5A', glow: 'rgba(155,140,90,0.25)', label: '#6B5C30' },
  process:    { fill: '#2A8A84', glow: 'rgba(107,122,74,0.25)', label: '#4A5830' },
};

interface Props { graph: KnowledgeGraph; onSeek: (s: number) => void; highlightId?: string; }

export default function ConstellationGraph({ graph, onSeek, highlightId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const rafRef = useRef(0);
  const hoveredIdRef = useRef<string | null>(null);
  const [tooltip, setTooltip] = useState<{ node: SimNode; x: number; y: number } | null>(null);

  const initNodes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { width, height } = canvas;
    nodesRef.current = graph.concepts.map(c => ({
      ...c,
      x: width / 2 + (Math.random() - 0.5) * width * 0.65,
      y: height / 2 + (Math.random() - 0.5) * height * 0.65,
      vx: 0, vy: 0,
      radius: Math.max(6, Math.min(18, c.importance * 1.8)),
    }));
  }, [graph]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let tick = 0;

    const resize = () => {
      const p = canvas.parentElement!;
      canvas.width = p.clientWidth;
      canvas.height = p.clientHeight;
      initNodes();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    function simulate() {
      const nodes = nodesRef.current;
      const { width, height } = canvas!;
      nodes.forEach(n => {
        n.vx += (width / 2 - n.x) * 0.008;
        n.vy += (height / 2 - n.y) * 0.008;
        nodes.forEach(m => {
          if (n === m) return;
          const dx = n.x - m.x, dy = n.y - m.y;
          const d2 = dx * dx + dy * dy + 1;
          const f = 5000 / d2;
          const d = Math.sqrt(d2);
          n.vx += (dx / d) * f; n.vy += (dy / d) * f;
        });
        n.vx *= 0.78; n.vy *= 0.78;
        n.x = Math.max(n.radius + 4, Math.min(width - n.radius - 4, n.x + n.vx));
        n.y = Math.max(n.radius + 4, Math.min(height - n.radius - 4, n.y + n.vy));
      });
      graph.relationships.forEach(link => {
        const src = nodes.find(n => n.id === link.source);
        const tgt = nodes.find(n => n.id === link.target);
        if (!src || !tgt) return;
        const dx = tgt.x - src.x, dy = tgt.y - src.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.1;
        const f = (d - 100) * 0.006 * (link.strength / 10);
        const fx = (dx / d) * f, fy = (dy / d) * f;
        src.vx += fx; src.vy += fy; tgt.vx -= fx; tgt.vy -= fy;
      });
      tick++;
    }

    function draw() {
      if (!canvas || !ctx) return;
      const { width, height } = canvas;
      const nodes = nodesRef.current;
      const hid = hoveredIdRef.current;
      ctx.clearRect(0, 0, width, height);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      graph.relationships.forEach(link => {
        const src = nodes.find(n => n.id === link.source);
        const tgt = nodes.find(n => n.id === link.target);
        if (!src || !tgt) return;
        const hi = hid === link.source || hid === link.target;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y); ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = hi ? '#DBDBDB' : '#E0E0E0';
        ctx.lineWidth = hi ? 1.5 : 1;
        ctx.globalAlpha = hi ? 0.8 : 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      nodes.forEach(node => {
        const c = CAT_COLORS[node.category] ?? CAT_COLORS.fact;
        const isHov = hid === node.id;
        const isHl = highlightId === node.id;
        const r = node.radius * (isHov ? 1.25 : 1);

        if (isHov || isHl) {
          const grad = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 14);
          grad.addColorStop(0, c.glow); grad.addColorStop(1, 'transparent');
          ctx.beginPath(); ctx.arc(node.x, node.y, r + 14, 0, Math.PI * 2);
          ctx.fillStyle = grad; ctx.fill();
        }

        ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = c.fill + (isHov ? '' : 'CC'); ctx.fill();

        if (node.importance >= 6 || isHov) {
          const label = node.name.length > 18 ? node.name.slice(0, 16) + '...' : node.name;
          ctx.font = `${isHov ? 600 : 500} ${isHov ? 12 : 11}px Inter, sans-serif`;
          ctx.fillStyle = isHov ? c.label : '#636363';
          ctx.globalAlpha = isHov ? 1 : 0.75;
          ctx.textAlign = 'center'; ctx.textBaseline = 'top';
          ctx.fillText(label, node.x, node.y + r + 4);
          ctx.globalAlpha = 1;
        }
      });
    }

    function loop() { if (tick < 240) simulate(); draw(); rafRef.current = requestAnimationFrame(loop); }
    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, [graph, highlightId, initNodes]);

  function getNodeAt(cx: number, cy: number) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = cx - rect.left, y = cy - rect.top;
    return nodesRef.current.find(n => Math.hypot(n.x - x, n.y - y) < n.radius + 8) ?? null;
  }

  function fmt(s: number) { return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', cursor: 'pointer' }}
        onMouseMove={e => {
          const n = getNodeAt(e.clientX, e.clientY);
          hoveredIdRef.current = n ? n.id : null;
          if (n) {
            const rect = canvasRef.current!.getBoundingClientRect();
            setTooltip({ node: n, x: n.x + rect.left, y: n.y + rect.top });
          } else {
            setTooltip(null);
          }
        }}
        onClick={e => { const n = getNodeAt(e.clientX, e.clientY); if (n) onSeek(n.timestamp); }}
        onMouseLeave={() => { hoveredIdRef.current = null; setTooltip(null); }}
      />

      <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {Object.entries(CAT_COLORS).map(([cat, c]) => (
          <span key={cat} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: c.fill + '20', color: c.label, border: `1px solid ${c.fill}40`, fontWeight: 500, textTransform: 'capitalize' }}>{cat}</span>
        ))}
      </div>

      {tooltip && (
        <div style={{ position: 'fixed', zIndex: 100, pointerEvents: 'none', left: tooltip.x + 14, top: tooltip.y - 14 }}>
          <div style={{ background: '#fff', border: '1.5px solid #DBDBDB', borderRadius: 12, padding: '12px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxWidth: 220 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1628', marginBottom: 4 }}>{tooltip.node.name}</div>
            <div style={{ fontSize: 13, color: '#636363', lineHeight: 1.5, marginBottom: 8 }}>{tooltip.node.description}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: CAT_COLORS[tooltip.node.category]?.label, background: CAT_COLORS[tooltip.node.category]?.fill + '18', padding: '2px 8px', borderRadius: 99, textTransform: 'capitalize', fontWeight: 500 }}>{tooltip.node.category}</span>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#B85A00', fontWeight: 600 }}>{fmt(tooltip.node.timestamp)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
