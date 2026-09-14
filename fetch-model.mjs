import { mkdir, writeFile, stat } from 'node:fs/promises';
const CANDIDATES = [
  'https://huggingface.co/FuryTMP/RIFE_fp32/resolve/main/RIFE_fp32.onnx',
  'https://huggingface.co/yuvraj108c/rife-onnx/resolve/main/rife.onnx',
  'https://huggingface.co/marduk191/rife/resolve/main/rife_v4.9.onnx',
];
const DEST = 'public/models/rife.onnx';
try {
  const s = await stat(DEST);
  if (s.size > 100_000) { console.log('  RIFE model present (' + (s.size/1e6).toFixed(1) + ' MB)'); process.exit(0); }
} catch {}
await mkdir('public/models', { recursive: true });
let ok = false;
for (const url of CANDIDATES) {
  try {
    console.log('  Trying ' + url);
    const r = await fetch(url, { redirect: 'follow' });
    if (!r.ok) { console.log('   HTTP ' + r.status); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 100_000) { console.log('   too small'); continue; }
    await writeFile(DEST, buf);
    console.log('  Downloaded RIFE model (' + (buf.length/1e6).toFixed(1) + ' MB)');
    ok = true;
    break;
  } catch (e) { console.log('   ' + e.message); }
}
if (!ok) {
  console.log('');
  console.log('  Could not auto-download RIFE.');
  console.log('  Place any RIFE ONNX at public/models/rife.onnx');
  console.log('  The app uses a fallback shader until then.');
}