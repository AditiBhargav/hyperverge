export interface DigilockerSession {
  id: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface DigilockerDocument {
  id: string;
  type: string;
  name: string;
  issuer: string;
  issueDate: string;
  docDetails: {
    doctype: string;
    documentId: string;
    docData: any;
  };
}

export interface DigilockerError {
  code: string;
  message: string;
}

// Document types supported by Digilocker
export type DigilockerDocType = 'AADHAAR' | 'PAN' | 'DRIVING_LICENSE' | 'VOTER_ID';
