import { useEffect, useRef } from 'react';
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (ref.current) ref.current.style.transform = 'scaleX(' + (max > 0 ? h.scrollTop / max : 0) + ')';
    };
    window.addEventListener('scroll', on, { passive: true }); on();
    return () => window.removeEventListener('scroll', on);
  }, []);
  return <div className="scroll-progress" aria-hidden="true"><div ref={ref} className="scroll-progress-fill" /></div>;
}