// Dashboard-specific types
import { DocType } from './index';

export interface ApplicationSummary {
  id?: number;
  sessionId: string;
  applicantName?: string;
  phoneNumber?: string;
  email?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PENDING_DOCUMENTS';
  completionPercentage: number;
  documentsCount: number;
  requiredDocumentsCount: number;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  verificationScore?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
}

export interface DashboardStats {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  draft: number;
  todaySubmissions: number;
  weeklyGrowth: number;
  averageProcessingTime: number; // in hours
  documentTypes: Record<DocType, number>;
  statusDistribution: Record<string, number>;
  locationStats: Record<string, number>;
  riskLevelStats: Record<string, number>;
}

export interface ReviewAction {
  id?: number;
  sessionId: string;
  reviewerId: string;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_DOCUMENTS';
  comments: string;
  timestamp: string;
  documentsReviewed: DocType[];
  riskAssessment?: {
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
  };
}

export interface DashboardFilters {
  status?: ApplicationSummary['status'][];
  dateRange?: {
    start: string;
    end: string;
  };
  riskLevel?: ApplicationSummary['riskLevel'][];
  location?: string[];
  searchQuery?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'completionPercentage' | 'verificationScore';
  sortOrder?: 'asc' | 'desc';
}
