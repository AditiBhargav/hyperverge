// Core types for KYC application
export type DocType = 'AADHAAR_FRONT' | 'AADHAAR_BACK' | 'PAN' | 'SELFIE';

export type UploadStatus = 'PENDING' | 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'RETRY';

export interface DocumentUpload {
  id?: number;
  uploadId: string;
  sessionId: string;
  docType: DocType;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  status: UploadStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  errorMessage?: string;
  chunks?: UploadChunk[];
  assembledFile?: string;
  compressed?: boolean;
  originalSize?: number;
  compressedSize?: number;
}

export interface UploadChunk {
  chunkId: string;
  chunkIndex: number;
  chunkSize: number;
  chunkData: string; // base64 encoded
  uploaded: boolean;
}

export interface KYCSession {
  id?: number;
  sessionId: string;
  userId?: string;
  phoneNumber?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED';
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface OCRResult {
  id?: number;
  uploadId: string;
  docType: DocType;
  extractedData: Record<string, string | number | boolean>;
  confidence: number;
  verified: boolean;
  createdAt: string;
}

export interface AnalyticsEvent {
  id?: number;
  sessionId: string;
  event: string;
  data: Record<string, string | number | boolean>;
  timestamp: string;
  uploaded: boolean;
}

export interface AppSettings {
  id?: number;
  key: string;
  value: string;
  updatedAt: string;
}

export interface CompressionSettings {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  format: 'jpeg' | 'webp';
}
