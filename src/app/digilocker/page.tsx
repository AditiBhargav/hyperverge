'use client';

import { useState } from 'react';
import Link from 'next/link';
import DigilockerService from '../../lib/digilockerService';
import { DigilockerDocument } from '../../types/digilocker';

export default function DigilockerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<DigilockerDocument[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDigilockerConnect = async () => {
    try {
      const authUrl = DigilockerService.getAuthorizationUrl();
      window.location.href = authUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Digilocker');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Digilocker Integration</h1>
              <p className="text-blue-100 mt-2">Fetch your verified documents securely</p>
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
        {/* Main content */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="inline-block p-3 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            
            <h2 className="mt-4 text-xl font-semibold text-gray-900">Connect with Digilocker</h2>
            <p className="mt-2 text-gray-600">
              Securely fetch your verified documents from Digilocker
            </p>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleDigilockerConnect}
              disabled={isLoading}
              className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                'Connect with Digilocker'
              )}
            </button>
          </div>

          {/* Benefits section */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">Verified Documents</h3>
              <p className="mt-2 text-sm text-gray-600">
                Access government-verified documents directly from Digilocker
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">Secure Access</h3>
              <p className="mt-2 text-sm text-gray-600">
                Your data is encrypted and secured using OAuth 2.0
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">Multiple Documents</h3>
              <p className="mt-2 text-sm text-gray-600">
                Support for Aadhaar, PAN, Driving License, and more
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">Quick Process</h3>
              <p className="mt-2 text-sm text-gray-600">
                Complete your KYC faster with pre-verified documents
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
