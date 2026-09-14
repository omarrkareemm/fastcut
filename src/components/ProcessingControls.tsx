export function ProcessingControls({ params, onChange, disabled }: { params: any; onChange: (p: any) => void; disabled: boolean }) {
  return (
    <>
      <div className="field">
        <div className="field-label">
          <span>Motion Blur Intensity</span>
          <span className="field-value">{params.blurIntensity.toFixed(2)}</span>
        </div>
        <input
          className="slider"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={params.blurIntensity}
          onChange={(e) => onChange({ ...params, blurIntensity: parseFloat(e.target.value) })}
          disabled={disabled}
        />
        <div className="field-hint">
          Higher values create longer directional trails on moving content. Static areas stay sharp.
        </div>
      </div>

      <div className="field">
        <div className="field-label">
          <span>Interpolation Factor</span>
        </div>
        <select
          className="select"
          value={params.interpolationFactor}
          onChange={(e) => onChange({ ...params, interpolationFactor: parseInt(e.target.value) })}
          disabled={disabled}
        >
          <option value={1}>1× — No interpolation</option>
          <option value={2}>2× — Double frame rate</option>
          <option value={4}>4× — Quad frame rate</option>
        </select>
      </div>

      <div className="field">
        <div className="field-label">
          <span>Mask Prompt</span>
        </div>
        <input
          className="input"
          type="text"
          placeholder="e.g. person, car, sky"
          value={params.maskPrompt}
          onChange={(e) => onChange({ ...params, maskPrompt: e.target.value })}
          disabled={disabled}
        />
        <div className="field-hint">
          Optional. Reserved for object segmentation (requires model weights).
        </div>
      </div>
    </>
  );
}