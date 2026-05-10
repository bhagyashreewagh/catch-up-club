import { createContext, useContext, useEffect } from 'react';

const Ctx = createContext<(x: number, y: number) => void>(() => {});
export const useParticle = () => useContext(Ctx);

// Three blobs follow cursor at different speeds for liquid feel
const BLOBS = [
  { lerp: 0.09, cssX: '--mx',  cssY: '--my'  },
  { lerp: 0.05, cssX: '--mx2', cssY: '--my2' },
  { lerp: 0.03, cssX: '--mx3', cssY: '--my3' },
];

export function ParticleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let targetX = -999, targetY = -999;
    const pos = BLOBS.map(() => ({ x: -999, y: -999 }));
    let rafId: number;

    function onMouseMove(e: MouseEvent) {
      targetX = e.clientX;
      targetY = e.clientY;
    }

    function tick() {
      BLOBS.forEach((blob, i) => {
        pos[i].x += (targetX - pos[i].x) * blob.lerp;
        pos[i].y += (targetY - pos[i].y) * blob.lerp;
        document.documentElement.style.setProperty(blob.cssX, `${pos[i].x}px`);
        document.documentElement.style.setProperty(blob.cssY, `${pos[i].y}px`);
      });

      rafId = requestAnimationFrame(tick);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <Ctx.Provider value={() => {}}>{children}</Ctx.Provider>;
}
