'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface CameraProps {
  docType: 'AADHAAR_FRONT' | 'AADHAAR_BACK' | 'PAN' | 'SELFIE';
  sessionId: string;
  onCaptureAction: (imageData: string) => void;
  onErrorAction?: (error: string) => void;
}

// Simple photo capture function
async function savePhoto(imageData: string, docType: string, sessionId: string) {
  try {
    // For now, just log the capture - can be enhanced later
    console.log('Photo captured:', { docType, sessionId, dataLength: imageData.length });
    return { success: true };
  } catch (error) {
    console.error('Failed to save photo:', error);
    throw error;
  }
}

export default function Camera({ docType, sessionId, onCaptureAction, onErrorAction }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Simple camera initialization
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Simple constraints - start basic and work if needed
      let constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: docType === 'SELFIE' ? 'user' : 'environment'
        }
      };

      let stream: MediaStream;
      
      try {
        // Try with preferred constraints
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.log('Preferred constraints failed, trying basic:', err);
        // Fallback to basic constraints
        constraints = { video: true };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(() => {
                setIsStreaming(true);
                setIsLoading(false);
              })
              .catch((playErr) => {
                console.error('Video play failed:', playErr);
                setError('Could not start video playback');
                setIsLoading(false);
              });
          }
        };
      }

    } catch (err) {
      console.error('Camera access failed:', err);
      
      let errorMessage = 'Camera access failed';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported in this browser.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
      onErrorAction?.(errorMessage);
    }
  }, [docType, onErrorAction]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsStreaming(false);
  }, []);

  // Capture photo
  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      setError('Camera not ready for capture');
      return;
    }

    try {
      setIsLoading(true);
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Just capture the image, don't save yet (saving happens on submit)
      setCapturedImage(imageData);
      setIsLoading(false);

    } catch (err) {
      console.error('Capture failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Photo capture failed';
      setError(errorMessage);
      onErrorAction?.(errorMessage);
      setIsLoading(false);
    }
  }, [isStreaming, onErrorAction]);

  // Retry/retake
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    if (!isStreaming) {
      startCamera();
    }
  }, [isStreaming, startCamera]);

  // Submit captured photo
  const handleSubmit = useCallback(async () => {
    if (!capturedImage) {
      setError('No photo captured to submit');
      return;
    }

    try {
      setIsLoading(true);
      
      // Save photo to database using the camera utility
      await savePhoto(capturedImage, docType, sessionId);
      
      // Call the capture action callback to notify parent
      onCaptureAction(capturedImage);
      
      setIsLoading(false);
    } catch (err) {
      console.error('Submit failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Photo submission failed';
      setError(errorMessage);
      onErrorAction?.(errorMessage);
      setIsLoading(false);
    }
  }, [capturedImage, docType, sessionId, onCaptureAction, onErrorAction]);

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Get document type display name
  const getDocTypeName = () => {
    switch (docType) {
      case 'AADHAAR_FRONT': return 'Aadhaar Front';
      case 'AADHAAR_BACK': return 'Aadhaar Back';
      case 'PAN': return 'PAN Card';
      case 'SELFIE': return 'Selfie';
      default: return 'Document';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <h3 className="text-lg font-semibold">Capture {getDocTypeName()}</h3>
        <p className="text-sm text-blue-100">
          {docType === 'SELFIE' 
            ? 'Position your face in the frame and click capture'
            : 'Position the document clearly in the frame'
          }
        </p>
      </div>

      {/* Camera View */}
      <div className="relative">
        {!capturedImage ? (
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover bg-gray-900"
              autoPlay
              playsInline
              muted
            />
            
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="font-medium">Starting camera...</p>
                </div>
              </div>
            )}

            {/* Frame guide */}
            {isStreaming && !isLoading && (
              <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg pointer-events-none">
                <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-white"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-white"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-white"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <Image
              src={capturedImage}
              alt="Captured document"
              width={400}
              height={256}
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-sm">
              ✓ Captured
            </div>
          </div>
        )}

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500">
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="p-4">
        {!capturedImage ? (
          <div className="space-y-3">
            {isStreaming && !isLoading ? (
              <button
                onClick={handleCapture}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors shadow-md"
              >
                📷 Capture Photo
              </button>
            ) : (
              <button
                onClick={startCamera}
                disabled={isLoading}
                className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors shadow-md"
              >
                {isLoading ? 'Starting Camera...' : '🔄 Start Camera'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors shadow-md"
            >
              ✓ Submit & Continue
            </button>
            <button
              onClick={handleRetake}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              🔄 Retake Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
