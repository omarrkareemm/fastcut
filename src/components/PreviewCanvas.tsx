import type { RefObject } from 'react';

export function PreviewCanvas({ innerRef }: { innerRef: RefObject<HTMLCanvasElement | null> }) {
  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-dot green" />
        <span className="panel-title">Preview</span>
      </div>
      <div className="preview-wrap">
        <canvas ref={innerRef} className="preview-canvas" />
        <div className="preview-placeholder" style={{ position: 'absolute', pointerEvents: 'none', opacity: 0.5 }}>
        </div>
      </div>
    </div>
  );
}