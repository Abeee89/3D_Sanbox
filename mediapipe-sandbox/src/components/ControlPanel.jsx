import PropTypes from 'prop-types';
import './ControlPanel.css';

/**
 * ControlPanel Component - Shape selector dan Reset button
 */
function ControlPanel({ activeShape, onShapeChange, onReset }) {
  const shapes = [
    { id: 'box', label: 'Kubus' },
    { id: 'sphere', label: 'Bola' },
    { id: 'cylinder', label: 'Silinder' }
  ];

  return (
    <div className="panel control-panel">
      <h1>3D Physics Sandbox</h1>
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
      <button className="reset-btn" onClick={onReset}>
        Reset Scene
      </button>
    </div>
  );
}

ControlPanel.propTypes = {
  activeShape: PropTypes.string.isRequired,
  onShapeChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired
};

export default ControlPanel;
