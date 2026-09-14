// bootstrap.mjs — FC FAVICON MATCHED TO OK
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const FILES = {

  'public/favicon.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#000000"/>
  <text x="32" y="46"
        font-family="'SF Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"
        font-size="38"
        font-weight="800"
        fill="#ffffff"
        text-anchor="middle"
        letter-spacing="-3">FC</text>
</svg>
`,

};

let n = 0;
for (const [path, content] of Object.entries(FILES)) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
  console.log('  wrote ' + path);
  n++;
}
console.log('\n' + n + ' file(s) written.');