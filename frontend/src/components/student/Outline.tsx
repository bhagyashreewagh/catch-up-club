import { useState } from 'react';
import { ChevronRight, Play } from 'lucide-react';
import type { OutlineItem } from '../../types';

interface Props {
  outline: OutlineItem[];
  onSeek: (seconds: number) => void;
  currentTime?: number;
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function OutlineNode({
  item,
  onSeek,
  currentTime = 0,
  depth = 0,
}: {
  item: OutlineItem;
  onSeek: (s: number) => void;
  currentTime?: number;
  depth?: number;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = currentTime >= item.timestamp &&
    (item.children.length === 0 || currentTime < (item.children[0]?.timestamp ?? Infinity));

  return (
    <div style={{ marginLeft: depth > 0 ? 16 : 0, borderLeft: depth > 0 ? '1.5px solid #E0E0E0' : 'none', paddingLeft: depth > 0 ? 12 : 0 }}>
      <div
        onClick={() => { onSeek(item.timestamp); if (hasChildren) setOpen(o => !o); }}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
          background: isActive ? '#B85A000D' : 'transparent',
          borderLeft: isActive ? '2px solid #B85A00' : '2px solid transparent',
          marginLeft: isActive ? -2 : 0,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#F0EFED'; }}
        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      >
        {hasChildren ? (
          <ChevronRight size={14} style={{ marginTop: 2, color: '#818181', flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
        ) : (
          <Play size={12} style={{ marginTop: 3, color: '#B85A0070', flexShrink: 0 }} />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: depth === 0 ? 600 : 500, color: '#1A1628', lineHeight: 1.4 }}>
              {item.title}
            </span>
            <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#B85A0080', flexShrink: 0 }}>
              {fmtTime(item.timestamp)}
            </span>
          </div>
          {item.summary && (
            <p style={{ fontSize: 13, color: '#636363', marginTop: 2, lineHeight: 1.5, margin: '2px 0 0' }}>
              {item.summary}
            </p>
          )}
        </div>
      </div>

      {hasChildren && open && (
        <div style={{ marginTop: 4 }}>
          {item.children.map((child, i) => (
            <OutlineNode key={i} item={child} onSeek={onSeek} currentTime={currentTime} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Outline({ outline, onSeek, currentTime }: Props) {
  return (
    <div style={{ overflowY: 'auto', height: '100%' }}>
      {outline.map((item, i) => (
        <OutlineNode key={i} item={item} onSeek={onSeek} currentTime={currentTime} />
      ))}
    </div>
  );
}
