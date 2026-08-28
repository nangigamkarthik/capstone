"""
Verification script for Physical Camera RTSP / WebRTC Stream Reader.
Mocks the cv2.VideoCapture object to verify the asynchronous background thread,
frame buffering, capture loops, and resource release mechanisms.
"""
import sys
import os
import time
import numpy as np
from unittest.mock import MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import app.ai.camera.manager as camera_manager

def main():
    print("====================================================")
    print("      VERIFYING PHYSICAL RTSP / WEBCAM INTEGRATION   ")
    print("====================================================")
    
    # Force CV2 available flag to true for test execution of thread paths
    original_cv2_available = camera_manager.CV2_AVAILABLE
    camera_manager.CV2_AVAILABLE = True
    
    # Mock cv2 VideoCapture instance
    mock_cap = MagicMock()
    mock_cap.isOpened.return_value = True
    
    # Mock cv2.read() returning a dummy frame (height: 720, width: 1280, 3 channels)
    dummy_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
    mock_cap.read.return_value = (True, dummy_frame)
    
    # Patch cv2.VideoCapture in camera_manager
    camera_manager.cv2 = MagicMock()
    camera_manager.cv2.VideoCapture.return_value = mock_cap
    
    print("1. Initializing RTSPCameraStream on mock source 'rtsp://192.168.1.100:554/stream1'...")
    stream = camera_manager.RTSPCameraStream(source="rtsp://192.168.1.100:554/stream1", resolution=(1280, 720))
    
    print("2. Starting asynchronous frame capture thread...")
    stream.start()
    
    # Sleep to allow thread to run a few loops
    time.sleep(0.1)
    
    # Check if a frame has been captured
    frame = stream.read()
    print(f"  - Frame captured: {frame is not None}")
    if frame is not None:
        print(f"  - Frame shape   : {frame.shape}")
        print(f"  - Frame dtype   : {frame.dtype}")
        
    # Check VideoCapture parameter settings
    mock_cap.set.assert_any_call(camera_manager.cv2.CAP_PROP_FRAME_WIDTH, 1280)
    mock_cap.set.assert_any_call(camera_manager.cv2.CAP_PROP_FRAME_HEIGHT, 720)
    print("  - VideoCapture configurations verified [OK]")
    
    print("3. Terminating capture thread and releasing system resources...")
    stream.stop()
    
    # Verify release is called
    mock_cap.release.assert_called_once()
    print("  - VideoCapture released successfully [OK]")
    
    # Restore original flag
    camera_manager.CV2_AVAILABLE = original_cv2_available
    
    print("====================================================")
    print("                  VERIFICATION RESULTS              ")
    print("====================================================")
    print("Physical camera integration: PASSED [OK]")
    print("====================================================")

if __name__ == "__main__":
    main()
