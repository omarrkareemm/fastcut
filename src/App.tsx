import { useState, useRef, useCallback, useEffect } from 'react';
import { css } from './styles';
import { Cursor } from './components/Cursor';
import { Grain } from './components/Grain';
import { ScrollProgress } from './components/ScrollProgress';
import { Marquee } from './components/Marquee';
import { useMotionBlur } from './hooks/useMotionBlur';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { state, progress, outputUrl, error, dimensions, frameCount, backend, process, reset } =
    useMotionBlur(canvasRef);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Detect scroll — the nav gains a frosted-glass backdrop past 20px.
  useEffect(() => {
    let raf = 0;
    let queued = false;
    const update = () => {
      queued = false;
      setScrolled(window.scrollY > 20);
    };
    const on = () => {
      if (!queued) { queued = true; raf = requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', on, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (file) requestAnimationFrame(() => {
      document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [file]);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('video/')) return;
    setFile(f); process(f);
  }, [process]);

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); };
  const pick = () => inputRef.current?.click();
  const resetAll = useCallback(() => { reset(); setFile(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [reset]);

  return (
    <>
      <style>{css}</style>
      <Grain />
      <Cursor />
      <ScrollProgress />

      <div className={'app' + (ready ? ' ready' : '')}>
        <nav className={'nav' + (scrolled ? ' scrolled' : '')}>
          <div className="nav-blur" />
          <div className="nav-content">
            <div className="nav-mark">
              <span className="nav-glyph">F</span>
              <span>Fastcut</span>
            </div>
            <div className="nav-meta">
              <span>FULL-RESOLUTION</span>
              <span>WEBGPU · V1.0</span>
              <span>◢ {new Date().getFullYear()}</span>
            </div>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-top">
            <div className="col"><span><span className="dot" />01 / ENGINE — ONLINE</span></div>
            <div className="col right"><span>CHROME · EDGE · WEBGPU</span><span>LATENCY · LOCAL</span></div>
          </div>
          <div className="hero-display">
            <h1 className="display">
              <span className="reveal-line">
                <span className="reveal-inner" style={{ '--rd': '0.35s' } as React.CSSProperties}>Motion</span>
              </span>
              <span className="reveal-line indent">
                <span className="reveal-inner" style={{ '--rd': '0.5s' } as React.CSSProperties}>Blur</span>
              </span>
            </h1>
          </div>
          <div className="hero-foot">
            <p className="hero-lede fade-item" style={{ '--rd': '0.85s' } as React.CSSProperties}>
              Full-resolution <em>directional motion blur</em> for any video. Native pixel processing, source-matched bitrate, zero quality loss.
            </p>
            <div className="hero-meta fade-item" style={{ '--rd': '1.05s' } as React.CSSProperties}>
              <div className="row"><span>01</span><span>Full-res processing</span></div>
              <div className="row"><span>02</span><span>Source-matched bitrate</span></div>
              <div className="row"><span>03</span><span>WebGPU compute</span></div>
              <div className="row"><span>04</span><span>Zero data leaves device</span></div>
            </div>
          </div>
        </section>

        <Marquee items={['FULL RESOLUTION','NO DOWNSCALING','SOURCE BITRATE','NO UPLOADS','WEBCODEX ENCODE','LOCAL ONLY','CHROME 113+']} />

        <section className="section" id="studio">
          <header className="section-head">
            <div><span className="dot live" style={{ display: 'inline-block', marginRight: 10 }} />02 / Studio — {state === 'idle' ? 'Awaiting source' : state.toUpperCase()}</div>
            <div>FASTCUT.BUILD/0001</div>
          </header>

          {!file && state !== 'processing' && state !== 'done' && (
            <div
              className={'dropzone' + (drag ? ' on' : '')}
              onClick={pick}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
            >
              <input ref={inputRef} type="file" accept="video/*" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="dropzone-inner">
                <div className="dz-index">[ 001 ]</div>
                <div>
                  <div className="dz-title">
                    <span className="row"><span>Drop</span></span>
                    <span className="row"><span className="outline">footage</span></span>
                  </div>
                  <div className="dz-hint">
                    <span>MP4</span><span className="sep">·</span>
                    <span>MOV</span><span className="sep">·</span>
                    <span>WEBM</span><span className="sep">·</span>
                    <span>Drag or click</span>
                  </div>
                </div>
                <div className="dz-arrow">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="dz-rule" />
              <div className="dz-foot">
                <span>No uploads</span><span className="sep">·</span>
                <span>100% local</span><span className="sep">·</span>
                <span>Full resolution</span><span className="sep">·</span>
                <span>Auto-processing</span>
              </div>
            </div>
          )}

          {file && (
            <div className="workspace">
              <div className="ws-left">
                <div className="canvas-head">
                  <div>Preview</div>
                  <div>{state === 'processing' ? 'Live · ' + Math.round(progress * 100) + '%' : state === 'done' ? 'Complete' : state.toUpperCase()}</div>
                </div>
                <div className="canvas-body">
                  <canvas ref={canvasRef} />
                  {state === 'loading' && <div className="canvas-empty">Loading footage…</div>}
                </div>
              </div>

              <aside className="ws-right">
                <div className="meta-block">
                  <div className="meta-label"><span className="dot" />Source</div>
                  <div className="file-row">
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>

                <div className="meta-block">
                  <div className="meta-label"><span className="dot" />Pipeline</div>
                  <div className="meta-list">
                    <div className="meta-row"><span className="k">Render path</span><span className="v good">Full-res GPU</span></div>
                    <div className="meta-row"><span className="k">Bitrate</span><span className="v">Source × 1.6</span></div>
                    <div className="meta-row"><span className="k">Encoder mode</span><span className="v">Quality</span></div>
                    <div className="meta-row"><span className="k">Codec</span><span className="v">VP9</span></div>
                    <div className="meta-row"><span className="k">Resolution</span><span className="v">{dimensions ? dimensions.w + ' × ' + dimensions.h : '—'}</span></div>
                    {backend !== '—' && <div className="meta-row"><span className="k">Active</span><span className="v">{backend}</span></div>}
                  </div>
                </div>

                {state === 'processing' && (
                  <div className="meta-block">
                    <div className="meta-label"><span className="dot live" />Progress</div>
                    <div className="progress-track"><div className="progress-fill" style={{ transform: 'scaleX(' + progress + ')' }} /></div>
                    <div className="progress-read">
                      <span className="big">{Math.round(progress * 100)}%</span>
                      <span>{frameCount} frames</span>
                    </div>
                  </div>
                )}

                {state === 'error' && (
                  <div className="meta-block">
                    <div className="meta-label err"><span className="dot" />Error</div>
                    <div className="err-msg">{error}</div>
                  </div>
                )}
              </aside>

              {state === 'done' && outputUrl && (
                <a className="export" href={outputUrl} download={'fastcut-' + Date.now() + '.webm'} data-cursor>
                  <div className="export-inner">
                    <div>
                      <span className="export-tag">[ Export ] — 03</span>
                      <div className="export-title">Download video</div>
                    </div>
                    <div className="export-arrow">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25">
                        <path d="M7 17L17 7M9 7h8v8" />
                      </svg>
                    </div>
                  </div>
                </a>
              )}

              {(state === 'done' || state === 'error') && (
                <button className="reset" onClick={resetAll}>
                  <span>◢</span><span>Process another video</span>
                </button>
              )}
            </div>
          )}
        </section>

        <Marquee reverse items={['A FASTCUT STUDIO','COMPUTED CLIENT-SIDE','DESIGNED FOR MOTION','NO ACCOUNTS','NO LIMITS']} />

        <footer className="colophon">
          <div className="col-display">
            <span>Built for</span>
            <span className="serif">motion</span>
            <span className="thin">.</span>
          </div>
          <div className="col-row">
            <span>
              Fastcut © {new Date().getFullYear()}
              <span className="sep"> · </span>
              Designed &amp; built by{' '}
              <a
                href="https://omarrkareemm.github.io/web/"
                target="_blank"
                rel="noopener noreferrer"
                className="author-link"
                data-cursor
              >
                <span className="author-mark">◢</span>Omar Kareem
              </a>
            </span>
            <span>WebGPU · WebCodecs · Client-Side</span>
            <span>Made in the browser</span>
          </div>
        </footer>
      </div>
    </>
  );
}