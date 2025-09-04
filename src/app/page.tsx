'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DatabaseService from '../lib/db';
import { DocumentUpload, DocType } from '../types';
import { PWAProvider } from '../components/PWAProvider';
import PWANotifications from '../components/PWANotifications';

const documentTypes = [
  { type: 'AADHAAR_FRONT', label: 'Aadhaar Card', icon: '🆔', required: true, route: 'aadhaar', description: 'Both front and back sides' },
  { type: 'PAN', label: 'PAN Card', icon: '💳', required: true, route: 'pan', description: 'PAN card document' },
  { type: 'SELFIE', label: 'Selfie', icon: '🤳', required: true, route: 'selfie', description: 'Photo verification' },
] as const;

export default function Home() {
  const [sessionId, setSessionId] = useState<string>('');
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [mounted, setMounted] = useState(false);

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
      }
    };
    
    initSession();
    setMounted(true);
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

  // Get upload status for document type (for Aadhaar, check both front and back)
  const getUploadStatus = (docType: DocType) => {
    if (docType === 'AADHAAR_FRONT') {
      // For Aadhaar card, check both front and back
      const frontUpload = uploads.find(u => u.docType === 'AADHAAR_FRONT' && u.status === 'COMPLETED');
      const backUpload = uploads.find(u => u.docType === 'AADHAAR_BACK' && u.status === 'COMPLETED');
      
      if (frontUpload && backUpload) return '✓ Completed';
      if (frontUpload || backUpload) return 'Partial';
      return 'Not captured';
    }
    
    const upload = uploads.find(u => u.docType === docType && u.status === 'COMPLETED');
    return upload ? '✓ Completed' : 'Not captured';
  };

  // Calculate upload statistics (Aadhaar counts as 1 when both sides are done)
  const uploadStats = {
    completed: (() => {
      const frontUpload = uploads.find(u => u.docType === 'AADHAAR_FRONT' && u.status === 'COMPLETED');
      const backUpload = uploads.find(u => u.docType === 'AADHAAR_BACK' && u.status === 'COMPLETED');
      const aadhaarComplete = frontUpload && backUpload ? 1 : 0;
      
      const panComplete = uploads.find(u => u.docType === 'PAN' && u.status === 'COMPLETED') ? 1 : 0;
      const selfieComplete = uploads.find(u => u.docType === 'SELFIE' && u.status === 'COMPLETED') ? 1 : 0;
      
      return aadhaarComplete + panComplete + selfieComplete;
    })(),
    total: documentTypes.length
  };

  // Don't render stats until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <PWAProvider>
        <div className="min-h-screen bg-gray-50">
          <PWANotifications />
          <div className="bg-blue-600 text-white py-6">
            <div className="max-w-4xl mx-auto px-4">
              <h1 className="text-2xl font-bold">KYC Verification</h1>
              <p className="text-blue-100 mt-2">Loading...</p>
            </div>
          </div>
        </div>
      </PWAProvider>
    );
  }

  return (
    <PWAProvider>
      <div className="min-h-screen bg-gray-50">
        {/* PWA Notifications */}
        <PWANotifications />
        
        {/* Header */}
        <div className="bg-blue-600 text-white py-6">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold">KYC Verification</h1>
                <p className="text-blue-100 mt-2">Complete your Know Your Customer verification</p>
              </div>
              <Link 
                href="/dashboard" 
                className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
              >
                Admin Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span className="font-medium">Progress</span>
              <span className="font-medium">{uploadStats.completed}/{uploadStats.total} required documents</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ 
                  width: `${uploadStats.total > 0 ? (uploadStats.completed / uploadStats.total) * 100 : 0}%` 
                }}
              />
            </div>
          </div>

          {/* Document Selection */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Select Document to Capture
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {documentTypes.map((doc) => (
                <div key={doc.type} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-3xl">{doc.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{doc.label}</h3>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {doc.required ? 'Required' : 'Optional'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getUploadStatus(doc.type) === '✓ Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : getUploadStatus(doc.type) === 'Partial'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {getUploadStatus(doc.type)}
                      </span>
                    </div>
                    
                    <Link
                      href={`/upload/${doc.route}`}
                      className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
                    >
                      {getUploadStatus(doc.type) === '✓ Completed' ? 'Recapture' : 
                       getUploadStatus(doc.type) === 'Partial' ? 'Continue' : 'Capture Now'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* DigiLocker Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">DigiLocker Integration</h3>
                  <p className="text-blue-700 text-sm mb-4">
                    Quickly verify your identity using DigiLocker - Access your official documents securely
                  </p>
                  <ul className="text-sm text-blue-800 space-y-2 mb-4">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Instant document verification
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Government-verified documents
                    </li>
                  </ul>
                </div>
                <div className="hidden md:block text-6xl">🔐</div>
              </div>
              <Link
                href="/digilocker"
                className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
              >
                Connect with DigiLocker
              </Link>
            </div>

            {/* Alternative Individual Routes */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Document Capture</h3>
              <p className="text-sm text-gray-700 mb-4">
                Prefer to capture documents individually? Use these direct links:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/upload/aadhaar-front" className="text-center p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors">
                  <div className="text-xl mb-1">🆔</div>
                  <div className="text-xs font-medium text-gray-800">Aadhaar Front</div>
                </Link>
                <Link href="/upload/aadhaar-back" className="text-center p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors">
                  <div className="text-xl mb-1">🆔</div>
                  <div className="text-xs font-medium text-gray-800">Aadhaar Back</div>
                </Link>
                <Link href="/upload/pan" className="text-center p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors">
                  <div className="text-xl mb-1">💳</div>
                  <div className="text-xs font-medium text-gray-800">PAN Card</div>
                </Link>
                <Link href="/upload/selfie" className="text-center p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors">
                  <div className="text-xl mb-1">🤳</div>
                  <div className="text-xs font-medium text-gray-800">Selfie</div>
                </Link>
              </div>
            </div>

            {/* Verification Button */}
            {uploadStats.completed >= uploadStats.total && (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <span className="text-4xl">✅</span>
                  <h3 className="text-lg font-semibold text-green-800 mt-2">All Required Documents Captured!</h3>
                  <p className="text-green-600 mt-1">You can now proceed to verification.</p>
                </div>
                <Link
                  href="/verification"
                  className="bg-green-600 text-white py-3 px-8 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Start Verification Process
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="text-center py-8 text-gray-500 text-sm">
          <p>KYC Lite - Serving Rural India with Digital Identity Verification</p>
          <p className="mt-1">Built with Next.js, PWA, and Offline-First Architecture</p>
        </div>
      </div>
    </PWAProvider>
  );
}
