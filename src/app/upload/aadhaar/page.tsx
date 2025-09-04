'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Camera from '../../../components/Camera';
import DatabaseService from '../../../lib/db';
import { DocumentUpload, DocType } from '../../../types';

type AadhaarSide = 'front' | 'back';

export default function AadhaarUploadPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [currentStep, setCurrentStep] = useState<'instructions' | 'capture-front' | 'capture-back' | 'success'>('instructions');
  const [currentSide, setCurrentSide] = useState<AadhaarSide>('front');
  const [loading, setLoading] = useState(true);
  const [frontCaptured, setFrontCaptured] = useState(false);
  const [backCaptured, setBackCaptured] = useState(false);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        // Try to get existing session from localStorage
        let existingSessionId = localStorage.getItem('kyc-session-id');
        
        if (!existingSessionId) {
          existingSessionId = await DatabaseService.createSession();
          localStorage.setItem('kyc-session-id', existingSessionId);
        }
        
        setSessionId(existingSessionId);
        console.log('Session initialized:', existingSessionId);
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initSession();
  }, []);

  // Load uploads
  const loadUploads = useCallback(async () => {
    if (sessionId) {
      try {
        const sessionUploads = await DatabaseService.getUploadsBySession(sessionId);
        setUploads(sessionUploads);
        
        // Check what's already captured
        const frontUpload = sessionUploads.find(u => u.docType === 'AADHAAR_FRONT' && u.status === 'COMPLETED');
        const backUpload = sessionUploads.find(u => u.docType === 'AADHAAR_BACK' && u.status === 'COMPLETED');
        
        setFrontCaptured(!!frontUpload);
        setBackCaptured(!!backUpload);
        
        // Determine starting point based on what's already captured
        if (!frontUpload && !backUpload) {
          setCurrentSide('front');
        } else if (frontUpload && !backUpload) {
          setCurrentSide('back');
        } else if (frontUpload && backUpload) {
          setCurrentStep('success');
        }
      } catch (error) {
        console.error('Error loading uploads:', error);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  // Handle camera capture
  const handleCapture = async (imageData: string) => {
    const docType = currentSide === 'front' ? 'AADHAAR_FRONT' : 'AADHAAR_BACK';
    console.log('Aadhaar captured successfully!', { side: currentSide, docType, length: imageData.length });
    
    await loadUploads();
    
    if (currentSide === 'front') {
      setFrontCaptured(true);
      setCurrentSide('back');
      setCurrentStep('capture-back');
    } else {
      setBackCaptured(true);
      setCurrentStep('success');
    }
  };

  // Handle camera error
  const handleCameraError = (error: string) => {
    console.error('Camera error:', error);
    alert(`Camera error: ${error}`);
    setCurrentStep('instructions');
  };

  // Start capture process
  const startCapture = () => {
    if (!frontCaptured) {
      setCurrentSide('front');
      setCurrentStep('capture-front');
    } else if (!backCaptured) {
      setCurrentSide('back');
      setCurrentStep('capture-back');
    }
  };

  // Recapture specific side
  const recaptureSide = (side: AadhaarSide) => {
    setCurrentSide(side);
    setCurrentStep(side === 'front' ? 'capture-front' : 'capture-back');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getCurrentDocType = (): DocType => {
    return currentSide === 'front' ? 'AADHAAR_FRONT' : 'AADHAAR_BACK';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800">
                ← Back to Documents
              </Link>
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🆔</span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Aadhaar Card</h1>
                  <p className="text-sm text-gray-600">Capture both front and back sides</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              {frontCaptured && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Front
                </span>
              )}
              {backCaptured && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Back
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 'instructions' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Aadhaar Card Capture Instructions
            </h2>
            
            {/* Progress indicator */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                <div className={`flex items-center space-x-2 ${frontCaptured ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    frontCaptured ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {frontCaptured ? '✓' : '1'}
                  </div>
                  <span>Front Side</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 rounded">
                  <div className={`h-1 rounded transition-all duration-300 ${
                    frontCaptured ? 'bg-green-500 w-full' : 'bg-gray-200 w-0'
                  }`}></div>
                </div>
                <div className={`flex items-center space-x-2 ${backCaptured ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    backCaptured ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {backCaptured ? '✓' : '2'}
                  </div>
                  <span>Back Side</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">1</span>
                  <span>Front Side Instructions</span>
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 ml-8">
                  <li>• Place Aadhaar card front side up</li>
                  <li>• Ensure photo is clearly visible</li>
                  <li>• Make sure name and address are readable</li>
                  <li>• Avoid shadows and reflections</li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">2</span>
                  <span>Back Side Instructions</span>
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 ml-8">
                  <li>• Flip the card to back side</li>
                  <li>• Ensure QR code is clearly visible</li>
                  <li>• Make sure address is fully readable</li>
                  <li>• Keep the card centered in frame</li>
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center space-x-4">
              {!frontCaptured && !backCaptured && (
                <button
                  onClick={startCapture}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Start with Front Side
                </button>
              )}
              
              {frontCaptured && !backCaptured && (
                <button
                  onClick={startCapture}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue with Back Side
                </button>
              )}
              
              {frontCaptured && backCaptured && (
                <Link
                  href="/"
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Both Sides Completed - Back to Documents
                </Link>
              )}
              
              {/* Recapture options */}
              {(frontCaptured || backCaptured) && (
                <div className="space-y-2">
                  {frontCaptured && (
                    <button
                      onClick={() => recaptureSide('front')}
                      className="block w-full bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                      Recapture Front
                    </button>
                  )}
                  {backCaptured && (
                    <button
                      onClick={() => recaptureSide('back')}
                      className="block w-full bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    >
                      Recapture Back
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {(currentStep === 'capture-front' || currentStep === 'capture-back') && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Capturing Aadhaar {currentSide === 'front' ? 'Front' : 'Back'} Side
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {currentSide === 'front' 
                  ? 'Position the front side of your Aadhaar card in the camera view'
                  : 'Flip your card and position the back side in the camera view'
                }
              </p>
            </div>
            <Camera
              docType={getCurrentDocType()}
              sessionId={sessionId}
              onCaptureAction={handleCapture}
              onErrorAction={handleCameraError}
            />
          </div>
        )}

        {currentStep === 'success' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <span className="text-6xl">✅</span>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Aadhaar Card Captured Successfully!</h2>
            <p className="mt-2 text-gray-700">
              Both front and back sides of your Aadhaar card have been captured and saved.
            </p>
            
            <div className="mt-8 space-y-4">
              {/* Next document suggestion */}
              {!uploads.find(u => u.docType === 'PAN' && u.status === 'COMPLETED') && (
                <Link
                  href="/upload/pan"
                  className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue with PAN Card →
                </Link>
              )}
              
              <Link
                href="/"
                className="block w-full bg-gray-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Back to All Documents
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
