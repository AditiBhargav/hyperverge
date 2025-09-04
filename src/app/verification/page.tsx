'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import DatabaseService from '../../lib/db';
import { DocumentUpload } from '../../types';

export default function VerificationPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Initialize session
  useEffect(() => {
    const existingSessionId = localStorage.getItem('kyc-session-id');
    if (existingSessionId) {
      setSessionId(existingSessionId);
    } else {
      // Redirect to home if no session
      window.location.href = '/';
    }
  }, []);

  // Load uploads
  const loadUploads = useCallback(async () => {
    if (sessionId) {
      try {
        const sessionUploads = await DatabaseService.getUploadsBySession(sessionId);
        setUploads(sessionUploads);
      } catch (error) {
        console.error('Error loading uploads:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  // Check completeness
  const frontUpload = uploads.find(u => u.docType === 'AADHAAR_FRONT' && u.status === 'COMPLETED');
  const backUpload = uploads.find(u => u.docType === 'AADHAAR_BACK' && u.status === 'COMPLETED');
  const panUpload = uploads.find(u => u.docType === 'PAN' && u.status === 'COMPLETED');
  const selfieUpload = uploads.find(u => u.docType === 'SELFIE' && u.status === 'COMPLETED');

  const isComplete = frontUpload && backUpload && panUpload && selfieUpload;

  // Submit for verification
  const handleSubmitForVerification = async () => {
    if (!isComplete || !sessionId) return;

    setSubmitting(true);
    try {
      // Simulate submission process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update session status or create submission record
      localStorage.setItem('kyc-submitted', 'true');
      localStorage.setItem('submission-time', new Date().toISOString());
      
      setSubmitted(true);
    } catch (error) {
      console.error('Submission failed:', error);
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading verification details...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <span className="text-6xl">🎉</span>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">KYC Submitted Successfully!</h1>
            <p className="mt-2 text-gray-700">
              Your documents have been submitted for verification. You will receive updates on the verification status.
            </p>
            
            <div className="mt-8 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900">What&apos;s Next?</h3>
                <ul className="mt-2 text-sm text-blue-800 text-left space-y-1">
                  <li>• Your documents will be reviewed within 24-48 hours</li>
                  <li>• You&apos;ll receive email/SMS notifications about status updates</li>
                  <li>• Check the admin dashboard for real-time status</li>
                </ul>
              </div>
              
              <div className="flex space-x-4 justify-center">
                <Link
                  href="/dashboard"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  View Dashboard
                </Link>
                <Link
                  href="/"
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  Start New Application
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">KYC Verification Review</h1>
              <p className="text-blue-100 mt-2">Review your documents before submission</p>
            </div>
            <Link 
              href="/" 
              className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              ← Back to Documents
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Completeness Check */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Document Verification Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🆔</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Aadhaar Card</h3>
                  <p className="text-sm text-gray-600">Front and back sides</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {frontUpload ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Front
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ✗ Front
                  </span>
                )}
                {backUpload ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Back
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    ✗ Back
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💳</span>
                <div>
                  <h3 className="font-semibold text-gray-900">PAN Card</h3>
                  <p className="text-sm text-gray-600">Permanent Account Number</p>
                </div>
              </div>
              {panUpload ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Uploaded
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  ✗ Missing
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🤳</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Selfie</h3>
                  <p className="text-sm text-gray-600">Photo verification</p>
                </div>
              </div>
              {selfieUpload ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Uploaded
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  ✗ Missing
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Submission Section */}
        <div className="bg-white rounded-lg shadow p-6">
          {isComplete ? (
            <div>
              <div className="text-center mb-6">
                <span className="text-4xl">✅</span>
                <h3 className="mt-2 text-lg font-semibold text-green-800">All Documents Ready!</h3>
                <p className="text-green-700">You can now submit your KYC application for verification.</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Submission Guidelines:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Ensure all documents are clear and readable</li>
                  <li>• Verify that personal information is accurate</li>
                  <li>• Once submitted, changes cannot be made easily</li>
                  <li>• Verification typically takes 24-48 hours</li>
                </ul>
              </div>

              <div className="text-center">
                <button
                  onClick={handleSubmitForVerification}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    '🚀 Submit for Verification'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <span className="text-4xl">⚠️</span>
              <h3 className="mt-2 text-lg font-semibold text-yellow-800">Incomplete Application</h3>
              <p className="text-yellow-700 mb-6">Please upload all required documents before submission.</p>
              
              <Link
                href="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Complete Document Upload
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
