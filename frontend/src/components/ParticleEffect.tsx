import { createContext, useContext, useEffect } from 'react';

const Ctx = createContext<(x: number, y: number) => void>(() => {});
export const useParticle = () => useContext(Ctx);

const LERP = 0.08;

export function ParticleProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let targetX = -999, targetY = -999;
    let currentX = -999, currentY = -999;
    let rafId: number;

    function onMouseMove(e: MouseEvent) {
      targetX = e.clientX;
      targetY = e.clientY;
    }

    function tick() {
      currentX += (targetX - currentX) * LERP;
      currentY += (targetY - currentY) * LERP;

      // Drive body's background spotlight via --mx/--my on <html>
      // body inherits custom props from html
      document.documentElement.style.setProperty('--mx', `${currentX}px`);
      document.documentElement.style.setProperty('--my', `${currentY}px`);

      // Also drive per-card spotlights
      const els = document.querySelectorAll<HTMLElement>('[data-spotlight]');
      els.forEach(el => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--sx', `${targetX - rect.left}px`);
        el.style.setProperty('--sy', `${targetY - rect.top}px`);
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
