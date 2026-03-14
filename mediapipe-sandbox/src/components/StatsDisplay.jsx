import PropTypes from 'prop-types';
import './StatsDisplay.css';

/**
 * StatsDisplay Component - FPS counter
 */
function StatsDisplay({ fps, objectCount, qualityMode, isPhysicsFrozen, trackingActive, gestureStatus }) {
  return (
    <div id="stats">
      <div className="stats-line">
        FPS: <span id="fps-val">{fps}</span>
      </div>
      <div className="stats-line">Objek: {objectCount}</div>
      <div className="stats-line">Kualitas: {qualityMode}</div>
      <div className="stats-line">Tracking: {trackingActive ? 'Aktif' : 'Tidak Aktif'}</div>
      <div className="stats-line">Physics: {isPhysicsFrozen ? 'Freeze' : 'Berjalan'}</div>
      <div className="status-pill">{gestureStatus}</div>
    </div>
  );
}

StatsDisplay.propTypes = {
  fps: PropTypes.number.isRequired,
  objectCount: PropTypes.number.isRequired,
  qualityMode: PropTypes.oneOf(['low', 'normal', 'high']).isRequired,
  isPhysicsFrozen: PropTypes.bool.isRequired,
  trackingActive: PropTypes.bool.isRequired,
  gestureStatus: PropTypes.string.isRequired
};

export default StatsDisplay;
