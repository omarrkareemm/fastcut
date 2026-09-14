/// <reference lib="webworker" />
import { Muxer, ArrayBufferTarget } from 'webm-muxer';

const MOTION_BLUR_WGSL = `
struct Params {
  width: u32,
  height: u32,
  blurStrength: f32,
  searchRadius: i32,
  sampleCount: u32,
  _pad0: u32,
};

@group(0) @binding(0) var currTex: texture_2d<f32>;
@group(0) @binding(1) var prevTex: texture_2d<f32>;
@group(0) @binding(2) var outputTex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var<uniform> params: Params;

fn sampleRGB(tex: texture_2d<f32>, x: i32, y: i32) -> vec3<f32> {
  let W = i32(params.width);
  let H = i32(params.height);
  let cx = clamp(x, 0, W - 1);
  let cy = clamp(y, 0, H - 1);
  return textureLoad(tex, vec2<i32>(cx, cy), 0).rgb;
}

fn colorDiff(a: vec3<f32>, b: vec3<f32>) -> f32 {
  return abs(a.r - b.r) + abs(a.g - b.g) + abs(a.b - b.b);
}

fn estimateFlow(x: i32, y: i32) -> vec2<f32> {
  let center = sampleRGB(currTex, x, y);
  let r = params.searchRadius;
  var bestDx = 0;
  var bestDy = 0;
  var bestCost = 1e9;
  for (var dy = -r; dy <= r; dy += 1) {
    for (var dx = -r; dx <= r; dx += 1) {
      let candidate = sampleRGB(prevTex, x + dx, y + dy);
      let cost = colorDiff(center, candidate);
      if (cost < bestCost) { bestCost = cost; bestDx = dx; bestDy = dy; }
    }
  }
  return vec2<f32>(f32(-bestDx), f32(-bestDy));
}

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.width || gid.y >= params.height) { return; }
  let x = i32(gid.x);
  let y = i32(gid.y);
  let W = i32(params.width);
  let H = i32(params.height);
  let curr = sampleRGB(currTex, x, y);

  let isCrosshair = abs(x - W / 2) < 30 && abs(y - H / 2) < 30;
  let isMinimap = x < W / 6 && y < H / 4;
  if (isCrosshair || isMinimap || params.blurStrength < 0.01) {
    textureStore(outputTex, vec2<i32>(x, y), vec4<f32>(curr, 1.0));
    return;
  }

  let flow = estimateFlow(x, y);
  let flowMag = length(flow);
  if (flowMag < 1.5) {
    textureStore(outputTex, vec2<i32>(x, y), vec4<f32>(curr, 1.0));
    return;
  }

  let n = params.sampleCount;
  let s = params.blurStrength;
  var acc = vec3<f32>(0.0);
  var count = 0.0;
  for (var i: u32 = 0u; i < n; i += 1u) {
    let t = (f32(i) / f32(n - 1u)) - 0.5;
    let offset = flow * t * s * 2.5;
    let sx = x + i32(offset.x);
    let sy = y + i32(offset.y);
    acc += sampleRGB(currTex, sx, sy);
    count += 1.0;
  }
  let blurred = acc / count;
  textureStore(outputTex, vec2<i32>(x, y), vec4<f32>(blurred, 1.0));
}
`;

let device: GPUDevice | null = null;
let pipeline: GPUComputePipeline | null = null;
let muxer: Muxer<ArrayBufferTarget> | null = null;
let encoder: VideoEncoder | null = null;
let width = 0, height = 0, fps = 30;
let prevTexture: GPUTexture | null = null;
let cancelled = false;
let frameIndex = 0;

async function init(config: any) {
  width = config.width;
  height = config.height;
  fps = config.fps || 30;
  cancelled = false;
  frameIndex = 0;

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('WebGPU not available');
  device = await adapter.requestDevice();

  const module = device.createShaderModule({ code: MOTION_BLUR_WGSL });
  pipeline = device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'main' } });

  prevTexture = device.createTexture({
    size: [width, height], format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING,
  });

  muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'V_VP9', width, height },
    firstTimestampBehavior: 'offset',
  });
  encoder = new VideoEncoder({
    output: (chunk, meta) => { if (muxer) muxer.addVideoChunk(chunk, meta); },
    error: (e) => self.postMessage({ type: 'error', error: e.message }),
  });
  encoder.configure({ codec: 'vp09.00.10.08', width, height, bitrate: 8_000_000, framerate: 60 });

  self.postMessage({ type: 'ready' });
}

async function handleFrame(buffer: ArrayBuffer, index: number, mediaTime: number, frameFps: number, params: any) {
  if (!device || !encoder || !pipeline || cancelled) return;
  try {
    if (frameFps && frameFps > 0) fps = frameFps;

    const currTexture = device.createTexture({
      size: [width, height], format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.STORAGE_BINDING,
    });
    device.queue.writeTexture(
      { texture: currTexture },
      new Uint8Array(buffer),
      { bytesPerRow: width * 4, rowsPerImage: height },
      [width, height]
    );

    const outTexture = device.createTexture({
      size: [width, height], format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.STORAGE_BINDING,
    });

    const uniformBuffer = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const ub = new ArrayBuffer(32);
    new Uint32Array(ub, 0, 2).set([width, height]);
    new Float32Array(ub, 8, 1).set([params.blurIntensity]);
    new Int32Array(ub, 12, 1).set([3]);
    new Uint32Array(ub, 16, 1).set([10]);
    device.queue.writeBuffer(uniformBuffer, 0, ub);

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: currTexture.createView() },
        { binding: 1, resource: prevTexture!.createView() },
        { binding: 2, resource: outTexture.createView() },
        { binding: 3, resource: { buffer: uniformBuffer } },
      ],
    });

    const cmd = device.createCommandEncoder();
    const pass = cmd.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8));
    pass.end();
    device.queue.submit([cmd.finish()]);

    const bytesPerRow = Math.ceil(width * 4 / 256) * 256;
    const readBuffer = device.createBuffer({
      size: bytesPerRow * height,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    const rc = device.createCommandEncoder();
    rc.copyTextureToBuffer(
      { texture: outTexture },
      { buffer: readBuffer, bytesPerRow, rowsPerImage: height },
      [width, height]
    );
    device.queue.submit([rc.finish()]);

    await readBuffer.mapAsync(GPUMapMode.READ);
    const mapped = new Uint8Array(readBuffer.getMappedRange());
    const result = new Uint8Array(width * height * 4);
    for (let yy = 0; yy < height; yy++) {
      result.set(mapped.subarray(yy * bytesPerRow, yy * bytesPerRow + width * 4), yy * width * 4);
    }
    readBuffer.unmap();
    readBuffer.destroy();

    const cc = device.createCommandEncoder();
    cc.copyTextureToTexture({ texture: currTexture }, { texture: prevTexture! }, [width, height]);
    device.queue.submit([cc.finish()]);

    const imageData = new ImageData(new Uint8ClampedArray(result.buffer), width, height);
    const bitmap = await createImageBitmap(imageData);
    const timestamp = Math.round(mediaTime * 1_000_000);
    const frame = new VideoFrame(bitmap, { timestamp, duration: Math.round(1_000_000 / fps) });
    encoder.encode(frame, { keyFrame: frameIndex % 60 === 0 });
    frame.close();
    bitmap.close();

    currTexture.destroy();
    outTexture.destroy();
    uniformBuffer.destroy();

    frameIndex++;
    self.postMessage({ type: 'progress', stage: `Encoding frame ${index + 1}`, progress: 0.9 });
  } catch (err) {
    self.postMessage({ type: 'error', error: 'Frame ' + index + ': ' + String(err) });
  }
}

async function finish() {
  if (!encoder || !muxer) return;
  self.postMessage({ type: 'progress', stage: 'Finalizing video…', progress: 0.97 });
  try {
    await encoder.flush();
    encoder.close(); encoder = null;
    muxer.finalize();
    const { buffer } = muxer.target as ArrayBufferTarget;
    muxer = null;
    if (prevTexture) { prevTexture.destroy(); prevTexture = null; }
    self.postMessage({ type: 'encode-result', data: new Uint8Array(buffer) }, [buffer]);
  } catch (err) {
    self.postMessage({ type: 'error', error: 'Finish: ' + String(err) });
  }
}

self.onmessage = async (e: MessageEvent) => {
  try {
    switch (e.data.type) {
      case 'init': await init(e.data.config); break;
      case 'frame': await handleFrame(e.data.buffer, e.data.index, e.data.mediaTime, e.data.fps, e.data.params); break;
      case 'finish': await finish(); break;
      case 'cancel':
        cancelled = true;
        if (encoder) { try { encoder.close(); } catch {} encoder = null; }
        muxer = null;
        if (prevTexture) { prevTexture.destroy(); prevTexture = null; }
        break;
    }
  } catch (err) { self.postMessage({ type: 'error', error: String(err) }); }
};