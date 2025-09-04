'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DigilockerService from '../../../lib/digilockerService';
import { DigilockerDocument } from '../../../types/digilocker';

export default function DigilockerCallbackPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCallback = async () => {
    setIsProcessing(true);
    try {
      // Get code and state from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (!code || !state) {
        throw new Error('Missing required parameters');
      }

      // Process the callback
      await DigilockerService.handleCallback(code, state);

      // Redirect to document selection
      window.location.href = '/digilocker/documents';
    } catch (err: any) {
      setError(err.message || 'Failed to process Digilocker authentication');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process callback when component mounts
  useEffect(() => {
    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 max-w-md w-full">
        <div className="text-center">
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Processing...</h2>
              <p className="mt-2 text-gray-600">Please wait while we connect to your Digilocker account</p>
            </>
          ) : error ? (
            <>
              <div className="text-red-600 text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-gray-900">Authentication Failed</h2>
              <p className="mt-2 text-red-600">{error}</p>
              <Link
                href="/digilocker"
                className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
