import { useEffect, useRef, useState } from 'react';
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const t = useRef({ x: 0, y: 0 });
  const p = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    const move = (e: MouseEvent) => {
      t.current.x = e.clientX; t.current.y = e.clientY;
      setOn(!!(e.target as HTMLElement)?.closest?.('a,button,[data-cursor]'));
    };
    let raf = 0;
    const loop = () => {
      p.current.x += (t.current.x - p.current.x) * 0.16;
      p.current.y += (t.current.y - p.current.y) * 0.16;
      if (ref.current) ref.current.style.transform = 'translate3d(' + p.current.x + 'px,' + p.current.y + 'px,0)';
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener('mousemove', move, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className={'cursor' + (on ? ' on' : '')} aria-hidden="true"><div className="cursor-dot" /></div>;
}