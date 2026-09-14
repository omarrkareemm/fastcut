
// Motion Blur: Blurs along motion vector estimated from frame differencing
export const motionBlurShader = `
struct Params {
  width: u32,
  height: u32,
  blurStrength: f32,
  numSamples: u32,
};
@group(0) @binding(0) var currTex: texture_2d<f32>;
@group(0) @binding(1) var prevTex: texture_2d<f32>;
@group(0) @binding(2) var outputTex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(3) var<uniform> params: Params;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.width || gid.y >= params.height) { return; }
  let coord = vec2<i32>(gid.xy);
  let curr = textureLoad(currTex, coord, 0).rgb;
  let prev = textureLoad(prevTex, coord, 0).rgb;
  let flow = curr - prev;
  if (length(flow) < 0.01 || params.blurStrength < 0.01) {
    textureStore(outputTex, coord, vec4<f32>(curr, 1.0));
    return;
  }
  var acc = vec3<f32>(0.0);
  var wsum = 0.0;
  let n = params.numSamples;
  for (var i: u32 = 0u; i < n; i++) {
    let t = (f32(i) / f32(n - 1u)) - 0.5;
    let offset = flow * t * params.blurStrength * 8.0;
    let sp = clamp(coord + vec2<i32>(offset), vec2<i32>(0), vec2<i32>(i32(params.width) - 1, i32(params.height) - 1));
    acc += textureLoad(currTex, sp, 0).rgb;
    wsum += 1.0;
  }
  let blurred = acc / wsum;
  let result = mix(curr, blurred, params.blurStrength);
  textureStore(outputTex, coord, vec4<f32>(result, 1.0));
}
`;

// Mask Blur: Blurs inside the masked region (color threshold based on prompt)
export const maskBlurShader = `
struct Params {
  width: u32,
  height: u32,
  blurStrength: f32,
  numSamples: u32,
  targetR: f32,
  targetG: f32,
  targetB: f32,
  threshold: f32,
};
@group(0) @binding(0) var inputTex: texture_2d<f32>;
@group(0) @binding(1) var outputTex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(2) var<uniform> params: Params;

@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  if (gid.x >= params.width || gid.y >= params.height) { return; }
  let coord = vec2<i32>(gid.xy);
  let color = textureLoad(inputTex, coord, 0).rgb;
  
  // Compute mask: 1.0 if inside, 0.0 if outside
  let target = vec3<f32>(params.targetR, params.targetG, params.targetB);
  let dist = length(color - target);
  let mask = select(1.0, 0.0, dist > params.threshold);
  
  if (mask < 0.5 || params.blurStrength < 0.01) {
    textureStore(outputTex, coord, vec4<f32>(color, 1.0));
    return;
  }
  
  var acc = vec3<f32>(0.0);
  var wsum = 0.0;
  let n = params.numSamples;
  for (var i: u32 = 0u; i < n; i++) {
    for (var j: u32 = 0u; j < n; j++) {
      let ox = i32(f32(i) - f32(n) / 2.0);
      let oy = i32(f32(j) - f32(n) / 2.0);
      let sp = clamp(coord + vec2<i32>(ox, oy), vec2<i32>(0), vec2<i32>(i32(params.width) - 1, i32(params.height) - 1));
      acc += textureLoad(inputTex, sp, 0).rgb;
      wsum += 1.0;
    }
  }
  let blurred = acc / wsum;
  let result = mix(color, blurred, params.blurStrength);
  textureStore(outputTex, coord, vec4<f32>(result, 1.0));
}
`;
