# Fastcut

Full-resolution directional motion blur in the browser. 100% client-side.

Built with Vite + React + TypeScript + WebGPU + WebCodecs.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:5173 in Chrome or Edge 113+.

## Deployment

This site deploys automatically to GitHub Pages on every push to `main`.

**One-time setup:**

1. Go to **Settings → Pages** in this repository
2. Under **Source**, choose **GitHub Actions**
3. Push to `main` — the workflow builds and deploys automatically

The live site will be at `https://<your-username>.github.io/fastcut/`.

## Technology

- **WebGPU** — compute shaders for full-resolution motion blur
- **WebCodecs** — hardware-accelerated VP9 encoding
- **webm-muxer** — WebM container packaging
- **No servers, no uploads, no data leaves the device**
