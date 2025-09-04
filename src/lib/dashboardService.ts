import DatabaseService from './db';
import OfflineSyncManager from './offlineSyncManager';
import { ApplicationSummary, DashboardStats, ReviewAction, DashboardFilters } from '../types/dashboard';
import { DocType, KYCSession, DocumentUpload } from '../types';

export class DashboardService {
  
  // Get all applications with filtering and pagination
  static async getApplications(
    filters: DashboardFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ applications: ApplicationSummary[]; total: number; pages: number }> {
    try {
      // Get all sessions from database
      const sessions = await DatabaseService.getAllSessions();
      
      // Convert sessions to application summaries
      const applications: ApplicationSummary[] = [];
      
      for (const session of sessions) {
        const uploads = await DatabaseService.getUploadsBySession(session.sessionId);
        const summary = await this.convertToApplicationSummary(session, uploads);
        
        // Apply filters
        if (this.matchesFilters(summary, filters)) {
          applications.push(summary);
        }
      }
      
      // Sort applications
      this.sortApplications(applications, filters.sortBy, filters.sortOrder);
      
      // Calculate pagination
      const total = applications.length;
      const pages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedApplications = applications.slice(startIndex, startIndex + limit);
      
      return {
        applications: paginatedApplications,
        total,
        pages
      };
    } catch (error) {
      console.error('Error fetching applications:', error);
      return { applications: [], total: 0, pages: 0 };
    }
  }
  
  // Get dashboard statistics
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        return this.getEmptyStats();
      }
      
      // Ensure DatabaseService has the method
      if (typeof DatabaseService.getAllSessions !== 'function') {
        console.error('DatabaseService.getAllSessions is not a function');
        return this.getEmptyStats();
      }
      
      const sessions = await DatabaseService.getAllSessions();
      const allUploads: DocumentUpload[] = [];
      
      // Collect all uploads and convert sessions to summaries
      const applications: ApplicationSummary[] = [];
      for (const session of sessions) {
        const uploads = await DatabaseService.getUploadsBySession(session.sessionId);
        allUploads.push(...uploads);
        applications.push(await this.convertToApplicationSummary(session, uploads));
      }
      
      // Calculate statistics
      const totalApplications = applications.length;
      const statusCounts = this.calculateStatusCounts(applications);
      const todaySubmissions = this.getTodaySubmissions(applications);
      const documentTypeCounts = this.calculateDocumentTypeCounts(allUploads);
      const locationStats = this.calculateLocationStats(applications);
      const riskLevelStats = this.calculateRiskLevelStats(applications);
      
      return {
        totalApplications,
        pendingReview: statusCounts.UNDER_REVIEW || 0,
        approved: statusCounts.APPROVED || 0,
        rejected: statusCounts.REJECTED || 0,
        draft: statusCounts.DRAFT || 0,
        todaySubmissions,
        weeklyGrowth: this.calculateWeeklyGrowth(applications),
        averageProcessingTime: this.calculateAverageProcessingTime(applications),
        documentTypes: documentTypeCounts,
        statusDistribution: statusCounts,
        locationStats,
        riskLevelStats
      };
    } catch (error) {
      console.error('Error calculating dashboard stats:', error);
      return this.getEmptyStats();
    }
  }

  // Return empty stats for SSR or error cases
  private static getEmptyStats(): DashboardStats {
    return {
      totalApplications: 0,
      pendingReview: 0,
      approved: 0,
      rejected: 0,
      draft: 0,
      todaySubmissions: 0,
      weeklyGrowth: 0,
      averageProcessingTime: 0,
      documentTypes: {} as Record<DocType, number>,
      statusDistribution: {},
      locationStats: {},
      riskLevelStats: {}
    };
  }
  
  // Get application details by session ID
  static async getApplicationDetails(sessionId: string): Promise<ApplicationSummary | null> {
    try {
      const session = await DatabaseService.getSessionById(sessionId);
      if (!session) return null;
      
      const uploads = await DatabaseService.getUploadsBySession(sessionId);
      return await this.convertToApplicationSummary(session, uploads);
    } catch (error) {
      console.error('Error fetching application details:', error);
      return null;
    }
  }
  
    // Get specific application details
  static async getApplicationSession(sessionId: string): Promise<KYCSession | null> {
    const session = await DatabaseService.getSessionById(sessionId);
    return session || null;
  }

  // Get application uploads
  static async getApplicationUploads(sessionId: string): Promise<DocumentUpload[]> {
    return await DatabaseService.getUploadsBySession(sessionId);
  }

  // Submit review for an application
  static async submitReview(sessionId: string, action: Omit<ReviewAction, 'id' | 'timestamp'>): Promise<boolean> {
    try {
      // Check if offline
      if (typeof window !== 'undefined' && !navigator.onLine) {
        // Queue for sync when back online
        await OfflineSyncManager.queueForSync('REVIEW_SUBMISSION', {
          sessionId,
          reviewAction: {
            ...action,
            timestamp: new Date().toISOString()
          } as ReviewAction
        });
        
        console.log('Review queued for offline sync');
        return true;
      }
      
      // In a real implementation, this would save to a reviews table
      // For now, we'll update the session status
      
      let newStatus: ApplicationSummary['status'];
      switch (action.action) {
        case 'APPROVE':
          newStatus = 'APPROVED';
          break;
        case 'REJECT':
          newStatus = 'REJECTED';
          break;
        case 'REQUEST_DOCUMENTS':
          newStatus = 'PENDING_DOCUMENTS';
          break;
        default:
          newStatus = 'UNDER_REVIEW';
      }
      
      // Store review action (simulated - in real app would use a reviews table)
      const reviewAction: ReviewAction = {
        ...action,
        sessionId,
        timestamp: new Date().toISOString()
      };
      
      console.log('Review action submitted:', reviewAction);
      
      // Update session status in database (map to KYC session status)
      const sessionStatus: KYCSession['status'] = newStatus === 'APPROVED' || newStatus === 'REJECTED' ? 'COMPLETED' : 'ACTIVE';
      await DatabaseService.updateSessionStatus(sessionId, sessionStatus);
      
      // In a real implementation, you would:
      // 1. Save the review action to database
      // 2. Send notifications to applicant
      // 3. Log the action for audit trail
      
      return true;
    } catch (error) {
      console.error('Error submitting review:', error);
      return false;
    }
  }
  
  // Convert session and uploads to application summary
  private static async convertToApplicationSummary(
    session: KYCSession, 
    uploads: DocumentUpload[]
  ): Promise<ApplicationSummary> {
    const requiredDocuments: DocType[] = ['AADHAAR_FRONT', 'AADHAAR_BACK', 'PAN', 'SELFIE'];
    const completedDocuments = uploads.filter(u => u.status === 'COMPLETED');
    const requiredCompleted = completedDocuments.filter(u => requiredDocuments.includes(u.docType));
    
    const completionPercentage = Math.round((requiredCompleted.length / requiredDocuments.length) * 100);
    
    // Determine status based on completion and session status
    let status: ApplicationSummary['status'] = 'DRAFT';
    if (completionPercentage === 100) {
      status = session.status === 'COMPLETED' ? 'SUBMITTED' : 'UNDER_REVIEW';
    } else if (completionPercentage > 0) {
      status = 'DRAFT';
    }
    
    // Calculate verification score (simulated)
    const verificationScore = this.calculateVerificationScore(uploads);
    const riskLevel = this.calculateRiskLevel(verificationScore);
    
    return {
      sessionId: session.sessionId,
      phoneNumber: session.phoneNumber,
      status,
      completionPercentage,
      documentsCount: completedDocuments.length,
      requiredDocumentsCount: requiredDocuments.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      submittedAt: completionPercentage === 100 ? session.updatedAt : undefined,
      verificationScore,
      riskLevel,
      location: {
        city: 'Unknown',
        state: 'Unknown',
        country: 'India'
      }
    };
  }
  
  // Check if application matches filters
  private static matchesFilters(application: ApplicationSummary, filters: DashboardFilters): boolean {
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(application.status)) return false;
    }
    
    // Date range filter
    if (filters.dateRange) {
      const appDate = new Date(application.createdAt);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      if (appDate < startDate || appDate > endDate) return false;
    }
    
    // Risk level filter
    if (filters.riskLevel && filters.riskLevel.length > 0 && application.riskLevel) {
      if (!filters.riskLevel.includes(application.riskLevel)) return false;
    }
    
    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = `${application.sessionId} ${application.phoneNumber || ''} ${application.applicantName || ''}`.toLowerCase();
      if (!searchableText.includes(query)) return false;
    }
    
    return true;
  }
  
  // Sort applications
  private static sortApplications(
    applications: ApplicationSummary[], 
    sortBy: DashboardFilters['sortBy'] = 'createdAt',
    sortOrder: DashboardFilters['sortOrder'] = 'desc'
  ): void {
    applications.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;
      
      switch (sortBy) {
        case 'createdAt':
        case 'updatedAt':
          aValue = new Date(a[sortBy]);
          bValue = new Date(b[sortBy]);
          break;
        case 'completionPercentage':
        case 'verificationScore':
          aValue = a[sortBy] || 0;
          bValue = b[sortBy] || 0;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
  
  // Calculate various statistics
  private static calculateStatusCounts(applications: ApplicationSummary[]): Record<string, number> {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return counts;
  }
  
  private static getTodaySubmissions(applications: ApplicationSummary[]): number {
    const today = new Date().toDateString();
    return applications.filter(app => 
      new Date(app.createdAt).toDateString() === today
    ).length;
  }
  
  private static calculateDocumentTypeCounts(uploads: DocumentUpload[]): Record<DocType, number> {
    const counts = {} as Record<DocType, number>;
    uploads.forEach(upload => {
      if (upload.status === 'COMPLETED') {
        counts[upload.docType] = (counts[upload.docType] || 0) + 1;
      }
    });
    return counts;
  }
  
  private static calculateLocationStats(applications: ApplicationSummary[]): Record<string, number> {
    const stats: Record<string, number> = {};
    applications.forEach(app => {
      const location = app.location?.state || 'Unknown';
      stats[location] = (stats[location] || 0) + 1;
    });
    return stats;
  }
  
  private static calculateRiskLevelStats(applications: ApplicationSummary[]): Record<string, number> {
    const stats: Record<string, number> = {};
    applications.forEach(app => {
      const risk = app.riskLevel || 'UNKNOWN';
      stats[risk] = (stats[risk] || 0) + 1;
    });
    return stats;
  }
  
  private static calculateWeeklyGrowth(applications: ApplicationSummary[]): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const thisWeek = applications.filter(app => 
      new Date(app.createdAt) >= oneWeekAgo
    ).length;
    
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const lastWeek = applications.filter(app => {
      const date = new Date(app.createdAt);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    }).length;
    
    if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
    return Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  }
  
  private static calculateAverageProcessingTime(applications: ApplicationSummary[]): number {
    const completedApps = applications.filter(app => 
      app.status === 'APPROVED' || app.status === 'REJECTED'
    );
    
    if (completedApps.length === 0) return 0;
    
    const totalTime = completedApps.reduce((sum, app) => {
      if (app.submittedAt && app.reviewedAt) {
        const submitted = new Date(app.submittedAt);
        const reviewed = new Date(app.reviewedAt);
        return sum + (reviewed.getTime() - submitted.getTime());
      }
      return sum;
    }, 0);
    
    // Return average in hours
    return Math.round(totalTime / completedApps.length / (1000 * 60 * 60));
  }
  
  private static calculateVerificationScore(uploads: DocumentUpload[]): number {
    // Simulated verification score based on document quality and completeness
    let score = 0;
    const completedUploads = uploads.filter(u => u.status === 'COMPLETED');
    
    // Base score for each completed document
    score += completedUploads.length * 20;
    
    // Bonus for required documents
    const requiredDocs = ['AADHAAR_FRONT', 'AADHAAR_BACK', 'PAN', 'SELFIE'] as DocType[];
    const hasRequired = requiredDocs.filter(doc => 
      completedUploads.some(u => u.docType === doc)
    );
    score += hasRequired.length * 10;
    
    // Random factor for demo (in real app, this would be OCR confidence, etc.)
    score += Math.floor(Math.random() * 20);
    
    return Math.min(score, 100);
  }
  
  private static calculateRiskLevel(score: number): ApplicationSummary['riskLevel'] {
    if (score >= 80) return 'LOW';
    if (score >= 60) return 'MEDIUM';
    return 'HIGH';
  }
}

export default DashboardService;
