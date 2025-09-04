'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Camera from '../../../components/Camera';
import DatabaseService from '../../../lib/db';
import { DocumentUpload, DocType } from '../../../types';

// Document type configurations
const docTypeConfig = {
  'aadhaar-front': {
    type: 'AADHAAR_FRONT' as DocType,
    label: 'Aadhaar Front',
    icon: '🆔',
    description: 'Capture the front side of your Aadhaar card',
    instructions: [
      'Place your Aadhaar card on a flat surface',
      'Ensure good lighting without shadows',
      'Make sure all text is clearly visible',
      'Keep the card within the frame boundaries'
    ]
  },
  'aadhaar-back': {
    type: 'AADHAAR_BACK' as DocType,
    label: 'Aadhaar Back',
    icon: '🆔',
    description: 'Capture the back side of your Aadhaar card',
    instructions: [
      'Flip your Aadhaar card to the back side',
      'Ensure the QR code is clearly visible',
      'Make sure all text is readable',
      'Keep the card within the frame boundaries'
    ]
  },
  'pan': {
    type: 'PAN' as DocType,
    label: 'PAN Card',
    icon: '💳',
    description: 'Capture your PAN card',
    instructions: [
      'Place your PAN card on a flat surface',
      'Ensure all details are clearly visible',
      'Make sure there are no reflections',
      'Keep the card centered in the frame'
    ]
  },
  'selfie': {
    type: 'SELFIE' as DocType,
    label: 'Selfie',
    icon: '🤳',
    description: 'Take a clear selfie for verification',
    instructions: [
      'Look directly at the camera',
      'Ensure your face is well-lit',
      'Remove any sunglasses or hat',
      'Keep your expression neutral'
    ]
  }
} as const;

type DocTypeParam = keyof typeof docTypeConfig;

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const docTypeParam = params.docType as DocTypeParam;
  
  const [sessionId, setSessionId] = useState<string>('');
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [currentStep, setCurrentStep] = useState<'instructions' | 'capture' | 'success'>('instructions');
  const [loading, setLoading] = useState(true);

  // Get document configuration
  const docConfig = docTypeConfig[docTypeParam];

  // Redirect if invalid document type
  useEffect(() => {
    if (!docConfig) {
      router.push('/');
      return;
    }
  }, [docConfig, router]);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        // Try to get existing session from localStorage or URL params
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
    console.log('Document captured successfully!', { docType: docConfig.type, length: imageData.length });
    await loadUploads();
    setCurrentStep('success');
  };

  // Handle camera error
  const handleCameraError = (error: string) => {
    console.error('Camera error:', error);
    alert(`Camera error: ${error}`);
    setCurrentStep('instructions');
  };

  // Check if document already uploaded
  const existingUpload = uploads.find(u => u.docType === docConfig?.type && u.status === 'COMPLETED');

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

  if (!docConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl">❌</span>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Invalid Document Type</h1>
          <p className="mt-2 text-gray-600">The requested document type is not supported.</p>
          <Link href="/" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

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
                <span className="text-3xl">{docConfig.icon}</span>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{docConfig.label}</h1>
                  <p className="text-sm text-gray-600">{docConfig.description}</p>
                </div>
              </div>
            </div>
            {existingUpload && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Uploaded
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 'instructions' && (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {existingUpload ? 'Recapture Instructions' : 'Capture Instructions'}
            </h2>
            
            <div className="space-y-4 mb-8">
              {docConfig.instructions.map((instruction, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <p className="text-gray-800">{instruction}</p>
                </div>
              ))}
            </div>

            {existingUpload && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <p className="text-yellow-800">
                    You have already uploaded this document. Proceeding will replace the existing upload.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={() => setCurrentStep('capture')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {existingUpload ? 'Recapture Document' : 'Start Camera'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'capture' && (
          <div className="bg-white rounded-lg shadow">
            <Camera
              docType={docConfig.type}
              sessionId={sessionId}
              onCaptureAction={handleCapture}
              onErrorAction={handleCameraError}
            />
          </div>
        )}

        {currentStep === 'success' && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <span className="text-6xl">✅</span>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Document Uploaded Successfully!</h2>
            <p className="mt-2 text-gray-700">
              Your {docConfig.label.toLowerCase()} has been captured and saved.
            </p>
            
            <div className="mt-8 space-y-4">
              {/* Next document suggestion for Aadhaar flow */}
              {docConfig.type === 'AADHAAR_FRONT' && (
                <Link
                  href="/upload/aadhaar-back"
                  className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue with Aadhaar Back →
                </Link>
              )}
              
              {docConfig.type === 'AADHAAR_BACK' && !uploads.find(u => u.docType === 'PAN' && u.status === 'COMPLETED') && (
                <Link
                  href="/upload/pan"
                  className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue with PAN Card →
                </Link>
              )}
              
              {docConfig.type === 'PAN' && !uploads.find(u => u.docType === 'SELFIE' && u.status === 'COMPLETED') && (
                <Link
                  href="/upload/selfie"
                  className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue with Selfie →
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
