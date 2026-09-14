import { useState, useRef, useCallback, useEffect, type RefObject } from 'react';

export type State = 'idle' | 'loading' | 'processing' | 'done' | 'error';
const SOURCE_FPS = 30;

export function useMotionBlur(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [state, setState] = useState<State>('idle');
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [backend, setBackend] = useState<string>('—');
  const workerRef = useRef<Worker | null>(null);
  const cancelRef = useRef(false);
  const pendingRef = useRef(0);
  const activeRef = useRef(false);

  useEffect(() => {
    const w = new Worker(new URL('../workers/blur.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = w;
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'ready') setBackend(m.backend);
      else if (m.type === 'progress') { setProgress(m.progress); if (typeof m.frames === 'number') setFrameCount(m.frames); }
      else if (m.type === 'frame-done') pendingRef.current = Math.max(0, pendingRef.current - 1);
      else if (m.type === 'encode-result') {
        const blob = new Blob([m.data], { type: 'video/webm' });
        setOutputUrl(URL.createObjectURL(blob));
        setState('done'); setProgress(1); activeRef.current = false;
      } else if (m.type === 'error') { setError(m.error); setState('error'); activeRef.current = false; }
    };
    return () => w.terminate();
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = true; pendingRef.current = 0; activeRef.current = false;
    setState('idle'); setProgress(0); setOutputUrl(null); setError(null);
    setDimensions(null); setFrameCount(0); setBackend('—');
  }, []);

  const process = useCallback(async (file: File) => {
    if (activeRef.current) return;
    activeRef.current = true;
    setState('loading'); setProgress(0); setError(null); setOutputUrl(null); setFrameCount(0);
    cancelRef.current = false; pendingRef.current = 0;

    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true; video.playsInline = true; video.preload = 'auto'; video.crossOrigin = 'anonymous';

    try {
      await new Promise<void>((res, rej) => {
        video.onloadedmetadata = () => res();
        video.onerror = () => rej(new Error('Cannot read this video file'));
      });

      const W = video.videoWidth;
      const H = video.videoHeight;
      const duration = video.duration;
      if (!W || !H) throw new Error('Invalid video dimensions');

      const totalFrames = Math.max(1, Math.round(duration * SOURCE_FPS));
      const sourceBitrate = (file.size * 8) / Math.max(duration, 0.1);
      const targetBitrate = Math.min(Math.max(Math.round(sourceBitrate * 1.6), 15_000_000), 80_000_000);

      console.log(
        '[pipeline] loaded', W + 'x' + H, duration.toFixed(2) + 's',
        '->', totalFrames, 'frames',
        '| source ~' + (sourceBitrate / 1e6).toFixed(1) + ' Mbps',
        '| target ' + (targetBitrate / 1e6).toFixed(1) + ' Mbps',
      );
      setDimensions({ w: W, h: H });

      const canvas = canvasRef.current;
      if (canvas) { canvas.width = W; canvas.height = H; }
      const previewCtx = canvas?.getContext('2d');

      workerRef.current!.postMessage({
        type: 'init',
        config: { width: W, height: H, fps: SOURCE_FPS, totalFrames, targetBitrate },
      });
      await new Promise<void>((res) => {
        const h = (e: MessageEvent) => {
          if (e.data.type === 'ready') { workerRef.current!.removeEventListener('message', h); res(); }
        };
        workerRef.current!.addEventListener('message', h);
      });

      setState('processing');

      const workCanvas = document.createElement('canvas');
      workCanvas.width = W; workCanvas.height = H;
      const workCtx = workCanvas.getContext('2d', { willReadFrequently: true })!;

      const MAX_PENDING = 4;
      let sent = 0;

      for (let i = 0; i < totalFrames; i++) {
        if (cancelRef.current) break;
        while (pendingRef.current >= MAX_PENDING && !cancelRef.current) {
          await new Promise((r) => setTimeout(r, 8));
        }
        if (cancelRef.current) break;

        const t = i / SOURCE_FPS;
        await new Promise<void>((resolve) => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            video.removeEventListener('seeked', finish);
            resolve();
          };
          video.addEventListener('seeked', finish);
          video.currentTime = Math.min(t, Math.max(0, duration - 0.001));
          setTimeout(finish, 800);
        });

        if (cancelRef.current) break;

        workCtx.drawImage(video, 0, 0, W, H);
        const img = workCtx.getImageData(0, 0, W, H);
        if (previewCtx) previewCtx.putImageData(img, 0, 0);

        const copy = new Uint8ClampedArray(img.data);
        pendingRef.current++;
        workerRef.current!.postMessage(
          { type: 'frame', buffer: copy.buffer, index: i, mediaTime: t },
          [copy.buffer],
        );
        sent++;
        setProgress(0.02 + 0.9 * (sent / totalFrames));
      }

      console.log('[pipeline] sent', sent, 'of', totalFrames, 'frames');
      while (pendingRef.current > 0 && !cancelRef.current) {
        await new Promise((r) => setTimeout(r, 50));
      }
      video.src = '';
      if (!cancelRef.current) workerRef.current!.postMessage({ type: 'finish' });
    } catch (e: any) {
      setError(e?.message || String(e));
      setState('error');
      activeRef.current = false;
    }
  }, [canvasRef]);

  return { state, progress, outputUrl, error, dimensions, frameCount, backend, process, reset };
}