'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardService from '../../../../lib/dashboardService';
import { ApplicationSummary, ReviewAction } from '../../../../types/dashboard';
import { KYCSession, DocumentUpload } from '../../../../types';

export default function ReviewApplication() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [application, setApplication] = useState<ApplicationSummary | null>(null);
  const [session, setSession] = useState<KYCSession | null>(null);
  const [uploads, setUploads] = useState<DocumentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Review form state
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | ''>('');
  const [reviewComments, setReviewComments] = useState('');
  const [riskLevel, setRiskLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');

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
        // Set default risk level from application
        if (applicationData.applications[0].riskLevel) {
          setRiskLevel(applicationData.applications[0].riskLevel);
        }
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

  const handleSubmitReview = async () => {
    if (!reviewDecision || !application) {
      setError('Please select a decision before submitting');
      return;
    }

    if (reviewDecision === 'reject' && !reviewComments.trim()) {
      setError('Please provide comments for rejection');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const reviewAction: ReviewAction = {
        sessionId,
        reviewerId: 'admin', // In a real app, get from auth context
        action: reviewDecision === 'approve' ? 'APPROVE' : 'REJECT',
        comments: reviewComments.trim(),
        timestamp: new Date().toISOString(),
        documentsReviewed: uploads.map(upload => upload.docType),
        riskAssessment: {
          level: riskLevel,
          factors: [], // Could be populated from detailed analysis
          score: application.verificationScore || 0
        }
      };

      await DashboardService.submitReview(sessionId, reviewAction);
      
      // Redirect to dashboard with success message
      router.push('/dashboard?reviewed=success');
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
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

  const getStatusColor = (status: ApplicationSummary['status']) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application for review...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl">😕</span>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Application Not Found</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <Link href="/dashboard" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (application?.status !== 'SUBMITTED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl">⚠️</span>
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Application Not Available for Review</h1>
          <p className="mt-2 text-gray-600">
            This application is in {application?.status} status and cannot be reviewed.
          </p>
          <div className="mt-4 space-x-3">
            <Link href={`/dashboard/applications/${sessionId}`} className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              View Details
            </Link>
            <Link href="/dashboard" className="inline-block bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
              Back to Dashboard
            </Link>
          </div>
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
                <h1 className="text-2xl font-bold text-gray-900">Review Application</h1>
                <p className="text-gray-600">Session ID: {sessionId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                {application.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Summary</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Applicant Name</label>
                  <p className="text-sm text-gray-900">{application.applicantName || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="text-sm text-gray-900">{application.phoneNumber || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Completion</label>
                  <div className="flex items-center">
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
                  <label className="block text-sm font-medium text-gray-500">Documents</label>
                  <p className="text-sm text-gray-900">
                    {application.documentsCount}/{application.requiredDocumentsCount}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Submitted</label>
                  <p className="text-sm text-gray-900">{formatDate(application.createdAt)}</p>
                </div>
                {application.verificationScore && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Verification Score</label>
                    <p className="text-sm text-gray-900">{application.verificationScore}/100</p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents Review */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents Review</h2>
              {uploads.length > 0 ? (
                <div className="space-y-4">
                  {uploads.map((upload) => (
                    <div key={upload.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded">
                            {upload.docType === 'AADHAAR' && <span className="text-blue-600">🆔</span>}
                            {upload.docType === 'PAN' && <span className="text-blue-600">📄</span>}
                            {upload.docType === 'SELFIE' && <span className="text-blue-600">📷</span>}
                            {upload.docType === 'DL' && <span className="text-blue-600">🚗</span>}
                            {upload.docType === 'VOTERID' && <span className="text-blue-600">🗳️</span>}
                            {upload.docType === 'PASSPORT' && <span className="text-blue-600">📎</span>}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{upload.docType.replace('_', ' ')}</p>
                            <p className="text-sm text-gray-500">{upload.fileName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            upload.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {upload.status}
                          </span>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View Document
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Size:</span> {(upload.fileSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <div>
                          <span className="text-gray-500">Type:</span> {upload.mimeType}
                        </div>
                        <div>
                          <span className="text-gray-500">Uploaded:</span> {formatDate(upload.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-4xl">📄</span>
                  <p className="mt-2">No documents uploaded</p>
                </div>
              )}
            </div>
          </div>

          {/* Review Panel */}
          <div className="space-y-6">
            {/* Review Decision */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Decision</h3>
              
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Decision Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Decision</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="decision"
                        value="approve"
                        checked={reviewDecision === 'approve'}
                        onChange={(e) => setReviewDecision(e.target.value as 'approve')}
                        className="mr-2"
                      />
                      <span className="text-green-700 font-medium">✓ Approve Application</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="decision"
                        value="reject"
                        checked={reviewDecision === 'reject'}
                        onChange={(e) => setReviewDecision(e.target.value as 'reject')}
                        className="mr-2"
                      />
                      <span className="text-red-700 font-medium">✕ Reject Application</span>
                    </label>
                  </div>
                </div>

                {/* Risk Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="LOW">Low Risk</option>
                    <option value="MEDIUM">Medium Risk</option>
                    <option value="HIGH">High Risk</option>
                  </select>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments {reviewDecision === 'reject' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    placeholder={
                      reviewDecision === 'approve' 
                        ? 'Optional: Add any comments about the approval...'
                        : 'Required: Explain the reason for rejection...'
                    }
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || !reviewDecision}
                  className={`w-full py-3 px-4 rounded-md font-medium text-white ${
                    reviewDecision === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                      : reviewDecision === 'reject'
                      ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Submitting...' : 
                   reviewDecision === 'approve' ? 'Approve Application' :
                   reviewDecision === 'reject' ? 'Reject Application' :
                   'Select Decision'}
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completion</span>
                  <span className="text-sm font-medium text-gray-900">{application.completionPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Documents</span>
                  <span className="text-sm font-medium text-gray-900">
                    {application.documentsCount}/{application.requiredDocumentsCount}
                  </span>
                </div>
                {application.verificationScore && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Verification Score</span>
                    <span className="text-sm font-medium text-gray-900">{application.verificationScore}/100</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Submitted</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
