import { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Canvas3D Component - Container untuk Three.js renderer
 */
function Canvas3D({ containerRef }) {
  return (
    <div 
      id="canvas-container" 
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    />
  );
}

Canvas3D.propTypes = {
  containerRef: PropTypes.object.isRequired
};

export default Canvas3D;
