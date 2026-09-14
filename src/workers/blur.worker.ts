/// <reference lib="webworker" />
import { Muxer, ArrayBufferTarget } from 'webm-muxer';

const WGSL = `
struct Params {
  width: u32,
  height: u32,
  blurStrength: f32,
  motionThreshold: f32,
};

@group(0) @binding(0) var currTex: texture_2d<f32>;
@group(0) @binding(1) var prevTex: texture_2d<f32>;
@group(0) @binding(2) var outTex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var<uniform> p: Params;
@group(0) @binding(4) var samp: sampler;

fn luma(c: vec3<f32>) -> f32 {
  return dot(c, vec3<f32>(0.2126, 0.7152, 0.0722));
}

@compute @workgroup_size(16, 16, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let x = i32(gid.x);
  let y = i32(gid.y);
  let W = i32(p.width);
  let H = i32(p.height);
  if (x >= W || y >= H) { return; }

  let uv = (vec2<f32>(f32(x), f32(y)) + 0.5) / vec2<f32>(f32(W), f32(H));

  let curr = textureSampleLevel(currTex, samp, uv, 0.0).rgb;
  let prev = textureSampleLevel(prevTex, samp, uv, 0.0).rgb;
  let lumaDiff = abs(luma(curr) - luma(prev));

  var neighborMotion = 0.0;
  for (var dy = -1; dy <= 1; dy += 1) {
    for (var dx = -1; dx <= 1; dx += 1) {
      let cx = clamp(x + dx, 0, W - 1);
      let cy = clamp(y + dy, 0, H - 1);
      let c = textureLoad(currTex, vec2<i32>(cx, cy), 0).rgb;
      let pr = textureLoad(prevTex, vec2<i32>(cx, cy), 0).rgb;
      neighborMotion = max(neighborMotion, abs(luma(c) - luma(pr)));
    }
  }
  if (lumaDiff < p.motionThreshold || neighborMotion < p.motionThreshold * 1.5) {
    textureStore(outTex, vec2<i32>(x, y), vec4<f32>(curr, 1.0));
    return;
  }
  if (lumaDiff > 0.6) {
    textureStore(outTex, vec2<i32>(x, y), vec4<f32>(curr, 1.0));
    return;
  }

  var gx = 0.0;
  var gy = 0.0;
  for (var dy = -2; dy <= 2; dy += 1) {
    for (var dx = -2; dx <= 2; dx += 1) {
      let px = clamp(x + dx, 1, W - 2);
      let py = clamp(y + dy, 1, H - 2);
      let l_right = luma(textureLoad(currTex, vec2<i32>(px + 1, py), 0).rgb);
      let l_left  = luma(textureLoad(currTex, vec2<i32>(px - 1, py), 0).rgb);
      let l_down  = luma(textureLoad(currTex, vec2<i32>(px, py + 1), 0).rgb);
      let l_up    = luma(textureLoad(currTex, vec2<i32>(px, py - 1), 0).rgb);
      let w = 1.0 / (1.0 + f32(abs(dx) + abs(dy)));
      gx += (l_right - l_left) * w;
      gy += (l_down - l_up) * w;
    }
  }

  var dir: vec2<f32>;
  let gmag = length(vec2<f32>(gx, gy));
  if (gmag < 0.01) {
    let tmag = length(curr - prev);
    if (tmag < 0.001) {
      textureStore(outTex, vec2<i32>(x, y), vec4<f32>(curr, 1.0));
      return;
    }
    dir = normalize((curr - prev).xy);
  } else {
    dir = normalize(vec2<f32>(gx, gy));
  }

  let motionAmp = clamp(lumaDiff * 3.0, 0.0, 1.0);
  let w = p.blurStrength * motionAmp;

  let pixelSize = 1.0 / vec2<f32>(f32(W), f32(H));
  let trailRange = 24.0;
  let taps = 24;

  var acc = curr * 3.0;
  var tot = 3.0;

  for (var i: i32 = 0; i < taps; i += 1) {
    let fi = f32(i);
    let t = (fi / f32(taps - 1)) - 0.5;
    let sample_uv = uv + dir * w * t * trailRange * pixelSize;
    let s = textureSampleLevel(currTex, samp, sample_uv, 0.0).rgb;
    let spatial = exp(-3.5 * t * t);
    let colorDist = length(s - curr);
    let colorW = exp(-colorDist * colorDist * 25.0);
    let sw = spatial * colorW;
    acc = acc + s * sw;
    tot = tot + sw;
  }

  for (var i: i32 = 0; i < taps; i += 1) {
    let fi = f32(i);
    let t = (fi + 1.0) / f32(taps);
    let sample_uv = uv - dir * w * t * trailRange * pixelSize;
    let s = textureSampleLevel(prevTex, samp, sample_uv, 0.0).rgb;
    let spatial = exp(-3.5 * t * t);
    let colorDist = length(s - curr);
    let colorW = exp(-colorDist * colorDist * 20.0);
    let temporalW = 0.6 * (1.0 - t * 0.6);
    let sw = spatial * colorW * temporalW;
    acc = acc + s * sw;
    tot = tot + sw;
  }

  let result = acc / tot;
  textureStore(outTex, vec2<i32>(x, y), vec4<f32>(result, 1.0));
}
`;

let device: GPUDevice | null = null;
let pipeline: GPUComputePipeline | null = null;
let prevTex: GPUTexture | null = null;
let sampler: GPUSampler | null = null;
let encoder: VideoEncoder | null = null;
let muxer: Muxer<ArrayBufferTarget> | null = null;
let W = 0, H = 0, FPS = 30, TOTAL = 1;
let cancelled = false;
let chain: Promise<void> = Promise.resolve();
let encodedFrames = 0;
let lastTimestampUs = -1;

async function pickCodec(w: number, h: number, bitrate: number): Promise<string> {
  let level = '40';
  if (w <= 176 && h <= 144) level = '10';
  else if (w <= 352 && h <= 288) level = '20';
  else if (w <= 720 && h <= 576) level = '30';
  else if (w <= 1920 && h <= 1080) level = '40';
  else if (w <= 3840 && h <= 2160) level = '50';
  else level = '51';
  const candidates = [`vp09.00.${level}.08`, 'vp09.00.40.08', 'vp09.00.50.08', 'vp8'];
  for (const c of candidates) {
    try {
      const ok = await VideoEncoder.isConfigSupported({ codec: c, width: w, height: h, bitrate, framerate: FPS });
      if (ok.supported) { console.log('[encoder] using codec:', c); return c; }
    } catch {}
  }
  return 'vp8';
}

function makeTex(d: Uint8Array): GPUTexture {
  const tex = device!.createTexture({
    size: [W, H], format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.COPY_SRC |
      GPUTextureUsage.STORAGE_BINDING,
  });
  device!.queue.writeTexture({ texture: tex }, d, { bytesPerRow: W * 4, rowsPerImage: H }, [W, H]);
  return tex;
}

async function readTex(tex: GPUTexture): Promise<Uint8Array> {
  const bpr = Math.ceil((W * 4) / 256) * 256;
  const rbuf = device!.createBuffer({ size: bpr * H, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
  const rc = device!.createCommandEncoder();
  rc.copyTextureToBuffer({ texture: tex }, { buffer: rbuf, bytesPerRow: bpr, rowsPerImage: H }, [W, H]);
  device!.queue.submit([rc.finish()]);
  await rbuf.mapAsync(GPUMapMode.READ);
  const m = new Uint8Array(rbuf.getMappedRange());
  const out = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) out.set(m.subarray(y * bpr, y * bpr + W * 4), y * W * 4);
  rbuf.unmap(); rbuf.destroy();
  return out;
}

async function encodeFrame(rgba: Uint8Array, targetUs: number, key: boolean) {
  if (!encoder || encoder.state !== 'configured') return;
  while (encoder.encodeQueueSize > 12) await new Promise((r) => setTimeout(r, 4));
  const ts = targetUs > lastTimestampUs ? targetUs : lastTimestampUs + 1;
  lastTimestampUs = ts;
  const img = new ImageData(new Uint8ClampedArray(rgba.buffer.slice(0)), W, H);
  const bmp = await createImageBitmap(img);
  const frame = new VideoFrame(bmp, { timestamp: ts, duration: Math.round(1_000_000 / FPS) });
  encoder.encode(frame, { keyFrame: key });
  frame.close(); bmp.close();
  encodedFrames++;
}

async function init(cfg: any) {
  W = cfg.width; H = cfg.height; FPS = cfg.fps; TOTAL = cfg.totalFrames;
  cancelled = false; encodedFrames = 0; lastTimestampUs = -1;
  const targetBitrate = cfg.targetBitrate ?? 20_000_000;

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('WebGPU not available');
  device = await adapter.requestDevice();

  pipeline = device.createComputePipeline({
    layout: 'auto',
    compute: { module: device.createShaderModule({ code: WGSL }), entryPoint: 'main' },
  });

  sampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
    addressModeU: 'clamp-to-edge',
    addressModeV: 'clamp-to-edge',
  });

  prevTex = device.createTexture({
    size: [W, H], format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.COPY_SRC |
      GPUTextureUsage.STORAGE_BINDING,
  });
  device.queue.writeTexture({ texture: prevTex }, new Uint8Array(W * H * 4), { bytesPerRow: W * 4, rowsPerImage: H }, [W, H]);

  muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'V_VP9', width: W, height: H },
    firstTimestampBehavior: 'offset',
  });

  const codec = await pickCodec(W, H, targetBitrate);

  encoder = new VideoEncoder({
    output: (chunk, meta) => { if (muxer) muxer.addVideoChunk(chunk, meta); },
    error: (e) => { console.error('[encoder] error', e); self.postMessage({ type: 'error', error: 'Encoder: ' + e.message }); },
  });
  encoder.configure({
    codec,
    width: W, height: H,
    bitrate: targetBitrate,
    framerate: FPS,
    bitrateMode: 'variable',
    latencyMode: 'quality',
  });

  console.log('[encoder] configured', codec, W + 'x' + H, FPS + 'fps', (targetBitrate / 1e6).toFixed(1) + 'Mbps');
  self.postMessage({ type: 'ready', backend: 'full-res-max' });
}

async function handleFrame(buffer: ArrayBuffer, index: number, mediaTime: number) {
  if (!device || !encoder || !pipeline || !prevTex || !sampler || cancelled) return;

  const curr = new Uint8Array(buffer);
  const currTex = makeTex(curr);

  const outTex = device.createTexture({
    size: [W, H], format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.STORAGE_BINDING,
  });

  const ubo = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const ub = new ArrayBuffer(16);
  new Uint32Array(ub, 0, 2).set([W, H]);
  new Float32Array(ub, 8, 2).set([0.95, 0.08]);
  device.queue.writeBuffer(ubo, 0, ub);

  const bg = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: currTex.createView() },
      { binding: 1, resource: prevTex.createView() },
      { binding: 2, resource: outTex.createView() },
      { binding: 3, resource: { buffer: ubo } },
      { binding: 4, resource: sampler },
    ],
  });

  const cmd = device.createCommandEncoder();
  const pass = cmd.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bg);
  pass.dispatchWorkgroups(Math.ceil(W / 16), Math.ceil(H / 16));
  pass.end();
  cmd.copyTextureToTexture({ texture: currTex }, { texture: prevTex }, [W, H]);
  device.queue.submit([cmd.finish()]);

  const pixels = await readTex(outTex);
  currTex.destroy(); outTex.destroy(); ubo.destroy();

  await encodeFrame(pixels, Math.round(mediaTime * 1_000_000), index % 60 === 0);

  self.postMessage({ type: 'frame-done', index });
  self.postMessage({ type: 'progress', progress: Math.min((index + 1) / TOTAL, 0.95), frames: index + 1 });
}

async function finish() {
  if (!encoder || !muxer) return;
  self.postMessage({ type: 'progress', progress: 0.97 });
  try {
    await encoder.flush();
    console.log('[encoder] flushed. frames encoded:', encodedFrames);
    encoder.close(); encoder = null;
    if (encodedFrames < 2) throw new Error('Encoding produced fewer than 2 frames');
    muxer.finalize();
    const { buffer } = muxer.target as ArrayBufferTarget;
    muxer = null;
    if (buffer.byteLength < 10_000) throw new Error('Output under 10 KB');
    if (prevTex) { prevTex.destroy(); prevTex = null; }
    console.log('[finalize] output size:', (buffer.byteLength / 1024).toFixed(1), 'KB across', encodedFrames, 'frames');
    self.postMessage({ type: 'encode-result', data: new Uint8Array(buffer) }, [buffer]);
  } catch (err) {
    console.error('[finish] failed', err);
    self.postMessage({ type: 'error', error: 'Finalize: ' + String(err) });
  }
}

self.onmessage = (e: MessageEvent) => {
  chain = chain.then(async () => {
    try {
      const d = e.data;
      if (d.type === 'init') await init(d.config);
      else if (d.type === 'frame') await handleFrame(d.buffer, d.index, d.mediaTime);
      else if (d.type === 'finish') await finish();
      else if (d.type === 'cancel') {
        cancelled = true;
        if (encoder) { try { encoder.close(); } catch {} encoder = null; }
        muxer = null;
        if (prevTex) { prevTex.destroy(); prevTex = null; }
      }
    } catch (err) {
      console.error('[worker]', err);
      self.postMessage({ type: 'error', error: String(err) });
    }
  });
};