import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './WebcamPreview.css';

/**
 * WebcamPreview Component - Menampilkan webcam dengan overlay hand landmarks
 */
const WebcamPreview = forwardRef(function WebcamPreview({ videoRef, canvasRef }, ref) {
  return (
    <div id="webcam-container" ref={ref}>
      <video 
        ref={videoRef} 
        id="input_video"
        style={{ display: 'none' }}
      />
      <canvas 
        ref={canvasRef} 
        id="output_canvas"
        width="640"
        height="480"
      />
    </div>
  );
});

WebcamPreview.propTypes = {
  videoRef: PropTypes.object.isRequired,
  canvasRef: PropTypes.object.isRequired
};

export default WebcamPreview;
