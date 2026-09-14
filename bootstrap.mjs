// bootstrap.mjs — GITHUB PAGES DEPLOY PATCH
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

// ─── Change this if your repo will be named differently ───
const REPO_NAME = 'fastcut';
// ─────────────────────────────────────────────────────────

const FILES = {

  'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from https://<user>.github.io/<repo>/
// so assets must be referenced with a base path.
export default defineConfig({
  base: '/${REPO_NAME}/',
  plugins: [react()],
  worker: { format: 'es' },
  build: { target: 'esnext' },
});`,

  '.gitignore': `node_modules
dist
dist-ssr
*.local
.vite
.DS_Store
*.log
npm-debug.log*
.env
.env.local
`,

  'public/.nojekyll': '',

  '.github/workflows/deploy.yml': `name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
`,

  'README.md': `# Fastcut

Full-resolution directional motion blur in the browser. 100% client-side.

Built with Vite + React + TypeScript + WebGPU + WebCodecs.

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:5173 in Chrome or Edge 113+.

## Deployment

This site deploys automatically to GitHub Pages on every push to \`main\`.

**One-time setup:**

1. Go to **Settings → Pages** in this repository
2. Under **Source**, choose **GitHub Actions**
3. Push to \`main\` — the workflow builds and deploys automatically

The live site will be at \`https://<your-username>.github.io/fastcut/\`.

## Technology

- **WebGPU** — compute shaders for full-resolution motion blur
- **WebCodecs** — hardware-accelerated VP9 encoding
- **webm-muxer** — WebM container packaging
- **No servers, no uploads, no data leaves the device**
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