// bootstrap.mjs — FAVICON PATCH
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const FILES = {

  'public/favicon.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#0a0a0c"/>
  <text x="32" y="45"
        font-family="'SF Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
        font-size="34"
        font-weight="800"
        fill="#ffffff"
        text-anchor="middle"
        letter-spacing="-2">FC</text>
</svg>
`,

  'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="theme-color" content="#0a0a0c" />
    <meta name="description" content="Fastcut — full-resolution directional motion blur in the browser. No uploads. No servers." />
    <title>Fastcut — Motion blur, in the browser</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
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