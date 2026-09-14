export function ProgressPanel({ isProcessing, progress, stage, error, outputUrl }: { isProcessing: boolean; progress: number; stage: string; error: string | null; outputUrl: string | null; }) {
  if (!isProcessing && !outputUrl && !error) return null;

  return (
    <div style={{ marginTop: 16 }}>
      {isProcessing && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-dot" />
            <span className="panel-title">Processing</span>
          </div>
          <div className="panel-body">
            <div className="progress-meta">
              <span>{stage || 'Working…'}</span>
              <span className="progress-percent">{Math.round(progress * 100)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="status status-error">
          <div className="status-icon">!</div>
          <div className="status-body">
            <div className="status-title">Something went wrong</div>
            <div className="status-msg">{error}</div>
          </div>
        </div>
      )}

      {outputUrl && !isProcessing && (
        <div className="status status-success">
          <div className="status-icon">✓</div>
          <div className="status-body">
            <div className="status-title">Processing complete</div>
            <div className="status-msg" style={{ marginBottom: 12 }}>Your motion-blurred video is ready.</div>
            <a className="btn btn-download" href={outputUrl} download="motion_blurred.webm" style={{ width: 'auto', display: 'inline-flex' }}>
              ↓  Download Video
            </a>
          </div>
        </div>
      )}
    </div>
  );
}