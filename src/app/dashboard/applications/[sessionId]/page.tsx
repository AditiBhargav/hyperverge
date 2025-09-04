'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardService from '../../../../lib/dashboardService';
import ImageViewer from '../../../../components/ImageViewer';
import { ApplicationSummary } from '../../../../types/dashboard';
import { KYCSession, DocumentUpload } from '../../../../types';

export default function ApplicationDetail() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [application, setApplication] = useState<ApplicationSummary | null>(null);
  const [session, setSession] = useState<KYCSession | null>(null);
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Image viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; docType: string } | null>(null);

  const loadApplicationData = useCallback(async () => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [applicationData, sessionData, uploadsData] = await Promise.all([
        DashboardService.getApplications({ searchQuery: sessionId }, 1, 1),
        DashboardService.getApplicationSession(sessionId),
        DashboardService.getApplicationUploads(sessionId)
      ]);
      
      if (applicationData.applications.length > 0) {
        setApplication(applicationData.applications[0]);
      }
      setSession(sessionData);
      setUploads(uploadsData);
    } catch (err) {
      console.error('Error loading application data:', err);
      setError('Failed to load application data');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadApplicationData();
  }, [loadApplicationData]);

  const getStatusColor = (status: ApplicationSummary['status']) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'PENDING_DOCUMENTS': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: ApplicationSummary['riskLevel']) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle image viewing
  const handleViewImage = (upload: DocumentUpload) => {
    if (upload.assembledFile) {
      setSelectedImage({
        data: upload.assembledFile,
        docType: upload.docType
      });
      setViewerOpen(true);
    } else {
      alert('Image data not available for this document');
    }
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedImage(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl">😕</span>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Application Not Found</h1>
          <p className="mt-2 text-gray-600">{error || 'The requested application could not be found.'}</p>
          <Link href="/dashboard" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Back to Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
                <p className="text-gray-600">Session ID: {sessionId}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              {application.status === 'SUBMITTED' && (
                <Link 
                  href={`/dashboard/review/${sessionId}`}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Review Application
                </Link>
              )}
              <button
                onClick={loadApplicationData}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Overview */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                    {application.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Completion</label>
                  <div className="flex items-center mt-1">
                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${application.completionPercentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{application.completionPercentage}%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-sm text-gray-900">{formatDate(application.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-900">{formatDate(application.updatedAt)}</p>
                </div>
                {application.riskLevel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Risk Level</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(application.riskLevel)}`}>
                      {application.riskLevel}
                    </span>
                  </div>
                )}
                {application.verificationScore && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Verification Score</label>
                    <p className="text-sm text-gray-900">{application.verificationScore}/100</p>
                  </div>
                )}
              </div>
            </div>

            {/* Applicant Information */}
            {session && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm text-gray-900">{application.applicantName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-sm text-gray-900">{application.phoneNumber || 'Not provided'}</p>
                  </div>
                  {application.location && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">City</label>
                        <p className="text-sm text-gray-900">{application.location.city}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">State</label>
                        <p className="text-sm text-gray-900">{application.location.state}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Country</label>
                        <p className="text-sm text-gray-900">{application.location.country}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Documents ({application.documentsCount}/{application.requiredDocumentsCount})
              </h2>
              {uploads.length > 0 ? (
                <div className="space-y-4">
                  {uploads.map((upload) => (
                    <div key={upload.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {/* Document icon or thumbnail */}
                        <div className="flex-shrink-0">
                          {upload.assembledFile ? (
                            <div className="relative w-16 h-16 rounded overflow-hidden border">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={upload.assembledFile}
                                alt={`${upload.docType} thumbnail`}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-80"
                                onClick={() => handleViewImage(upload)}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-blue-100 rounded flex items-center justify-center">
                              {(upload.docType === 'AADHAAR_FRONT' || upload.docType === 'AADHAAR_BACK') && <span className="text-blue-600 text-xl">🆔</span>}
                              {upload.docType === 'PAN' && <span className="text-blue-600 text-xl">�</span>}
                              {upload.docType === 'SELFIE' && <span className="text-blue-600 text-xl">�</span>}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{upload.docType.replace('_', ' ')}</p>
                          <p className="text-sm text-gray-500">
                            Uploaded {formatDate(upload.createdAt)}
                          </p>
                          {upload.assembledFile && (
                            <p className="text-xs text-blue-600">Click thumbnail to view</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {upload.status === 'COMPLETED' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Completed
                          </span>
                        )}
                        <button 
                          className={`text-sm font-medium ${
                            upload.assembledFile 
                              ? 'text-blue-600 hover:text-blue-800' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          onClick={() => handleViewImage(upload)}
                          disabled={!upload.assembledFile}
                        >
                          {upload.assembledFile ? 'View Full Size' : 'No Image'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl">📄</span>
                  <p className="mt-2">No documents uploaded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {application.status === 'SUBMITTED' && (
                  <Link 
                    href={`/dashboard/review/${sessionId}`}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-center block"
                  >
                    Review Application
                  </Link>
                )}
                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Download Documents
                </button>
                <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                  Export Report
                </button>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Application Created</p>
                    <p className="text-xs text-gray-500">{formatDate(application.createdAt)}</p>
                  </div>
                </div>
                {application.updatedAt !== application.createdAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-xs text-gray-500">{formatDate(application.updatedAt)}</p>
                    </div>
                  </div>
                )}
                {uploads.map((upload) => (
                  <div key={upload.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {upload.docType.replace('_', ' ')} Uploaded
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(upload.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Documents</span>
                  <span className="text-sm font-medium text-gray-900">
                    {application.documentsCount}/{application.requiredDocumentsCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completion</span>
                  <span className="text-sm font-medium text-gray-900">{application.completionPercentage}%</span>
                </div>
                {application.verificationScore && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Verification Score</span>
                    <span className="text-sm font-medium text-gray-900">{application.verificationScore}/100</span>
                  </div>
                )}
                {application.riskLevel && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Risk Level</span>
                    <span className={`text-sm font-medium ${
                      application.riskLevel === 'LOW' ? 'text-green-600' :
                      application.riskLevel === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {application.riskLevel}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          imageData={selectedImage.data}
          docType={selectedImage.docType}
          isOpen={viewerOpen}
          onCloseAction={handleCloseViewer}
        />
      )}
    </div>
  );
}
