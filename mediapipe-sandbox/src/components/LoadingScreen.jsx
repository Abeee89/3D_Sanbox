import PropTypes from 'prop-types';
import './LoadingScreen.css';

/**
 * LoadingScreen Component - Loading overlay dengan spinner
 */
function LoadingScreen({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div id="loading-screen">
      <div className="spinner"></div>
      <p>Menyiapkan Hand Tracking & Mesin Fisika...</p>
    </div>
  );
}

LoadingScreen.propTypes = {
  isVisible: PropTypes.bool.isRequired
};

export default LoadingScreen;
