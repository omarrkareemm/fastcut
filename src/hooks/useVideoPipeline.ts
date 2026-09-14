import { useState, useRef, useCallback, useEffect, type RefObject } from 'react';

export function useVideoPipeline(previewCanvasRef: RefObject<HTMLCanvasElement | null>) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    const worker = new Worker(new URL('../workers/frame-processor.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent) => {
      const msg = e.data;
      switch (msg.type) {
        case 'ready': setStage('Processing video…'); break;
        case 'progress': setStage(msg.stage); setProgress(msg.progress); break;
        case 'encode-result': {
          const blob = new Blob([msg.data], { type: 'video/webm' });
          setOutputUrl(URL.createObjectURL(blob));
          setIsProcessing(false); setStage('Complete'); setProgress(1);
          break;
        }
        case 'error': setError(msg.error); setIsProcessing(false); break;
      }
    };
    return () => worker.terminate();
  }, []);

  const startPipeline = useCallback(async (file: File, params: any) => {
    setIsProcessing(true);
    setProgress(0); setError(null); setOutputUrl(null);
    setStage('Loading video…');
    cancelRef.current = false;

    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video'));
    });

    const width = video.videoWidth;
    const height = video.videoHeight;
    const duration = video.duration;

    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      previewCanvas.width = width;
      previewCanvas.height = height;
    }
    const previewCtx = previewCanvas?.getContext('2d');

    workerRef.current?.postMessage({
      type: 'init',
      config: { width, height, fps: 30, totalFrames: 1 }
    });
    await new Promise<void>((resolve) => {
      const handler = (e: MessageEvent) => {
        if (e.data.type === 'ready') {
          workerRef.current?.removeEventListener('message', handler);
          resolve();
        }
      };
      workerRef.current?.addEventListener('message', handler);
    });

    const workCanvas = document.createElement('canvas');
    workCanvas.width = width;
    workCanvas.height = height;
    const workCtx = workCanvas.getContext('2d', { willReadFrequently: true });
    if (!workCtx) throw new Error('Could not get 2D context');

    let frameCount = 0;
    let firstMediaTime = -1;
    let estimatedFps = 30;

    await new Promise<void>((resolve) => {
      const captureFrame = (_now: number, metadata: any) => {
        if (cancelRef.current) { video.pause(); resolve(); return; }

        const mediaTime = metadata.mediaTime ?? (frameCount / 30);
        if (firstMediaTime < 0) firstMediaTime = mediaTime;
        if (frameCount === 10 && mediaTime > firstMediaTime) {
          estimatedFps = Math.round(10 / (mediaTime - firstMediaTime));
          estimatedFps = Math.max(15, Math.min(120, estimatedFps));
        }

        workCtx.drawImage(video, 0, 0, width, height);
        const imageData = workCtx.getImageData(0, 0, width, height);
        if (previewCtx) previewCtx.putImageData(imageData, 0, 0);

        const workerCopy = new Uint8ClampedArray(imageData.data);
        workerRef.current?.postMessage({
          type: 'frame',
          buffer: workerCopy.buffer,
          index: frameCount,
          mediaTime,
          fps: estimatedFps,
          params,
        }, [workerCopy.buffer]);

        frameCount++;
        const estTotal = Math.max(1, Math.round(duration * estimatedFps));
        setStage(`Rendering frame ${frameCount} of ~${estTotal} · ${estimatedFps} fps`);
        setProgress(Math.min(frameCount / estTotal, 0.9));

        if (!video.ended && !video.paused) {
          (video as any).requestVideoFrameCallback(captureFrame);
        } else {
          resolve();
        }
      };

      video.onended = () => resolve();
      (video as any).requestVideoFrameCallback(captureFrame);
      video.play().catch((err) => setError('Play failed: ' + err.message));
    });

    video.pause();
    video.src = '';
    workerRef.current?.postMessage({ type: 'finish' });
  }, [previewCanvasRef]);

  const cancelPipeline = useCallback(() => {
    cancelRef.current = true;
    workerRef.current?.postMessage({ type: 'cancel' });
    setIsProcessing(false);
  }, []);

  return { isProcessing, progress, stage, outputUrl, error, startPipeline, cancelPipeline };
}