import { useEffect, useRef } from 'react';
export function Grain() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const s = 160; c.width = s; c.height = s;
    const img = ctx.createImageData(s, s); const d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = (Math.random()*255)|0; d[i]=v;d[i+1]=v;d[i+2]=v;d[i+3]=255; }
    ctx.putImageData(img, 0, 0);
  }, []);
  return <canvas ref={ref} className="grain" aria-hidden="true" />;
}