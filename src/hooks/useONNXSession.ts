import { useEffect, useState, useCallback } from 'react';
import * as ort from 'onnxruntime-web/webgpu';

ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency ?? 4, 8);
ort.env.wasm.simd = true;

export interface SessionConfig {
  modelUrl: string;
  graphOptimizationLevel?: 'disabled' | 'basic' | 'extended' | 'all';
  enableGraphCapture?: boolean;
  preferredOutputLocation?: 'cpu' | 'gpu-buffer' | Record<string, 'cpu' | 'gpu-buffer'>;
  freeDimensionOverrides?: Record<string, number>;
}

export function useONNXSession(config: SessionConfig) {
  const [state, setState] = useState<{
    session: ort.InferenceSession | null;
    loading: boolean;
    error: string | null;
    backend: 'webgpu' | 'wasm' | null;
  }>({ session: null, loading: false, error: null, backend: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState(s => ({ ...s, loading: true, error: null }));
      try {
        const hasWebGPU = 'gpu' in navigator && !!(await navigator.gpu.requestAdapter());
        if (!hasWebGPU) throw new Error('WebGPU unavailable');

        const session = await ort.InferenceSession.create(config.modelUrl, {
          executionProviders: ['webgpu'],
          graphOptimizationLevel: config.graphOptimizationLevel ?? 'all',
          preferredOutputLocation: config.preferredOutputLocation ?? 'gpu-buffer',
          ...(config.enableGraphCapture ? {
            enableGraphCapture: true,
            freeDimensionOverrides: config.freeDimensionOverrides,
          } : {}),
        });

        if (!cancelled) {
          setState({ session, loading: false, error: null, backend: 'webgpu' });
        }
      } catch (err) {
        if (!cancelled) {
          setState(s => ({ ...s, loading: false, error: String(err) }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [config.modelUrl]);

  const release = useCallback(async () => {
    await state.session?.release?.();
  }, [state.session]);

  return { ...state, release };
}