import { useState, useEffect, useCallback } from 'react';
export function useRifeModel() {
  const [status, setStatus] = useState<'checking' | 'available' | 'missing'>('checking');
  const check = useCallback(async () => {
    try {
      const r = await fetch('/models/rife.onnx', { method: 'HEAD' });
      if (r.ok) { setStatus('available'); return; }
    } catch {}
    setStatus('missing');
  }, []);
  useEffect(() => { check(); }, [check]);
  return { status, recheck: check };
}