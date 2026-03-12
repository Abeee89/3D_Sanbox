import PropTypes from 'prop-types';
import './StatsDisplay.css';

/**
 * StatsDisplay Component - FPS counter
 */
function StatsDisplay({ fps }) {
  return (
    <div id="stats">
      FPS: <span id="fps-val">{fps}</span>
    </div>
  );
}

StatsDisplay.propTypes = {
  fps: PropTypes.number.isRequired
};

export default StatsDisplay;
