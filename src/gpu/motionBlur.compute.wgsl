struct Params { width: u32, height: u32, blurStrength: f32, numSamples: u32, discontinuityThreshold: f32, _pad0: f32, _pad1: f32, _pad2: f32, };
@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var flowTex: texture_2d<f32>;
@group(0) @binding(2) var maskTex: texture_2d<f32>;
@group(0) @binding(3) var outputTex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(4) var<uniform> params: Params;
@compute @workgroup_size(8, 8, 1) fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.width || gid.y >= params.height) { return; }
  let coord = vec2<i32>(gid.xy);
  let centerFlow = textureLoad(flowTex, coord, 0).rg;
  let centerMask = textureLoad(maskTex, coord, 0).r;
  if (length(centerFlow) < 0.5 && centerMask < 0.01) { textureStore(outputTex, coord, textureLoad(inputTex, coord, 0)); return; }
  var acc = vec3<f32>(0.0); var wsum = 0.0; let strength = params.blurStrength * centerMask; let n = params.numSamples;
  for (var i: u32 = 0u; i < n; i++) {
    let t = (f32(i) / f32(n - 1u)) - 0.5; let offset = centerFlow * t * strength * 32.0;
    let sp = clamp(coord + vec2<i32>(offset), vec2<i32>(0), vec2<i32>(i32(params.width) - 1, i32(params.height) - 1));
    let sFlow = textureLoad(flowTex, sp, 0).rg; let diff = length(sFlow - centerFlow);
    let w = select(1.0, exp(-diff * diff / max(params.discontinuityThreshold, 0.001)), diff > params.discontinuityThreshold);
    acc += textureLoad(inputTex, sp, 0).rgb * w; wsum += w;
  }
  let blurred = acc / max(wsum, 0.001); let orig = textureLoad(inputTex, coord, 0).rgb;
  textureStore(outputTex, coord, vec4<f32>(mix(orig, blurred, centerMask), 1.0));
}