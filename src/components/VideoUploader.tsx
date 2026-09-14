import { useRef, useState } from 'react';

export function VideoUploader({ onFileSelected, disabled }: { onFileSelected: (file: File) => void; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  return (
    <div
      className="uploader"
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        if (disabled) return;
        const f = e.dataTransfer.files?.[0];
        if (f && f.type.startsWith('video/')) onFileSelected(f);
      }}
      style={hover ? { borderColor: '#4d9eff', background: '#101a30' } : undefined}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFileSelected(f);
        }}
        disabled={disabled}
      />
      <div className="uploader-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      <div className="uploader-title">Drop your video here</div>
      <div className="uploader-hint">or click to browse · MP4, WebM, MOV · max 30 s</div>
    </div>
  );
}