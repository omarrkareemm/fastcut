export interface Capabilities { webgpu: boolean; webcodecs: boolean; sharedArrayBuffer: boolean; opfs: boolean; supported: boolean; reason?: string; }
export async function probeCapabilities(): Promise<Capabilities> {
  const webgpu = 'gpu' in navigator && !!(await navigator.gpu?.requestAdapter?.());
  const webcodecs = typeof (globalThis as any).VideoDecoder !== 'undefined' && typeof (globalThis as any).VideoEncoder !== 'undefined';
  const sharedArrayBuffer = (globalThis as any).crossOriginIsolated === true;
  const opfs = 'storage' in navigator && 'getDirectory' in navigator.storage;
  const isChromium = /Chrome|Edg/.test(navigator.userAgent) && !/Firefox/.test(navigator.userAgent);
  const supported = isChromium && webgpu && webcodecs && sharedArrayBuffer && opfs;
  let reason: string | undefined;
  if (!isChromium) reason = 'Only Chrome and Edge 113+ are supported in v1.';
  else if (!webgpu) reason = 'WebGPU unavailable.';
  else if (!sharedArrayBuffer) reason = 'Cross-origin isolation missing (COOP/COEP).';
  else if (!webcodecs) reason = 'WebCodecs unavailable.';
  else if (!opfs) reason = 'OPFS unavailable.';
  return { webgpu, webcodecs, sharedArrayBuffer, opfs, supported, reason };
}