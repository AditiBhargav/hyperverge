import { DatabaseService } from './db';
import { DocumentUpload, DocType, UploadStatus } from '../types';

export interface CaptureResult {
  success: boolean;
  imageData: string;
  timestamp: string;
  docType: string;
  sessionId: string;
}

export async function capturePhoto(
  imageData: string,
  docType: string,
  sessionId: string
): Promise<CaptureResult> {
  try {
    // Map docType to correct type
    let mappedDocType: DocType;
    switch (docType) {
      case 'AADHAAR_FRONT':
        mappedDocType = 'AADHAAR_FRONT';
        break;
      case 'AADHAAR_BACK':
        mappedDocType = 'AADHAAR_BACK';
        break;
      case 'PAN':
        mappedDocType = 'PAN';
        break;
      case 'SELFIE':
        mappedDocType = 'SELFIE';
        break;
      default:
        mappedDocType = 'AADHAAR_FRONT';
    }
    
    // Create document upload record
    const upload: Omit<DocumentUpload, 'id'> = {
      uploadId: `${sessionId}_${docType}_${Date.now()}`,
      sessionId,
      docType: mappedDocType,
      fileName: `${docType}.jpg`,
      filePath: '', // Will be set later if needed
      fileSize: imageData.length,
      mimeType: 'image/jpeg',
      status: 'COMPLETED' as UploadStatus,
      progress: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 0,
      assembledFile: imageData,
      compressed: false
    };
    
    // Save to database
    await DatabaseService.addUpload(upload);
    
    const result: CaptureResult = {
      success: true,
      imageData,
      timestamp: new Date().toISOString(),
      docType,
      sessionId
    };
    
    console.log('Photo captured successfully:', { docType, sessionId });
    
    return result;
  } catch (error) {
    console.error('Failed to save photo:', error);
    throw new Error('Failed to save photo: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}
