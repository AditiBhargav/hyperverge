import Dexie, { Table } from 'dexie';
import { 
  DocumentUpload, 
  KYCSession, 
  OCRResult, 
  AnalyticsEvent, 
  AppSettings 
} from '../types';

export class KYCDatabase extends Dexie {
  uploads!: Table<DocumentUpload, number>;
  sessions!: Table<KYCSession, number>;
  ocrResults!: Table<OCRResult, number>;
  analytics!: Table<AnalyticsEvent, number>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super('KYCFreshDB');
    
    this.version(1).stores({
      uploads: '++id, sessionId, docType, status, createdAt, uploadId',
      sessions: '++id, sessionId, status, createdAt, userId',
      ocrResults: '++id, uploadId, docType, createdAt, verified',
      analytics: '++id, sessionId, event, timestamp, uploaded',
      settings: '++id, key'
    });
  }
}

// Create database instance
let db: KYCDatabase;

// SSR-safe database initialization
if (typeof window !== 'undefined') {
  db = new KYCDatabase();
}

export class DatabaseService {
  
  // Session Management
  static async createSession(userId?: string, phoneNumber?: string): Promise<string> {
    if (typeof window === 'undefined') return '';
    
    const sessionId = `kyc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await db.sessions.add({
      sessionId,
      userId,
      phoneNumber,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      expiresAt
    });

    return sessionId;
  }

  static async getSession(sessionId: string): Promise<KYCSession | undefined> {
    if (typeof window === 'undefined') return undefined;
    return await db.sessions.where('sessionId').equals(sessionId).first();
  }

  // Upload Management
  static async addUpload(upload: Omit<DocumentUpload, 'id'>): Promise<number> {
    if (typeof window === 'undefined') return 0;
    return await db.uploads.add(upload);
  }

  static async updateUpload(uploadId: string, updates: Partial<DocumentUpload>): Promise<void> {
    if (typeof window === 'undefined') return;
    await db.uploads.where('uploadId').equals(uploadId).modify(updates);
  }

  static async getUpload(uploadId: string): Promise<DocumentUpload | undefined> {
    if (typeof window === 'undefined') return undefined;
    return await db.uploads.where('uploadId').equals(uploadId).first();
  }

  static async getAllUploads(): Promise<DocumentUpload[]> {
    if (typeof window === 'undefined') return [];
    return await db.uploads.orderBy('createdAt').reverse().toArray();
  }

  static async getPendingUploads(): Promise<DocumentUpload[]> {
    if (typeof window === 'undefined') return [];
    return await db.uploads.where('status').anyOf(['PENDING', 'RETRY']).toArray();
  }

  static async getUploadsBySession(sessionId: string): Promise<DocumentUpload[]> {
    if (typeof window === 'undefined') return [];
    return await db.uploads.where('sessionId').equals(sessionId).toArray();
  }

  static async deleteUpload(uploadId: string): Promise<void> {
    if (typeof window === 'undefined') return;
    await db.uploads.where('uploadId').equals(uploadId).delete();
  }

  // OCR Results
  static async addOCRResult(result: Omit<OCRResult, 'id'>): Promise<number> {
    if (typeof window === 'undefined') return 0;
    return await db.ocrResults.add(result);
  }

  static async getOCRResult(uploadId: string): Promise<OCRResult | undefined> {
    if (typeof window === 'undefined') return undefined;
    return await db.ocrResults.where('uploadId').equals(uploadId).first();
  }

  // Analytics
  static async addAnalyticsEvent(event: Omit<AnalyticsEvent, 'id'>): Promise<number> {
    if (typeof window === 'undefined') return 0;
    return await db.analytics.add(event);
  }

  static async getPendingAnalytics(): Promise<AnalyticsEvent[]> {
    if (typeof window === 'undefined') return [];
    return await db.analytics.where('uploaded').equals(0).toArray(); // Use 0 for false
  }

  // Settings
  static async setSetting(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const existing = await db.settings.where('key').equals(key).first();
    if (existing) {
      await db.settings.where('key').equals(key).modify({
        value,
        updatedAt: new Date().toISOString()
      });
    } else {
      await db.settings.add({
        key,
        value,
        updatedAt: new Date().toISOString()
      });
    }
  }

  static async getSetting(key: string): Promise<string | undefined> {
    if (typeof window === 'undefined') return undefined;
    const setting = await db.settings.where('key').equals(key).first();
    return setting?.value;
  }

  // Get all sessions
  static async getAllSessions(): Promise<KYCSession[]> {
    if (typeof window === 'undefined') return [];
    return await db.sessions.toArray();
  }

  // Get session by ID
  static async getSessionById(sessionId: string): Promise<KYCSession | undefined> {
    if (typeof window === 'undefined') return undefined;
    return await db.sessions.where('sessionId').equals(sessionId).first();
  }

  // Update session status
  static async updateSessionStatus(sessionId: string, status: KYCSession['status']): Promise<void> {
    if (typeof window === 'undefined') return;
    await db.sessions.where('sessionId').equals(sessionId).modify({
      status,
      updatedAt: new Date().toISOString()
    });
  }

  // Cleanup
  static async clearOldSessions(): Promise<void> {
    if (typeof window === 'undefined') return;
    const now = new Date().toISOString();
    await db.sessions.where('expiresAt').below(now).delete();
  }

  static async clearDatabase(): Promise<void> {
    if (typeof window === 'undefined') return;
    await db.delete();
    db = new KYCDatabase();
  }
}

export default DatabaseService;
