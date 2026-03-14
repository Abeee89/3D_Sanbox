import PropTypes from 'prop-types';
import './ControlPanel.css';

/**
 * ControlPanel Component - Shape selector dan Reset button
 */
function ControlPanel({
  activeShape,
  onShapeChange,
  onReset,
  qualityMode,
  onQualityChange,
  gravity,
  onGravityChange,
  isPhysicsFrozen,
  onPhysicsFrozenChange,
  autoRain,
  onAutoRainChange,
  onSpawnBurst,
  onBlast,
  showHandOverlay,
  onShowHandOverlayChange,
  showWebcam,
  onShowWebcamChange
}) {
  const shapes = [
    { id: 'box', label: 'Kubus' },
    { id: 'sphere', label: 'Bola' },
    { id: 'cylinder', label: 'Silinder' }
  ];

  const qualityOptions = [
    { id: 'low', label: 'Ringan' },
    { id: 'normal', label: 'Normal' },
    { id: 'high', label: 'Ultra' }
  ];

  return (
    <div className="panel control-panel">
      <h1>3D Physics Sandbox</h1>

      <p className="section-label">Bentuk Objek</p>
      <div className="btn-group" id="shape-selector">
        {shapes.map((shape) => (
          <button
            key={shape.id}
            className={activeShape === shape.id ? 'active' : ''}
            onClick={() => onShapeChange(shape.id)}
          >
            {shape.label}
          </button>
        ))}
      </div>

      <p className="section-label">Mode Performa</p>
      <div className="btn-group quality-selector">
        {qualityOptions.map((quality) => (
          <button
            key={quality.id}
            className={qualityMode === quality.id ? 'active' : ''}
            onClick={() => onQualityChange(quality.id)}
          >
            {quality.label}
          </button>
        ))}
      </div>

      <div className="slider-wrap">
        <label htmlFor="gravity-range">Gravitasi: {gravity.toFixed(2)}</label>
        <input
          id="gravity-range"
          type="range"
          min="-25"
          max="5"
          step="0.1"
          value={gravity}
          onChange={(event) => onGravityChange(Number(event.target.value))}
        />
      </div>

      <div className="toggle-group">
        <label>
          <input
            type="checkbox"
            checked={isPhysicsFrozen}
            onChange={(event) => onPhysicsFrozenChange(event.target.checked)}
          />
          Freeze Physics
        </label>

        <label>
          <input
            type="checkbox"
            checked={autoRain}
            onChange={(event) => onAutoRainChange(event.target.checked)}
          />
          Auto Rain
        </label>

        <label>
          <input
            type="checkbox"
            checked={showHandOverlay}
            onChange={(event) => onShowHandOverlayChange(event.target.checked)}
          />
          Overlay Landmark
        </label>

        <label>
          <input
            type="checkbox"
            checked={showWebcam}
            onChange={(event) => onShowWebcamChange(event.target.checked)}
          />
          Tampilkan Webcam
        </label>
      </div>

      <div className="action-grid">
        <button className="action-btn" onClick={onSpawnBurst}>
          Burst x8
        </button>
        <button className="action-btn" onClick={onBlast}>
          Blast
        </button>
      </div>

      <button className="reset-btn" onClick={onReset}>
        Reset Scene
      </button>
    </div>
  );
}

ControlPanel.propTypes = {
  activeShape: PropTypes.string.isRequired,
  onShapeChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  qualityMode: PropTypes.oneOf(['low', 'normal', 'high']).isRequired,
  onQualityChange: PropTypes.func.isRequired,
  gravity: PropTypes.number.isRequired,
  onGravityChange: PropTypes.func.isRequired,
  isPhysicsFrozen: PropTypes.bool.isRequired,
  onPhysicsFrozenChange: PropTypes.func.isRequired,
  autoRain: PropTypes.bool.isRequired,
  onAutoRainChange: PropTypes.func.isRequired,
  onSpawnBurst: PropTypes.func.isRequired,
  onBlast: PropTypes.func.isRequired,
  showHandOverlay: PropTypes.bool.isRequired,
  onShowHandOverlayChange: PropTypes.func.isRequired,
  showWebcam: PropTypes.bool.isRequired,
  onShowWebcamChange: PropTypes.func.isRequired
};

export default ControlPanel;
