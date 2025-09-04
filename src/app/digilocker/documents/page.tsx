'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DigilockerService from '../../../lib/digilockerService';
import { DigilockerDocument } from '../../../types/digilocker';

export default function DigilockerDocumentsPage() {
  const [documents, setDocuments] = useState<DigilockerDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const sessionId = localStorage.getItem('digilocker_session_id');
      if (!sessionId) {
        throw new Error('No active Digilocker session');
      }

      const docs = await DigilockerService.getDocuments(sessionId);
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSelect = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleImportDocuments = async () => {
    if (selectedDocs.length === 0) return;

    setIsLoading(true);
    try {
      // Here you would implement the logic to import selected documents
      // This could involve creating new document records in your system
      // and downloading the actual documents from Digilocker

      window.location.href = '/verification';
    } catch (err: any) {
      setError(err.message || 'Failed to import documents');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Select Documents</h1>
              <p className="text-blue-100 mt-2">Choose documents to import from Digilocker</p>
            </div>
            <Link 
              href="/digilocker" 
              className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading documents...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow divide-y">
              {documents.map(doc => (
                <div 
                  key={doc.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.id)}
                      onChange={() => handleDocumentSelect(doc.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.name}</h3>
                      <p className="text-sm text-gray-500">
                        Issued by {doc.issuer} • {doc.issueDate}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">{doc.type}</span>
                </div>
              ))}
            </div>

            {documents.length > 0 ? (
              <div className="flex justify-end">
                <button
                  onClick={handleImportDocuments}
                  disabled={selectedDocs.length === 0 || isLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  Import Selected Documents
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No documents found in your Digilocker account
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
